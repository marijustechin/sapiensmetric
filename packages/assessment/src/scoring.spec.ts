import { describe, it, expect } from 'vitest';
import { scoreAttempt } from './scoring';
import { toPublicForm } from './public-form';
import { AssessmentError, type AssessmentErrorCode } from './errors';
import type { AttemptSubmission, KeyedFormSnapshot, ResponseEntry } from './types';

function baseForm(overrides: Partial<KeyedFormSnapshot> = {}): KeyedFormSnapshot {
  return {
    assessmentId: 'demo-assessment',
    assessmentVersion: '1.0.0',
    formId: 'demo-form-a',
    formVersion: '1.0.0',
    languageScope: 'en',
    translationVersion: 'en-1.0.0',
    scoringRuleVersion: '1.0.0',
    objectives: [{ objectiveId: 'obj-1' }, { objectiveId: 'obj-2' }],
    items: [
      {
        itemId: 'i-single',
        itemVersion: '1',
        objectiveId: 'obj-1',
        languageScope: 'en',
        translationVersion: 't1',
        kind: 'single-answer',
        optionIds: ['a', 'b', 'c', 'd'],
        correctOptionId: 'c',
      },
      {
        itemId: 'i-multi',
        itemVersion: '1',
        objectiveId: 'obj-1',
        languageScope: 'en',
        translationVersion: 't1',
        kind: 'multiple-select',
        optionIds: ['a', 'b', 'c', 'd'],
        correctOptionIds: ['a', 'c'],
      },
      {
        itemId: 'i-order',
        itemVersion: '1',
        objectiveId: 'obj-2',
        languageScope: 'en',
        translationVersion: 't1',
        kind: 'ordering',
        optionIds: ['x', 'y', 'z'],
        correctOrder: ['y', 'z', 'x'],
      },
      {
        itemId: 'i-num',
        itemVersion: '1',
        objectiveId: 'obj-2',
        languageScope: 'en',
        translationVersion: 't1',
        kind: 'numeric',
        unit: 'minutes',
        acceptedValue: 8,
        absoluteTolerance: 0.5,
      },
    ],
    ...overrides,
  };
}

function submission(responses: ResponseEntry[], overrides: Partial<AttemptSubmission> = {}): AttemptSubmission {
  return { attemptId: 'attempt-1', status: 'submitted', responses, ...overrides };
}

function outcomeOf(form: KeyedFormSnapshot, responses: ResponseEntry[], itemId: string) {
  const result = scoreAttempt(form, submission(responses));
  const found = result.items.find((item) => item.itemId === itemId);
  if (!found) throw new Error(`no outcome for ${itemId}`);
  return found;
}

function expectCode(fn: () => unknown, code: AssessmentErrorCode): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AssessmentError);
    expect((error as AssessmentError).code).toBe(code);
    return;
  }
  throw new Error('expected an AssessmentError, but no error was thrown');
}

describe('single-answer scoring', () => {
  it('awards 1 for the exact correct option', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'c' } }], 'i-single').outcome).toBe('correct');
  });

  it('awards 0 for a wrong option', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'b' } }], 'i-single').outcome).toBe('incorrect');
  });

  it('counts an explicit skipped response as skipped', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-single', response: { kind: 'skipped' } }], 'i-single').outcome).toBe('skipped');
  });

  it('rejects an unknown option', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'z' } }])), 'INVALID_RESPONSES');
  });
});

describe('multiple-select scoring', () => {
  it('awards 1 only for the exact set', () => {
    const form = baseForm();
    const correct = outcomeOf(form, [{ itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a', 'c'] } }], 'i-multi');
    expect(correct.outcome).toBe('correct');
    expect(correct.pointsAwarded).toBe(1);
  });

  it('is selection-order independent', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['c', 'a'] } }], 'i-multi').outcome).toBe('correct');
  });

  it('is all-or-nothing for a subset', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a'] } }], 'i-multi').outcome).toBe('incorrect');
  });

  it('is all-or-nothing for a superset', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a', 'c', 'd'] } }], 'i-multi').outcome).toBe('incorrect');
  });

  it('rejects duplicated selected options', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a', 'a'] } }])), 'INVALID_RESPONSES');
  });
});

