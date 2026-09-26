import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test + coverage configuration for slimverlof.nl.
//
// Two suites live side by side:
//   npm test        -> `node --test` for the deploy workflow tests (tests/*.test.mjs)
//   npm run coverage -> vitest with V8 coverage for the unit/component suite below
//
// The vitest files use the *.spec.* pattern exactly so `node --test` never picks
// them up (it discovers `*.test.*`), and this config only globs the spec files.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.spec.{js,jsx}'],
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
