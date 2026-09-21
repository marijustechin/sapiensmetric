'use client';

import { Link, usePathname, useRouter } from '../../i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from './auth-provider';
import {
  otherLocale,
  switchLocaleTarget,
  type AppLocale,
} from '../../lib/locale-navigation';

export function AuthNav() {
  const t = useTranslations('Nav');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const other = otherLocale(locale);

  const onSignOut = async () => {
    await logout();
    router.replace('/');
  };

  // Switch to the equivalent available route in the other locale. A safe
  // same-origin `returnTo` is remapped to the target locale; nothing is ever
  // read from or written to a cookie.
  const onSwitchLanguage = () => {
    const search =
      typeof window === 'undefined' ? '' : window.location.search;
    const target = switchLocaleTarget({
      pathname: pathname ?? '/',
      search,
      targetLocale: other,
    });
    router.replace(target, { locale: other });
  };

  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-8 py-3 text-sm">
      <Link href="/">{t('home')}</Link>
      <Link href="/auth/login">{t('login')}</Link>
      <Link href="/auth/register">{t('register')}</Link>
      <Link href="/auth/verify-email">{t('verify')}</Link>
      <Link href="/auth/forgot-password">{t('forgot')}</Link>
      <Link href="/account">{t('account')}</Link>
      <span className="ml-auto flex items-center gap-3">
        {status === 'authenticated' && user ? (
          <>
            <span className="text-gray-600">{user.email}</span>
            <button type="button" onClick={() => void onSignOut()}>
              {t('signOut')}
            </button>
          </>
        ) : null}
        <button type="button" onClick={onSwitchLanguage}>
          {other === 'en' ? t('switchToEnglish') : t('switchToLithuanian')}
        </button>
      </span>
    </nav>
  );
}
