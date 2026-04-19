import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, './src/test-setup.js')],
    exclude: ['**/node_modules/**', '**/archive/**'],
  },
  resolve: {
    alias: {
      '@swibe': path.resolve(__dirname, '../src')
    }
  }
});
