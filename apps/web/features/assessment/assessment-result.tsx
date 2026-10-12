'use client';

import { useTranslations } from 'next-intl';
import type { AssessmentResultDto } from './assessment-types';

interface AssessmentResultViewProps {
  result: AssessmentResultDto;
}

/**
 * Raw server scoring output for a finalised attempt. Shows only what the API
 * returns (correct/incorrect/skipped, a raw score, and objective totals) and
 * explicitly avoids any validated/percentile/IQ framing. Laid out as stacked
 * label/value groups so it stays usable and free of page-level horizontal scroll
 * at narrow widths (320/360/390px).
 */
export function AssessmentResultView({ result }: AssessmentResultViewProps) {
  const t = useTranslations('Assessment');

  const metrics: { label: string; value: number }[] = [
    { label: t('totalItems'), value: result.totalItems },
    { label: t('correct'), value: result.correct },
    { label: t('incorrect'), value: result.incorrect },
    { label: t('skipped'), value: result.skipped },
    { label: t('score'), value: result.score },
  ];

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="rounded border border-gray-300 bg-gray-50 p-4 text-sm">
        {t('resultSynthetic')}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:max-w-md">
        {metrics.map((metric) => (
          <div key={metric.label} className="col-span-2 flex justify-between gap-4 sm:col-span-1 sm:flex-col sm:gap-0">
            <dt className="text-slate-600">{metric.label}</dt>
            <dd className="font-mono">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className="min-w-0">
        <h3 className="font-semibold">{t('objectives')}</h3>
        <ul className="mt-2 flex min-w-0 flex-col gap-2">
          {result.objectives.map((objective) => (
            <li
              key={objective.objectiveId}
              className="min-w-0 rounded border border-slate-200 p-3 text-sm"
            >
              <p className="break-all font-mono text-slate-800">
                {objective.objectiveId}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">{t('correct')}</dt>
                  <dd className="font-mono">{objective.correct}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">{t('incorrect')}</dt>
                  <dd className="font-mono">{objective.incorrect}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">{t('skipped')}</dt>
                  <dd className="font-mono">{objective.skipped}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">{t('totalItems')}</dt>
                  <dd className="font-mono">{objective.items}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0">
        <h3 className="font-semibold">{t('itemsBreakdown')}</h3>
        <ul className="mt-2 flex min-w-0 flex-col gap-1 text-sm">
          {result.items.map((item) => (
            <li key={item.itemId} className="flex flex-wrap gap-x-2">
              <span className="break-all font-mono">{item.itemId}</span>
              <span className="text-gray-600">{t(`outcome.${item.outcome}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
