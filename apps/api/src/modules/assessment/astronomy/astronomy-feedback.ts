import type {
  AssessmentAttemptContent,
  AssessmentContentItem,
  AssessmentFeedback,
  AssessmentFeedbackItem,
  AssessmentUiLocale,
} from '@sapiensmetric/contracts';
import type {
  KeyedFormSnapshot,
  ResponseEntry,
  ScoringResult,
} from '@sapiensmetric/assessment';
import {
  ASTRONOMY_SOURCES,
  findAstronomyItem,
} from './astronomy-bank.js';

/**
 * Client-safe projections for the astronomy draft module (T-022).
 *
 * - `buildAttemptContent` never includes answer keys and is safe for in-progress
 *   attempts (used to render localized prompts/options).
 * - `buildAttemptFeedback` includes correctness, explanations and sources and is
 *   only produced for a **finalised** attempt.
 *
 * Both resolve text by the attempt's own `itemId`+`itemVersion`, so later bank
 * edits do not rewrite the content/feedback of an existing attempt; if a version
 * is no longer present, feedback is marked `unavailable` rather than substituted.
 */

const sourceById = new Map(ASTRONOMY_SOURCES.map((s) => [s.id, s]));

export function buildAttemptContent(
  snapshot: KeyedFormSnapshot,
  locale: AssessmentUiLocale,
): AssessmentAttemptContent {
  const items: AssessmentContentItem[] = snapshot.items.map((item) => {
    const bank = findAstronomyItem(item.itemId, item.itemVersion);
    const optionIds: string[] =
      'optionIds' in item && Array.isArray(item.optionIds) ? item.optionIds : [];
    return {
      itemId: item.itemId,
      itemVersion: item.itemVersion,
      objectiveId: item.objectiveId,
      kind: item.kind,
      languageScope: item.languageScope,
      prompt: bank ? bank.prompt[locale] : item.itemId,
      options: optionIds.map((id) => ({
        id,
        text: bank
          ? bank.options.find((o) => o.id === id)?.text[locale] ?? id
          : id,
      })),
      relevance: bank ? bank.relevance[locale] : '',
    };
  });
  return {
    attemptId: '',
    assessmentId: snapshot.assessmentId,
    formId: snapshot.formId,
    locale,
    items,
  };
}

function selectedOptionIds(entry: ResponseEntry | undefined): string[] {
  if (!entry) return [];
  switch (entry.response.kind) {
    case 'single-answer':
      return [entry.response.selectedOptionId];
    case 'multiple-select':
      return [...entry.response.selectedOptionIds].sort();
    case 'ordering':
      return [...entry.response.orderedOptionIds];
    case 'numeric':
    case 'skipped':
    default:
      return [];
  }
}

export function buildAttemptFeedback(
  snapshot: KeyedFormSnapshot,
  answers: readonly ResponseEntry[],
  result: ScoringResult,
  locale: AssessmentUiLocale,
): AssessmentFeedback {
  const byItem = new Map(answers.map((entry) => [entry.itemId, entry]));
  const items: AssessmentFeedbackItem[] = result.items.map((outcome) => {
    const bank = findAstronomyItem(outcome.itemId, outcome.itemVersion);
    const selected = selectedOptionIds(byItem.get(outcome.itemId));
    if (!bank) {
      // The attempt references a bank version that is no longer present: do not
      // substitute a newer explanation.
      return {
        itemId: outcome.itemId,
        itemVersion: outcome.itemVersion,
        objectiveId: outcome.objectiveId,
        outcome: outcome.outcome,
        selectedOptionIds: selected,
        answerOptionIds: [],
        explanation:
          locale === 'lt'
            ? 'Šio bandymo versijos paaiškinimas nebeprieinamas.'
            : 'The explanation for this attempt’s item version is no longer available.',
        options: [],
        sources: [],
        unavailable: true,
      };
    }
    return {
      itemId: outcome.itemId,
      itemVersion: outcome.itemVersion,
      objectiveId: outcome.objectiveId,
      outcome: outcome.outcome,
      selectedOptionIds: selected,
      answerOptionIds: [...bank.correctOptionIds],
      explanation: bank.explanation[locale],
      options: bank.options.map((o) => ({ id: o.id, text: o.text[locale] })),
      sources: bank.sources
        .map((id) => sourceById.get(id))
        .filter((s): s is NonNullable<typeof s> => !!s)
        .map((s) => ({ id: s.id, label: s.label, url: s.url })),
    };
  });

  return {
    attemptId: result.attemptId,
    assessmentId: snapshot.assessmentId,
    formId: snapshot.formId,
    locale,
    totals: {
      totalItems: result.totalItems,
      correct: result.correct,
      incorrect: result.incorrect,
      skipped: result.skipped,
    },
    items,
  };
}
