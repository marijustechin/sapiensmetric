import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { LOCALES } from './locale-navigation.ts';

/**
 * Claims guard — keeps public user-facing UI text inside the boundaries of
 * `docs/claims-ladder.md`.
 *
 * Scope: the checked-in UI message catalogues that are rendered to users. It is
 * deliberately narrow: it does NOT scan documentation, task records, tests, or
 * source comments, where discussions of forbidden claims (and tests of the
 * guard itself) are legitimate.
 *
 * FUTURE: when report templates, result screens, or any other user-visible
 * text locations are added, they MUST be registered in PUBLIC_UI_TEXT_SOURCES
 * below so this guard covers them too. Adding a catalogue here is the only
 * required change; no new dependency is needed.
 */

const here = dirname(fileURLToPath(import.meta.url));

interface PublicTextSource {
  label: string;
  path: string;
}

const PUBLIC_UI_TEXT_SOURCES: PublicTextSource[] = LOCALES.map((locale) => ({
  label: `messages/${locale}.json`,
  path: resolve(here, `../../messages/${locale}.json`),
}));

interface ForbiddenClaim {
  /** Claim language that must never appear in public UI copy. */
  pattern: RegExp;
  /** Human-readable explanation for the failure message. */
  reason: string;
  /**
   * Optional negation/disclaimer form. When the text matches this, the claim is
   * treated as a permitted disclaimer (Tier 0) rather than a violation, e.g.
   * "not scientifically validated" or "pre-validation".
   */
  allowIf?: RegExp;
}

/**
 * Patterns map to the prohibited language in `docs/claims-ladder.md`:
 * Tier 0 forbids IQ, norm-referenced comparison, and predictive framing;
 * Tier 4 forbids clinical/diagnostic, hiring/selection, and validation claims.
 */
const FORBIDDEN_CLAIMS: ForbiddenClaim[] = [
  {
    pattern: /\bIQ\b/i,
    reason: 'IQ claim — prohibited at every tier',
  },
  {
    pattern: /intelligence quotient/i,
    reason: 'IQ claim — prohibited at every tier',
  },
  {
    pattern: /\bpercentiles?\b/i,
    reason: 'norm-referenced claim — requires Tier 3 representative norms',
  },
  {
    pattern: /better than \d+\s?%/i,
    reason: 'norm-referenced comparison — requires Tier 3 representative norms',
  },
  {
    pattern: /top \d+\s?%/i,
    reason: 'norm-referenced comparison — requires Tier 3 representative norms',
  },
  {
    pattern: /\bdiagnos(e|es|ed|is|tic)\b/i,
    reason: 'clinical/diagnostic claim — prohibited',
  },
  {
    pattern: /hiring recommendation|employment recommendation|job recommendation/i,
    reason: 'hiring/selection claim — requires Tier 4 validation for that use',
  },
  {
    pattern: /predicts? (your |academic|job|career|work|employment|school)/i,
    reason: 'predictive validity claim — requires Tier 2 validity evidence',
  },
  {
    pattern: /measures? (your )?(intelligence|cognitive ability)/i,
    reason: 'construct-measurement claim — requires Tier 2 validity evidence',
  },
  {
    pattern: /scientifically (validated|proven)/i,
    reason: 'validation claim — prohibited until validation and norming exist',
    allowIf: /\b(not|never)\b|pre-?validation|unvalidated/i,
  },
  {
    pattern: /clinically (validated|proven)/i,
    reason: 'clinical validation claim — prohibited',
    allowIf: /\b(not|never)\b|pre-?validation|unvalidated/i,
  },
];

function flattenStrings(
  value: unknown,
  prefix = '',
): Array<[string, string]> {
  if (typeof value === 'string') {
    return [[prefix, value]];
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenStrings(child, prefix.length > 0 ? `${prefix}.${key}` : key),
  );
}

function findViolations(): string[] {
  const violations: string[] = [];
  for (const source of PUBLIC_UI_TEXT_SOURCES) {
    const catalogue = JSON.parse(readFileSync(source.path, 'utf8')) as unknown;
    for (const [key, text] of flattenStrings(catalogue)) {
      for (const claim of FORBIDDEN_CLAIMS) {
        if (!claim.pattern.test(text)) {
          continue;
        }
        if (claim.allowIf?.test(text)) {
          continue;
        }
        violations.push(
          `${source.label}:${key} -> "${text}" [${claim.reason}]`,
        );
      }
    }
  }
  return violations;
}

test('public UI text contains no claim beyond the claims-ladder boundaries', () => {
  const violations = findViolations();
  assert.deepEqual(
    violations,
    [],
    `Forbidden claim language in public UI text:\n${violations.join('\n')}`,
  );
});

test('the claims guard detects representative forbidden claims (self-check)', () => {
  // Guards against the patterns silently becoming inert.
  const sample =
    'You scored better than 80% of people and have an IQ of 120; this clinically validated test predicts job success.';
  const hits = FORBIDDEN_CLAIMS.filter((claim) => claim.pattern.test(sample)).map(
    (claim) => claim.reason,
  );
  assert.ok(hits.length >= 3, `expected the guard to flag the sample, got ${hits.length}`);
});

test('the claims guard allows a negation/disclaimer form', () => {
  const disclaimer = 'Results are pre-validation and not scientifically validated.';
  const flagged = FORBIDDEN_CLAIMS.some(
    (claim) => claim.pattern.test(disclaimer) && !claim.allowIf?.test(disclaimer),
  );
  assert.equal(flagged, false);
});
