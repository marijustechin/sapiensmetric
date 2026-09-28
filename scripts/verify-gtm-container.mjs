#!/usr/bin/env node
/**
 * verify-gtm-container.mjs — focused validation of the GTM *UI import/export*
 * format for `docs/gtm/container-GTM-WRBRTKRT.json` (T-014 format regression).
 *
 * Background: the GTM UI importer rejected an earlier revision of the file with
 * "Error deserializing enum type [Type]. Unrecognized value [template]." The UI
 * export format uses UPPERCASE enum values for Parameter and Condition `type`
 * fields (TEMPLATE, LIST, MAP, INTEGER, BOOLEAN, EQUALS, ...), while tag and
 * variable *template identifiers* stay lowercase (googtag, gaawe, v). The REST
 * API JSON uses lowercase enums and is NOT directly importable — do not "fix"
 * this by uppercasing every `type`.
 *
 * This script validates the file locally. It does NOT prove that the GTM
 * importer accepts it — only an owner-operated GTM import/Preview can show that.
 *
 * Usage: node scripts/verify-gtm-container.mjs [path]
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'docs/gtm/container-GTM-WRBRTKRT.json';

const PARAM_TYPES = new Set([
  'TEMPLATE', 'INTEGER', 'BOOLEAN', 'LIST', 'MAP', 'TRIGGER_REFERENCE', 'TAG_REFERENCE',
]);
const CONDITION_TYPES = new Set([
  'EQUALS', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'MATCH_REGEX', 'GREATER',
  'GREATER_OR_EQUALS', 'LESS', 'LESS_OR_EQUALS', 'CSS_SELECTOR', 'URL_MATCHES',
]);
// Lowercase spellings that indicate API-style JSON leaked into an import file.
const LOWER_ENUMS = new Set([
  'template', 'list', 'map', 'integer', 'boolean', 'trigger_reference', 'tag_reference',
  'equals', 'contains', 'starts_with', 'ends_with', 'match_regex', 'greater',
  'greater_or_equals', 'less', 'less_or_equals', 'css_selector', 'url_matches',
  'not_set', 'needed', 'not_needed', 'once_per_event',
]);
// Built-in variable types must be uppercase.
const BUILT_IN_TYPES = /^[A-Z][A-Z0-9_]+$/;

const failures = [];
const check = (name, condition, detail = '') => {
  if (condition) {
    console.log(`ok   ${name}`);
  } else {
    failures.push(name + (detail ? ` — ${detail}` : ''));
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

let raw;
try {
  raw = readFileSync(file, 'utf8');
} catch {
  console.error(`Cannot read ${file}`);
  process.exit(1);
}

let root;
try {
  root = JSON.parse(raw);
} catch (e) {
  console.error(`FAIL ${file} is not valid JSON: ${e.message}`);
  process.exit(1);
}

const cv = root.containerVersion;
const tags = cv?.tag ?? [];
const triggers = cv?.trigger ?? [];
const variables = cv?.variable ?? [];

// --- 1. no lowercase enum values anywhere (the reported regression) --------
const leaks = [];
(function walk(node, path) {
  if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    if (typeof node.type === 'string' && LOWER_ENUMS.has(node.type)) {
      leaks.push(`${path}.type="${node.type}"`);
    }
    for (const [k, val] of Object.entries(node)) walk(val, `${path}.${k}`);
  }
})(root, '$');
check('no lowercase enum values (template/list/map/integer/equals/...)', leaks.length === 0, leaks.join(', '));

// --- 2. every Parameter `type` is an uppercase enum ------------------------
function paramProblems(params, base) {
  const out = [];
  params.forEach((p, i) => {
    const at = `${base}[${i}]`;
    if (!PARAM_TYPES.has(p.type)) out.push(`${at}.type="${p.type}"`);
    if (Array.isArray(p.list) && p.list.length) out.push(...paramProblems(p.list, `${at}.list`));
    if (Array.isArray(p.map) && p.map.length) out.push(...paramProblems(p.map, `${at}.map`));
  });
  return out;
}
const paramBad = [];
const conditionBad = [];
tags.forEach((t, i) => paramBad.push(...paramProblems(t.parameter ?? [], `tag[${i}](${t.name}).parameter`)));
variables.forEach((v, i) => paramBad.push(...paramProblems(v.parameter ?? [], `variable[${i}](${v.name}).parameter`)));
triggers.forEach((t, i) => {
  for (const key of ['customEventFilter', 'filter']) {
    for (const [j, cond] of (t[key] ?? []).entries()) {
      if (!CONDITION_TYPES.has(cond.type)) conditionBad.push(`trigger[${i}].${key}[${j}].type="${cond.type}"`);
      paramBad.push(...paramProblems(cond.parameter ?? [], `trigger[${i}].${key}[${j}].parameter`));
    }
  }
});
check('all Parameter.type values are uppercase enum values', paramBad.length === 0, paramBad.join(', '));
check('all condition/filter type values are uppercase enum values', conditionBad.length === 0, conditionBad.join(', '));

// --- 3. identifiers are NOT uppercased -------------------------------------
const googtag = tags.find((t) => t.type === 'googtag');
const gaawe = tags.find((t) => t.type === 'gaawe');
check('tag template identifier stays lowercase: googtag', Boolean(googtag));
check('tag template identifier stays lowercase: gaawe', Boolean(gaawe));
check('variable template identifier stays lowercase: v', variables.every((v) => v.type === 'v'));
check(
  'built-in variable types are uppercase',
  (cv?.builtInVariable ?? []).every((b) => BUILT_IN_TYPES.test(String(b.type))),
  JSON.stringify((cv?.builtInVariable ?? []).map((b) => b.type)),
);

// --- 4. preserved values ----------------------------------------------------
check('container publicId is GTM-WRBRTKRT', cv?.container?.publicId === 'GTM-WRBRTKRT');

const param = (tag, key) => (tag?.parameter ?? []).find((p) => p.key === key);
const settingsMap = (tag, key) =>
  Object.fromEntries((param(tag, key)?.list ?? []).map((row) => {
    const m = Object.fromEntries((row.map ?? []).map((x) => [x.key, x.value]));
    return [m.parameter, m.parameterValue];
  }));

check('googtag Tag ID is G-0CR4C3KPH3', param(googtag, 'tagId')?.value === 'G-0CR4C3KPH3');
const cfg = settingsMap(googtag, 'configSettingsTable');
check('Google tag keeps send_page_view=false', cfg.send_page_view === 'false');
check('Google tag sets sanitised page_location', cfg.page_location === '{{DL - page_location}}');
check('Google tag sets sanitised page_referrer', cfg.page_referrer === '{{DL - page_referrer}}');

check('GA4 Event name is page_view', param(gaawe, 'eventName')?.value === 'page_view');
check('GA4 Event measurementIdOverride is G-0CR4C3KPH3', param(gaawe, 'measurementIdOverride')?.value === 'G-0CR4C3KPH3');
const evParams = Object.fromEntries(
  (param(gaawe, 'eventParameters')?.list ?? []).map((row) => {
    const m = Object.fromEntries((row.map ?? []).map((x) => [x.key, x.value]));
    return [m.name, m.value];
  }),
);
check('GA4 Event carries sanitised page_location', evParams.page_location === '{{DL - page_location}}');
check('GA4 Event carries sanitised page_referrer', evParams.page_referrer === '{{DL - page_referrer}}');

const spaTrigger = triggers.find((t) => t.name === 'CE - spa_page_view');
const spaFilter = spaTrigger?.customEventFilter?.[0];
check('spa_page_view trigger exists and filters {{_event}} EQUALS spa_page_view',
  spaFilter?.type === 'EQUALS' && spaFilter?.parameter?.find((p) => p.key === 'arg1')?.value === 'spa_page_view');

for (const tag of [googtag, gaawe]) {
  const ct = tag?.consentSettings?.consentType;
  const types = (ct?.list ?? []).map((p) => p.value);
  check(`${tag?.name}: consent NEEDED for analytics_storage`,
    tag?.consentSettings?.consentStatus === 'NEEDED' && ct?.type === 'LIST' && types.includes('analytics_storage'));
}

for (const name of ['DL - page_location', 'DL - page_referrer']) {
  check(`variable present: ${name}`, variables.some((v) => v.name === name));
}

check('no advertising consent requested (ad_storage/ad_user_data/ad_personalization)',
  !/ad_storage|ad_user_data|ad_personalization/.test(raw));

// --- summary ---------------------------------------------------------------
console.log('');
if (failures.length) {
  console.log(`verify-gtm-container: ${failures.length} failed`);
  process.exit(1);
}
console.log('verify-gtm-container: all local format checks passed.');
console.log('NOTE: local validation only. It does not prove the GTM UI importer accepts');
console.log('this file; confirm with an owner-operated import + Preview.');
