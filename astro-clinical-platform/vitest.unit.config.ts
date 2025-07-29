/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/**/*.stories.*', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});