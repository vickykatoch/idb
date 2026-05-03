import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@salt-ds/theme/index.css';
import './index.css';
import App from './App.tsx';
import { AppContextProvider } from '@idb/ui-core';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppContextProvider appName="Web Shell" configAppName="web-shell" configProvider="dpd-config">
      <App />
    </AppContextProvider>
  </StrictMode>
);
