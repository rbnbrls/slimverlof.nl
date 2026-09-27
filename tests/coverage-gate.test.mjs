// Guards the coverage gate: `.github/workflows/ci.yml` together with `vitest.config.js`.
//
// A threshold that lives in only one of the two files is not a gate. Declared in
// the workflow alone, it would be a number vitest never reads; held in the vitest
// config alone, it would never gate a merge and invisible to anything reading the
// workflow. So the two are asserted against each other: the workflow's `env:`
// block is what CI enforces, the config's recorded defaults are what a local
// `npm run coverage` enforces, and a drift between them fails here.
//
// The summary step's contract is checked by running it: an unreadable report must
// come out as `unavailable` with a reason and a non-zero exit (never a zero), and
// a readable one must print the level CI enforced next to the level CI measured.
//
// Run with `npm test` (node --test).

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import config, { COVERAGE_THRESHOLD_ENV, RECORDED_COVERAGE_THRESHOLDS } from '../vitest.config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const workflow = readFileSync(path.join(here, '..', '.github', 'workflows', 'ci.yml'), 'utf8');
const summaryScript = path.join(here, '..', 'scripts', 'coverage-summary.mjs');
const metrics = Object.keys(RECORDED_COVERAGE_THRESHOLDS);
const thresholds = config.test.coverage.thresholds;

// Reads `KEY: 12` out of the workflow, or null when it is not declared.
const declared = (key) => {
  const match = workflow.match(new RegExp(`^\\s*${key}\\s*:\\s*(\\d{1,3})\\s*$`, 'm'));
  return match ? Number(match[1]) : null;
};

// Runs the summary step over a generated report, without touching the real
// `$GITHUB_STEP_SUMMARY` of the run that invoked this test.
const runSummary = (linePct, env = {}) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'coverage-summary-'));
  const report = path.join(dir, 'coverage-summary.json');
  const metric = { pct: linePct, covered: 299, total: 305 };
  const summaryEnv = { ...process.env, ...env };
  delete summaryEnv.GITHUB_STEP_SUMMARY;
  try {
    writeFileSync(
      report,
      JSON.stringify({
        total: { lines: metric, statements: metric, branches: metric, functions: metric },
      })
    );
    return spawnSync(process.execPath, [summaryScript, report], {
      encoding: 'utf8',
      env: summaryEnv,
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('the coverage suite runs in CI', () => {
  assert.match(
    workflow,
    /^\s*run:\s*npm run coverage\s*$/m,
    '.github/workflows/ci.yml must run `npm run coverage`'
  );
});

test('the workflow declares every recorded threshold', () => {
  for (const metric of metrics) {
    const key = COVERAGE_THRESHOLD_ENV[metric];
    assert.equal(
      declared(key),
      RECORDED_COVERAGE_THRESHOLDS[metric],
      `ci.yml must declare ${key}: ${RECORDED_COVERAGE_THRESHOLDS[metric]}`
    );
  }
});

test('vitest enforces the same threshold for every metric', () => {
  for (const metric of metrics) {
    const override = Number.parseInt(process.env[COVERAGE_THRESHOLD_ENV[metric]] ?? '', 10);
    const expected = Number.isInteger(override) ? override : RECORDED_COVERAGE_THRESHOLDS[metric];
    assert.equal(
      thresholds[metric],
      expected,
      `vitest.config.js resolves the ${metric} threshold to ${thresholds[metric]}, ` +
        `CI declares ${expected} (${COVERAGE_THRESHOLD_ENV[metric]})`
    );
  }
});

test('every recorded threshold is a whole percent between 1 and 100', () => {
  for (const metric of metrics) {
    const value = RECORDED_COVERAGE_THRESHOLDS[metric];
    assert.ok(
      Number.isInteger(value) && value >= 1 && value <= 100,
      `recorded ${metric} threshold must be an integer 1-100, got ${JSON.stringify(value)}`
    );
  }
});

test('a missing coverage report is unavailable, not zero, and fails the step', () => {
  const result = spawnSync(
    process.execPath,
    [summaryScript, path.join(tmpdir(), 'coverage-summary-absent.json')],
    { encoding: 'utf8', env: { ...process.env, GITHUB_STEP_SUMMARY: '' } }
  );
  assert.notEqual(result.status, 0, 'an unreadable summary must fail the step');
  assert.match(result.stderr, /unavailable \(reason: coverage_summary_missing/);
});

test('a total at or above the recorded threshold is reported as met', () => {
  const recorded = RECORDED_COVERAGE_THRESHOLDS.lines;
  const result = runSummary(recorded, { COVERAGE_LINES_THRESHOLD: String(recorded) });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`coverage line total: ${recorded}%`));
  assert.match(result.stdout, new RegExp(`recorded threshold: ${recorded}% .* - met`));
});

test('a total below the recorded threshold is reported as not met', () => {
  const recorded = RECORDED_COVERAGE_THRESHOLDS.lines;
  const result = runSummary(recorded - 1, { COVERAGE_LINES_THRESHOLD: String(recorded) });
  assert.match(result.stdout, new RegExp(`coverage line total: ${recorded - 1}%`));
  assert.match(result.stdout, new RegExp(`recorded threshold: ${recorded}% .* - not met`));
});

test('an unset threshold is reported as unavailable instead of no threshold', () => {
  const result = runSummary(50, { COVERAGE_LINES_THRESHOLD: '' });
  assert.match(
    result.stdout,
    /recorded threshold: unavailable \(reason: COVERAGE_LINES_THRESHOLD_unset\)/
  );
});
