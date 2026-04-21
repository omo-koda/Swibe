import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/archive/**',
      '**/web-playground-legacy/**'
    ],
    environment: 'node',
    testTimeout: 30000
  },
  esbuild: {
    target: 'node18'
  }
});
