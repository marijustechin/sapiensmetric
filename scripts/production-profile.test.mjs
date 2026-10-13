import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseProfile, profileTargets, PROFILES } from './production-profile.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
const autoWorkflow = readFileSync(resolve(repoRoot, '.github/workflows/deploy.yml'), 'utf8');
const closedWorkflow = readFileSync(resolve(repoRoot, '.github/workflows/deploy-closed.yml'), 'utf8');

test('parseProfile accepts only public|closed (explicit, fail-closed)', () => {
  assert.deepEqual(PROFILES, ['public', 'closed']);
  assert.equal(parseProfile('public'), 'public');
  assert.equal(parseProfile('  closed \n'), 'closed');
  assert.throws(() => parseProfile('staging'), /invalid production profile/);
  assert.throws(() => parseProfile(''), /invalid production profile/);
});

test('profileTargets maps the profile to the artifact directory and app-routes expectation', () => {
  assert.deepEqual(profileTargets('public'), { profile: 'public', artifact: 'dist/public-site', appRoutes: '404' });
  assert.deepEqual(profileTargets('closed'), { profile: 'closed', artifact: 'dist/closed-site', appRoutes: '200' });
});

test('the committed active profile is valid', () => {
  const value = parseProfile(readFileSync(resolve(repoRoot, 'deploy/production-profile'), 'utf8'));
  assert.ok(PROFILES.includes(value));
});

test('both build profiles and their strict checks remain available', () => {
  for (const script of ['build:public', 'verify:public-release', 'build:closed', 'verify:closed']) {
    assert.ok(pkg.scripts[script], `missing ${script}`);
  }
});

test('the automatic workflow is driven by the active profile (no hardcoded artifact)', () => {
  assert.match(autoWorkflow, /scripts\/production-profile\.mjs/);
  assert.match(autoWorkflow, /name: site/);
  assert.match(autoWorkflow, /--artifact \$\{\{ needs\.classify\.outputs\.artifact \}\}/);
  assert.match(autoWorkflow, /--app-routes \$\{\{ needs\.classify\.outputs\.app_routes \}\}/);
  // It must not pin either profile's artifact for the deploy path.
  assert.doesNotMatch(autoWorkflow, /--artifact dist\/public-site/);
  assert.doesNotMatch(autoWorkflow, /--artifact dist\/closed-site/);
  // The deployment record captures the profile.
  assert.match(autoWorkflow, /Production profile:/);
});

test('the closed workflow is guarded and activates the profile only on success', () => {
  assert.match(closedWorkflow, /confirm == 'activate'/);
  assert.match(closedWorkflow, /activate-profile/);
  assert.match(closedWorkflow, /needs\.deploy-closed\.result == 'success'/);
  assert.match(closedWorkflow, /printf 'closed\\n' > deploy\/production-profile/);
  assert.match(closedWorkflow, /activation did not persist/);
});
