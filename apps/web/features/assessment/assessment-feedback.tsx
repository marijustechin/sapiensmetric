'use client';

import { useTranslations } from 'next-intl';
import type { AssessmentFeedback } from './assessment-types';

/**
 * Post-submission feedback for a finalised astronomy-draft attempt (T-022).
 * Shows correctness, the participant's answer, the correct option, the
 * explanation and sources. Never rendered for in-progress attempts.
 */
export function AssessmentFeedbackView({
  feedback,
}: {
  feedback: AssessmentFeedback;
}) {
  const t = useTranslations('Assessment');

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm" role="note">
        {t('feedbackDraftNote')}
      </div>

      <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-1">
        <dt>{t('totalItems')}</dt>
        <dd className="font-mono">{feedback.totals.totalItems}</dd>
        <dt>{t('correct')}</dt>
        <dd className="font-mono">{feedback.totals.correct}</dd>
        <dt>{t('incorrect')}</dt>
        <dd className="font-mono">{feedback.totals.incorrect}</dd>
        <dt>{t('skipped')}</dt>
        <dd className="font-mono">{feedback.totals.skipped}</dd>
      </dl>

      <ol className="flex flex-col gap-4">
        {feedback.items.map((item, index) => (
          <li key={item.itemId} className="rounded border border-slate-300 p-4">
            <p className="font-semibold">
              {index + 1}. {t(`feedbackOutcome.${item.outcome}`)}
            </p>
            {item.unavailable ? (
              <p className="mt-1 text-sm text-slate-600">{t('feedbackUnavailable')}</p>
            ) : (
              <>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {item.options.map((option) => {
                    const correct = item.answerOptionIds.includes(option.id);
                    const selected = item.selectedOptionIds.includes(option.id);
                    return (
                      <li key={option.id} className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={correct ? 'text-green-700' : 'text-slate-400'}
                        >
                          {correct ? '✓' : '·'}
                        </span>
                        <span>{option.text}</span>
                        {selected ? (
                          <span className="text-xs text-slate-500">
                            ({t('feedbackYourAnswer')})
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-sm">{item.explanation}</p>
                {item.sources.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1 text-xs text-slate-600">
                    {item.sources.map((source) => (
                      <li key={source.id}>
                        <a
                          className="underline"
                          href={source.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {source.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
