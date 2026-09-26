import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test + coverage configuration for slimverlof.nl.
// `npm run coverage` executes the suite under V8 coverage and prints a line
// total for src/ (text reporter) plus machine readable output in coverage/.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.{js,jsx}'],
    setupFiles: ['tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/assets/**'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
});
