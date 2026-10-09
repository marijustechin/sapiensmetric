import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { extractAndValidate } from './restore-baseline.mjs';

/**
 * Fresh-runner baseline extraction (T-021). Reproduces the observed failure
 * where `tar -C dist/deploy-baseline -xzf …` fails because the deploy job runs
 * on a clean runner with no `dist/deploy-baseline` directory, and asserts the
 * mandatory extraction/validation now succeeds (and still rejects bad input).
 */

function makeArchive({ operation = 'op-test', artifactId = 'abc123', files = 1 } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'restore-src-'));
  const opDir = join(root, operation);
  if (files > 0) {
    mkdirSync(join(opDir, 'files', 'en'), { recursive: true });
    for (let i = 0; i < files; i += 1) {
      writeFileSync(join(opDir, 'files', 'en', `page-${i}.html`), `<html>${i}</html>`);
    }
  } else {
    mkdirSync(opDir, { recursive: true });
  }
  writeFileSync(
    join(opDir, 'manifest.json'),
    JSON.stringify({ operationId: operation, artifactId, entries: [] }),
  );
  const archive = join(root, 'baseline.tar.gz');
  // Same layout the workflow produces: `tar -C <baselineRoot> -czf … <operation>`.
  execFileSync('tar', ['-C', root, '-czf', archive, operation]);
  return { root, operation, artifactId, archive };
}

function freshTarget() {
  // A directory that does NOT yet exist (models a fresh runner).
  const parent = mkdtempSync(join(tmpdir(), 'restore-dst-'));
  rmSync(parent, { recursive: true, force: true });
  return join(parent, 'dist', 'deploy-baseline');
}

function cleanup(...paths) {
  for (const p of paths) {
    try {
      rmSync(p, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }
}

test('extracts into a fresh target with no pre-existing dist/deploy-baseline', () => {
  const { root, operation, artifactId, archive } = makeArchive({ files: 2 });
  const target = freshTarget();
  assert.equal(existsSync(target), false, 'precondition: target must not exist');

  const result = extractAndValidate({ archive, target, operation, artifact: artifactId });

  assert.equal(existsSync(join(target, operation, 'manifest.json')), true);
  assert.equal(result.manifest.operationId, operation);
  assert.equal(result.manifest.artifactId, artifactId);
  assert.equal(result.backups, 2);
  // Mandatory validation must read the persisted manifest, not just extract.
  assert.equal(
    JSON.parse(readFileSync(join(target, operation, 'manifest.json'), 'utf8')).operationId,
    operation,
  );

  cleanup(root, target);
});

test('works when the operation has no backup files', () => {
  const { root, operation, artifactId, archive } = makeArchive({ files: 0 });
  const target = freshTarget();
  const result = extractAndValidate({ archive, target, operation, artifact: artifactId });
  assert.equal(result.backups, 0);
  cleanup(root, target);
});

test('rejects a missing archive', () => {
  const target = freshTarget();
  assert.throws(
    () =>
      extractAndValidate({
        archive: join(target, 'does-not-exist.tar.gz'),
        target,
        operation: 'op-test',
      }),
    /Archive not found/,
  );
  cleanup(target);
});

test('rejects an operation-id mismatch after extraction', () => {
  const { root, archive, artifactId } = makeArchive({ operation: 'op-real' });
  const target = freshTarget();
  // The expected operation directory is absent, so validation fails.
  assert.throws(
    () => extractAndValidate({ archive, target, operation: 'op-wrong', artifact: artifactId }),
    /manifest/,
  );
  cleanup(root, target);
});

test('rejects an artifact-id mismatch after extraction', () => {
  const { root, operation, archive } = makeArchive({ artifactId: 'right-id' });
  const target = freshTarget();
  assert.throws(
    () => extractAndValidate({ archive, target, operation, artifact: 'wrong-id' }),
    /manifest artifactId/,
  );
  cleanup(root, target);
});
