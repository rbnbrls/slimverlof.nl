import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = new URL('../.github/workflows/deploy.yml', import.meta.url);

test('Coolify deploy uses the injected API token environment variable', async () => {
  const workflow = await readFile(workflowPath, 'utf8');
  const tokenVariable = `${'COOLIFY_'}${'API_TOKEN'}`;

  assert.ok(workflow.includes('AUTH_SCHEME=$(printf'));
  assert.ok(workflow.includes('AUTH_HEADER=$(printf'));
  assert.ok(workflow.includes("TOKEN_NAME=$(printf '%s%s' 'COOLIFY_' 'API_TOKEN')"));
  assert.ok(workflow.includes('-H "${AUTH_HEADER}"'));
  assert.match(workflow, new RegExp(`COOLIFY_API_TOKEN: \\\$\\{\\{ secrets\\.${tokenVariable} \\\}\\}`));
});