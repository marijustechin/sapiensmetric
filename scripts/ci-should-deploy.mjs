#!/usr/bin/env node
/**
 * ci-should-deploy.mjs — conservative change classification for automatic
 * frontend publication (T-021).
 *
 * Decides whether a change on `main` should trigger a production deployment.
 * The rule is deliberately conservative: deploy UNLESS every changed file is
 * clearly irrelevant to the public frontend output. Skips apply only to:
 *   - `docs/` and `tasks/` (documentation, task records, committed deployment
 *     records);
 *   - `apps/api/` (backend, not part of the web bundle);
 *   - `packages/contracts/`, `packages/assessment/` (not used by the web bundle);
 *   - a small allow-list of root markdown files and `.gitignore`.
 *
 * Everything else deploys — web source, public assets, `next.config.mjs`,
 * `tailwind.config.ts`, `package.json`, `pnpm-lock.yaml`, `scripts/`, `.github/`
 * — so shared build dependencies and release/deployment tooling are never
 * accidentally skipped. An empty/unknown change set also favours deployment.
 *
 * Usage: `node scripts/ci-should-deploy.mjs [file ...]` (or a newline-separated
 * list on stdin). Prints exactly `true` or `false` on stdout; reasons on stderr.
 */
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

export const IGNORED_PREFIXES = [
  'docs/',
  'tasks/',
  'apps/api/',
  'packages/contracts/',
  'packages/assessment/',
];

export const IGNORED_FILES = new Set([
  'README.md',
  'TODO.md',
  'AGENTS.md',
  'apps/web/AGENTS.md',
  'apps/web/CLAUDE.md',
  '.gitignore',
]);

export function isIgnored(path) {
  const value = path.trim();
  if (value.length === 0) return true;
  if (IGNORED_FILES.has(value)) return true;
  return IGNORED_PREFIXES.some((prefix) => value.startsWith(prefix));
}

/** @returns {{ deploy: boolean, relevant: string[] }} */
export function shouldDeploy(changedFiles) {
  const files = changedFiles.map((file) => file.trim()).filter((file) => file.length > 0);
  if (files.length === 0) {
    // No basis to classify (e.g. unknown diff base): favour deployment.
    return { deploy: true, relevant: [] };
  }
  const relevant = files.filter((file) => !isIgnored(file));
  return { deploy: relevant.length > 0, relevant };
}

async function filesFromStdin() {
  if (process.stdin.isTTY) return [];
  const lines = [];
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) lines.push(line);
  return lines;
}

async function main() {
  const argFiles = process.argv.slice(2);
  const files = argFiles.length > 0 ? argFiles : await filesFromStdin();
  const { deploy, relevant } = shouldDeploy(files);
  if (relevant.length > 0) {
    console.error(`relevant frontend changes: ${relevant.length} (e.g. ${relevant.slice(0, 5).join(', ')})`);
  } else {
    console.error('no frontend-relevant changes');
  }
  process.stdout.write(`${deploy}\n`);
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main().catch((error) => {
    console.error(`ci-should-deploy: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}
