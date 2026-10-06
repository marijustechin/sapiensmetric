/**
 * Pure answer helpers for the assessment runner (T-019).
 *
 * No React/DOM/network dependencies, so the save/clear/resume semantics can be
 * unit-tested directly. An absent item and `{ kind: 'skipped' }` are treated as
 * equivalent (both mean "no answer stored").
 */

import type {
  ItemResponseDto,
  PublicAssessmentItem,
  ResponseEntryDto,
} from './assessment-types';

export type AnswerDraft = Record<string, ItemResponseDto>;

const SKIPPED: ItemResponseDto = { kind: 'skipped' };

export function skippedResponse(): ItemResponseDto {
  return { kind: 'skipped' };
}

/** True when two responses are semantically identical (key-order independent). */
export function sameResponse(
  a: ItemResponseDto,
  b: ItemResponseDto,
): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  switch (a.kind) {
    case 'single-answer':
      return a.selectedOptionId === (b as typeof a).selectedOptionId;
    case 'multiple-select': {
      const other = b as typeof a;
      return (
        [...a.selectedOptionIds].sort().join('\u0000') ===
        [...other.selectedOptionIds].sort().join('\u0000')
      );
    }
    case 'ordering': {
      const other = b as typeof a;
      return a.orderedOptionIds.join('\u0000') === other.orderedOptionIds.join('\u0000');
    }
    case 'numeric':
      return a.value === (b as typeof a).value;
    case 'skipped':
      return true;
  }
}

/** Convert the server's answer entries into a draft map (absent = no answer). */
export function toDraft(entries: ResponseEntryDto[]): AnswerDraft {
  const draft: AnswerDraft = {};
  for (const entry of entries) {
    if (entry.response.kind !== 'skipped') {
      draft[entry.itemId] = entry.response;
    }
  }
  return draft;
}

/** Number of items with an actual answer (skipped/absent do not count). */
export function answeredCount(draft: AnswerDraft): number {
  return Object.values(draft).filter((response) => response.kind !== 'skipped')
    .length;
}

/**
 * The entries that differ between the local draft and the last server-saved
 * answers. A cleared answer is expressed as `{ kind: 'skipped' }` so the server
 * removes it. Unchanged items are omitted (the API save is partial).
 */
export function dirtyEntries(
  draft: AnswerDraft,
  saved: AnswerDraft,
): ResponseEntryDto[] {
  const ids = new Set([...Object.keys(draft), ...Object.keys(saved)]);
  const entries: ResponseEntryDto[] = [];
  for (const itemId of ids) {
    const next = draft[itemId] ?? SKIPPED;
    const previous = saved[itemId] ?? SKIPPED;
    if (!sameResponse(next, previous)) {
      entries.push({ itemId, response: next });
    }
  }
  return entries.sort((a, b) => a.itemId.localeCompare(b.itemId));
}

export function hasUnsavedChanges(
  draft: AnswerDraft,
  saved: AnswerDraft,
): boolean {
  return dirtyEntries(draft, saved).length > 0;
}

/**
 * The entries to send for a save: only items the participant actually edited,
 * and only while they still differ from the last saved answers.
 *
 * Restricting to edited items (rather than a full diff) lets conflict recovery
 * re-apply *only* the participant's own edits on top of fresh server state,
 * without silently reverting unrelated changes made elsewhere.
 */
export function pendingEntries(
  draft: AnswerDraft,
  saved: AnswerDraft,
  editedIds: readonly string[],
): ResponseEntryDto[] {
  const edited = new Set(editedIds);
  return dirtyEntries(draft, saved).filter((entry) => edited.has(entry.itemId));
}

export function hasPendingChanges(
  draft: AnswerDraft,
  saved: AnswerDraft,
  editedIds: readonly string[],
): boolean {
  return pendingEntries(draft, saved, editedIds).length > 0;
}

/** Set (or replace) a concrete answer for an item. */
export function setAnswer(
  draft: AnswerDraft,
  itemId: string,
  response: ItemResponseDto,
): AnswerDraft {
  return { ...draft, [itemId]: response };
}

/** Clear an item's answer (kept as `skipped` so the server removes it on save). */
export function clearAnswer(draft: AnswerDraft, itemId: string): AnswerDraft {
  return { ...draft, [itemId]: SKIPPED };
}

export function responseFor(
  draft: AnswerDraft,
  item: PublicAssessmentItem,
): ItemResponseDto {
  return draft[item.itemId] ?? SKIPPED;
}

/** Current ordering for an ordering item (defaults to the served order). */
export function orderingFor(
  draft: AnswerDraft,
  item: PublicAssessmentItem,
): string[] {
  const response = responseFor(draft, item);
  if (response.kind === 'ordering') {
    return response.orderedOptionIds;
  }
  return item.optionIds ? [...item.optionIds] : [];
}

/** Move an element within a list; returns a new list (no mutation). */
export function moveWithin<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
