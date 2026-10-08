'use client';

import { Link } from '../../shared/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useConsent } from './consent-provider';

/**
 * Accessible EN/LT analytics consent banner. Shown until a decision is stored
 * and again when the visitor reopens settings from the footer. Accept and Reject
 * are equally accessible; a privacy link is provided.
 */
export function ConsentBanner() {
  const t = useTranslations('Consent');
  const { decision, settingsOpen, accept, reject } = useConsent();

  if (decision !== null && !settingsOpen) {
    return null;
  }

  return (
    <section
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-300 bg-white p-4 text-sm shadow-lg"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <h2 className="font-semibold text-slate-900">{t('title')}</h2>
        <p className="text-slate-700">{t('body')}</p>
        {decision === 'granted' ? (
          <p className="text-slate-600">{t('grantedNote')}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={accept}
            className="inline-flex min-h-[44px] items-center rounded bg-blue-700 px-4 font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('accept')}
          </button>
          <button
            type="button"
            onClick={reject}
            className="inline-flex min-h-[44px] items-center rounded border border-slate-400 px-4 font-medium text-slate-800 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('reject')}
          </button>
          <Link
            href="/privacy"
            className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('privacy')}
          </Link>
        </div>
      </div>
    </section>
  );
}
