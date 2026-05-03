export type AppConfigProvider = 'dpd-confgig' | string;

export interface User {
  sid: string;
  name: string;
  imageUrl?: string;
}

export interface AppContextState {
  appName: string;
  configAppName: string;
  configProvider: AppConfigProvider;
}
