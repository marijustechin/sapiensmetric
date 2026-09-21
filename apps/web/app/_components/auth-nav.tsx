'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { accountHref, homeHref } from '../../lib/auth-navigation';
import type { Locale } from '../../lib/auth-types';

const COPY = {
  lt: {
    home: 'Pradžia',
    login: 'Prisijungti',
    register: 'Registruotis',
    verify: 'Patvirtinti el. paštą',
    forgot: 'Pamiršau slaptažodį',
    account: 'Paskyra',
    signOut: 'Atsijungti',
    otherLocale: 'English',
  },
  en: {
    home: 'Home',
    login: 'Sign in',
    register: 'Register',
    verify: 'Verify email',
    forgot: 'Forgot password',
    account: 'Account',
    signOut: 'Sign out',
    otherLocale: 'Lietuviškai',
  },
} as const;

export function AuthNav({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const other: Locale = locale === 'lt' ? 'en' : 'lt';

  const onSignOut = async () => {
    await logout();
    router.replace(homeHref(locale));
  };

  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-8 py-3 text-sm">
      <Link href={homeHref(locale)}>{c.home}</Link>
      <Link href={`/${locale}/auth/login`}>{c.login}</Link>
      <Link href={`/${locale}/auth/register`}>{c.register}</Link>
      <Link href={`/${locale}/auth/verify-email`}>{c.verify}</Link>
      <Link href={`/${locale}/auth/forgot-password`}>{c.forgot}</Link>
      <Link href={accountHref(locale)}>{c.account}</Link>
      <span className="ml-auto flex items-center gap-3">
        {status === 'authenticated' && user ? (
          <>
            <span className="text-gray-600">{user.email}</span>
            <button type="button" onClick={() => void onSignOut()}>
              {c.signOut}
            </button>
          </>
        ) : null}
        <Link href={`/${other}`}>{c.otherLocale}</Link>
      </span>
    </nav>
  );
}
