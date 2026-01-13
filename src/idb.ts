export type JsonValue =
	| null
	| boolean
	| number
	| string
	| JsonValue[]
	| { [key: string]: JsonValue };

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
	});
}

function openDb(dbName: string, storeName: string, version = 1): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(dbName, version);

		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName);
			}

			if (!db.objectStoreNames.contains('changeLog')) {
				db.createObjectStore('changeLog', { keyPath: 'id', autoIncrement: true });
			}
		};

		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
	});
}

function txDone(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));
		tx.onerror = () => reject(tx.error ?? new Error('Transaction error'));
	});
}

export async function writeJson<T extends JsonValue>(
	dbName: string,
	storeName: string,
	key: IDBValidKey,
	value: T,
): Promise<void> {
	const db = await openDb(dbName, storeName);
	const tx = db.transaction([storeName, 'changeLog'], 'readwrite');
	tx.objectStore(storeName).put(value, key);
	tx.objectStore('changeLog').add({ store: storeName, key, value });
	await txDone(tx);
	db.close();
}

export async function readJson<T extends JsonValue>(
	dbName: string,
	storeName: string,
	key: IDBValidKey,
): Promise<T | undefined> {
	const db = await openDb(dbName, storeName);
	const tx = db.transaction(storeName, 'readonly');
	const val = (await requestToPromise(tx.objectStore(storeName).get(key))) as T | undefined;
	await txDone(tx);
	db.close();
	return val;
}

export async function deleteKey(
	dbName: string,
	storeName: string,
	key: IDBValidKey,
): Promise<void> {
	const db = await openDb(dbName, storeName);
	const tx = db.transaction(storeName, 'readwrite');
	tx.objectStore(storeName).delete(key);
	await txDone(tx);
	db.close();
}

// Function to read multiple records from IndexedDB based on a filter criterion
export async function readMultipleRecords<T extends JsonValue>(
	dbName: string,
	storeName: string,
	filterFn: (value: T) => boolean,
): Promise<T[]> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);

		request.onerror = (event) => {
			const errorEvent = event.target as IDBOpenDBRequest | null;
			if (errorEvent) {
				console.error('Error opening database:', errorEvent.error);
				reject(errorEvent.error);
			} else {
				console.error('Error opening database: Unknown error');
				reject('Unknown error');
			}
		};

		request.onsuccess = (event) => {
			const successEvent = event.target as IDBOpenDBRequest | null;
			if (!successEvent) {
				reject('Unknown error');
				return;
			}

			const db = successEvent.result;
			const transaction = db.transaction(storeName, 'readonly');
			const objectStore = transaction.objectStore(storeName);
			const records: T[] = [];

			objectStore.openCursor().onsuccess = (cursorEvent: Event) => {
				const cursor = (cursorEvent.target as IDBRequest).result;
				if (cursor) {
					if (filterFn(cursor.value)) {
						records.push(cursor.value);
					}
					cursor.continue();
				} else {
					resolve(records);
				}
			};

			transaction.onerror = (txnEvent: Event) => {
				console.error('Transaction error:', txnEvent.target.error);
				reject(txnEvent.target.error);
			};
		};
	});
}

// Function to delete multiple records from IndexedDB based on a filter criterion
export async function deleteMultipleRecords<T extends JsonValue>(
	dbName: string,
	storeName: string,
	filterFn: (value: T) => boolean,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName);

		request.onerror = (event) => {
			const errorEvent = event.target as IDBOpenDBRequest | null;
			if (errorEvent) {
				console.error('Error opening database:', errorEvent.error);
				reject(errorEvent.error);
			} else {
				console.error('Error opening database: Unknown error');
				reject('Unknown error');
			}
		};

		request.onsuccess = (event) => {
			const successEvent = event.target as IDBOpenDBRequest | null;
			if (!successEvent) {
				reject('Unknown error');
				return;
			}

			const db = successEvent.result;
			const transaction = db.transaction(storeName, 'readwrite');
			const objectStore = transaction.objectStore(storeName);

			objectStore.openCursor().onsuccess = (cursorEvent: Event) => {
				const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					if (filterFn(cursor.value)) {
						cursor.delete();
					}
					cursor.continue();
				} else {
					resolve();
				}
			};

			transaction.onerror = (txnEvent: Event) => {
				console.error('Transaction error:', txnEvent.target.error);
				reject(txnEvent.target.error);
			};
		};
	});
}

// Function to notify whenever a new record is added to IndexedDB
export function onNewRecord<T extends JsonValue>(
	dbName: string,
	callback: (value: T) => void,
): void {
	const seenChanges = new Set();

	const pollForChanges = () => {
		const request = indexedDB.open(dbName);

		request.onsuccess = (event) => {
			const db = (event.target as IDBOpenDBRequest)?.result;
			if (!db) {
				console.error('Failed to open database: Unknown error');
				return;
			}

			const transaction = db.transaction('changeLog', 'readonly');
			const changeLogStore = transaction.objectStore('changeLog');

			changeLogStore.openCursor().onsuccess = (cursorEvent: IDBRequestEvent) => {
				const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					if (!seenChanges.has(cursor.primaryKey)) {
						seenChanges.add(cursor.primaryKey);
						callback(cursor.value);
					}
					cursor.continue();
				}
			};

			transaction.oncomplete = () => {
				setTimeout(pollForChanges, 1000); // Poll every second
			};
		};
	};

	pollForChanges();
}

// Function to notify whenever a new record is added, using the change log
export function onNewRecordWithLog(dbName: string, callback: (value: JsonValue) => void): void {
	const seenChanges = new Set();

	const pollForChanges = () => {
		const request = indexedDB.open(dbName);

		request.onsuccess = (event) => {
			const successEvent = event.target as IDBOpenDBRequest | null;
			if (!successEvent) {
				console.error('Unknown error');
				return;
			}

			const db = successEvent.result;
			const transaction = db.transaction('changeLog', 'readonly');
			const changeLogStore = transaction.objectStore('changeLog');

			changeLogStore.openCursor().onsuccess = (cursorEvent: IDBRequestEvent) => {
				const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					if (!seenChanges.has(cursor.primaryKey)) {
						seenChanges.add(cursor.primaryKey);
						callback(cursor.value);
					}
					cursor.continue();
				}
			};

			transaction.oncomplete = () => {
				setTimeout(pollForChanges, 1000); // Poll every second
			};

			transaction.onerror = (errorEvent: Event) => {
				console.error('Transaction error:', (errorEvent.target as IDBRequest)?.error);
			};
		};

		request.onerror = (errorEvent) => {
			console.error(
				'Error opening database:',
				(errorEvent.target as IDBRequest)?.error || 'Unknown error',
			);
		};
	};
	pollForChanges();
}
