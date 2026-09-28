/**
 * Versioned, deterministic scoring core (T-016).
 *
 * Pure and dependency-free: no UI, HTTP, database, authentication, environment
 * variables, network, randomness, or wall-clock time. Inputs are never mutated.
 *
 * Guarantees and boundaries (see docs/assessment-scoring.md):
 * - Only an explicitly `submitted` attempt receives a final score.
 * - The denominator is always the full form; missing responses count as skipped.
 * - Each item is worth one point; no weights, partial credit, guessing
 *   correction, IQ conversion, percentiles, mastery thresholds, adaptive
 *   selection, or timing.
 * - Any validation failure throws a coded `AssessmentError`; no partial result is
 *   returned and malformed values are never coerced.
 */

import { AssessmentError } from './errors';
import type {
  AttemptSubmission,
  ItemDefinition,
  ItemOutcome,
  ItemResponse,
  KeyedFormSnapshot,
  ObjectiveResult,
  ResponseEntry,
  ScoringResult,
} from './types';

/** Scoring-rule versions this core supports. Unknown versions are rejected. */
export const SUPPORTED_SCORING_RULE_VERSIONS: readonly string[] = ['1.0.0'];

const LANGUAGE_SCOPES = new Set(['neutral', 'lt', 'en']);

function fail(
  code: 'UNSUPPORTED_SCORING_RULE_VERSION' | 'INVALID_FORM' | 'INVALID_RESPONSES' | 'ATTEMPT_NOT_SUBMITTED',
  message: string,
): never {
  throw new AssessmentError(code, message);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function requireNonEmptyString(value: unknown, label: string, code: 'INVALID_FORM' | 'INVALID_RESPONSES'): string {
  if (typeof value !== 'string' || value.length === 0) {
    fail(code, `${label} must be a non-empty string`);
  }
  return value;
}

function requireUniqueStrings(value: unknown, label: string, code: 'INVALID_FORM'): string[] {
  if (!Array.isArray(value) || value.length === 0) fail(code, `${label} must be a non-empty array`);
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0) fail(code, `${label} entries must be non-empty strings`);
    if (seen.has(item)) fail(code, `${label} contains a duplicate entry: ${item}`);
    seen.add(item);
  }
  return value as string[];
}

function isPermutation(candidate: readonly string[], set: readonly string[]): boolean {
  if (candidate.length !== set.length) return false;
  const allowed = new Set(set);
  const seen = new Set<string>();
  for (const entry of candidate) {
    if (!allowed.has(entry) || seen.has(entry)) return false;
    seen.add(entry);
  }
  return true;
}

export function assertSupportedScoringRuleVersion(version: unknown): void {
  if (typeof version !== 'string' || !SUPPORTED_SCORING_RULE_VERSIONS.includes(version)) {
    fail(
      'UNSUPPORTED_SCORING_RULE_VERSION',
      `unsupported scoringRuleVersion: ${JSON.stringify(version)} (supported: ${SUPPORTED_SCORING_RULE_VERSIONS.join(', ')})`,
    );
  }
}

function validateItem(item: ItemDefinition, index: number, objectiveIds: Set<string>): void {
  const at = `items[${index}]`;
  if (!isPlainObject(item)) fail('INVALID_FORM', `${at} must be an object`);
  requireNonEmptyString(item.itemId, `${at}.itemId`, 'INVALID_FORM');
  requireNonEmptyString(item.itemVersion, `${at}.itemVersion`, 'INVALID_FORM');
  requireNonEmptyString(item.objectiveId, `${at}.objectiveId`, 'INVALID_FORM');
  requireNonEmptyString(item.translationVersion, `${at}.translationVersion`, 'INVALID_FORM');
  if (!LANGUAGE_SCOPES.has(item.languageScope)) fail('INVALID_FORM', `${at}.languageScope is invalid`);
  if (!objectiveIds.has(item.objectiveId)) fail('INVALID_FORM', `${at}.objectiveId is not declared in objectives`);

  switch (item.kind) {
    case 'single-answer': {
      const options = requireUniqueStrings(item.optionIds, `${at}.optionIds`, 'INVALID_FORM');
      requireNonEmptyString(item.correctOptionId, `${at}.correctOptionId`, 'INVALID_FORM');
      if (!options.includes(item.correctOptionId)) {
        fail('INVALID_FORM', `${at}.correctOptionId is not one of optionIds`);
      }
      return;
    }
    case 'multiple-select': {
      const options = requireUniqueStrings(item.optionIds, `${at}.optionIds`, 'INVALID_FORM');
      const correct = requireUniqueStrings(item.correctOptionIds, `${at}.correctOptionIds`, 'INVALID_FORM');
      for (const id of correct) {
        if (!options.includes(id)) fail('INVALID_FORM', `${at}.correctOptionIds contains an unknown option: ${id}`);
      }
      return;
    }
    case 'ordering': {
      const options = requireUniqueStrings(item.optionIds, `${at}.optionIds`, 'INVALID_FORM');
      const order = requireUniqueStrings(item.correctOrder, `${at}.correctOrder`, 'INVALID_FORM');
      if (!isPermutation(order, options)) {
        fail('INVALID_FORM', `${at}.correctOrder must be a permutation of optionIds`);
      }
      return;
    }
    case 'numeric': {
      requireNonEmptyString(item.unit, `${at}.unit`, 'INVALID_FORM');
      if (!isFiniteNumber(item.acceptedValue)) fail('INVALID_FORM', `${at}.acceptedValue must be a finite number`);
      if (!isFiniteNumber(item.absoluteTolerance) || item.absoluteTolerance < 0) {
        fail('INVALID_FORM', `${at}.absoluteTolerance must be a finite number >= 0`);
      }
      return;
    }
    default:
      fail('INVALID_FORM', `${at}.kind is not supported`);
  }
}

