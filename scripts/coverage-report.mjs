#!/usr/bin/env node
// Publishes the coverage numbers CI enforces as a report committed to the repository.
//
// Why: `.github/workflows/ci.yml` fails the build when coverage drops below the
// recorded thresholds, but nothing durable said *what the measured level was* — a
// workflow artifact expires, and a line in a job log is not readable from the default
// branch. So the repository enforced a number it never published. This script turns
// the raw reports of the last `npm run coverage` into two committed files:
//
//   coverage/coverage-summary.json  the metric a consumer parses: `total.lines.pct`
//   coverage/lcov.info              per-file line coverage
//
// The raw reporters write what the *runner* saw: absolute paths such as
// `/home/runner/work/slimverlof.nl/slimverlof.nl/src/App.jsx`. Committing those would
// record a machine instead of the repository, and would differ between a laptop and
// CI, so every path is rewritten relative to the repository root and the summary's
// keys are sorted. The same input therefore always produces the same file — which is
// what makes `--check` ("the committed report still matches the code") a real check
// rather than a formatting comparison.
//
// Usage:
//
//   node scripts/coverage-report.mjs          publish from the last coverage run
//   node scripts/coverage-report.mjs --check  fail when the committed reports are
//                                             absent, or no longer match this run
//
// A report that cannot be produced is an error, never a zero: the reason is printed
// and the exit code is non-zero.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SUMMARY_PATH = 'coverage/coverage-summary.json';
const LCOV_PATH = 'coverage/lcov.info';
const METRICS = ['lines', 'statements', 'functions', 'branches'];

const root = process.cwd();
const check = process.argv.includes('--check');

const fail = (reason, detail = '') => {
  console.error(`coverage report: unavailable (reason: ${reason})`);
  if (detail) console.error(detail);
  process.exit(1);
};

const readWorking = (file) => {
  try {
    return readFileSync(path.resolve(root, file), 'utf8');
  } catch {
    return null;
  }
};

// Reads a file as it exists in the commit being checked, which is the committed
// report even after `npm run coverage` has overwritten the working-tree copy.
const readCommitted = (file) => {
  const result = spawnSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout : null;
};

// The one place a runner absolute path becomes a repository path. An absolute path
// outside the repository is refused instead of committed: it names a checkout, not
// a file of this project.
const relative = (file) => {
  if (!path.isAbsolute(file)) return file;
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    fail('coverage_report_outside_repo', `${file} is outside ${root}`);
  }
  return rel;
};

const normalizeSummary = (text) => {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail('coverage_summary_unparsable', String(error && error.message ? error.message : error));
  }
  if (!raw || typeof raw !== 'object' || typeof raw.total !== 'object' || raw.total === null) {
    fail('coverage_summary_unparsable', `${SUMMARY_PATH} carries no \`total\` block`);
  }
  for (const metric of METRICS) {
    const pct = raw.total[metric] && raw.total[metric].pct;
    if (typeof pct !== 'number') {
      fail('coverage_summary_unparsable', `\`total.${metric}.pct\` is missing`);
    }
  }
  // `total` first, then the files sorted, so the serialized file is stable.
  const report = { total: raw.total };
  for (const key of Object.keys(raw).sort()) {
    if (key === 'total') continue;
    report[relative(key)] = raw[key];
  }
  return report;
};

const serialize = (report) => `${JSON.stringify(report, null, 2)}\n`;

const normalizeLcov = (text) => {
  let records = 0;
  const lines = text.split('\n').map((line) => {
    if (!line.startsWith('SF:')) return line;
    records += 1;
    return `SF:${relative(line.slice(3))}`;
  });
  if (records === 0) fail('coverage_lcov_unusable', `${LCOV_PATH} carries no \`SF:\` records`);
  return lines.join('\n');
};

