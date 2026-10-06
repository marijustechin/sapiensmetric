'use client';

import { useTranslations } from 'next-intl';
import type { AssessmentResultDto } from './assessment-types';

interface AssessmentResultViewProps {
  result: AssessmentResultDto;
}

/**
 * Renders the raw server scoring output for a finalised attempt. It shows only
 * what the API returns (correct/incorrect/skipped, a raw score, and objective
 * totals) and explicitly avoids any validated/percentile/IQ framing.
 */
export function AssessmentResultView({ result }: AssessmentResultViewProps) {
  const t = useTranslations('Assessment');

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded border border-gray-300 bg-gray-50 p-4 text-sm">
        {t('resultSynthetic')}
      </div>

      <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-1">
        <dt>{t('totalItems')}</dt>
        <dd className="font-mono">{result.totalItems}</dd>
        <dt>{t('correct')}</dt>
        <dd className="font-mono">{result.correct}</dd>
        <dt>{t('incorrect')}</dt>
        <dd className="font-mono">{result.incorrect}</dd>
        <dt>{t('skipped')}</dt>
        <dd className="font-mono">{result.skipped}</dd>
        <dt>{t('score')}</dt>
        <dd className="font-mono">{result.score}</dd>
      </dl>

      <div>
        <h3 className="font-semibold">{t('objectives')}</h3>
        <table className="mt-1 text-sm">
          <thead>
            <tr className="text-left">
              <th className="pr-4">{t('objectiveHeader')}</th>
              <th className="pr-4">{t('correct')}</th>
              <th className="pr-4">{t('incorrect')}</th>
              <th className="pr-4">{t('skipped')}</th>
              <th>{t('totalItems')}</th>
            </tr>
          </thead>
          <tbody>
            {result.objectives.map((objective) => (
              <tr key={objective.objectiveId}>
                <td className="pr-4 font-mono">{objective.objectiveId}</td>
                <td className="pr-4 font-mono">{objective.correct}</td>
                <td className="pr-4 font-mono">{objective.incorrect}</td>
                <td className="pr-4 font-mono">{objective.skipped}</td>
                <td className="font-mono">{objective.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-semibold">{t('itemsBreakdown')}</h3>
        <ul className="mt-1 text-sm">
          {result.items.map((item) => (
            <li key={item.itemId} className="flex gap-2">
              <span className="font-mono">{item.itemId}</span>
              <span className="text-gray-600">
                {t(`outcome.${item.outcome}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
