'use client';

import { useTranslations } from 'next-intl';
import { BackToTop } from '../../shared/ui/back-to-top';

/** Localized back-to-top control for the authenticated app shell. */
export function AppBackToTop() {
  const t = useTranslations('Nav');
  return <BackToTop label={t('backToTop')} />;
}
