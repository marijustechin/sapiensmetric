'use client';

import { useTranslations } from 'next-intl';
import type { AppLocale } from '../../shared/lib/locale-navigation';
import type { AssessmentAttemptSummary } from './assessment-types';

interface AssessmentHistoryProps {
  locale: AppLocale;
  status: 'loading' | 'ready' | 'error';
  items: AssessmentAttemptSummary[];
  activeId: string | null;
  onSelect: (attemptId: string) => void;
  onRefresh: () => void;
}

/**
 * The participant's own attempts (T-022 correction).
 *
 * Identity leads with a translated **module title** (mapped from the attempt's
 * client-safe `assessmentId`, never guessed from the item count) plus status,
 * date and item count; technical ids/revision are secondary. Presented as raw
 * records, never as validated progress.
 */
export function AssessmentHistory({
  locale,
  status,
  items,
  activeId,
  onSelect,
  onRefresh,
}: AssessmentHistoryProps) {
  const t = useTranslations('Assessment');

  const moduleTitle = (assessmentId: string): string => {
    if (assessmentId === 'synthetic-demo') return t('moduleSynthetic');
    if (assessmentId === 'astronomy-draft') return t('moduleAstronomy');
    return t('moduleUnknown');
  };

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(locale === 'lt' ? 'lt-LT' : 'en-GB');
  };

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">{t('historyTitle')}</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[44px] border border-gray-500 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('refresh')}
        </button>
      </div>

      {status === 'loading' ? <p>{t('historyLoading')}</p> : null}
      {status === 'error' ? <p role="alert">{t('historyError')}</p> : null}
      {status === 'ready' && items.length === 0 ? (
        <p className="text-gray-600">{t('historyEmpty')}</p>
      ) : null}

      {status === 'ready' && items.length > 0 ? (
        <ul className="flex min-w-0 flex-col gap-2">
          {items.map((attempt) => {
            const finalised = attempt.status === 'finalised';
            return (
              <li
                key={attempt.attemptId}
                className={`flex min-w-0 flex-col gap-2 rounded border p-3 ${
                  attempt.attemptId === activeId ? 'border-gray-800' : 'border-gray-300'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {moduleTitle(attempt.assessmentId)}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      finalised
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {finalised ? t('statusFinalised') : t('statusInProgress')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span>
                    {t('historyItems', { count: attempt.itemCount })}
                  </span>
                  <span>
                    {t('created')}: {formatDate(attempt.createdAt)}
                  </span>
                  <span>
                    {t('updated')}: {formatDate(attempt.updatedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelect(attempt.attemptId)}
                    className="min-h-[44px] border border-gray-500 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {finalised ? t('viewResult') : t('resume')}
                  </button>
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer">{t('details')}</summary>
                    <dl className="mt-1 flex flex-col gap-0.5">
                      <div className="flex gap-2">
                        <dt>{t('attemptIdLabel')}:</dt>
                        <dd className="break-all font-mono">
                          {attempt.attemptId}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt>{t('revision', { n: attempt.revision })}</dt>
                      </div>
                    </dl>
                  </details>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
