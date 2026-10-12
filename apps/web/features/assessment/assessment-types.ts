/**
 * Client-safe assessment types (T-019).
 *
 * These mirror the browser-facing projection in
 * `packages/contracts/src/assessment.ts` and deliberately exclude answer keys,
 * numeric answers, and the keyed form snapshot: the API never returns
 * authoritative keys to the client, and the web app never imports the scoring
 * core or the server-side synthetic form. They are declared locally (rather than
 * importing `@sapiensmetric/contracts`) so the static web bundle stays free of
 * the contracts runtime, matching `features/auth/auth-api.ts`.
 */

export type AssessmentLanguageScope = 'neutral' | 'lt' | 'en';

export type AssessmentItemKind =
  | 'single-answer'
  | 'multiple-select'
  | 'ordering'
  | 'numeric';

/** Browser-safe item: option IDs are shown; keys are not. */
export interface PublicAssessmentItem {
  itemId: string;
  itemVersion: string;
  objectiveId: string;
  languageScope: AssessmentLanguageScope;
  translationVersion: string;
  kind: AssessmentItemKind;
  optionIds?: string[];
  unit?: string;
}

export interface PublicAssessmentForm {
  assessmentId: string;
  assessmentVersion: string;
  formId: string;
  formVersion: string;
  languageScope: AssessmentLanguageScope;
  translationVersion: string;
  scoringRuleVersion: string;
  objectives: { objectiveId: string }[];
  items: PublicAssessmentItem[];
}

export type ItemResponseDto =
  | { kind: 'single-answer'; selectedOptionId: string }
  | { kind: 'multiple-select'; selectedOptionIds: string[] }
  | { kind: 'ordering'; orderedOptionIds: string[] }
  | { kind: 'numeric'; value: number }
  | { kind: 'skipped' };

export interface ResponseEntryDto {
  itemId: string;
  response: ItemResponseDto;
}

export interface SaveAnswersRequest {
  revision: number;
  answers: ResponseEntryDto[];
}

export type AssessmentAttemptStatus = 'in_progress' | 'finalised';

export interface ItemOutcomeDto {
  itemId: string;
  itemVersion: string;
  objectiveId: string;
  outcome: 'correct' | 'incorrect' | 'skipped';
  pointsAwarded: 0 | 1;
  pointsPossible: 1;
}

export interface ObjectiveResultDto {
  objectiveId: string;
  items: number;
  correct: number;
  incorrect: number;
  skipped: number;
}

export interface AssessmentResultDto {
  attemptId: string;
  assessmentId: string;
  assessmentVersion: string;
  formId: string;
  formVersion: string;
  scoringRuleVersion: string;
  languageScope: AssessmentLanguageScope;
  translationVersion: string;
  totalItems: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  items: ItemOutcomeDto[];
  objectives: ObjectiveResultDto[];
}

export interface AssessmentAttemptView {
  attemptId: string;
  assessmentId: string;
  formId: string;
  status: AssessmentAttemptStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
  finalisedAt: string | null;
  form: PublicAssessmentForm;
  answers: ResponseEntryDto[];
  result: AssessmentResultDto | null;
}

export interface AssessmentAttemptSummary {
  attemptId: string;
  assessmentId: string;
  formId: string;
  status: AssessmentAttemptStatus;
  revision: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  finalisedAt: string | null;
}

export interface AssessmentAttemptList {
  items: AssessmentAttemptSummary[];
}

export type AssessmentUiLocale = 'en' | 'lt';

/** Client-safe localized content (T-022) — no answer keys. */
export interface AssessmentContentItem {
  itemId: string;
  itemVersion: string;
  objectiveId: string;
  kind: AssessmentItemKind;
  languageScope: AssessmentLanguageScope;
  unit?: string;
  prompt: string;
  options: { id: string; text: string }[];
  relevance: string;
}

export interface AssessmentAttemptContent {
  attemptId: string;
  assessmentId: string;
  formId: string;
  locale: AssessmentUiLocale;
  items: AssessmentContentItem[];
}

export interface AssessmentFeedbackSource {
  id: string;
  label: string;
  url: string;
}

/** Post-submission feedback (T-022) — finalised attempts only. */
export interface AssessmentFeedbackItem {
  itemId: string;
  itemVersion: string;
  objectiveId: string;
  outcome: 'correct' | 'incorrect' | 'skipped';
  selectedOptionIds: string[];
  answerOptionIds: string[];
  explanation: string;
  options: { id: string; text: string }[];
  sources: AssessmentFeedbackSource[];
  unavailable?: boolean;
}

export interface AssessmentFeedback {
  attemptId: string;
  assessmentId: string;
  formId: string;
  locale: AssessmentUiLocale;
  totals: {
    totalItems: number;
    correct: number;
    incorrect: number;
    skipped: number;
  };
  items: AssessmentFeedbackItem[];
}