// The published level of a line-coverage file, in the form the lcov format itself
// carries: how many files, how many lines, how many of them were hit.
const lcovTotals = (text) => {
  const totals = { records: 0, found: 0, hit: 0 };
  for (const line of text.split('\n')) {
    if (line.startsWith('SF:')) totals.records += 1;
    else if (line.startsWith('LF:')) totals.found += Number.parseInt(line.slice(3), 10) || 0;
    else if (line.startsWith('LH:')) totals.hit += Number.parseInt(line.slice(3), 10) || 0;
  }
  return totals;
};

const percent = (report, metric) => report.total[metric].pct;
const fileKeys = (report) =>
  Object.keys(report)
    .filter((key) => key !== 'total')
    .sort();

const rawSummary = readWorking(SUMMARY_PATH);
if (rawSummary === null) {
  fail('coverage_summary_missing', `run \`npm run coverage\` first (${SUMMARY_PATH})`);
}
const rawLcov = readWorking(LCOV_PATH);
if (rawLcov === null) {
  fail('coverage_lcov_missing', `run \`npm run coverage\` first (${LCOV_PATH})`);
}

const summary = normalizeSummary(rawSummary);
const lcov = normalizeLcov(rawLcov);

if (!check) {
  writeFileSync(path.resolve(root, SUMMARY_PATH), serialize(summary));
  writeFileSync(path.resolve(root, LCOV_PATH), lcov);
  const detail = METRICS.map((metric) => `${metric} ${percent(summary, metric)}%`).join(', ');
  const totals = lcovTotals(lcov);
  console.log(`coverage report: published ${SUMMARY_PATH} (${detail})`);
  console.log(
    `coverage report: published ${LCOV_PATH} ` +
      `(${totals.hit}/${totals.found} lines in ${totals.records} files)`
  );
  process.exit(0);
}

const committedSummary = readCommitted(SUMMARY_PATH);
const committedLcov = readCommitted(LCOV_PATH);
if (committedSummary === null || committedLcov === null) {
  const absent = [
    committedSummary === null ? SUMMARY_PATH : '',
    committedLcov === null ? LCOV_PATH : '',
  ]
    .filter(Boolean)
    .join(', ');
  fail(
    'coverage_report_absent',
    `${absent} is not committed; run \`npm run coverage:report\` and commit the report`
  );
}

const drifts = [];
let committed;
try {
  committed = JSON.parse(committedSummary);
} catch (error) {
  fail('coverage_report_unparsable', String(error && error.message ? error.message : error));
}
for (const metric of METRICS) {
  const before =
    committed.total && committed.total[metric] ? committed.total[metric].pct : undefined;
  const now = percent(summary, metric);
  if (typeof before !== 'number')
    drifts.push(`${metric}: committed report has no value, run measures ${now}%`);
  else if (before !== now) drifts.push(`${metric}: committed ${before}% vs measured ${now}%`);
}

const committedFiles = fileKeys(committed);
const measuredFiles = fileKeys(summary);
if (committedFiles.join('\n') !== measuredFiles.join('\n')) {
  drifts.push(
    `files: committed report lists ${committedFiles.length}, run covers ${measuredFiles.length} ` +
      `(${committedFiles.filter((key) => !measuredFiles.includes(key)).length} no longer measured, ` +
      `${measuredFiles.filter((key) => !committedFiles.includes(key)).length} new)`
  );
}

const before = lcovTotals(normalizeLcov(committedLcov));
const now = lcovTotals(lcov);
if (before.records !== now.records || before.hit !== now.hit || before.found !== now.found) {
  drifts.push(
    `lcov: committed ${before.hit}/${before.found} lines in ${before.records} files vs ` +
      `measured ${now.hit}/${now.found} in ${now.records}`
  );
}

if (drifts.length > 0) {
  console.error(
    `coverage report: out_of_date (reason: coverage_report_stale, file: ${SUMMARY_PATH})`
  );
  for (const drift of drifts) console.error(`  ${drift}`);
  console.error(
    '  run `npm run coverage` (or `npm run coverage:report`) and commit the refreshed report'
  );
  process.exit(1);
}

const detail = METRICS.map((metric) => `${metric} ${percent(summary, metric)}%`).join(', ');
console.log(`coverage report: in sync (${detail})`);
