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

// Recorded coverage gate: the levels measured on `main` at a898577
// (lines 98.03%, statements 97.64%, functions 93.58%, branches 94.17%), floored to
// whole percent. A run below the recorded level fails, so coverage can ratchet up
// but not down.
//
// `.github/workflows/ci.yml` declares the same numbers in its job `env:` block and
// this config reads them back from there, so CI and a local `npm run coverage`
// enforce an identical gate. `tests/coverage-gate.test.mjs` fails on any drift.
export const RECORDED_COVERAGE_THRESHOLDS = {
  lines: 98,
  statements: 97,
  functions: 93,
  branches: 94,
};

//: Environment variable each metric's threshold is read from in CI.
export const COVERAGE_THRESHOLD_ENV = {
  lines: 'COVERAGE_LINES_THRESHOLD',
  statements: 'COVERAGE_STATEMENTS_THRESHOLD',
  functions: 'COVERAGE_FUNCTIONS_THRESHOLD',
  branches: 'COVERAGE_BRANCHES_THRESHOLD',
};

// An unusable override is reported instead of silently weakening the gate: an
// unreadable threshold must never read as "no threshold".
const recordedThreshold = (metric) => {
  const raw = process.env[COVERAGE_THRESHOLD_ENV[metric]];
  const value = Number.parseInt(raw ?? '', 10);
  if (Number.isInteger(value) && value >= 0 && value <= 100) return value;
  if (raw !== undefined) {
    console.warn(
      `coverage: ignoring ${COVERAGE_THRESHOLD_ENV[metric]}=${JSON.stringify(raw)} ` +
        `(not an integer 0-100); using the recorded ${metric} threshold ` +
        `${RECORDED_COVERAGE_THRESHOLDS[metric]}`
    );
  }
  return RECORDED_COVERAGE_THRESHOLDS[metric];
};

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
        lines: recordedThreshold('lines'),
        statements: recordedThreshold('statements'),
        functions: recordedThreshold('functions'),
        branches: recordedThreshold('branches'),
      },
    },
  },
});
