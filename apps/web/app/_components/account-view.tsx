'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { loginHref } from '../../lib/auth-navigation';
import type { Locale } from '../../lib/auth-types';

const COPY = {
  lt: {
    loading: 'Tikrinama sesija…',
    error: 'Nepavyko patikrinti sesijos. Bandykite dar kartą.',
    retry: 'Bandyti dar kartą',
    redirecting: 'Nukreipiama į prisijungimą…',
    signedInAs: 'Prisijungęs kaip',
    notice: 'Tai paskyros būsenos puslapis. Joks vertinimas čia nesiūlomas.',
    signOut: 'Atsijungti',
    backHome: 'Į pradžią',
  },
  en: {
    loading: 'Checking session…',
    error: 'Could not check your session. Please try again.',
    retry: 'Retry',
    redirecting: 'Redirecting to sign in…',
    signedInAs: 'Signed in as',
    notice: 'This is an account-state page. No assessment is offered here.',
    signOut: 'Sign out',
    backHome: 'Home',
  },
} as const;

export function AccountView({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const { status, user, retryBootstrap, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return;
    }
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.replace(loginHref(locale, returnTo));
  }, [status, locale, router]);

  if (status === 'loading') {
    return <p>{c.loading}</p>;
  }

  if (status === 'error') {
    return (
      <section className="flex max-w-sm flex-col gap-3">
        <p role="alert">{c.error}</p>
        <button
          type="button"
          onClick={retryBootstrap}
          className="border border-gray-500 px-3 py-1"
        >
          {c.retry}
        </button>
      </section>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <p>{c.redirecting}</p>;
  }

  const onSignOut = async () => {
    await logout();
    router.replace(`/${locale}`);
  };

  return (
    <section className="flex max-w-sm flex-col gap-3">
      <p>{c.signedInAs}</p>
      <p className="font-mono">{user.email}</p>
      <p className="text-sm text-gray-600">{c.notice}</p>
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="border border-gray-500 px-3 py-1"
      >
        {c.signOut}
      </button>
    </section>
  );
}
