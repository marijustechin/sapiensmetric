import { describe, it, expect } from 'vitest';
import { toPublicForm } from '@sapiensmetric/assessment';
import {
  ASTRONOMY_ITEMS,
  ASTRONOMY_OBJECTIVES,
  buildAstronomySnapshot,
} from './astronomy-bank.js';
import {
  evaluatePublicationEligibility,
  validateAstronomyBank,
} from './astronomy-review.js';

describe('astronomy draft bank (T-022)', () => {
  it('is structurally valid', () => {
    expect(validateAstronomyBank()).toEqual([]);
  });

  it('covers all 25 owner topics exactly once', () => {
    expect(ASTRONOMY_ITEMS).toHaveLength(25);
    const topics = ASTRONOMY_ITEMS.map((i) => i.topic).sort((a, b) => a - b);
    expect(topics).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('maps every item to a declared objective and every objective to its topics', () => {
    const objectiveIds = new Set(ASTRONOMY_OBJECTIVES.map((o) => o.objectiveId));
    for (const item of ASTRONOMY_ITEMS) {
      expect(objectiveIds.has(item.objectiveId)).toBe(true);
    }
    const mapped = ASTRONOMY_OBJECTIVES.flatMap((o) => o.topics).sort((a, b) => a - b);
    expect(mapped).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('keeps every draft unreviewed and NOT publication-eligible', () => {
    for (const item of ASTRONOMY_ITEMS) {
      expect(item.reviews.content).toBeNull();
      expect(item.reviews.language).toBeNull();
      expect(evaluatePublicationEligibility(item).eligible).toBe(false);
    }
  });

  it('never repeats the correct option text inside the prompt (answer hint)', () => {
    for (const item of ASTRONOMY_ITEMS) {
      for (const correct of item.correctOptionIds) {
        const option = item.options.find((o) => o.id === correct);
        expect(option).toBeDefined();
        expect(item.prompt.en.includes(option!.text.en)).toBe(false);
        expect(item.prompt.lt.includes(option!.text.lt)).toBe(false);
      }
    }
  });

  it('builds a deterministic form: a new attempt repeats the same items and option order', () => {
    const first = buildAstronomySnapshot();
    const second = buildAstronomySnapshot();
    // No randomisation: two builds are deep-equal (order included).
    expect(second).toEqual(first);
    expect(first.items.map((i) => i.itemId)).toEqual(
      ASTRONOMY_ITEMS.map((i) => i.itemId),
    );
    // Option order is preserved from the bank (no shuffling).
    first.items.forEach((engineItem, index) => {
      const optionIds = 'optionIds' in engineItem ? engineItem.optionIds : [];
      expect(optionIds).toEqual(ASTRONOMY_ITEMS[index].options.map((o) => o.id));
    });
  });

  it('exposes keys only in the server snapshot, never in the public form', () => {
    const snapshot = buildAstronomySnapshot();
    expect(JSON.stringify(snapshot)).toContain('correctOptionId');
    const publicForm = JSON.stringify(toPublicForm(snapshot));
    for (const leaked of ['correctOptionId', 'correctOrder', 'acceptedValue', 'absoluteTolerance']) {
      expect(publicForm).not.toContain(leaked);
    }
  });
});
