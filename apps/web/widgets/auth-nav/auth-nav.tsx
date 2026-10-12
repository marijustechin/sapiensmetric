'use client';

import { useRef, useState } from 'react';
import { Link, usePathname, useRouter } from '../../shared/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '../../features/auth/auth-provider';
import { signOutToHome } from '../../features/auth/sign-out';
import { BrandMark } from '../../shared/ui/brand-mark';
import { Drawer } from '../../shared/ui/drawer';
import {
  otherLocale,
  switchLocaleTarget,
  type AppLocale,
} from '../../shared/lib/locale-navigation';

/**
 * Authenticated app navigation (T-022 correction).
 *
 * Reuses the same accessible hamburger/drawer behaviour as the public
 * site-header at **all widths**, sharing `shared/ui/drawer.tsx` rather than
 * introducing another menu implementation. Role-aware destinations, account,
 * sign-out, locale switching and auth bootstrap are preserved. The public site
 * shell does not depend on any of this (public pages make no session requests).
 */
export function AuthNav() {
  const t = useTranslations('Nav');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const other = otherLocale(locale);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const onSignOut = async () => {
    setMenuOpen(false);
    await signOutToHome(logout, locale);
  };

  // Switch to the equivalent available route in the other locale. A safe
  // same-origin `returnTo` is remapped to the target locale; nothing is ever
  // read from or written to a cookie.
  const onSwitchLanguage = () => {
    const search = typeof window === 'undefined' ? '' : window.location.search;
    const target = switchLocaleTarget({
      pathname: pathname ?? '/',
      search,
      targetLocale: other,
    });
    router.replace(target, { locale: other });
  };

  const closeMenu = () => setMenuOpen(false);

  const links: { href: string; label: string }[] = [
    { href: '/', label: t('home') },
    { href: '/auth/login', label: t('login') },
    { href: '/auth/register', label: t('register') },
    { href: '/auth/verify-email', label: t('verify') },
    { href: '/auth/forgot-password', label: t('forgot') },
    { href: '/account', label: t('account') },
    { href: '/assessment', label: t('assessment') },
  ];

  return (
    <header className="border-b border-gray-200">
      <div className="flex items-center justify-between gap-3 px-8 py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <BrandMark className="h-8 w-8 shrink-0" alt="" />
          <span className="truncate font-semibold text-slate-900">SapiensMetric</span>
        </Link>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSwitchLanguage}
            className="inline-flex min-h-[44px] items-center rounded border border-gray-300 px-3 text-sm text-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {other === 'en' ? t('switchToEnglish') : t('switchToLithuanian')}
          </button>
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-controls="app-menu"
            onClick={() => setMenuOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-gray-300 text-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="sr-only">{t('openMenu')}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <Drawer
        open={menuOpen}
        onClose={closeMenu}
        label={t('menu')}
        inertTargetId="app-shell-root"
        triggerRef={menuButtonRef}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <span className="text-base font-semibold text-slate-900">{t('menu')}</span>
          <button
            type="button"
            onClick={closeMenu}
            aria-label={t('closeMenu')}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav id="app-menu" aria-label={t('menu')} className="flex flex-col gap-1 p-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="flex min-h-[44px] items-center rounded px-3 text-base text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {status === 'authenticated' && user ? (
          <div className="mt-auto border-t border-gray-200 p-4 text-sm">
            <p className="break-all text-gray-600">{user.email}</p>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="mt-2 inline-flex min-h-[44px] items-center rounded border border-gray-500 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('signOut')}
            </button>
          </div>
        ) : null}
      </Drawer>
    </header>
  );
}