describe('ordering scoring', () => {
  it('awards 1 for the exact ordered sequence', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['y', 'z', 'x'] } }], 'i-order').outcome).toBe('correct');
  });

  it('awards 0 for a different order', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['x', 'y', 'z'] } }], 'i-order').outcome).toBe('incorrect');
  });

  it('rejects an incomplete sequence', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['y', 'z'] } }])), 'INVALID_RESPONSES');
  });

  it('rejects a duplicated entry in the sequence', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['y', 'y', 'z'] } }])), 'INVALID_RESPONSES');
  });

  it('rejects an unknown entry in the sequence', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['y', 'z', 'w'] } }])), 'INVALID_RESPONSES');
  });
});

describe('numeric scoring', () => {
  it('accepts the exact value and the inclusive tolerance boundary', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-num', response: { kind: 'numeric', value: 8 } }], 'i-num').outcome).toBe('correct');
    expect(outcomeOf(form, [{ itemId: 'i-num', response: { kind: 'numeric', value: 8.5 } }], 'i-num').outcome).toBe('correct');
    expect(outcomeOf(form, [{ itemId: 'i-num', response: { kind: 'numeric', value: 7.5 } }], 'i-num').outcome).toBe('correct');
  });

  it('rejects a value just outside the tolerance', () => {
    const form = baseForm();
    expect(outcomeOf(form, [{ itemId: 'i-num', response: { kind: 'numeric', value: 8.5001 } }], 'i-num').outcome).toBe('incorrect');
  });

  it('handles a zero answer with zero tolerance', () => {
    const form = baseForm({
      items: [
        {
          itemId: 'i-zero',
          itemVersion: '1',
          objectiveId: 'obj-1',
          languageScope: 'neutral',
          translationVersion: 't1',
          kind: 'numeric',
          unit: 'count',
          acceptedValue: 0,
          absoluteTolerance: 0,
        },
      ],
    });
    expect(outcomeOf(form, [{ itemId: 'i-zero', response: { kind: 'numeric', value: 0 } }], 'i-zero').outcome).toBe('correct');
    expect(outcomeOf(form, [{ itemId: 'i-zero', response: { kind: 'numeric', value: 0.1 } }], 'i-zero').outcome).toBe('incorrect');
  });

  it('rejects non-finite response values', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'i-num', response: { kind: 'numeric', value: Number.POSITIVE_INFINITY } }])), 'INVALID_RESPONSES');
  });

  it('rejects a non-finite accepted value in the form', () => {
    const form = baseForm();
    (form.items[3] as { acceptedValue: number }).acceptedValue = Number.NaN;
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });

  it('rejects a negative tolerance in the form', () => {
    const form = baseForm();
    (form.items[3] as { absoluteTolerance: number }).absoluteTolerance = -1;
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });
});

describe('form validation', () => {
  it('rejects duplicate item IDs', () => {
    const form = baseForm();
    form.items.push({ ...(form.items[0] as KeyedFormSnapshot['items'][number]) });
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });

  it('rejects duplicate objective IDs', () => {
    const form = baseForm({ objectives: [{ objectiveId: 'obj-1' }, { objectiveId: 'obj-1' }] });
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });

  it('rejects an item whose objective is not declared', () => {
    const form = baseForm();
    (form.items[0] as { objectiveId: string }).objectiveId = 'obj-missing';
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });

  it('rejects a correct option that is not among the options', () => {
    const form = baseForm();
    (form.items[0] as { correctOptionId: string }).correctOptionId = 'z';
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });

  it('rejects a multiple-select key that is not a subset of the options', () => {
    const form = baseForm();
    (form.items[1] as { correctOptionIds: string[] }).correctOptionIds = ['a', 'z'];
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });

  it('rejects an ordering key that is not a permutation', () => {
    const form = baseForm();
    (form.items[2] as { correctOrder: string[] }).correctOrder = ['y', 'z'];
    expectCode(() => scoreAttempt(form, submission([])), 'INVALID_FORM');
  });

  it('rejects an unsupported scoring-rule version', () => {
    const form = baseForm({ scoringRuleVersion: '2.0.0' });
    expectCode(() => scoreAttempt(form, submission([])), 'UNSUPPORTED_SCORING_RULE_VERSION');
  });
});

