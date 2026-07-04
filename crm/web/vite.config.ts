import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Frontend nutzt relative URLs — der Dev-Server proxied zur CRM-API (:5210).
    proxy: {
      '/api': 'http://localhost:5210',
      '/health': 'http://localhost:5210',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
