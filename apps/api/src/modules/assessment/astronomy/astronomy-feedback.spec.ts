import { describe, it, expect } from 'vitest';
import { scoreAttempt, type KeyedFormSnapshot, type ResponseEntry } from '@sapiensmetric/assessment';
import { ASTRONOMY_ITEMS, buildAstronomySnapshot } from './astronomy-bank.js';
import {
  buildAttemptContent,
  buildAttemptFeedback,
} from './astronomy-feedback.js';

const ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';

function responses(): ResponseEntry[] {
  const first = ASTRONOMY_ITEMS[0];
  const second = ASTRONOMY_ITEMS[1];
  const wrongSecond = second.options.find(
    (o) => !second.correctOptionIds.includes(o.id),
  )!;
  return [
    {
      itemId: first.itemId,
      response: { kind: 'single-answer', selectedOptionId: first.correctOptionIds[0] },
    },
    {
      itemId: second.itemId,
      response: { kind: 'single-answer', selectedOptionId: wrongSecond.id },
    },
  ];
}

function scored(snapshot: KeyedFormSnapshot, entries: ResponseEntry[]) {
  return scoreAttempt(snapshot, {
    attemptId: ATTEMPT_ID,
    status: 'submitted',
    responses: entries,
  });
}

describe('astronomy content and feedback projections (T-022)', () => {
  it('localized content carries prompts/options but NO answer keys', () => {
    const snapshot = buildAstronomySnapshot();
    const content = buildAttemptContent(snapshot, 'en');
    expect(content.items).toHaveLength(25);
    expect(content.items[0].prompt).toBe(ASTRONOMY_ITEMS[0].prompt.en);
    expect(content.items[0].options).toHaveLength(ASTRONOMY_ITEMS[0].options.length);
    expect(content.items[0].options[0].text.length).toBeGreaterThan(0);
    const json = JSON.stringify(content);
    for (const leaked of ['correctOptionId', 'correctOptionIds', 'correctOrder', 'acceptedValue', 'absoluteTolerance']) {
      expect(json).not.toContain(leaked);
    }
    // Lithuanian content is localized too.
    expect(buildAttemptContent(snapshot, 'lt').items[0].prompt).toBe(
      ASTRONOMY_ITEMS[0].prompt.lt,
    );
  });

  it('feedback reports outcomes, correct options, explanations and sources', () => {
    const snapshot = buildAstronomySnapshot();
    const entries = responses();
    const feedback = buildAttemptFeedback(snapshot, entries, scored(snapshot, entries), 'en');
    expect(feedback.items).toHaveLength(25);
    const first = feedback.items[0];
    expect(first.outcome).toBe('correct');
    expect(first.answerOptionIds).toEqual(ASTRONOMY_ITEMS[0].correctOptionIds);
    expect(first.explanation).toBe(ASTRONOMY_ITEMS[0].explanation.en);
    expect(first.sources.length).toBeGreaterThan(0);
    expect(first.unavailable).toBeFalsy();

    const second = feedback.items[1];
    expect(second.outcome).toBe('incorrect');
    // A skipped item is reported separately (not counted as correct/incorrect).
    expect(feedback.totals.skipped).toBe(23);
    expect(feedback.totals.correct).toBe(1);
    expect(feedback.totals.incorrect).toBe(1);
  });

  it('does not rewrite feedback when the attempt item version is absent (version pinning)', () => {
    const snapshot = structuredClone(buildAstronomySnapshot());
    // Simulate an older attempt whose item version is no longer in the bank.
    snapshot.items[0].itemVersion = '0.0.0';
    const entries = responses();
    const feedback = buildAttemptFeedback(snapshot, entries, scored(snapshot, entries), 'en');
    const first = feedback.items[0];
    expect(first.unavailable).toBe(true);
    expect(first.answerOptionIds).toEqual([]);
    expect(first.explanation).not.toBe(ASTRONOMY_ITEMS[0].explanation.en);
  });
});
