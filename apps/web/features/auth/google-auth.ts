/**
 * Pure helpers for the Google sign-in button (T-007). No secrets are involved:
 * the browser only navigates to the API start endpoint; the client ID, secret,
 * and redirect URI stay server-side.
 *
 * The button/unavailable copy lives in the message catalogues under the
 * `Google` namespace; only the URL construction is pure helper logic here.
 */

import type {Locale} from './auth-types';

export function googleStartUrl(
  apiBase: string,
  locale: Locale,
  returnTo?: string,
): string {
  const base = apiBase.replace(/\/+$/, '');
  const params = new URLSearchParams({ locale });
  if (returnTo) {
    params.set('returnTo', returnTo);
  }
  return `${base}/auth/google/start?${params.toString()}`;
}
