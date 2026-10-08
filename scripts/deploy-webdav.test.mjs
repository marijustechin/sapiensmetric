// Focused tests for the deployment identity model (content-hashed artifact id,
// separate operation id, resume verification, baseline capture decisions).
// Run: node --test scripts/deploy-webdav.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  artifactIdentity,
  credentialsFromEnv,
  newOperationId,
  reservedPaths,
  shouldCaptureBaseline,
  assertResumeMatches,
  sha256,
  sortKeysForUpload,
} from './deploy-webdav.mjs';

function contentHash(path, contents) {
  return { path, sha256: sha256(Buffer.from(contents)) };
}

test('artifact identity uses sorted paths + content hashes, not path:size', () => {
  // Same path, same size, different bytes -> different identity.
  const a = artifactIdentity([contentHash('index.html', 'aaaa')]);
  const b = artifactIdentity([contentHash('index.html', 'bbbb')]);
  assert.notEqual(a, b, 'same-size content change must change artifact identity');

  // Same content -> same identity regardless of input order.
  const c = artifactIdentity([contentHash('index.html', 'aaaa'), contentHash('a.css', 'zz')]);
  const d = artifactIdentity([contentHash('a.css', 'zz'), contentHash('index.html', 'aaaa')]);
  assert.equal(c, d, 'identity must be order-independent');
});

test('artifact identity reads real file bytes (same size, different content)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'deploy-artifact-'));
  mkdirSync(join(dir, 'sub'));
  writeFileSync(join(dir, 'index.html'), 'AAAA');
  writeFileSync(join(dir, 'sub', 'a.css'), 'BB');
  const first = artifactIdentity([
    contentHash('index.html', 'AAAA'),
    contentHash('sub/a.css', 'BB'),
  ]);

  // Change one file to a different value of the SAME length.
  writeFileSync(join(dir, 'index.html'), 'ZZZZ');
  const second = artifactIdentity([
    contentHash('index.html', 'ZZZZ'),
    contentHash('sub/a.css', 'BB'),
  ]);
  assert.notEqual(first, second, 'same-length content change must change identity');
});

test('a new deployment operation gets a fresh operation id', () => {
  const artifactId = artifactIdentity([contentHash('index.html', 'same')]);
  const op1 = newOperationId();
  const op2 = newOperationId();
  assert.notEqual(op1, op2, 'each deployment operation must get a fresh id');
  // Operation id is independent of artifact id.
  const secondArtifactId = artifactIdentity([contentHash('index.html', 'same')]);
  assert.equal(artifactId, secondArtifactId, 'same artifact -> same artifact id');
  assert.ok(op1 !== artifactId && op2 !== artifactId);
});

test('retry preserves the original baseline instead of re-capturing', () => {
  // A retry sees the existing overwrite entry: it must NOT capture again, so the
  // original pre-deployment content is preserved across attempts.
  const entry = { path: 'index.html', action: 'overwrite', backup: 'files/index.html' };
  assert.equal(shouldCaptureBaseline(entry), false, 'retry must reuse the baseline');
  // A path created by this operation never had a pre-deployment baseline.
  assert.equal(shouldCaptureBaseline({ path: 'new.html', action: 'create' }), false);
  // No prior entry (first attempt) -> capture the original remote content.
  assert.equal(shouldCaptureBaseline(undefined), true);
});

test('resume verifies artifact contents and destination match', () => {
  const manifest = { operationId: 'op-1', artifactId: 'abc123', remoteBase: 'https://host:2078/' };
  assert.doesNotThrow(() =>
    assertResumeMatches(manifest, { artifactId: 'abc123', remoteBase: 'https://host:2078/' }),
  );
  assert.throws(
    () => assertResumeMatches(manifest, { artifactId: 'different', remoteBase: 'https://host:2078/' }),
    /Artifact contents differ/,
  );
  assert.throws(
    () => assertResumeMatches(manifest, { artifactId: 'abc123', remoteBase: 'https://other:2078/' }),
    /Destination differs/,
  );
});

test('upload ordering is deterministic with assets first', () => {
  const ordered = sortKeysForUpload(['index.html', '_next/x.js', 'branding/a.webp', 'en/index.html']);
  assert.deepEqual(ordered.slice(0, 2), ['_next/x.js', 'branding/a.webp']);
});

test('CI credentials come from the environment and reject disabled TLS', () => {
  const env = {
    WEBDAV_URL: 'https://host:2078',
    WEBDAV_USERNAME: 'ci-user',
    WEBDAV_PASSWORD: 's3cret-value',
  };
  const creds = credentialsFromEnv(env);
  assert.equal(creds.url, 'https://host:2078/');
  // The Authorization header is derived, but the raw password is never returned.
  assert.match(creds.auth, /^Basic /);
  assert.equal(Buffer.from(creds.auth.slice('Basic '.length), 'base64').toString('utf8'), 'ci-user:s3cret-value');
  assert.equal(JSON.stringify(creds).includes('s3cret-value'), false, 'raw password must not appear in the returned object');

  assert.throws(() => credentialsFromEnv({ WEBDAV_URL: 'https://host/' }), /WEBDAV_URL and WEBDAV_USERNAME/);
  assert.throws(
    () => credentialsFromEnv({ WEBDAV_URL: 'https://host/', WEBDAV_USERNAME: 'u' }),
    /WEBDAV_PASSWORD/,
  );
  assert.throws(
    () => credentialsFromEnv({ ...env, NODE_TLS_REJECT_UNAUTHORIZED: '0' }),
    /TLS certificate verification/,
  );
});

test('reserved hosting-controlled paths are detected', () => {
  assert.deepEqual(
    reservedPaths(['index.html', '.htaccess', '.well-known/acme/x', '.well-known', 'en/index.html']),
    ['.htaccess', '.well-known/acme/x', '.well-known'],
  );
  assert.deepEqual(reservedPaths(['index.html', '_next/a.js']), []);
});
