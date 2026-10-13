/**
 * Pure authenticated/guest drawer navigation (T-023).
 *
 * The authenticated app drawer shows only role-appropriate destinations:
 *   - authenticated user:  Home, Account, Assessment, (Logout rendered separately)
 *   - authenticated admin: additionally Admin
 *   - guest:               Home, Sign in, (+ Register only when registration is enabled)
 *
 * Guest-only account-recovery entries (verify email, forgot password) are NOT
 * placed in the main menu: they live in their relevant authentication flows.
 * Registration is offered only when the API says registration is enabled.
 *
 * Kept pure so guest/user/admin and registration-disabled states are unit-tested
 * without a DOM; the widget renders exactly these items.
 */

export interface AuthNavItem {
  href: string;
  /** next-intl key within the `Nav` namespace. */
  labelKey: 'home' | 'login' | 'register' | 'account' | 'assessment' | 'admin';
}

export interface AuthNavState {
  authenticated: boolean;
  isAdmin: boolean;
  registrationEnabled: boolean;
}

export function buildAuthNavItems(state: AuthNavState): AuthNavItem[] {
  if (!state.authenticated) {
    const guest: AuthNavItem[] = [
      { href: '/', labelKey: 'home' },
      { href: '/auth/login', labelKey: 'login' },
    ];
    if (state.registrationEnabled) {
      guest.push({ href: '/auth/register', labelKey: 'register' });
    }
    return guest;
  }

  const items: AuthNavItem[] = [
    { href: '/', labelKey: 'home' },
    { href: '/account', labelKey: 'account' },
    { href: '/assessment', labelKey: 'assessment' },
  ];
  if (state.isAdmin) {
    items.push({ href: '/admin', labelKey: 'admin' });
  }
  return items;
}
