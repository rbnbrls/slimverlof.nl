// Guards the published coverage report: `scripts/coverage-report.mjs`, the files it
// writes and the CI steps that run it.
//
// The gap this closes: CI enforced coverage thresholds but published no report, so
// nothing readable from the default branch said what the measured level was. An
// unreadable or stale report must therefore never be committed and never read as a
// zero — the same rule `scripts/coverage-summary.mjs` follows.
//
// Run with `npm test` (node --test).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..');
const script = path.join(repoRoot, 'scripts', 'coverage-report.mjs');
const workflow = readFileSync(path.join(repoRoot, '.github', 'workflows', 'ci.yml'), 'utf8');
const SUMMARY_PATH = 'coverage/coverage-summary.json';
const LCOV_PATH = 'coverage/lcov.info';

const git = (cwd, args) =>
  spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' },
  });

const run = (cwd, args = []) =>
  spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });

// A raw summary shaped like the one vitest's `json-summary` reporter writes: absolute
// runner paths as keys, plus the `total` block a consumer parses.
const rawSummary = (linePct, file) => ({
  total: {
    lines: { total: 100, covered: Math.round(linePct), skipped: 0, pct: linePct },
    statements: { total: 100, covered: 90, skipped: 0, pct: 90 },
    functions: { total: 10, covered: 9, skipped: 0, pct: 90 },
    branches: { total: 20, covered: 19, skipped: 0, pct: 95 },
  },
  [file]: { lines: { total: 10, covered: 9, pct: 90 } },
});

const rawLcov = (file) => `SF:${file}\nLF:10\nLH:9\nend_of_record\n`;

const scaffold = (linePct) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'coverage-report-'));
  mkdirSync(path.join(dir, 'coverage'), { recursive: true });
  const source = path.join(dir, 'src', 'App.jsx');
  writeFileSync(path.join(dir, SUMMARY_PATH), JSON.stringify(rawSummary(linePct, source), null, 2));
  writeFileSync(path.join(dir, LCOV_PATH), rawLcov(source));
  return dir;
};

const commitAll = (dir) => {
  git(dir, ['init', '-q']);
  git(dir, ['config', 'user.email', 'ci@example.invalid']);
  git(dir, ['config', 'user.name', 'ci']);
  git(dir, ['add', '-A']);
  const result = git(dir, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'report']);
  assert.equal(result.status, 0, result.stderr);
  return result;
};

const inTempRepo = (linePct, body) => {
  const dir = scaffold(linePct);
  try {
    body(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('publishing rewrites runner paths relative to the repository root', () => {
  inTempRepo(98.03, (dir) => {
    const result = run(dir);
    assert.equal(result.status, 0, result.stderr);
    const published = JSON.parse(readFileSync(path.join(dir, SUMMARY_PATH), 'utf8'));
    assert.deepEqual(Object.keys(published).sort(), ['src/App.jsx', 'total']);
    assert.equal(published.total.lines.pct, 98.03);
    assert.match(readFileSync(path.join(dir, LCOV_PATH), 'utf8'), /^SF:src\/App\.jsx$/m);
    assert.doesNotMatch(readFileSync(path.join(dir, LCOV_PATH), 'utf8'), new RegExp(dir));
  });
});

test('a report outside the repository is refused instead of committed', () => {
  inTempRepo(98.03, (dir) => {
    writeFileSync(
      path.join(dir, SUMMARY_PATH),
      JSON.stringify(rawSummary(98.03, path.join(tmpdir(), 'elsewhere', 'App.jsx')), null, 2)
    );
    const result = run(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unavailable \(reason: coverage_report_outside_repo/);
  });
});

test('a missing summary is unavailable, never zero, and fails the run', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'coverage-report-'));
  mkdirSync(path.join(dir, 'coverage'), { recursive: true });
  try {
    const result = run(dir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unavailable \(reason: coverage_summary_missing/);
    assert.equal(existsSync(path.join(dir, SUMMARY_PATH)), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a committed report that matches the run passes the check', () => {
  inTempRepo(98.03, (dir) => {
    assert.equal(run(dir).status, 0);
    commitAll(dir);
    const result = run(dir, ['--check']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /in sync \(lines 98\.03%/);
  });
});

test('coverage that moved without refreshing the report fails the check', () => {
  inTempRepo(98.03, (dir) => {
    assert.equal(run(dir).status, 0);
    commitAll(dir);
    writeFileSync(
      path.join(dir, SUMMARY_PATH),
      JSON.stringify(rawSummary(90.5, path.join(dir, 'src', 'App.jsx')), null, 2)
    );
    writeFileSync(path.join(dir, LCOV_PATH), rawLcov(path.join(dir, 'src', 'App.jsx')));
    assert.equal(run(dir).status, 0);
    const result = run(dir, ['--check']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /out_of_date \(reason: coverage_report_stale/);
    assert.match(result.stderr, /lines: committed 98\.03% vs measured 90\.5%/);
    assert.match(result.stderr, /commit the refreshed report/);
  });
});

test('a report that was never committed is reported as absent', () => {
  inTempRepo(98.03, (dir) => {
    assert.equal(run(dir).status, 0);
    git(dir, ['init', '-q']);
    git(dir, ['config', 'user.email', 'ci@example.invalid']);
    git(dir, ['config', 'user.name', 'ci']);
    git(dir, ['-c', 'commit.gpgsign=false', 'commit', '-q', '--allow-empty', '-m', 'no report']);
    const result = run(dir, ['--check']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unavailable \(reason: coverage_report_absent/);
  });
});

test('CI publishes the report and fails when it is out of date', () => {
  assert.match(workflow, /^\s*run:\s*npm run coverage:report\s*$/m);
  assert.match(workflow, /^\s*run:\s*npm run coverage:report:check\s*$/m);
});

test('the published reports are committed, not gitignored', () => {
  for (const report of [SUMMARY_PATH, LCOV_PATH]) {
    assert.ok(existsSync(path.join(repoRoot, report)), `${report} must exist in the repository`);
    const ignored = git(repoRoot, ['check-ignore', '-q', report]);
    assert.notEqual(ignored.status, 0, `${report} must not be gitignored`);
    const tracked = git(repoRoot, ['ls-files', '--error-unmatch', report]);
    assert.equal(tracked.status, 0, `${report} must be tracked: ${tracked.stderr}`);
  }
});

test('the committed report parses to a percentage from the default branch', () => {
  const report = JSON.parse(readFileSync(path.join(repoRoot, SUMMARY_PATH), 'utf8'));
  const lines = report.total && report.total.lines ? report.total.lines.pct : undefined;
  assert.equal(typeof lines, 'number', 'total.lines.pct must be a number');
  assert.ok(lines > 0 && lines <= 100, `total.lines.pct must be a percentage, got ${lines}`);
  for (const key of Object.keys(report)) {
    assert.ok(key === 'total' || !path.isAbsolute(key), `${key} must be repository-relative`);
  }
  assert.ok(
    readFileSync(path.join(repoRoot, LCOV_PATH), 'utf8')
      .split('\n')
      .some((line) => line.startsWith('LF:')),
    `${LCOV_PATH} must carry line records`
  );
});
