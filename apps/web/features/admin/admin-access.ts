/**
 * Pure admin route-entry decision (T-012 UX follow-up).
 *
 * Client redirects are navigation behaviour, not security enforcement; the API
 * remains the authority. This module only decides what the client should render
 * or navigate to after session bootstrap and the admin "probe" request.
 *
 * Dependency-free so it runs under the built-in Node test runner.
 */

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';
export type AdminProbe = 'pending' | 'success' | 'forbidden' | 'unauthorized' | 'error';

export type AdminEntryDecision =
  | { kind: 'waiting' }
  | { kind: 'session-error' }
  | { kind: 'sign-in'; returnTo: string }
  | { kind: 'redirect-account'; path: string }
  | { kind: 'render' }
  | { kind: 'probe-error' };

export interface AdminEntryInput {
  authStatus: AuthStatus;
  probe: AdminProbe;
  locale: string;
}

export function adminReturnTo(locale: string): string {
  return `/${locale}/admin/`;
}

export function accountPath(locale: string): string {
  return `/${locale}/account/`;
}

/**
 * - while the session or the probe is unresolved -> `waiting` (loading state,
 *   no admin content and no "no permissions" screen);
 * - unauthenticated or session-expired -> `sign-in` preserving the admin
 *   destination as `returnTo` (the login page sanitises it);
 * - authenticated non-admin (probe forbidden) -> `redirect-account`;
 * - authenticated admin (probe success) -> `render`;
 * - network/server failure -> `probe-error` (retry), NEVER a permission
 *   redirect; a bootstrap error -> `session-error` (recovery).
 */
export function decideAdminEntry(input: AdminEntryInput): AdminEntryDecision {
  if (input.authStatus === 'loading') {
    return { kind: 'waiting' };
  }
  if (input.authStatus === 'error') {
    return { kind: 'session-error' };
  }
  if (input.authStatus === 'unauthenticated') {
    return { kind: 'sign-in', returnTo: adminReturnTo(input.locale) };
  }
  // authenticated
  if (input.probe === 'pending') {
    return { kind: 'waiting' };
  }
  if (input.probe === 'success') {
    return { kind: 'render' };
  }
  if (input.probe === 'forbidden') {
    return { kind: 'redirect-account', path: accountPath(input.locale) };
  }
  if (input.probe === 'unauthorized') {
    // Invalid/expired session: reuse the existing login/returnTo recovery.
    return { kind: 'sign-in', returnTo: adminReturnTo(input.locale) };
  }
  return { kind: 'probe-error' };
}

/**
 * Map an admin API outcome to a probe state. Action-level validation errors
 * (400/409) are NOT permission outcomes; they belong to the action result, not
 * to entry/access decisions.
 */
export function probeFromOutcome(kind: string): AdminProbe {
  switch (kind) {
    case 'success':
      return 'success';
    case 'forbidden':
      return 'forbidden';
    case 'unauthorized':
      return 'unauthorized';
    default:
      return 'error';
  }
}
