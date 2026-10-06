'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '../../features/auth/auth-provider';
import { loginHref } from '../../features/auth/auth-navigation';
import { assessmentApi } from '../../features/assessment/assessment-api';
import { pendingEntries } from '../../features/assessment/assessment-answers';
import type { AssessmentAttemptSummary } from '../../features/assessment/assessment-types';
import { AssessmentHistory } from '../../features/assessment/assessment-history';
import { AssessmentRunner } from '../../features/assessment/assessment-runner';
import { AssessmentResultView } from '../../features/assessment/assessment-result';
import { useAssessmentStore } from './use-assessment-store';
import { useAttemptParam } from './use-attempt-param';
import type { AppLocale } from '../../shared/lib/locale-navigation';

interface HistoryState {
  status: 'loading' | 'ready' | 'error';
  items: AssessmentAttemptSummary[];
}

/**
 * Synthetic-assessment screen (T-019). Wires the auth provider to the
 * framework-free assessment store and renders the history, runner, and result.
 * It is mounted only inside the authenticated app area, on all locales.
 */
export function AssessmentScreen() {
  const t = useTranslations('Assessment');
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { status, retryBootstrap, getAccessToken } = useAuth();
  const store = useAssessmentStore();
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );
  const { attemptId, selectAttempt } = useAttemptParam();

  const [history, setHistory] = useState<HistoryState>({
    status: 'loading',
    items: [],
  });

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.replace(loginHref(locale, returnTo));
  }, [status, locale, router]);

  const refreshHistory = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setHistory({ status: 'error', items: [] });
      return;
    }
    setHistory((current) => ({ ...current, status: 'loading' }));
    const outcome = await assessmentApi.list(token);
    if (outcome.kind === 'success') {
      setHistory({ status: 'ready', items: outcome.data.items });
      return;
    }
    setHistory({ status: 'error', items: [] });
  }, [getAccessToken]);

  useEffect(() => {
    if (status === 'authenticated') void refreshHistory();
  }, [status, refreshHistory]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (attemptId) {
      void store.loadAttempt(attemptId);
    } else {
      store.reset();
    }
  }, [attemptId, status, store]);

  // Refresh the history once an attempt is finalised (after submit or when
  // viewing an already-finalised attempt).
  useEffect(() => {
    if (state.status === 'finalised') void refreshHistory();
  }, [state.status, refreshHistory]);

  const hasPending =
    pendingEntries(state.draft, state.saved, state.editedIds).length > 0;

  const confirmDiscard = useCallback((): boolean => {
    return !hasPending || window.confirm(t('discardConfirm'));
  }, [hasPending, t]);

  const onStart = useCallback(async () => {
    if (!confirmDiscard()) return;
    const id = await store.startNew();
    if (id) {
      selectAttempt(id);
      void refreshHistory();
    }
  }, [confirmDiscard, store, selectAttempt, refreshHistory]);

  const onSelect = useCallback(
    (id: string) => {
      if (!confirmDiscard()) return;
      selectAttempt(id);
    },
    [confirmDiscard, selectAttempt],
  );

  const onBack = useCallback(() => {
    if (!confirmDiscard()) return;
    selectAttempt(null);
    store.reset();
    void refreshHistory();
  }, [confirmDiscard, selectAttempt, store, refreshHistory]);

  const loadErrorMessage = (kind: string | null): string => {
    switch (kind) {
      case 'not-found':
        return t('notFound');
      case 'not-available':
        return t('notAvailable');
      case 'network':
        return t('loadNetwork');
      case 'server':
        return t('loadServer');
      case 'unauthorized':
        return t('sessionExpired');
      default:
        return t('loadInvalid');
    }
  };

  if (status === 'loading') {
    return <p>{t('loading')}</p>;
  }

  if (status === 'error') {
    return (
      <section className="flex max-w-md flex-col gap-3">
        <p role="alert">{t('authError')}</p>
        <button
          type="button"
          onClick={retryBootstrap}
          className="self-start border border-gray-500 px-3 py-1"
        >
          {t('retry')}
        </button>
      </section>
    );
  }

  if (status === 'unauthenticated') {
    return <p>{t('redirecting')}</p>;
  }

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p
          className="rounded border border-amber-400 bg-amber-50 p-3 text-sm"
          role="note"
        >
          {t('syntheticBanner')}
        </p>
      </header>

      {state.startError ? (
        <p role="alert" className="text-sm text-red-700">
          {loadErrorMessage(state.startError)}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          onClick={() => void onStart()}
          disabled={state.startStatus === 'starting'}
          className="border border-gray-700 bg-gray-800 px-3 py-1 text-white disabled:opacity-40"
        >
          {state.startStatus === 'starting' ? t('starting') : t('start')}
        </button>
      </div>

      {attemptId ? (
        state.load === 'loading' || state.load === 'empty' ? (
          <p>{t('loadingAttempt')}</p>
        ) : state.load === 'error' ? (
          <div className="flex flex-col gap-2">
            <p role="alert">{loadErrorMessage(state.loadError)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void store.loadAttempt(attemptId)}
                className="border border-gray-500 px-3 py-1 text-sm"
              >
                {t('retry')}
              </button>
              <button
                type="button"
                onClick={onBack}
                className="border border-gray-500 px-3 py-1 text-sm"
              >
                {t('back')}
              </button>
            </div>
          </div>
        ) : state.status === 'finalised' && state.result ? (
          <AssessmentResultView result={state.result} />
        ) : (
          <AssessmentRunner state={state} store={store} onBack={onBack} />
        )
      ) : (
        <AssessmentHistory
          locale={locale}
          status={history.status}
          items={history.items}
          activeId={attemptId}
          onSelect={onSelect}
          onRefresh={() => void refreshHistory()}
        />
      )}
    </section>
  );
}
