'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from './auth-provider';
import { loginHref } from '../../lib/auth-navigation';
import type { AppLocale } from '../../lib/locale-navigation';

export function AccountView() {
  const t = useTranslations('Account');
  const locale = useLocale() as AppLocale;
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
    return <p>{t('loading')}</p>;
  }

  if (status === 'error') {
    return (
      <section className="flex max-w-sm flex-col gap-3">
        <p role="alert">{t('error')}</p>
        <button
          type="button"
          onClick={retryBootstrap}
          className="border border-gray-500 px-3 py-1"
        >
          {t('retry')}
        </button>
      </section>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <p>{t('redirecting')}</p>;
  }

  const onSignOut = async () => {
    await logout();
    router.replace(`/${locale}`);
  };

  return (
    <section className="flex max-w-sm flex-col gap-3">
      <p>{t('signedInAs')}</p>
      <p className="font-mono">{user.email}</p>
      <p className="text-sm text-gray-600">{t('notice')}</p>
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="border border-gray-500 px-3 py-1"
      >
        {t('signOut')}
      </button>
    </section>
  );
}
