import { describe, expect, it } from 'vitest';
import {
	deleteKey,
	deleteMultipleRecords,
	onNewRecord,
	readJson,
	readMultipleRecords,
	writeJson,
} from '../src';

describe('idb json', () => {
	it('writes and reads json', async () => {
		await writeJson('mydb', 'kv', 'user:1', { name: 'Ada', age: 37 });
		const v = await readJson<{ name: string; age: number }>('mydb', 'kv', 'user:1');
		expect(v).toEqual({ name: 'Ada', age: 37 });
	});

	it('deletes key', async () => {
		await writeJson('mydb2', 'kv', 'k', { ok: true });
		await deleteKey('mydb2', 'kv', 'k');
		const v = await readJson<{ ok: boolean }>('mydb2', 'kv', 'k');
		expect(v).toBeUndefined();
	});

	describe('readMultipleRecords', () => {
		it('reads multiple records based on filter criteria', async () => {
			const dbName = 'testdb';
			const storeName = 'teststore';

			// Setup: Add test data
			await writeJson(dbName, storeName, 'key1', { id: 1, name: 'Alice' });
			await writeJson(dbName, storeName, 'key2', { id: 2, name: 'Bob' });
			await writeJson(dbName, storeName, 'key3', { id: 3, name: 'Charlie' });

			// Test: Read records where id > 1
			const records = await readMultipleRecords(
				dbName,
				storeName,
				(record: { id: number; name: string }) => record && record.id > 1,
			);
			expect(records).toEqual([
				{ id: 2, name: 'Bob' },
				{ id: 3, name: 'Charlie' },
			]);
		});
	});

	describe('deleteMultipleRecords', () => {
		it('deletes multiple records based on filter criteria', async () => {
			const dbName = 'testdb';
			const storeName = 'teststore';

			// Setup: Add test data
			await writeJson(dbName, storeName, 'key1', { id: 1, name: 'Alice' });
			await writeJson(dbName, storeName, 'key2', { id: 2, name: 'Bob' });
			await writeJson(dbName, storeName, 'key3', { id: 3, name: 'Charlie' });

			// Test: Delete records where id <= 2
			await deleteMultipleRecords(
				dbName,
				storeName,
				(record: { id: number; name: string }) => record && record.id <= 2,
			);

			// Verify: Only records with id > 2 remain
			const remainingRecords = await readMultipleRecords(dbName, storeName, () => true);
			expect(remainingRecords).toEqual([{ id: 3, name: 'Charlie' }]);
		});
	});

	describe.skip('onNewRecord', () => {
		it('notifies when a new record is added', async () => {
			const dbName = 'testdb';
			const storeName = 'teststore';

			// Setup: Add test data and listen for new records
			const notifications: { id: number; name: string }[] = [];
			onNewRecord(dbName, (record: { id: number; name: string }) => {
				console.log('New record detected:', record);
				notifications.push(record);
			});

			await writeJson(dbName, storeName, 'key1', { id: 1, name: 'Alice' });
			await writeJson(dbName, storeName, 'key2', { id: 2, name: 'Bob' });

			// Wait for notifications to be processed
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Verify: Notifications contain the new records
			console.log('Final notifications array:', notifications);
			expect(notifications).toEqual([
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
			]);
		});
	});
});
