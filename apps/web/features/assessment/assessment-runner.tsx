'use client';

import { useTranslations } from 'next-intl';
import { answeredCount, pendingEntries } from './assessment-answers';
import { AssessmentItem } from './assessment-item';
import type { AssessmentStore, RunnerState } from './assessment-store';

interface AssessmentRunnerProps {
  state: RunnerState;
  store: AssessmentStore;
  onBack: () => void;
}

/**
 * The attempt runner: renders the served items, tracks local edits, and drives
 * explicit Save / Submit. The server stays authoritative; this component only
 * orchestrates the store.
 */
export function AssessmentRunner({ state, store, onBack }: AssessmentRunnerProps) {
  const t = useTranslations('Assessment');

  const total = state.form?.items.length ?? 0;
  const answered = answeredCount(state.draft);
  const pending = pendingEntries(state.draft, state.saved, state.editedIds);
  const hasPending = pending.length > 0;
  const saving = state.saveStatus === 'saving';
  const submitting = state.submitStatus === 'submitting';

  const onSave = () => {
    void store.save();
  };

  const onSubmit = () => {
    if (typeof window !== 'undefined' && !window.confirm(t('submitConfirm'))) {
      return;
    }
    void store.submit();
  };

  const onReload = () => {
    if (
      typeof window === 'undefined' ||
      window.confirm(t('discardConfirm'))
    ) {
      void store.reloadFromServer();
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="border border-gray-500 px-2 py-1 text-sm"
        >
          {t('back')}
        </button>
        <span className="text-sm text-gray-700">
          {t('progress', { answered, total })}
        </span>
        <span className="text-xs text-gray-500">
          {t('revision', { n: state.revision })}
        </span>
        {hasPending ? (
          <span className="text-sm text-amber-700">{t('unsaved')}</span>
        ) : null}
      </div>

      {state.sessionExpired ? (
        <p role="alert" className="rounded border border-red-400 bg-red-50 p-3">
          {t('sessionExpired')}
        </p>
      ) : null}

      {state.conflict ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded border border-amber-500 bg-amber-50 p-3"
        >
          <strong>{t('conflictTitle')}</strong>
          <p className="text-sm">{t('conflictBody')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReload}
              className="border border-gray-600 bg-white px-3 py-1 text-sm"
            >
              {t('reloadServer')}
            </button>
            <button
              type="button"
              onClick={() => void store.keepLocalEdits()}
              className="border border-gray-600 bg-white px-3 py-1 text-sm"
            >
              {t('keepLocal')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {(state.form?.items ?? []).map((item, index) => (
          <AssessmentItem
            key={item.itemId}
            item={item}
            index={index + 1}
            draft={state.draft}
            disabled={state.status === 'finalised' || state.conflict}
            onAnswer={(itemId, response) => store.setAnswer(itemId, response)}
            onClear={(itemId) => store.clearAnswer(itemId)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded border border-gray-300 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || submitting || state.conflict}
            className="border border-gray-600 px-3 py-1 disabled:opacity-40"
          >
            {saving ? t('saving') : t('save')}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || saving || state.conflict}
            className="border border-gray-800 bg-gray-800 px-3 py-1 text-white disabled:opacity-40"
          >
            {submitting ? t('submitting') : t('submit')}
          </button>
          {state.saveStatus === 'saved' ? (
            <span className="text-sm text-green-700">{t('saved')}</span>
          ) : null}
        </div>

        {state.saveStatus === 'error' ? (
          <p role="alert" className="text-sm text-red-700">
            {state.saveError === 'unauthorized'
              ? t('sessionExpired')
              : t('saveError')}
          </p>
        ) : null}

        {state.submitStatus === 'error' ? (
          <div className="flex flex-col gap-1">
            <p role="alert" className="text-sm text-red-700">
              {state.submitAmbiguous ? t('submitAmbiguous') : t('submitError')}
            </p>
            {state.submitAmbiguous ? (
              <button
                type="button"
                onClick={() => void store.reconcile()}
                className="self-start border border-gray-600 px-3 py-1 text-sm"
              >
                {t('checkStatus')}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
