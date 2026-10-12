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
    itemCount: attempt.snapshot.items.length,
    createdAt: attempt.createdAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
    finalisedAt: attempt.finalisedAt ? attempt.finalisedAt.toISOString() : null,
  };
}

export function toAttemptList(attempts: AttemptRecord[]): AssessmentAttemptList {
  return { items: attempts.map(toAttemptSummary) };
}

/**
 * History visibility rule (T-022 correction).
 *
 * A normal attempt history omits an **untouched draft** — one the caller started
 * but never saved any answers to and never submitted. The draft still exists
 * server-side for snapshot/ownership integrity and can be resumed by id.
 *
 * Meaningful progress is an explicit `hasProgress` flag set when a save actually
 * applies answer operations; it is NOT derived from the revision counter (an
 * empty save can increment it). This is not exposure tracking: hiding an empty
 * draft says nothing about which items were presented.
 */
export function isHistoryVisible(
  attempt: Pick<AttemptRecord, 'hasProgress' | 'status'>,
): boolean {
  return attempt.hasProgress || attempt.status === 'finalised';
}
