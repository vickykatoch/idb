import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import "@salt-ds/theme/index.css";
import './index.css';
import App from './App.tsx';
import { SaltProvider } from '@salt-ds/core';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SaltProvider applyClassesTo='root' mode='dark'>
      <App />
    </SaltProvider>
  </StrictMode>
);