describe('response validation', () => {
  it('rejects a response for an unknown item', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'nope', response: { kind: 'skipped' } }])), 'INVALID_RESPONSES');
  });

  it('rejects duplicate response entries', () => {
    const form = baseForm();
    expectCode(
      () =>
        scoreAttempt(
          form,
          submission([
            { itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'c' } },
            { itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'a' } },
          ]),
        ),
      'INVALID_RESPONSES',
    );
  });

  it('rejects a response whose kind does not match the item kind', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([{ itemId: 'i-order', response: { kind: 'single-answer', selectedOptionId: 'x' } }])), 'INVALID_RESPONSES');
  });
});

describe('submitted versus unfinished attempts', () => {
  it('refuses to score an unfinished attempt', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, submission([], { status: 'unfinished' })), 'ATTEMPT_NOT_SUBMITTED');
  });

  it('refuses to score an attempt with no explicit submitted status', () => {
    const form = baseForm();
    expectCode(() => scoreAttempt(form, { attemptId: 'attempt-1', responses: [] } as unknown as AttemptSubmission), 'ATTEMPT_NOT_SUBMITTED');
  });
});

describe('full-denominator scoring and aggregates', () => {
  it('counts missing responses as skipped and never reduces the denominator', () => {
    const form = baseForm();
    const result = scoreAttempt(
      form,
      submission([
        { itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'c' } },
        { itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a', 'c'] } },
        { itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['x', 'y', 'z'] } },
        // i-num omitted -> skipped
      ]),
    );
    expect(result.totalItems).toBe(4);
    expect(result.correct).toBe(2);
    expect(result.incorrect).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.correct + result.incorrect + result.skipped).toBe(result.totalItems);
    expect(result.score).toBe(2);
  });

  it('reports descriptive objective counts', () => {
    const form = baseForm();
    const result = scoreAttempt(
      form,
      submission([
        { itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'c' } },
        { itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a'] } },
        { itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['y', 'z', 'x'] } },
        { itemId: 'i-num', response: { kind: 'numeric', value: 100 } },
      ]),
    );
    expect(result.objectives).toEqual([
      { objectiveId: 'obj-1', items: 2, correct: 1, incorrect: 1, skipped: 0 },
      { objectiveId: 'obj-2', items: 2, correct: 1, incorrect: 1, skipped: 0 },
    ]);
  });

  it('is deterministic and does not mutate its inputs', () => {
    const form = baseForm();
    const submitted = submission([
      { itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'a' } },
      { itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a', 'c'] } },
    ]);
    const formBefore = structuredClone(form);
    const submissionBefore = structuredClone(submitted);

    const first = scoreAttempt(form, submitted);
    const second = scoreAttempt(form, submitted);

    expect(first).toEqual(second);
    expect(form).toEqual(formBefore);
    expect(submitted).toEqual(submissionBefore);
  });
});

describe('confidential data is not leaked', () => {
  it('keeps answer keys out of the scoring result', () => {
    const form = baseForm();
    const result = scoreAttempt(
      form,
      submission([
        { itemId: 'i-single', response: { kind: 'single-answer', selectedOptionId: 'c' } },
        { itemId: 'i-multi', response: { kind: 'multiple-select', selectedOptionIds: ['a', 'c'] } },
        { itemId: 'i-order', response: { kind: 'ordering', orderedOptionIds: ['y', 'z', 'x'] } },
        { itemId: 'i-num', response: { kind: 'numeric', value: 8 } },
      ]),
    );
    const serialized = JSON.stringify(result);
    for (const forbidden of ['correctOptionId', 'correctOptionIds', 'correctOrder', 'acceptedValue', 'absoluteTolerance', 'optionIds']) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(result.items.every((item) => !('optionIds' in item) && !('correctOptionId' in item))).toBe(true);
  });

  it('projects a browser-safe public form without answer keys', () => {
    const publicForm = toPublicForm(baseForm());
    const serialized = JSON.stringify(publicForm);
    for (const forbidden of ['correctOptionId', 'correctOptionIds', 'correctOrder', 'acceptedValue', 'absoluteTolerance']) {
      expect(serialized).not.toContain(forbidden);
    }
    const numeric = publicForm.items.find((item) => item.kind === 'numeric');
    expect(numeric).toMatchObject({ kind: 'numeric', unit: 'minutes' });
    expect(numeric && 'acceptedValue' in numeric).toBe(false);
    const ordering = publicForm.items.find((item) => item.kind === 'ordering');
    expect(ordering?.optionIds).toEqual(['x', 'y', 'z']);
    expect(ordering && 'correctOrder' in ordering).toBe(false);
  });
});
