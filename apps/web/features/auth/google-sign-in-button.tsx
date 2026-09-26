'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import * as authApi from './auth-api';
import { googleStartUrl } from './google-auth';
import type { AppLocale } from '../../shared/lib/locale-navigation';

/**
 * Navigates to the API Google start endpoint. The button is hidden while the
 * availability check is in flight and shows a clear note when Google is not
 * configured, so password authentication is never blocked by it.
 */
export function GoogleSignInButton({ returnTo }: { returnTo?: string }) {
  const t = useTranslations('Google');
  const locale = useLocale() as AppLocale;
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void authApi.googleStatus().then((result) => {
      if (active) {
        setAvailable(result.kind === 'success' ? result.data.available : false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (available === null) {
    return null;
  }

  if (!available) {
    return <p className="text-sm text-gray-600">{t('unavailable')}</p>;
  }

  return (
    <a
      href={googleStartUrl(authApi.apiBaseUrl(), locale, returnTo)}
      className="border border-gray-500 px-3 py-1 text-center"
    >
      {t('button')}
    </a>
  );
}
