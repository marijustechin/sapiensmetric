/**
 * Typed errors for the versioned scoring core.
 *
 * Every failure is an explicit, coded error. The core never returns a partial
 * result after a validation failure and never silently coerces malformed input.
 */

export type AssessmentErrorCode =
  | 'UNSUPPORTED_SCORING_RULE_VERSION'
  | 'INVALID_FORM'
  | 'INVALID_RESPONSES'
  | 'ATTEMPT_NOT_SUBMITTED';

export class AssessmentError extends Error {
  readonly code: AssessmentErrorCode;

  constructor(code: AssessmentErrorCode, message: string) {
    super(message);
    this.name = 'AssessmentError';
    this.code = code;
  }
}
