/**
 * Pure navigation flags for the registration outcome (D-017).
 *
 * The user-facing message text lives in the message catalogues
 * (`messages/lt.json`, `messages/en.json`) under the `RegisterFeedback`
 * namespace. This helper stays free of React/DOM and copy so it can be
 * unit-tested with the built-in Node test runner; the register form resolves
 * `messageKey` through next-intl.
 */

export const REGISTER_FEEDBACK_KINDS = [
  'success',
  'already-registered',
  'delivery-failed',
  'invalid-input',
  'error',
] as const;

export type RegisterFeedbackKind = (typeof REGISTER_FEEDBACK_KINDS)[number];

export interface RegisterFeedback {
  /** Key inside the `RegisterFeedback` message namespace. */
  messageKey: string;
  showLogin: boolean;
  showResend: boolean;
  showForgot: boolean;
}

const FEEDBACK: Record<RegisterFeedbackKind, RegisterFeedback> = {
  success: {
    messageKey: 'success',
    showLogin: true,
    showResend: false,
    showForgot: false,
  },
  'already-registered': {
    messageKey: 'alreadyRegistered',
    showLogin: true,
    showResend: true,
    showForgot: true,
  },
  'delivery-failed': {
    messageKey: 'deliveryFailed',
    showLogin: false,
    showResend: true,
    showForgot: false,
  },
  'invalid-input': {
    messageKey: 'invalidInput',
    showLogin: false,
    showResend: false,
    showForgot: false,
  },
  error: {
    messageKey: 'error',
    showLogin: false,
    showResend: false,
    showForgot: false,
  },
};

export function registerFeedback(kind: RegisterFeedbackKind): RegisterFeedback {
  return FEEDBACK[kind];
}
