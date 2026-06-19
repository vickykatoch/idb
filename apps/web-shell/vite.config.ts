import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow imports from anywhere in the monorepo root (plugins, libs, etc.)
      allow: [path.resolve(__dirname, '../..')],
    },
  },
});
