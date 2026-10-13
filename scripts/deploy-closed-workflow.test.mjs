import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseArgs } from './deploy-webdav.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const closedWorkflow = readFileSync(resolve(repoRoot, '.github/workflows/deploy-closed.yml'), 'utf8');
const publicWorkflow = readFileSync(resolve(repoRoot, '.github/workflows/deploy.yml'), 'utf8');

test('the deploy tool defaults to the PUBLIC artifact (so closed MUST be explicit)', () => {
  const args = parseArgs(['apply']);
  assert.equal(args.artifact, 'dist/public-site');
});

test('the closed workflow applies the verified CLOSED artifact explicitly', () => {
  // The baseline capture and the apply upload must both point at dist/closed-site,
  // or `apply` silently falls back to dist/public-site (the observed failure).
  const artifactMentions = closedWorkflow.match(/--artifact dist\/closed-site/g) ?? [];
  assert.ok(
    artifactMentions.length >= 2,
    `expected --artifact dist/closed-site for both baseline and apply (found ${artifactMentions.length})`,
  );
  assert.match(closedWorkflow, /deploy-webdav\.mjs baseline[\s\S]*?--artifact dist\/closed-site/);
  assert.match(closedWorkflow, /deploy-webdav\.mjs apply[\s\S]*?--artifact dist\/closed-site/);
  assert.doesNotMatch(closedWorkflow, /deploy-webdav\.mjs apply[\s\S]{0,120}--artifact dist\/public-site/);
});

test('the closed workflow uploads and validates the closed artifact directory', () => {
  assert.match(closedWorkflow, /path: dist\/closed-site/);
  // Early validation step (before the remote baseline call) checks profile markers.
  assert.match(closedWorkflow, /Validate the closed artifact before any remote call/);
  assert.match(closedWorkflow, /en\/auth\/login\/index\.html/);
  const validateIdx = closedWorkflow.indexOf('Validate the closed artifact before any remote call');
  const baselineIdx = closedWorkflow.indexOf('Capture the pre-deployment baseline');
  assert.ok(validateIdx > -1 && baselineIdx > -1 && validateIdx < baselineIdx, 'validation must precede the baseline capture');
});

test('the closed workflow verifies production with app-routes=200', () => {
  assert.match(closedWorkflow, /deploy-webdav\.mjs verify --site "\$PUBLIC_SITE_URL" --app-routes 200/);
});

test('the public workflow deploys the artifact selected by the ACTIVE profile', () => {
  assert.doesNotMatch(publicWorkflow, /dist\/closed-site/);
  assert.match(publicWorkflow, /scripts\/production-profile\.mjs/);
  // No hardcoded public artifact: the profile decides.
  assert.doesNotMatch(publicWorkflow, /--artifact dist\/public-site/);
  assert.match(publicWorkflow, /--artifact \$\{\{ needs\.classify\.outputs\.artifact \}\}/);
  assert.match(publicWorkflow, /--app-routes \$\{\{ needs\.classify\.outputs\.app_routes \}\}/);
});

test('--app-routes accepts only 404|200|auto', () => {
  assert.equal(parseArgs(['verify', '--app-routes', '200']).appRoutes, '200');
  assert.equal(parseArgs(['verify']).appRoutes, 'auto');
  assert.throws(() => parseArgs(['verify', '--app-routes', 'wat']), /--app-routes must be one of/);
});