/** Validate the internal keyed form. Throws a coded `AssessmentError` on failure. */
export function validateKeyedFormSnapshot(form: KeyedFormSnapshot): void {
  if (!isPlainObject(form)) fail('INVALID_FORM', 'form must be an object');
  assertSupportedScoringRuleVersion(form.scoringRuleVersion);
  requireNonEmptyString(form.assessmentId, 'assessmentId', 'INVALID_FORM');
  requireNonEmptyString(form.assessmentVersion, 'assessmentVersion', 'INVALID_FORM');
  requireNonEmptyString(form.formId, 'formId', 'INVALID_FORM');
  requireNonEmptyString(form.formVersion, 'formVersion', 'INVALID_FORM');
  requireNonEmptyString(form.translationVersion, 'translationVersion', 'INVALID_FORM');
  if (!LANGUAGE_SCOPES.has(form.languageScope)) fail('INVALID_FORM', 'languageScope is invalid');

  if (!Array.isArray(form.objectives) || form.objectives.length === 0) {
    fail('INVALID_FORM', 'objectives must be a non-empty array');
  }
  const objectiveIds = new Set<string>();
  form.objectives.forEach((objective, index) => {
    if (!isPlainObject(objective)) fail('INVALID_FORM', `objectives[${index}] must be an object`);
    const id = requireNonEmptyString(objective.objectiveId, `objectives[${index}].objectiveId`, 'INVALID_FORM');
    if (objectiveIds.has(id)) fail('INVALID_FORM', `duplicate objective ID: ${id}`);
    objectiveIds.add(id);
  });

  if (!Array.isArray(form.items) || form.items.length === 0) {
    fail('INVALID_FORM', 'items must be a non-empty array');
  }
  const itemIds = new Set<string>();
  form.items.forEach((item, index) => {
    validateItem(item, index, objectiveIds);
    if (itemIds.has(item.itemId)) fail('INVALID_FORM', `duplicate item ID: ${item.itemId}`);
    itemIds.add(item.itemId);
  });
}

function validateResponseForItem(item: ItemDefinition, response: ItemResponse, itemId: string): void {
  const code = 'INVALID_RESPONSES' as const;
  if (!isPlainObject(response)) fail(code, `response for ${itemId} must be an object`);
  switch (response.kind) {
    case 'skipped':
      return;
    case 'single-answer': {
      if (item.kind !== 'single-answer') fail(code, `response kind single-answer does not match ${item.kind} for ${itemId}`);
      const selected = requireNonEmptyString(response.selectedOptionId, `response.selectedOptionId for ${itemId}`, code);
      if (!item.optionIds.includes(selected)) fail(code, `unknown option ${selected} for ${itemId}`);
      return;
    }
    case 'multiple-select': {
      if (item.kind !== 'multiple-select') fail(code, `response kind multiple-select does not match ${item.kind} for ${itemId}`);
      if (!Array.isArray(response.selectedOptionIds)) fail(code, `response.selectedOptionIds for ${itemId} must be an array`);
      const seen = new Set<string>();
      for (const id of response.selectedOptionIds) {
        if (typeof id !== 'string' || !item.optionIds.includes(id)) fail(code, `unknown option ${String(id)} for ${itemId}`);
        if (seen.has(id)) fail(code, `duplicate selected option ${id} for ${itemId}`);
        seen.add(id);
      }
      return;
    }
    case 'ordering': {
      if (item.kind !== 'ordering') fail(code, `response kind ordering does not match ${item.kind} for ${itemId}`);
      if (!Array.isArray(response.orderedOptionIds)) fail(code, `response.orderedOptionIds for ${itemId} must be an array`);
      if (!isPermutation(response.orderedOptionIds, item.optionIds)) {
        fail(code, `ordering response for ${itemId} must contain every option exactly once`);
      }
      return;
    }
    case 'numeric': {
      if (item.kind !== 'numeric') fail(code, `response kind numeric does not match ${item.kind} for ${itemId}`);
      if (!isFiniteNumber(response.value)) fail(code, `numeric response for ${itemId} must be a finite number`);
      return;
    }
    default:
      fail(code, `unsupported response kind for ${itemId}`);
  }
}

