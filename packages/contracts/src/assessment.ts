import { z } from 'zod';

/**
 * Assessment attempt contracts (T-017).
 *
 * These are the **client-safe** shapes only. They deliberately exclude answer
 * keys, numeric answers, and the internal keyed form snapshot: the API never
 * returns authoritative keys to the client. Scoring is performed server-side by
 * `@sapiensmetric/assessment`.
 */

export const assessmentLanguageScopeSchema = z.enum(['neutral', 'lt', 'en']);
export type AssessmentLanguageScope = z.infer<
  typeof assessmentLanguageScopeSchema
>;

export const assessmentItemKindSchema = z.enum([
  'single-answer',
  'multiple-select',
  'ordering',
  'numeric',
]);
export type AssessmentItemKind = z.infer<typeof assessmentItemKindSchema>;

/** Browser-safe item: option IDs are shown to the participant; keys are not. */
export const publicAssessmentItemSchema = z.object({
  itemId: z.string().min(1),
  itemVersion: z.string().min(1),
  objectiveId: z.string().min(1),
  languageScope: assessmentLanguageScopeSchema,
  translationVersion: z.string().min(1),
  kind: assessmentItemKindSchema,
  optionIds: z.array(z.string().min(1)).optional(),
  unit: z.string().min(1).optional(),
});
export type PublicAssessmentItem = z.infer<typeof publicAssessmentItemSchema>;

export const publicAssessmentFormSchema = z.object({
  assessmentId: z.string().min(1),
  assessmentVersion: z.string().min(1),
  formId: z.string().min(1),
  formVersion: z.string().min(1),
  languageScope: assessmentLanguageScopeSchema,
  translationVersion: z.string().min(1),
  scoringRuleVersion: z.string().min(1),
  objectives: z.array(z.object({ objectiveId: z.string().min(1) })),
  items: z.array(publicAssessmentItemSchema),
});
export type PublicAssessmentForm = z.infer<typeof publicAssessmentFormSchema>;

export const itemResponseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('single-answer'), selectedOptionId: z.string().min(1) }),
  z.object({
    kind: z.literal('multiple-select'),
    selectedOptionIds: z.array(z.string().min(1)),
  }),
  z.object({
    kind: z.literal('ordering'),
    orderedOptionIds: z.array(z.string().min(1)),
  }),
  z.object({ kind: z.literal('numeric'), value: z.number() }),
  z.object({ kind: z.literal('skipped') }),
]);
export type ItemResponseDto = z.infer<typeof itemResponseSchema>;

export const responseEntrySchema = z.object({
  itemId: z.string().min(1),
  response: itemResponseSchema,
});
export type ResponseEntryDto = z.infer<typeof responseEntrySchema>;

/**
 * Partial answer-save request. Each entry sets the answer for an item; an entry
 * whose response is `{ kind: 'skipped' }` **clears** that item's answer. Entries
 * not mentioned are unchanged. `revision` is the revision the client last saw;
 * a mismatch is rejected as a conflict (no silent lost updates).
 */
export const saveAnswersRequestSchema = z.object({
  revision: z.number().int().nonnegative(),
  answers: z.array(responseEntrySchema),
});
export type SaveAnswersRequest = z.infer<typeof saveAnswersRequestSchema>;

export const assessmentAttemptStatusSchema = z.enum(['in_progress', 'finalised']);
export type AssessmentAttemptStatus = z.infer<
  typeof assessmentAttemptStatusSchema
>;

export const itemOutcomeSchema = z.object({
  itemId: z.string().min(1),
  itemVersion: z.string().min(1),
  objectiveId: z.string().min(1),
  outcome: z.enum(['correct', 'incorrect', 'skipped']),
  pointsAwarded: z.union([z.literal(0), z.literal(1)]),
  pointsPossible: z.literal(1),
});
export type ItemOutcomeDto = z.infer<typeof itemOutcomeSchema>;

export const objectiveResultSchema = z.object({
  objectiveId: z.string().min(1),
  items: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
export type ObjectiveResultDto = z.infer<typeof objectiveResultSchema>;

export const assessmentResultSchema = z.object({
  attemptId: z.string().uuid(),
  assessmentId: z.string().min(1),
  assessmentVersion: z.string().min(1),
  formId: z.string().min(1),
  formVersion: z.string().min(1),
  scoringRuleVersion: z.string().min(1),
  languageScope: assessmentLanguageScopeSchema,
  translationVersion: z.string().min(1),
  totalItems: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  score: z.number().int().nonnegative(),
  items: z.array(itemOutcomeSchema),
  objectives: z.array(objectiveResultSchema),
});
export type AssessmentResultDto = z.infer<typeof assessmentResultSchema>;

export const assessmentAttemptViewSchema = z.object({
  attemptId: z.string().uuid(),
  assessmentId: z.string().min(1),
  formId: z.string().min(1),
  status: assessmentAttemptStatusSchema,
  revision: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  finalisedAt: z.string().nullable(),
  form: publicAssessmentFormSchema,
  /** The caller's own saved answers; absent item IDs are unanswered. */
  answers: z.array(responseEntrySchema),
  result: assessmentResultSchema.nullable(),
});
export type AssessmentAttemptView = z.infer<typeof assessmentAttemptViewSchema>;

export const assessmentAttemptSummarySchema = z.object({
  attemptId: z.string().uuid(),
  assessmentId: z.string().min(1),
  formId: z.string().min(1),
  status: assessmentAttemptStatusSchema,
  revision: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  finalisedAt: z.string().nullable(),
});
export type AssessmentAttemptSummary = z.infer<
  typeof assessmentAttemptSummarySchema
>;

export const assessmentAttemptListSchema = z.object({
  items: z.array(assessmentAttemptSummarySchema),
});
export type AssessmentAttemptList = z.infer<
  typeof assessmentAttemptListSchema
>;

export const assessmentNotAvailableResponseSchema = z.object({
  statusCode: z.literal(404),
  code: z.literal('ASSESSMENT_NOT_AVAILABLE'),
  message: z.string(),
});
export type AssessmentNotAvailableResponse = z.infer<
  typeof assessmentNotAvailableResponseSchema
>;
