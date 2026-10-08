import test from 'node:test';
import assert from 'node:assert/strict';
import { isIgnored, shouldDeploy } from './ci-should-deploy.mjs';

/**
 * Change classification for automatic frontend publication (T-021).
 * The rule is conservative: only clearly-frontend-irrelevant files skip deploy.
 */

test('documentation-only changes do not deploy', () => {
  for (const files of [
    ['README.md'],
    ['TODO.md'],
    ['docs/publication-status.md', 'docs/testing.md'],
    ['tasks/current.md'],
    ['docs/deployments/2026-10-09-abc.md'],
  ]) {
    assert.equal(shouldDeploy(files).deploy, false, JSON.stringify(files));
  }
});

test('API-only and non-web-package changes do not deploy', () => {
  for (const files of [
    ['apps/api/src/main.ts'],
    ['packages/assessment/src/scoring.ts'],
  ]) {
    assert.equal(shouldDeploy(files).deploy, false, JSON.stringify(files));
  }
});

test('shared contract changes deploy (conservative until dependency-aware)', () => {
  // packages/contracts is NOT on the skip list: shared contracts can affect
  // frontend consumers, so a contract-only change must still deploy.
  for (const files of [
    ['packages/contracts/src/assessment.ts'],
    ['packages/contracts/src/auth.ts', 'packages/contracts/src/index.ts'],
  ]) {
    assert.equal(shouldDeploy(files).deploy, true, JSON.stringify(files));
  }
});

test('web source, public assets and config deploy', () => {
  for (const files of [
    ['apps/web/app/[locale]/layout.tsx'],
    ['apps/web/public/branding/favicon.ico'],
    ['apps/web/next.config.mjs'],
    ['apps/web/tailwind.config.ts'],
  ]) {
    assert.equal(shouldDeploy(files).deploy, true, JSON.stringify(files));
  }
});

test('shared build dependencies and release/deployment tooling never skip', () => {
  for (const files of [
    ['package.json'],
    ['pnpm-lock.yaml'],
    ['scripts/deploy-webdav.mjs'],
    ['scripts/build-public-release.sh'],
    ['.github/workflows/deploy.yml'],
  ]) {
    assert.equal(shouldDeploy(files).deploy, true, JSON.stringify(files));
  }
});

test('a mixed change set deploys when any relevant file is present', () => {
  assert.equal(shouldDeploy(['docs/architecture.md', 'apps/web/widgets/site-header/site-header.tsx']).deploy, true);
});

test('an empty/unknown change set favours deployment', () => {
  assert.equal(shouldDeploy([]).deploy, true);
  assert.equal(shouldDeploy(['', '   ']).deploy, true);
});

test('relevant files are reported for diagnostics', () => {
  const { relevant } = shouldDeploy(['docs/x.md', 'apps/web/a.tsx', 'apps/api/b.ts']);
  assert.deepEqual(relevant, ['apps/web/a.tsx']);
});

test('isIgnored is prefix- and allow-list based', () => {
  assert.equal(isIgnored('docs/anything/deep.md'), true);
  assert.equal(isIgnored('apps/api/src/x.ts'), true);
  assert.equal(isIgnored('apps/web/AGENTS.md'), true);
  assert.equal(isIgnored('packages/assessment/src/scoring.ts'), true);
  assert.equal(isIgnored('packages/contracts/src/assessment.ts'), false);
  assert.equal(isIgnored('apps/web/app/page.tsx'), false);
  assert.equal(isIgnored('apps/apiary/x'), false); // not the apps/api/ prefix
});
