import { describe, it, expect } from 'vitest';
import { saveAnswersRequestSchema } from './assessment';

/**
 * Duplicate-answer rejection (repo audit 2026-10-09).
 *
 * The API treats a malformed answer payload as `400 INVALID_ANSWERS`
 * (`docs/assessments.md`). The scoring core already detects duplicate response
 * entries, but the service merges entries by `itemId` (last-wins) before
 * validation, so a duplicate payload was silently accepted. The contract now
 * rejects duplicate `itemId`s so the controller returns `400` as documented.
 */
describe('saveAnswersRequestSchema', () => {
  it('accepts distinct item entries', () => {
    const parsed = saveAnswersRequestSchema.parse({
      revision: 0,
      answers: [
        {
          itemId: 'synthetic-single',
          response: { kind: 'single-answer', selectedOptionId: 's3' },
        },
        {
          itemId: 'synthetic-multi',
          response: { kind: 'multiple-select', selectedOptionIds: ['s1'] },
        },
      ],
    });
    expect(parsed.answers).toHaveLength(2);
  });

  it('rejects duplicate itemId entries (=> 400 INVALID_ANSWERS at the API)', () => {
    const result = saveAnswersRequestSchema.safeParse({
      revision: 0,
      answers: [
        {
          itemId: 'synthetic-single',
          response: { kind: 'single-answer', selectedOptionId: 's3' },
        },
        {
          itemId: 'synthetic-single',
          response: { kind: 'single-answer', selectedOptionId: 's1' },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('allows clearing and setting different items in one payload', () => {
    const parsed = saveAnswersRequestSchema.parse({
      revision: 2,
      answers: [
        { itemId: 'a', response: { kind: 'skipped' } },
        { itemId: 'b', response: { kind: 'numeric', value: 42 } },
      ],
    });
    expect(parsed.answers).toHaveLength(2);
  });
});
