/**
 * Assessment runner store (T-019).
 *
 * A framework-free observable store that owns the client-side attempt state and
 * mediates every server call. It is intentionally decoupled from React (bound in
 * the widget via `useSyncExternalStore`) and from `features/auth` (the access
 * token is injected), so the risky behaviours — save/clear/resume,
 * save-before-submit, revision conflicts, duplicate in-flight actions, finalised
 * read-only state, and access/error recovery — can be unit-tested with a fake
 * API.
 *
 * The server is authoritative: this store never scores, never holds keys, and
 * never invents results. It tracks which items the participant actually edited
 * so conflict recovery can re-apply only those edits (never silently reverting
 * unrelated server changes).
 */

import type { AssessmentApi, ApiOutcome } from './assessment-api';
import {
  pendingEntries,
  skippedResponse,
  toDraft,
  type AnswerDraft,
} from './assessment-answers.ts';
import type {
  AssessmentAttemptStatus,
  AssessmentAttemptView,
  AssessmentResultDto,
  ItemResponseDto,
  PublicAssessmentForm,
} from './assessment-types';

export type LoadErrorKind =
  | 'unauthorized'
  | 'not-found'
  | 'not-available'
  | 'invalid'
  | 'network'
  | 'server';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
export type SubmitStatus = 'idle' | 'submitting' | 'error';

export interface RunnerState {
  load: 'empty' | 'loading' | 'ready' | 'error';
  loadError: LoadErrorKind | null;
  attemptId: string | null;
  form: PublicAssessmentForm | null;
  status: AssessmentAttemptStatus | null;
  revision: number;
  draft: AnswerDraft;
  saved: AnswerDraft;
  /** Item IDs the participant edited since the last successful save. */
  editedIds: string[];
  saveStatus: SaveStatus;
  saveError: LoadErrorKind | null;
  /** True after `REVISION_CONFLICT`; recovery is required before saving again. */
  conflict: boolean;
  submitStatus: SubmitStatus;
  /** Network/ambiguous submit failures must not be blindly retried. */
  submitAmbiguous: boolean;
  submitError: LoadErrorKind | null;
  result: AssessmentResultDto | null;
  /** True after a 401: the session must be re-established (keeps local edits). */
  sessionExpired: boolean;
  /** Starting a new attempt (explicit action only). */
  startStatus: 'idle' | 'starting';
  startError: LoadErrorKind | null;
}

export type SubmitOutcome =
  | { kind: 'finalised'; result: AssessmentResultDto }
  | { kind: 'already-finalised'; result: AssessmentResultDto | null }
  | { kind: 'unsaved' }
  | { kind: 'busy' }
  | { kind: 'invalid-state' }
  | { kind: 'error'; error: LoadErrorKind };

export interface AssessmentStore {
  getState(): RunnerState;
  subscribe(listener: () => void): () => void;
  /** Load (resume/view) an owned attempt. */
  loadAttempt(attemptId: string): Promise<void>;
  /** Start a new attempt via an explicit action; returns its id or null. */
  startNew(): Promise<string | null>;
  setAnswer(itemId: string, response: ItemResponseDto): void;
  clearAnswer(itemId: string): void;
  /** Persist pending answers. Resolves true only when the server accepted them. */
  save(): Promise<boolean>;
  /** Save any pending answers, then finalise. */
  submit(): Promise<SubmitOutcome>;
  /** Discard local edits and re-read the server state (conflict recovery). */
  reloadFromServer(): Promise<void>;
  /**
   * Conflict recovery that keeps the participant's own edits: re-read the
   * server, then re-apply only the edited items on top of it (no silent revert).
   */
  keepLocalEdits(): Promise<void>;
  /** Check the server after an ambiguous submit; loads the result if finalised. */
  reconcile(): Promise<void>;
  /** Leave the current attempt without touching the server. */
  reset(): void;
}

export function initialRunnerState(): RunnerState {
  return {
    load: 'empty',
    loadError: null,
    attemptId: null,
    form: null,
    status: null,
    revision: 0,
    draft: {},
    saved: {},
    editedIds: [],
    saveStatus: 'idle',
    saveError: null,
    conflict: false,
    submitStatus: 'idle',
    submitAmbiguous: false,
    submitError: null,
    result: null,
    sessionExpired: false,
    startStatus: 'idle',
    startError: null,
  };
}

function mapLoadError(outcome: ApiOutcome<unknown>): LoadErrorKind | null {
  switch (outcome.kind) {
    case 'unauthorized':
      return 'unauthorized';
    case 'networkError':
      return 'network';
    case 'serverError':
      return 'server';
    case 'clientError':
      if (outcome.code === 'ATTEMPT_NOT_FOUND') return 'not-found';
      if (outcome.code === 'ASSESSMENT_NOT_AVAILABLE') return 'not-available';
      return 'invalid';
    default:
      return null;
  }
}

