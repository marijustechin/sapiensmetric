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
 * The participant's own attempts. Presented as raw records (status, revision,
 * timestamps) with links to resume or view the result — never as validated
 * progress or achievement.
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

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(locale === 'lt' ? 'lt-LT' : 'en-GB');
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{t('historyTitle')}</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="border border-gray-500 px-2 py-1 text-sm"
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
        <ul className="flex flex-col gap-2">
          {items.map((attempt) => {
            const finalised = attempt.status === 'finalised';
            return (
              <li
                key={attempt.attemptId}
                className={`flex flex-wrap items-center gap-3 rounded border p-3 ${
                  attempt.attemptId === activeId
                    ? 'border-gray-800'
                    : 'border-gray-300'
                }`}
              >
                <span className="font-mono text-xs">{attempt.attemptId}</span>
                <span className="text-sm">
                  {finalised ? t('statusFinalised') : t('statusInProgress')}
                </span>
                <span className="text-xs text-gray-600">
                  {t('revision', { n: attempt.revision })}
                </span>
                <span className="text-xs text-gray-600">
                  {t('created')}: {formatDate(attempt.createdAt)}
                </span>
                <span className="text-xs text-gray-600">
                  {t('updated')}: {formatDate(attempt.updatedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(attempt.attemptId)}
                  className="ml-auto border border-gray-500 px-2 py-1 text-sm"
                >
                  {finalised ? t('viewResult') : t('resume')}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
