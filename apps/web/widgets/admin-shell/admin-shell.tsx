'use client';

import { useTranslations } from 'next-intl';
import { Link } from '../../shared/i18n/navigation';
import { AdminScreen } from '../../features/admin/admin-screen';

/**
 * Admin shell (widget): composed navigation plus the admin screen. The Next
 * route stays a thin composition of this widget.
 */
export function AdminShell() {
  const t = useTranslations('Admin');
  return (
    <section className="flex flex-col gap-6">
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/account">{t('nav.account')}</Link>
        <Link href="/">{t('nav.home')}</Link>
      </nav>
      <AdminScreen />
    </section>
  );
}
