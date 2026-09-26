import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  EDUCATIONAL_CONTENT_RULES,
  evaluateClaims,
} from './claims-rules.ts';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Educational content is allowed to discuss IQ and percentiles accurately and
 * must not be flagged. It must not, however, make unsupported product claims.
 */
const ALLOWED_SAMPLES = [
  'An online IQ test can give you practice and a score on its own tasks.',
  'A percentile describes a position within a defined comparison group.',
  'Percentage correct is a score on the task; a percentile is a group position.',
  'SapiensMetric assessments are not released yet.',
  'We will not label a result as an intelligence estimate.',
  'Results are pre-validation; the task is not scientifically validated.',
];

const DISALLOWED_SAMPLES: { text: string; reason: string }[] = [
  { text: 'SapiensMetric provides your IQ score.', reason: 'product IQ claim' },
  { text: 'Our assessment measures intelligence.', reason: 'measurement claim' },
  { text: 'Our test is scientifically validated.', reason: 'validation claim' },
  { text: 'This is a hiring recommendation.', reason: 'hiring claim' },
  { text: 'Read our testimonials from happy users.', reason: 'social proof' },
];

test('educational content rules allow representative educational statements', () => {
  for (const sample of ALLOWED_SAMPLES) {
    assert.deepEqual(
      evaluateClaims(sample, EDUCATIONAL_CONTENT_RULES),
      [],
      `must be allowed: ${sample}`,
    );
  }
});

test('educational content rules flag representative unsupported claims', () => {
  for (const { text } of DISALLOWED_SAMPLES) {
    assert.ok(
      evaluateClaims(text, EDUCATIONAL_CONTENT_RULES).length > 0,
      `must be flagged: ${text}`,
    );
  }
});

test('the shipped public content passes the educational content rules', () => {
  for (const file of ['../content/pages.ts', '../content/articles.ts']) {
    const text = readFileSync(resolve(here, file), 'utf8');
    const violations = evaluateClaims(text, EDUCATIONAL_CONTENT_RULES);
    assert.deepEqual(
      violations.map((rule) => `${rule.reason} in ${file}`),
      [],
      `content claim violations in ${file}`,
    );
  }
});
