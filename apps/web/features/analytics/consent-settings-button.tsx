'use client';

import { useTranslations } from 'next-intl';
import { useConsent } from './consent-provider';

/**
 * Persistent footer entry to reopen analytics settings and withdraw consent.
 * Rendered by the public footer; the banner reflects the reopened state.
 */
export function ConsentSettingsButton() {
  const t = useTranslations('Consent');
  const { openSettings } = useConsent();

  return (
    <button
      type="button"
      onClick={openSettings}
      className="text-left text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {t('settings')}
    </button>
  );
}
