import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@swibe': path.resolve(__dirname, '../src')
    }
  },
  // Ensure we don't try to optimize non-browser modules if we accidentally import them
  // But we likely need to stub them if used
  optimizeDeps: {
    exclude: ['fsevents']
  }
});
