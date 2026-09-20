// Guards the Coolify/nixpacks build inputs of this repository.
//
// nixpacks' Node provider installs `nodejs_<major>` from a per-major nixpkgs archive: the
// *package* comes from `NIXPACKS_NODE_VERSION` (or package.json `engines.node`), while the
// *archive* is resolved from `engines.node` alone. Without an `engines.node` declaration the
// archive is the one for nixpacks' default Node 18, and asking for `nodejs_24` out of it fails
// with `error: undefined variable 'nodejs_24'`. Both halves are therefore required: the
// declaration here and the matching `NIXPACKS_NODE_VERSION` on the Coolify application.
//
// vite 7 declares `engines.node: ^20.19.0 || >=22.12.0`; on an older runtime npm only warns
// (`EBADENGINE`) and vite prints "You are using Node.js ..., upgrade your Node.js version",
// so an unsupported build image stays invisible until a dependency starts enforcing it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const pkg = JSON.parse(read('../package.json'));
const minimumNode = { major: 22, minor: 12 };
const nixpacksNpmMajorFromLockfile = { 1: 6, 2: 8, 3: 9 };

test('package.json declares engines.node at or above 22.12 (nixpacks archive + vite 7 support)', () => {
  const range = pkg.engines?.node;
  assert.ok(range, 'package.json must declare engines.node');
  const match = String(range).match(/(\d+)\.(\d+)/);
  assert.ok(match, `cannot read a minimum version out of engines.node: ${range}`);
  const [major, minor] = [Number(match[1]), Number(match[2])];
  const ok = major > minimumNode.major || (major === minimumNode.major && minor >= minimumNode.minor);
  assert.ok(ok, `engines.node ${range} is below ${minimumNode.major}.${minimumNode.minor}`);
});

test('the npm lockfile selects the npm major nixpacks provisions for the install step', () => {
  const lockfile = JSON.parse(read('../package-lock.json'));
  const version = Number(lockfile.lockfileVersion);
  const expected = nixpacksNpmMajorFromLockfile[version];
  assert.ok(expected, `unexpected package-lock.json lockfileVersion: ${lockfile.lockfileVersion}`);
  const install = pkg.scripts?.build ? 'npm ci' : 'npm i';
  assert.equal(install, 'npm ci', 'a package-lock.json must be present so nixpacks runs `npm ci`');
  assert.equal(expected, 9, `lockfileVersion ${version} makes nixpacks provision npm-${expected}_x`);
});
