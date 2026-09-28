import { toPublicForm } from '@sapiensmetric/assessment';
import type {
  AssessmentAttemptList,
  AssessmentAttemptSummary,
  AssessmentAttemptView,
} from '@sapiensmetric/contracts';
import type { AttemptRecord } from './assessment-attempt.store.js';

/**
 * Pure projection from internal persisted attempts to **client-safe** DTOs.
 *
 * The public form is produced by `toPublicForm` (strips answer keys and numeric
 * answers). The view also never includes the stored keyed snapshot or any
 * internal item definitions. Kept as a pure function so the no-leak property is
 * directly testable.
 */
export function toAttemptView(attempt: AttemptRecord): AssessmentAttemptView {
  return {
    attemptId: attempt.id,
    assessmentId: attempt.snapshot.assessmentId,
    formId: attempt.snapshot.formId,
    status: attempt.status,
    revision: attempt.revision,
    createdAt: attempt.createdAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
    finalisedAt: attempt.finalisedAt ? attempt.finalisedAt.toISOString() : null,
    form: toPublicForm(attempt.snapshot),
    answers: attempt.answers as AssessmentAttemptView['answers'],
    result: attempt.result as AssessmentAttemptView['result'],
  };
}

export function toAttemptSummary(attempt: AttemptRecord): AssessmentAttemptSummary {
  return {
    attemptId: attempt.id,
    assessmentId: attempt.snapshot.assessmentId,
    formId: attempt.snapshot.formId,
    status: attempt.status,
    revision: attempt.revision,
    createdAt: attempt.createdAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
    finalisedAt: attempt.finalisedAt ? attempt.finalisedAt.toISOString() : null,
  };
}

export function toAttemptList(attempts: AttemptRecord[]): AssessmentAttemptList {
  return { items: attempts.map(toAttemptSummary) };
}
