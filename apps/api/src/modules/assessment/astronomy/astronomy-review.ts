import { createHash } from 'node:crypto';
import {
  ASTRONOMY_ITEMS,
  ASTRONOMY_OBJECTIVES,
  ASTRONOMY_SOURCE_IDS,
} from './astronomy-bank.js';
import type { BankItem, LocalizedText } from './astronomy-types.js';

/**
 * Review eligibility and validation for the astronomy draft bank (T-022).
 *
 * A draft is publishable only with **current** independent content AND language
 * review evidence. An approval is bound to a hash of the exact reviewed content,
 * so any relevant change invalidates it. Drafts are unreviewed, so nothing in the
 * bank is publishable today — and this module never invents reviewers or
 * backfills approvals.
 */

export type ReviewScope = 'content' | 'language';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function sha256(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex').slice(0, 32);
}

/** The content a review of the given scope approves. */
function reviewableContent(item: BankItem, scope: ReviewScope): unknown {
  if (scope === 'content') {
    return {
      prompt: item.prompt,
      options: item.options,
      correctOptionIds: item.correctOptionIds,
      explanation: item.explanation,
      distractorRationales: item.distractorRationales,
      sources: item.sources,
      relevance: item.relevance,
    };
  }
  return {
    prompt: item.prompt,
    options: item.options.map((o) => ({ id: o.id, text: o.text })),
    explanation: item.explanation,
    relevance: item.relevance,
    distractorRationales: item.distractorRationales,
    translationVersion: item.translationVersion,
  };
}

/** Current content hash for a scope (compare against `ReviewEvidence.contentHash`). */
export function reviewableHash(item: BankItem, scope: ReviewScope): string {
  return sha256(reviewableContent(item, scope));
}

/** True when a scope has review evidence that still matches the current content. */
export function isReviewCurrent(item: BankItem, scope: ReviewScope): boolean {
  const evidence = item.reviews[scope];
  if (!evidence) return false;
  if (item.reviewStatus[scope] === 'invalidated') return false;
  return evidence.contentHash === reviewableHash(item, scope);
}

/**
 * A draft is publication-eligible only with current content AND language review.
 * `reason` explains the first missing/invalid requirement (for diagnostics).
 */
export function evaluatePublicationEligibility(item: BankItem): {
  eligible: boolean;
  reason: string;
} {
  if (!item.reviews.content) return { eligible: false, reason: 'no independent content review evidence' };
  if (!item.reviews.language) return { eligible: false, reason: 'no independent language review evidence' };
  if (!isReviewCurrent(item, 'content')) return { eligible: false, reason: 'content review is stale (content changed since approval)' };
  if (!isReviewCurrent(item, 'language')) return { eligible: false, reason: 'language review is stale (content changed since approval)' };
  if (item.reviewStatus.content !== 'approved' || item.reviewStatus.language !== 'approved') {
    return { eligible: false, reason: 'review status is not approved' };
  }
  return { eligible: true, reason: 'content and language review are current and approved' };
}

const nonEmpty = (text: LocalizedText | undefined): boolean =>
  !!text && text.en.trim().length > 0 && text.lt.trim().length > 0;

/**
 * Structural + integrity validation of the whole bank. Returns a list of
 * problems (empty = valid). Does not (and cannot) validate astronomical truth.
 */
export function validateAstronomyBank(items: BankItem[] = ASTRONOMY_ITEMS): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();
  const seenVersions = new Set<string>();
  const seenTopics = new Set<number>();
  const objectiveIds = new Set(ASTRONOMY_OBJECTIVES.map((o) => o.objectiveId));

  for (const item of items) {
    const where = item.itemId;
    if (seenIds.has(item.itemId)) problems.push(`duplicate itemId: ${item.itemId}`);
    seenIds.add(item.itemId);
    const key = `${item.itemId}@${item.itemVersion}`;
    if (seenVersions.has(key)) problems.push(`duplicate itemId+version: ${key}`);
    seenVersions.add(key);

    if (item.topic < 1 || item.topic > 25) problems.push(`${where}: topic out of range (${item.topic})`);
    if (seenTopics.has(item.topic)) problems.push(`${where}: duplicate topic ${item.topic}`);
    seenTopics.add(item.topic);

    if (!objectiveIds.has(item.objectiveId)) problems.push(`${where}: unknown objectiveId ${item.objectiveId}`);
    if (!nonEmpty(item.prompt)) problems.push(`${where}: prompt must be non-empty in EN and LT`);
    if (!nonEmpty(item.relevance)) problems.push(`${where}: relevance must be non-empty in EN and LT`);
    if (!nonEmpty(item.explanation)) problems.push(`${where}: explanation must be non-empty in EN and LT`);
    if (item.options.length < 2) problems.push(`${where}: needs at least two options`);

    const optionIds = item.options.map((o) => o.id);
    if (new Set(optionIds).size !== optionIds.length) problems.push(`${where}: duplicate option ids`);
    for (const option of item.options) {
      if (!nonEmpty(option.text)) problems.push(`${where}: option ${option.id} text must be non-empty in EN and LT`);
    }

    if (item.kind === 'single-answer' && item.correctOptionIds.length !== 1) {
      problems.push(`${where}: single-answer must have exactly one correct option`);
    }
    for (const correct of item.correctOptionIds) {
      if (!optionIds.includes(correct)) problems.push(`${where}: correct option ${correct} is not among options`);
    }
    // Distractor rationales must cover every incorrect option (where applicable).
    const incorrect = optionIds.filter((id) => !item.correctOptionIds.includes(id));
    for (const id of incorrect) {
      if (!item.distractorRationales.some((r) => r.optionId === id)) {
        problems.push(`${where}: missing distractor rationale for option ${id}`);
      }
      if (!nonEmpty(item.distractorRationales.find((r) => r.optionId === id)?.reason)) {
        problems.push(`${where}: distractor rationale for ${id} must be non-empty in EN and LT`);
      }
    }
    // No answer-revealing hint: the correct option's full text must not appear in
    // the prompt (this catches the crudest leaks; human review is still required).
    for (const correct of item.correctOptionIds) {
      const option = item.options.find((o) => o.id === correct);
      if (option && (item.prompt.en.includes(option.text.en) || item.prompt.lt.includes(option.text.lt))) {
        problems.push(`${where}: prompt contains the correct option text (answer-revealing hint)`);
      }
    }

    if (item.sources.length === 0) problems.push(`${where}: at least one source is required`);
    for (const sourceId of item.sources) {
      if (!ASTRONOMY_SOURCE_IDS.has(sourceId)) problems.push(`${where}: unknown source id ${sourceId}`);
    }
  }

  for (let topic = 1; topic <= 25; topic += 1) {
    if (!seenTopics.has(topic)) problems.push(`missing item for owner topic ${topic}`);
  }

  // Drafts must remain unreviewed / ineligible.
  for (const item of items) {
    if (item.reviews.content || item.reviews.language) {
      problems.push(`${item.itemId}: draft must not carry review evidence`);
    }
    if (evaluatePublicationEligibility(item).eligible) {
      problems.push(`${item.itemId}: unreviewed draft must not be publication-eligible`);
    }
  }

  return problems;
}

export function assertAstronomyBankValid(items: BankItem[] = ASTRONOMY_ITEMS): void {
  const problems = validateAstronomyBank(items);
  if (problems.length > 0) {
    throw new Error(`Astronomy draft bank is invalid:\n- ${problems.join('\n- ')}`);
  }
}
