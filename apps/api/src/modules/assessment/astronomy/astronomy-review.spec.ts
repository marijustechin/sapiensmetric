import { describe, it, expect } from 'vitest';
import type { BankItem } from './astronomy-types.js';
import { ASTRONOMY_ITEMS } from './astronomy-bank.js';
import {
  evaluatePublicationEligibility,
  isReviewCurrent,
  reviewableHash,
  validateAstronomyBank,
} from './astronomy-review.js';

/**
 * Review eligibility is hash-bound: an approval records the exact content it
 * reviewed, and any relevant change invalidates it. This is how "later edits
 * invalidate the affected approval" is enforced without inventing reviewers.
 */

function baseItem(): BankItem {
  const item = ASTRONOMY_ITEMS[0];
  return structuredClone(item);
}

function approve(item: BankItem, reviewer: string): void {
  item.reviewStatus = { content: 'approved', language: 'approved' };
  item.reviews = {
    content: {
      reviewer,
      role: 'content',
      date: '2026-10-09',
      scope: 'astronomy draft item',
      reference: 'review-record-1',
      contentHash: reviewableHash(item, 'content'),
    },
    language: {
      reviewer: 'LT reviewer',
      role: 'language',
      date: '2026-10-09',
      scope: 'LT translation',
      reference: 'review-record-2',
      contentHash: reviewableHash(item, 'language'),
    },
  };
}

describe('astronomy review eligibility (T-022)', () => {
  it('rejects an unreviewed draft', () => {
    const draft = baseItem();
    const result = evaluatePublicationEligibility(draft);
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/content review/i);
  });

  it('requires BOTH content and language evidence', () => {
    const item = baseItem();
    item.reviewStatus = { content: 'approved', language: 'unreviewed' };
    item.reviews = {
      content: {
        reviewer: 'content reviewer',
        role: 'content',
        date: '2026-10-09',
        scope: 'x',
        reference: 'r1',
        contentHash: reviewableHash(item, 'content'),
      },
      language: null,
    };
    expect(evaluatePublicationEligibility(item).eligible).toBe(false);
    expect(evaluatePublicationEligibility(item).reason).toMatch(/language/i);
  });

  it('is eligible when current content AND language reviews exist', () => {
    const item = baseItem();
    approve(item, 'independent content reviewer');
    expect(isReviewCurrent(item, 'content')).toBe(true);
    expect(isReviewCurrent(item, 'language')).toBe(true);
    expect(evaluatePublicationEligibility(item).eligible).toBe(true);
  });

  it('invalidates the approval when the reviewed content changes', () => {
    const item = baseItem();
    approve(item, 'independent content reviewer');
    expect(evaluatePublicationEligibility(item).eligible).toBe(true);

    // A relevant content change (new explanation) after approval.
    item.explanation = { en: `${item.explanation.en} (edited)`, lt: item.explanation.lt };
    expect(isReviewCurrent(item, 'content')).toBe(false);
    const result = evaluatePublicationEligibility(item);
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/stale/i);
  });

  it('treats an explicitly invalidated review status as ineligible', () => {
    const item = baseItem();
    approve(item, 'independent content reviewer');
    item.reviewStatus.content = 'invalidated';
    expect(isReviewCurrent(item, 'content')).toBe(false);
    expect(evaluatePublicationEligibility(item).eligible).toBe(false);
  });

  it('flags invented/backfilled evidence on an otherwise-unreviewed bank', () => {
    const items = structuredClone(ASTRONOMY_ITEMS);
    items[0].reviews.content = {
      reviewer: 'nobody',
      role: 'content',
      date: '2026-10-09',
      scope: 'x',
      reference: 'r',
      contentHash: reviewableHash(items[0], 'content'),
    };
    const problems = validateAstronomyBank(items);
    expect(problems.some((p) => /must not carry review evidence/.test(p))).toBe(true);
  });
});
