import { describe, it, expect } from 'vitest';
import { buildSyntheticForm } from './synthetic-form.js';
import { toAttemptSummary, toAttemptView } from './assessment-view.js';
import type { AttemptRecord } from './assessment-attempt.store.js';

function attemptRecord(): AttemptRecord {
  const when = new Date('2026-01-01T10:00:00.000Z');
  return {
    id: '11111111-1111-1111-1111-111111111111',
    userId: 'user-1',
    snapshot: buildSyntheticForm(),
    answers: [
      {
        itemId: 'synthetic-single',
        response: { kind: 'single-answer', selectedOptionId: 's3' },
      },
    ],
    status: 'in_progress',
    revision: 1,
    result: null,
    createdAt: when,
    updatedAt: when,
    finalisedAt: null,
  };
}

describe('assessment view projection', () => {
  it('never exposes answer keys or internal definitions', () => {
    const serialized = JSON.stringify(toAttemptView(attemptRecord()));
    for (const forbidden of [
      'correctOptionId',
      'correctOptionIds',
      'correctOrder',
      'acceptedValue',
      'absoluteTolerance',
      'snapshot',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('keeps browser-safe option IDs and the numeric unit', () => {
    const view = toAttemptView(attemptRecord());
    const ordering = view.form.items.find((item) => item.itemId === 'synthetic-order');
    expect(ordering?.optionIds).toEqual(['p', 'q', 'r']);
    const numeric = view.form.items.find((item) => item.itemId === 'synthetic-numeric');
    expect(numeric).toMatchObject({ kind: 'numeric', unit: 'units' });
  });

  it('summary views carry no form or result', () => {
    const summary = toAttemptSummary(attemptRecord());
    expect(Object.keys(summary).sort()).toEqual(
      [
        'assessmentId',
        'attemptId',
        'createdAt',
        'finalisedAt',
        'formId',
        'revision',
        'status',
        'updatedAt',
      ].sort(),
    );
  });
});
