/**
 * Versioned scoring-core types (T-016).
 *
 * Design notes:
 * - Matching is by **stable IDs** (`itemId`, `objectiveId`, option IDs), never by
 *   translated labels or display positions.
 * - A `KeyedFormSnapshot` is **internal/confidential**: it contains answer keys and
 *   numeric answers. It is the only input the scorer accepts. Anything safe for
 *   browser delivery is represented separately by `PublicFormSnapshot`
 *   (see `public-form.ts`).
 * - Version identifiers are recorded for reproduction, but they do **not**
 *   substitute for the immutable scoring definition: the scorer reads the actual
 *   item definitions in the snapshot (it only checks that `scoringRuleVersion` is
 *   a supported rule version).
 */

export type LanguageScope = 'neutral' | 'lt' | 'en';

export interface ObjectiveDefinition {
  /** Stable objective ID used for descriptive counts. */
  objectiveId: string;
}

interface ItemBase {
  itemId: string;
  itemVersion: string;
  /** Objective this item belongs to (must exist in `objectives`). */
  objectiveId: string;
  languageScope: LanguageScope;
  /** Version of the translated/presented wording of this item. */
  translationVersion: string;
}

export interface SingleAnswerItemDefinition extends ItemBase {
  kind: 'single-answer';
  /** Stable option IDs (display order is defined elsewhere and is irrelevant here). */
  optionIds: string[];
  correctOptionId: string;
}

export interface MultipleSelectItemDefinition extends ItemBase {
  kind: 'multiple-select';
  optionIds: string[];
  /** Exact set; selection order is irrelevant. */
  correctOptionIds: string[];
}

export interface OrderingItemDefinition extends ItemBase {
  kind: 'ordering';
  /** The set of orderable IDs. */
  optionIds: string[];
  /** Exact ordered sequence; must be a permutation of `optionIds`. */
  correctOrder: string[];
}

export interface NumericItemDefinition extends ItemBase {
  kind: 'numeric';
  /** Unit label for the answer (documentation/metadata; comparison is unit-agnostic). */
  unit: string;
  acceptedValue: number;
  /** Absolute tolerance; accepted when `|value - acceptedValue| <= absoluteTolerance` (inclusive). */
  absoluteTolerance: number;
}

export type ItemDefinition =
  | SingleAnswerItemDefinition
  | MultipleSelectItemDefinition
  | OrderingItemDefinition
  | NumericItemDefinition;

/**
 * Internal, **keyed** form snapshot. Must never reach browser-delivered data,
 * static assets, or shared client DTOs.
 */
export interface KeyedFormSnapshot {
  assessmentId: string;
  assessmentVersion: string;
  formId: string;
  formVersion: string;
  languageScope: LanguageScope;
  /** Form-level translation version of the presented wording. */
  translationVersion: string;
  scoringRuleVersion: string;
  objectives: ObjectiveDefinition[];
  /** Exact items and answer keys, in presentation order. */
  items: ItemDefinition[];
}

/** One unambiguous representation of a skipped answer. */
export type ItemResponse =
  | { kind: 'single-answer'; selectedOptionId: string }
  | { kind: 'multiple-select'; selectedOptionIds: string[] }
  | { kind: 'ordering'; orderedOptionIds: string[] }
  | { kind: 'numeric'; value: number }
  | { kind: 'skipped' };

export interface ResponseEntry {
  itemId: string;
  response: ItemResponse;
}

export type AttemptStatus = 'submitted' | 'unfinished';

export interface AttemptSubmission {
  attemptId: string;
  /** Only `'submitted'` yields a final score; anything else is rejected. */
  status: AttemptStatus;
  /**
   * Responses keyed by stable item ID. Items omitted here are treated as
   * **skipped** for a submitted attempt (the denominator is never reduced).
   */
  responses: ResponseEntry[];
}

export type ItemOutcomeKind = 'correct' | 'incorrect' | 'skipped';

export interface ItemOutcome {
  itemId: string;
  itemVersion: string;
  objectiveId: string;
  outcome: ItemOutcomeKind;
  pointsAwarded: 0 | 1;
  pointsPossible: 1;
}

export interface ObjectiveResult {
  objectiveId: string;
  items: number;
  correct: number;
  incorrect: number;
  skipped: number;
}

/**
 * Final result for a submitted attempt. Contains **no answer keys and no internal
 * item definitions** — only IDs, versions, and outcomes.
 */
export interface ScoringResult {
  attemptId: string;
  assessmentId: string;
  assessmentVersion: string;
  formId: string;
  formVersion: string;
  scoringRuleVersion: string;
  languageScope: LanguageScope;
  translationVersion: string;
  totalItems: number;
  correct: number;
  incorrect: number;
  skipped: number;
  /** One point per correct item in this version. */
  score: number;
  items: ItemOutcome[];
  objectives: ObjectiveResult[];
}
