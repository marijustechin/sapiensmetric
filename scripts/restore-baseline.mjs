#!/usr/bin/env node
/**
 * restore-baseline.mjs — extract and validate an encrypted-baseline archive
 * (T-021) into a target directory on a fresh runner.
 *
 * The deploy/rollback jobs run on **fresh runners** where `dist/deploy-baseline`
 * does not exist. The baseline archive is created with
 * `tar -C dist/deploy-baseline -czf … <operation>`, so it contains
 * `<operation>/manifest.json` and `<operation>/files/…`; extraction therefore
 * requires the target parent directory to be created first. This script is the
 * single, tested implementation of that extraction + validation, so the workflow
 * and the tests exercise the same code.
 *
 * Any failure (missing archive, extraction error, missing/mismatched manifest,
 * artifact mismatch) throws and exits non-zero — the caller must treat this as
 * mandatory and must not proceed to production PUTs.
 *
 * Usage:
 *   node scripts/restore-baseline.mjs \
 *     --archive <baseline.tar.gz> --target dist/deploy-baseline \
 *     --operation <id> [--artifact <contentArtifactId>]
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function parseArgs(argv) {
  const args = { archive: null, target: null, operation: null, artifact: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--archive') args.archive = argv[++i];
    else if (a === '--target') args.target = argv[++i];
    else if (a === '--operation') args.operation = argv[++i];
    else if (a === '--artifact') args.artifact = argv[++i];
  }
  return args;
}

export function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else if (entry.isFile()) count += 1;
  }
  return count;
}

/**
 * Extract `archive` into `target` (creating the destination parent first) and
 * validate the extracted operation manifest. Returns the parsed manifest and the
 * backup-file count. Throws on any failure.
 */
export function extractAndValidate({ archive, target, operation, artifact }) {
  if (!archive) throw new Error('--archive is required.');
  if (!target) throw new Error('--target is required.');
  if (!operation) throw new Error('--operation is required.');
  if (!existsSync(archive)) throw new Error(`Archive not found: ${archive}`);

  // Fresh runners have no `dist/deploy-baseline`: create the destination parent
  // before extraction (the archive itself contains `<operation>/…`).
  mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-C', target, '-xzf', archive], { stdio: 'inherit' });

  const manifestPath = join(target, operation, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest.json missing after extraction: ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.operationId !== operation) {
    throw new Error(
      `manifest operationId (${manifest.operationId}) != expected (${operation})`,
    );
  }
  if (artifact && manifest.artifactId !== artifact) {
    throw new Error(
      `manifest artifactId (${manifest.artifactId}) != expected (${artifact})`,
    );
  }

  const filesDir = join(target, operation, 'files');
  const backups = existsSync(filesDir) ? countFiles(filesDir) : 0;
  return { manifest, backups, manifestPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { manifest, backups, manifestPath } = extractAndValidate(args);
  console.log(
    `restore-baseline: extracted operation ${manifest.operationId} (artifact ${manifest.artifactId}) → ${manifestPath}; backup files: ${backups}`,
  );
  console.log(`BASELINE_OPERATION=${manifest.operationId}`);
  console.log(`BASELINE_ARTIFACT=${manifest.artifactId}`);
  console.log(`BASELINE_BACKUPS=${backups}`);
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main().catch((error) => {
    console.error(`restore-baseline: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}