export function createAssessmentStore(
  api: AssessmentApi,
  getAccessToken: () => string | null,
): AssessmentStore {
  let state: RunnerState = initialRunnerState();
  const listeners = new Set<() => void>();
  // Drops stale load responses when the selection changes, and coalesces a
  // duplicate load of the same attempt (e.g. React StrictMode double-mount).
  let loadSeq = 0;

  function emit(): void {
    for (const listener of listeners) listener();
  }

  function patch(partial: Partial<RunnerState>): void {
    state = { ...state, ...partial };
    emit();
  }

  function hydrate(view: AssessmentAttemptView): void {
    const saved = toDraft(view.answers);
    patch({
      load: 'ready',
      loadError: null,
      attemptId: view.attemptId,
      form: view.form,
      status: view.status,
      revision: view.revision,
      draft: saved,
      saved,
      editedIds: [],
      result: view.result,
      conflict: false,
      saveStatus: 'idle',
      saveError: null,
      submitStatus: 'idle',
      submitAmbiguous: false,
      submitError: null,
      sessionExpired: false,
      startError: null,
    });
  }

  function isBusy(): boolean {
    return (
      state.load === 'loading' ||
      state.saveStatus === 'saving' ||
      state.submitStatus === 'submitting' ||
      state.startStatus === 'starting'
    );
  }

  function requireToken(): string | null {
    const token = getAccessToken();
    if (!token) {
      patch({ sessionExpired: true });
      return null;
    }
    return token;
  }

  async function loadAttempt(attemptId: string): Promise<void> {
    if (state.load === 'loading' && state.attemptId === attemptId) return;
    const seq = ++loadSeq;
    patch({
      load: 'loading',
      loadError: null,
      attemptId,
      sessionExpired: false,
    });
    const token = requireToken();
    if (!token) {
      if (seq === loadSeq) patch({ load: 'error', loadError: 'unauthorized' });
      return;
    }
    const outcome = await api.getAttempt(token, attemptId);
    if (seq !== loadSeq) return; // superseded by a newer load
    if (outcome.kind === 'success') {
      hydrate(outcome.data);
      return;
    }
    patch({ load: 'error', loadError: mapLoadError(outcome) });
  }

  async function startNew(): Promise<string | null> {
    if (isBusy()) return null;
    patch({ startStatus: 'starting', startError: null });
    const token = requireToken();
    if (!token) {
      patch({ startStatus: 'idle', startError: 'unauthorized' });
      return null;
    }
    const outcome = await api.start(token);
    if (outcome.kind === 'success') {
      patch({ startStatus: 'idle', startError: null });
      hydrate(outcome.data);
      return outcome.data.attemptId;
    }
    patch({ startStatus: 'idle', startError: mapLoadError(outcome) });
    return null;
  }

  function setAnswer(itemId: string, response: ItemResponseDto): void {
    if (state.status === 'finalised' || state.conflict) return;
    const editedIds = state.editedIds.includes(itemId)
      ? state.editedIds
      : [...state.editedIds, itemId];
    patch({
      draft: { ...state.draft, [itemId]: response },
      editedIds,
      saveStatus: state.saveStatus === 'saved' ? 'idle' : state.saveStatus,
    });
  }

  function clearAnswer(itemId: string): void {
    if (state.status === 'finalised' || state.conflict) return;
    const editedIds = state.editedIds.includes(itemId)
      ? state.editedIds
      : [...state.editedIds, itemId];
    patch({
      draft: { ...state.draft, [itemId]: skippedResponse() },
      editedIds,
      saveStatus: state.saveStatus === 'saved' ? 'idle' : state.saveStatus,
    });
  }

  async function save(): Promise<boolean> {
    // Duplicate in-flight guard: a second save while one is running is a no-op.
    if (state.saveStatus === 'saving' || state.submitStatus === 'submitting') {
      return false;
    }
    if (state.load !== 'ready' || !state.attemptId) return false;
    if (state.status === 'finalised') return false;
    if (state.conflict) return false;

    const entries = pendingEntries(state.draft, state.saved, state.editedIds);
    if (entries.length === 0) {
      patch({ saveStatus: 'saved', saveError: null });
      return true;
    }

    const attemptId = state.attemptId;
    const token = requireToken();
    if (!token) {
      patch({ saveStatus: 'error', saveError: 'unauthorized' });
      return false;
    }

    patch({ saveStatus: 'saving', saveError: null });
    const outcome = await api.saveAnswers(token, attemptId, {
      revision: state.revision,
      answers: entries,
    });

    if (outcome.kind === 'success') {
      const saved = toDraft(outcome.data.answers);
      patch({
        draft: saved,
        saved,
        editedIds: [],
        revision: outcome.data.revision,
        status: outcome.data.status,
        result: outcome.data.result,
        saveStatus: 'saved',
        saveError: null,
        conflict: false,
      });
      return true;
    }

    if (outcome.kind === 'unauthorized') {
      patch({
        saveStatus: 'error',
        saveError: 'unauthorized',
        sessionExpired: true,
      });
      return false;
    }

    if (outcome.kind === 'clientError' && outcome.code === 'REVISION_CONFLICT') {
      // Never overwrite newer server answers: keep the local draft and require an
      // explicit recovery decision.
      patch({ saveStatus: 'conflict', saveError: null, conflict: true });
      return false;
    }

    if (outcome.kind === 'clientError' && outcome.code === 'ATTEMPT_FINALISED') {
      await reloadFromServer();
      return false;
    }

    patch({
      saveStatus: 'error',
      saveError:
        outcome.kind === 'networkError'
          ? 'network'
          : outcome.kind === 'serverError'
            ? 'server'
            : 'invalid',
    });
    return false;
  }

  async function submit(): Promise<SubmitOutcome> {
    if (state.submitStatus === 'submitting' || state.saveStatus === 'saving') {
      return { kind: 'busy' };
    }
    if (state.load !== 'ready' || !state.attemptId) {
      return { kind: 'invalid-state' };
    }
    if (state.status === 'finalised') {
      return { kind: 'already-finalised', result: state.result };
    }
    if (state.conflict) return { kind: 'unsaved' };

    // Save-before-submit: the latest intended answers must be accepted by the
    // server before finalisation. If saving fails (conflict/error), do not
    // submit a stale set.
    if (pendingEntries(state.draft, state.saved, state.editedIds).length > 0) {
      const saved = await save();
      if (
        !saved ||
        pendingEntries(state.draft, state.saved, state.editedIds).length > 0
      ) {
        return { kind: 'unsaved' };
      }
    }

    const attemptId = state.attemptId;
    const token = requireToken();
    if (!token) return { kind: 'error', error: 'unauthorized' };

    patch({ submitStatus: 'submitting', submitAmbiguous: false, submitError: null });
    const outcome = await api.submit(token, attemptId);

    if (outcome.kind === 'success') {
      patch({
        status: 'finalised',
        result: outcome.data,
        submitStatus: 'idle',
        submitAmbiguous: false,
        submitError: null,
      });
      return { kind: 'finalised', result: outcome.data };
    }

    if (outcome.kind === 'unauthorized') {
      patch({
        submitStatus: 'error',
        submitError: 'unauthorized',
        sessionExpired: true,
      });
      return { kind: 'error', error: 'unauthorized' };
    }

    if (outcome.kind === 'clientError' && outcome.code === 'ATTEMPT_FINALISED') {
      // Already finalised elsewhere; reconcile to fetch the stored result.
      await reloadFromServer();
      return { kind: 'already-finalised', result: state.result };
    }

    if (outcome.kind === 'networkError') {
      // Ambiguous: the request may have finalised. Do not auto-retry; require a
      // server check (reconcile) before another attempt.
      patch({
        submitStatus: 'error',
        submitAmbiguous: true,
        submitError: 'network',
      });
      return { kind: 'error', error: 'network' };
    }

    const error: LoadErrorKind =
      outcome.kind === 'serverError' ? 'server' : 'invalid';
    patch({ submitStatus: 'error', submitAmbiguous: false, submitError: error });
    return { kind: 'error', error };
  }

  async function reloadFromServer(): Promise<void> {
    if (state.attemptId) {
      await loadAttempt(state.attemptId);
    }
  }

  async function keepLocalEdits(): Promise<void> {
    const attemptId = state.attemptId;
    if (!attemptId) return;
    const token = requireToken();
    if (!token) return;
    const outcome = await api.getAttempt(token, attemptId);
    if (outcome.kind !== 'success') {
      if (outcome.kind === 'unauthorized') patch({ sessionExpired: true });
      return;
    }
    // Adopt the fresh server state, then re-apply only the participant's own
    // edited items so unrelated server changes are preserved.
    const saved = toDraft(outcome.data.answers);
    const draft: AnswerDraft = { ...saved };
    for (const itemId of state.editedIds) {
      if (state.draft[itemId]) draft[itemId] = state.draft[itemId];
    }
    patch({
      form: outcome.data.form,
      status: outcome.data.status,
      revision: outcome.data.revision,
      draft,
      saved,
      result: outcome.data.result,
      conflict: false,
      saveStatus: 'idle',
      saveError: null,
    });
  }

  async function reconcile(): Promise<void> {
    if (!state.attemptId) return;
    const token = requireToken();
    if (!token) return;
    const outcome = await api.getAttempt(token, state.attemptId);
    if (outcome.kind === 'success') {
      hydrate(outcome.data);
      patch({ submitStatus: 'idle', submitAmbiguous: false, submitError: null });
    } else if (outcome.kind === 'networkError') {
      patch({ submitAmbiguous: true, submitError: 'network' });
    } else if (outcome.kind === 'unauthorized') {
      patch({ sessionExpired: true });
    }
  }

  function reset(): void {
    loadSeq += 1;
    state = initialRunnerState();
    emit();
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    loadAttempt,
    startNew,
    setAnswer,
    clearAnswer,
    save,
    submit,
    reloadFromServer,
    keepLocalEdits,
    reconcile,
    reset,
  };
}