function validateSubmission(
  form: KeyedFormSnapshot,
  submission: AttemptSubmission,
): Map<string, ItemResponse> {
  if (!isPlainObject(submission)) fail('INVALID_RESPONSES', 'submission must be an object');
  requireNonEmptyString(submission.attemptId, 'attemptId', 'INVALID_RESPONSES');
  if (submission.status !== 'submitted') {
    fail('ATTEMPT_NOT_SUBMITTED', 'only submitted attempts receive a final score');
  }
  if (!Array.isArray(submission.responses)) fail('INVALID_RESPONSES', 'responses must be an array');

  const itemsById = new Map(form.items.map((item) => [item.itemId, item]));
  const byItem = new Map<string, ItemResponse>();
  for (const entry of submission.responses as ResponseEntry[]) {
    if (!isPlainObject(entry)) fail('INVALID_RESPONSES', 'each response entry must be an object');
    const itemId = requireNonEmptyString(entry.itemId, 'response entry itemId', 'INVALID_RESPONSES');
    const item = itemsById.get(itemId);
    if (!item) fail('INVALID_RESPONSES', `response references unknown item: ${itemId}`);
    if (byItem.has(itemId)) fail('INVALID_RESPONSES', `duplicate response entry for ${itemId}`);
    validateResponseForItem(item, entry.response, itemId);
    byItem.set(itemId, entry.response);
  }
  return byItem;
}

function scoreItem(item: ItemDefinition, response: ItemResponse | undefined): ItemOutcome {
  if (!response || response.kind === 'skipped') {
    return {
      itemId: item.itemId,
      itemVersion: item.itemVersion,
      objectiveId: item.objectiveId,
      outcome: 'skipped',
      pointsAwarded: 0,
      pointsPossible: 1,
    };
  }

  let correct = false;
  switch (item.kind) {
    case 'single-answer':
      correct = response.kind === 'single-answer' && response.selectedOptionId === item.correctOptionId;
      break;
    case 'multiple-select': {
      if (response.kind !== 'multiple-select') break;
      const selected = new Set(response.selectedOptionIds);
      const expected = new Set(item.correctOptionIds);
      correct = selected.size === expected.size && [...expected].every((id) => selected.has(id));
      break;
    }
    case 'ordering':
      correct =
        response.kind === 'ordering' &&
        response.orderedOptionIds.length === item.correctOrder.length &&
        response.orderedOptionIds.every((id, index) => id === item.correctOrder[index]);
      break;
    case 'numeric':
      correct = response.kind === 'numeric' && Math.abs(response.value - item.acceptedValue) <= item.absoluteTolerance;
      break;
  }

  return {
    itemId: item.itemId,
    itemVersion: item.itemVersion,
    objectiveId: item.objectiveId,
    outcome: correct ? 'correct' : 'incorrect',
    pointsAwarded: correct ? 1 : 0,
    pointsPossible: 1,
  };
}

/**
 * Score a **submitted** attempt against the exact keyed form snapshot.
 *
 * @throws AssessmentError `UNSUPPORTED_SCORING_RULE_VERSION` for an unknown rule
 *   version, `INVALID_FORM`/`INVALID_RESPONSES` for malformed input, or
 *   `ATTEMPT_NOT_SUBMITTED` for anything other than an explicit submission.
 */
export function scoreAttempt(form: KeyedFormSnapshot, submission: AttemptSubmission): ScoringResult {
  validateKeyedFormSnapshot(form);
  const byItem = validateSubmission(form, submission);

  const items = form.items.map((item) => scoreItem(item, byItem.get(item.itemId)));
  const correct = items.filter((outcome) => outcome.outcome === 'correct').length;
  const incorrect = items.filter((outcome) => outcome.outcome === 'incorrect').length;
  const skipped = items.filter((outcome) => outcome.outcome === 'skipped').length;
  const totalItems = form.items.length;

  if (correct + incorrect + skipped !== totalItems) {
    throw new AssessmentError('INVALID_FORM', 'internal invariant violated: outcome counts do not sum to the form length');
  }

  const objectives: ObjectiveResult[] = form.objectives.map((objective) => {
    const forObjective = items.filter((outcome) => outcome.objectiveId === objective.objectiveId);
    return {
      objectiveId: objective.objectiveId,
      items: forObjective.length,
      correct: forObjective.filter((outcome) => outcome.outcome === 'correct').length,
      incorrect: forObjective.filter((outcome) => outcome.outcome === 'incorrect').length,
      skipped: forObjective.filter((outcome) => outcome.outcome === 'skipped').length,
    };
  });

  return {
    attemptId: submission.attemptId,
    assessmentId: form.assessmentId,
    assessmentVersion: form.assessmentVersion,
    formId: form.formId,
    formVersion: form.formVersion,
    scoringRuleVersion: form.scoringRuleVersion,
    languageScope: form.languageScope,
    translationVersion: form.translationVersion,
    totalItems,
    correct,
    incorrect,
    skipped,
    score: correct,
    items,
    objectives,
  };
}
