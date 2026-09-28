import type { KeyedFormSnapshot } from '@sapiensmetric/assessment';

/**
 * SYNTHETIC assessment content (T-017) — local/test only.
 *
 * This is NOT the astronomy pilot bank and is NOT publication-ready. It exists
 * solely to exercise the persisted-attempt vertical slice. Every identifier is
 * prefixed `synthetic-` so synthetic data is unmistakable, and this module is
 * server-side only (never imported by the web app). It is reachable only when
 * `ASSESSMENT_SYNTHETIC_ENABLED=true` (local/test); the config refuses to enable
 * it in production.
 *
 * The snapshot is deterministic: the same evaluation always yields the same
 * form, so tests can assert exact expected results. It is returned to callers
 * only through the public projection (no answer keys).
 */
export const SYNTHETIC_ASSESSMENT_ID = 'synthetic-demo';

export function buildSyntheticForm(): KeyedFormSnapshot {
  return {
    assessmentId: SYNTHETIC_ASSESSMENT_ID,
    assessmentVersion: '1.0.0',
    formId: 'synthetic-form-1',
    formVersion: '1.0.0',
    languageScope: 'en',
    translationVersion: 'synthetic-1.0.0',
    scoringRuleVersion: '1.0.0',
    objectives: [
      { objectiveId: 'synthetic-obj-a' },
      { objectiveId: 'synthetic-obj-b' },
    ],
    items: [
      {
        itemId: 'synthetic-single',
        itemVersion: '1',
        objectiveId: 'synthetic-obj-a',
        languageScope: 'en',
        translationVersion: 'synthetic-1',
        kind: 'single-answer',
        optionIds: ['s1', 's2', 's3', 's4'],
        correctOptionId: 's3',
      },
      {
        itemId: 'synthetic-multi',
        itemVersion: '1',
        objectiveId: 'synthetic-obj-a',
        languageScope: 'en',
        translationVersion: 'synthetic-1',
        kind: 'multiple-select',
        optionIds: ['s1', 's2', 's3', 's4'],
        correctOptionIds: ['s1', 's4'],
      },
      {
        itemId: 'synthetic-order',
        itemVersion: '1',
        objectiveId: 'synthetic-obj-b',
        languageScope: 'neutral',
        translationVersion: 'synthetic-1',
        kind: 'ordering',
        optionIds: ['p', 'q', 'r'],
        correctOrder: ['r', 'p', 'q'],
      },
      {
        itemId: 'synthetic-numeric',
        itemVersion: '1',
        objectiveId: 'synthetic-obj-b',
        languageScope: 'neutral',
        translationVersion: 'synthetic-1',
        kind: 'numeric',
        unit: 'units',
        acceptedValue: 42,
        absoluteTolerance: 0.5,
      },
    ],
  };
}
