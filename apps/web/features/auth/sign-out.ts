import type { AppLocale } from '../../shared/lib/locale-navigation';

/**
 * Sign out and return to the established home entry (T-022 correction).
 *
 * Signing out changes the auth status, which makes the protected-page guard
 * (`/{locale}/account`, `/{locale}/assessment`) race an in-app redirect back to
 * sign-in. To make the destination deterministic, revoke the session first and
 * then perform a full document navigation to the public home. Public pages are
 * session-independent, so this never strands the user on the sign-in screen.
 */
export async function signOutToHome(
  logout: () => Promise<void>,
  locale: AppLocale,
): Promise<void> {
  try {
    await logout();
  } catch {
    // `logout()` already clears local session state even if the API call fails;
    // still return the user to the home entry.
  }
  window.location.assign(`/${locale}`);
}
