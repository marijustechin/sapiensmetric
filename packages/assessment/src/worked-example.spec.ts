import { describe, it, expect } from 'vitest';
import { scoreAttempt } from './scoring';
import type { AttemptSubmission, KeyedFormSnapshot } from './types';

/**
 * One compact worked fixture with manually established expected outcomes that
 * demonstrates the full scoring flow (all four item types, two objectives,
 * correct/incorrect/skipped, and the full-form denominator).
 *
 * Expected (established by hand, not read from the implementation):
 *   i1 single   -> correct
 *   i2 multiple -> incorrect (subset of the key)
 *   i3 numeric  -> correct (exactly on the inclusive tolerance boundary)
 *   i4 ordering -> skipped (explicit)
 *   i5 single   -> skipped (omitted)
 *   totals: 5 items, 2 correct, 1 incorrect, 2 skipped, score 2
 */
const workedForm: KeyedFormSnapshot = {
  assessmentId: 'worked-demo',
  assessmentVersion: '1.0.0',
  formId: 'worked-form-1',
  formVersion: '1.0.0',
  languageScope: 'en',
  translationVersion: 'en-1.0.0',
  scoringRuleVersion: '1.0.0',
  objectives: [{ objectiveId: 'obj-a' }, { objectiveId: 'obj-b' }],
  items: [
    { itemId: 'i1', itemVersion: '1', objectiveId: 'obj-a', languageScope: 'en', translationVersion: 't1', kind: 'single-answer', optionIds: ['o1', 'o2', 'o3', 'o4'], correctOptionId: 'o3' },
    { itemId: 'i2', itemVersion: '1', objectiveId: 'obj-a', languageScope: 'en', translationVersion: 't1', kind: 'multiple-select', optionIds: ['o1', 'o2', 'o3', 'o4'], correctOptionIds: ['o1', 'o4'] },
    { itemId: 'i3', itemVersion: '1', objectiveId: 'obj-a', languageScope: 'neutral', translationVersion: 't1', kind: 'numeric', unit: 'km', acceptedValue: 42, absoluteTolerance: 0.5 },
    { itemId: 'i4', itemVersion: '1', objectiveId: 'obj-b', languageScope: 'neutral', translationVersion: 't1', kind: 'ordering', optionIds: ['p', 'q', 'r'], correctOrder: ['r', 'p', 'q'] },
    { itemId: 'i5', itemVersion: '1', objectiveId: 'obj-b', languageScope: 'en', translationVersion: 't1', kind: 'single-answer', optionIds: ['o1', 'o2', 'o3'], correctOptionId: 'o2' },
  ],
};

const workedSubmission: AttemptSubmission = {
  attemptId: 'worked-attempt-1',
  status: 'submitted',
  responses: [
    { itemId: 'i1', response: { kind: 'single-answer', selectedOptionId: 'o3' } },
    { itemId: 'i2', response: { kind: 'multiple-select', selectedOptionIds: ['o1'] } },
    { itemId: 'i3', response: { kind: 'numeric', value: 42.5 } },
    { itemId: 'i4', response: { kind: 'skipped' } },
    // i5 omitted on purpose -> counts as skipped
  ],
};

describe('worked example', () => {
  it('produces the manually established outcome', () => {
    const result = scoreAttempt(workedForm, workedSubmission);

    expect(result).toMatchObject({
      attemptId: 'worked-attempt-1',
      assessmentId: 'worked-demo',
      assessmentVersion: '1.0.0',
      formId: 'worked-form-1',
      formVersion: '1.0.0',
      scoringRuleVersion: '1.0.0',
      languageScope: 'en',
      translationVersion: 'en-1.0.0',
      totalItems: 5,
      correct: 2,
      incorrect: 1,
      skipped: 2,
      score: 2,
    });

    expect(result.items.map((item) => [item.itemId, item.outcome, item.pointsAwarded])).toEqual([
      ['i1', 'correct', 1],
      ['i2', 'incorrect', 0],
      ['i3', 'correct', 1],
      ['i4', 'skipped', 0],
      ['i5', 'skipped', 0],
    ]);

    expect(result.objectives).toEqual([
      { objectiveId: 'obj-a', items: 3, correct: 2, incorrect: 1, skipped: 0 },
      { objectiveId: 'obj-b', items: 2, correct: 0, incorrect: 0, skipped: 2 },
    ]);

    expect(result.correct + result.incorrect + result.skipped).toBe(result.totalItems);
    expect(result.score).toBe(result.correct);
  });
});
