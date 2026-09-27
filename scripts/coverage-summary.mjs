#!/usr/bin/env node
// Prints the coverage line total produced by `npm run coverage`.
//
// A missing or unreadable summary is reported as `unavailable` with a reason and
// fails the run: an unmeasurable metric must never be reported as zero.
import { appendFileSync, readFileSync } from 'node:fs';

const summaryPath = process.argv[2] ?? 'coverage/coverage-summary.json';

let summary;
try {
  summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
} catch (error) {
  console.error(`coverage: unavailable (reason: coverage_summary_missing, path: ${summaryPath})`);
  console.error(String(error && error.message ? error.message : error));
  process.exit(1);
}

const total = summary.total ?? {};
const lines = total.lines;

if (!lines || typeof lines.pct !== 'number') {
  console.error('coverage: unavailable (reason: coverage_line_total_absent)');
  process.exit(1);
}

const lineTotal = `coverage line total: ${lines.pct}% (${lines.covered}/${lines.total} lines)`;
const detail = [
  `statements ${total.statements.pct}%`,
  `branches ${total.branches.pct}%`,
  `functions ${total.functions.pct}%`,
].join(', ');

// The gate the same run had to clear. Enforcement belongs to `npm run coverage`
// (the vitest thresholds, which fail the job); this line only puts the level CI
// enforced next to the level CI measured, so a green log stays auditable and an
// unset threshold is reported instead of reading as "no threshold".
const recorded = Number.parseInt(process.env.COVERAGE_LINES_THRESHOLD ?? '', 10);
const gate =
  Number.isInteger(recorded) && recorded >= 0 && recorded <= 100
    ? `recorded threshold: ${recorded}% (COVERAGE_LINES_THRESHOLD) - ${
        lines.pct >= recorded ? 'met' : 'not met'
      }`
    : 'recorded threshold: unavailable (reason: COVERAGE_LINES_THRESHOLD_unset)';

console.log(lineTotal);
console.log(detail);
console.log(gate);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Coverage\n\n- ${lineTotal}\n- ${detail}\n- ${gate}\n`
  );
}
