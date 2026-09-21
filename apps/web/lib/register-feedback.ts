/**
 * Pure LT/EN copy and navigation flags for the registration outcome (D-017).
 *
 * Kept free of React/DOM so it can be unit-tested with the built-in Node test
 * runner. The register form renders its message and links from this mapping.
 */

import type { Locale } from './auth-types';

export type RegisterFeedbackKind =
  | 'success'
  | 'already-registered'
  | 'delivery-failed'
  | 'invalid-input'
  | 'error';

export interface RegisterFeedback {
  message: string;
  showLogin: boolean;
  showResend: boolean;
  showForgot: boolean;
}

const COPY: Record<Locale, Record<RegisterFeedbackKind, RegisterFeedback>> = {
  lt: {
    success: {
      message:
        'Paskyra sukurta. Patvirtinkite el. pašto adresą per gautą nuorodą, tada prisijunkite.',
      showLogin: true,
      showResend: false,
      showForgot: false,
    },
    'already-registered': {
      message:
        'Šis el. pašto adresas jau užregistruotas. Prisijunkite arba siųskite patvirtinimo nuorodą iš naujo.',
      showLogin: true,
      showResend: true,
      showForgot: true,
    },
    'delivery-failed': {
      message:
        'Paskyra sukurta, bet patvirtinimo el. laiško išsiųsti nepavyko. Siųskite patvirtinimo nuorodą iš naujo.',
      showLogin: false,
      showResend: true,
      showForgot: false,
    },
    'invalid-input': {
      message:
        'Patikrinkite įvestus duomenis (slaptažodis 12–128 simbolių).',
      showLogin: false,
      showResend: false,
      showForgot: false,
    },
    error: {
      message: 'Nepavyko. Bandykite dar kartą.',
      showLogin: false,
      showResend: false,
      showForgot: false,
    },
  },
  en: {
    success: {
      message:
        'Account created. Verify your email address using the link we sent, then sign in.',
      showLogin: true,
      showResend: false,
      showForgot: false,
    },
    'already-registered': {
      message:
        'This email address is already registered. Sign in, or send a new verification link.',
      showLogin: true,
      showResend: true,
      showForgot: true,
    },
    'delivery-failed': {
      message:
        'The account was created, but the verification email could not be sent. Send a new verification link.',
      showLogin: false,
      showResend: true,
      showForgot: false,
    },
    'invalid-input': {
      message: 'Check the entered details (password must be 12–128 characters).',
      showLogin: false,
      showResend: false,
      showForgot: false,
    },
    error: {
      message: 'Something went wrong. Please try again.',
      showLogin: false,
      showResend: false,
      showForgot: false,
    },
  },
};

export function registerFeedback(
  locale: Locale,
  kind: RegisterFeedbackKind,
): RegisterFeedback {
  return COPY[locale][kind];
}
