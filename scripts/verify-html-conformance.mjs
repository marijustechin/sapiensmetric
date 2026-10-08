#!/usr/bin/env node
/**
 * verify-html-conformance.mjs — Nu HTML Checker validation for the generated
 * static export (T-020).
 *
 * Submits the built HTML in `apps/web/out` to the Nu HTML Checker HTTP API
 * (`https://validator.w3.org/nu/?out=json`) and reports per page:
 *   - ERRORS   -> fail the run;
 *   - WARNINGS -> fail the run;
 *   - INFO     -> reported separately, allowed (they do not fail the run).
 *
 * The React-generated "Trailing slash on void elements" notices are INFO and are
 * deliberately left in place: they are harmless, and stripping them would mean
 * post-processing React output. The check covers both locale homepages,
 * representative article/content pages, the articles index, the global 404 and
 * the root redirect.
 *
 * Needs network access to validator.w3.org; it is a diagnostic regression tool
 * (like `verify-navigation-runtime.mjs`) and is NOT part of `pnpm verify`.
 * Run: `node scripts/verify-html-conformance.mjs [file ...]`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const API = 'https://validator.w3.org/nu/?out=json';
const OUT = resolve('apps/web/out');

const DEFAULT_PAGES = [
  'index.html',
  'en/index.html',
  'lt/index.html',
  'en/articles/index.html',
  'lt/articles/index.html',
  'en/articles/why-percentage-correct-is-not-a-percentile/index.html',
  'lt/articles/how-ability-tests-differ-from-knowledge-tests/index.html',
  'en/assessment-guide/index.html',
  'lt/understanding-results/index.html',
  'en/contact/index.html',
  'lt/privacy/index.html',
  '404.html',
];

const args = process.argv.slice(2);
// Do NOT silently drop missing pages: a smaller validated set must not look like
// a pass. If the export is absent, fail with a clear message.
const requested = args.length > 0 ? args : DEFAULT_PAGES.map((p) => `${OUT}/${p}`);
const missing = requested.filter((p) => !existsSync(p));
if (missing.length > 0) {
  console.log('verify-html-conformance: FAIL — expected page(s) missing:');
  for (const p of missing) console.log(`  ${p}`);
  console.log('Run `pnpm build` to produce apps/web/out before validating.');
  process.exit(1);
}
const pages = requested;

let errors = 0;
let warnings = 0;
let infos = 0;

for (const file of pages) {
  let messages;
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'User-Agent': 'sapiensmetric-nu-check/1.0' },
      body: readFileSync(file),
    });
    messages = (await res.json()).messages ?? [];
  } catch (error) {
    console.log(`FAIL ${file} — request failed: ${error}`);
    errors += 1;
    continue;
  }

  const pageErrors = messages.filter((m) => m.type === 'error');
  const pageWarnings = messages.filter((m) => m.type !== 'error' && m.subType === 'warning');
  const pageInfos = messages.filter((m) => m.type !== 'error' && m.subType !== 'warning');
  errors += pageErrors.length;
  warnings += pageWarnings.length;
  infos += pageInfos.length;

  const rel = file.startsWith(OUT) ? file.slice(OUT.length + 1) : file;
  console.log(
    `${pageErrors.length === 0 && pageWarnings.length === 0 ? 'ok  ' : 'FAIL'} ${rel} — errors=${pageErrors.length} warnings=${pageWarnings.length} info=${pageInfos.length}`,
  );
  for (const m of [...pageErrors, ...pageWarnings]) {
    const loc = m.lastLine ? ` (line ${m.lastLine}${m.firstColumn ? `:${m.firstColumn}` : ''})` : '';
    console.log(`       ${m.type === 'error' ? 'ERROR' : 'WARN'}${loc} ${m.message.replace(/\s*\n\s*/g, ' ')}`);
  }
}

console.log('');
console.log(`verify-html-conformance: ${errors} errors, ${warnings} warnings, ${infos} informational (info allowed).`);
if (errors > 0 || warnings > 0) {
  console.log('verify-html-conformance: FAILED (errors/warnings are attributable markup defects).');
  process.exit(1);
}
console.log('verify-html-conformance: all pages valid (informational notices only).');
