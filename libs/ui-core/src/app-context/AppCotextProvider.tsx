import React, { createContext, useContext, useReducer } from 'react';
import { SaltProvider } from '@salt-ds/core';
import type { AppContextState } from './types';
import { appContextReducer } from './app-context-reducer';

interface AppContextProviderProps extends AppContextState {
  children: React.ReactNode;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export function AppContextProvider({
  appName,
  configAppName,
  configProvider,
  children,
}: AppContextProviderProps) {
  const [state] = useReducer(appContextReducer, {
    appName,
    configAppName,
    configProvider,
  });
  return (
    <AppContext.Provider value={state}>
      <SaltProvider applyClassesTo="root" mode="dark">
        {children}
      </SaltProvider>
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextState {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
