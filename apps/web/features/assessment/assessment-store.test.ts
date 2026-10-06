import test from 'node:test';
import assert from 'node:assert/strict';
import type { AssessmentApi, ApiOutcome } from './assessment-api.ts';
import { createAssessmentStore } from './assessment-store.ts';
import type {
  AssessmentAttemptList,
  AssessmentAttemptView,
  AssessmentResultDto,
  PublicAssessmentForm,
  ResponseEntryDto,
  SaveAnswersRequest,
} from './assessment-types.ts';

const ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'test-token';

const FORM: PublicAssessmentForm = {
  assessmentId: 'synthetic-demo',
  assessmentVersion: '1.0.0',
  formId: 'synthetic-form-1',
  formVersion: '1.0.0',
  languageScope: 'en',
  translationVersion: 'synthetic-1.0.0',
  scoringRuleVersion: '1.0.0',
  objectives: [
    { objectiveId: 'synthetic-obj-a' },
    { objectiveId: 'synthetic-obj-b' },
  ],
  items: [
    {
      itemId: 'synthetic-single',
      itemVersion: '1',
      objectiveId: 'synthetic-obj-a',
      languageScope: 'en',
      translationVersion: 'synthetic-1',
      kind: 'single-answer',
      optionIds: ['s1', 's2', 's3', 's4'],
    },
    {
      itemId: 'synthetic-multi',
      itemVersion: '1',
      objectiveId: 'synthetic-obj-a',
      languageScope: 'en',
      translationVersion: 'synthetic-1',
      kind: 'multiple-select',
      optionIds: ['s1', 's2', 's3', 's4'],
    },
    {
      itemId: 'synthetic-order',
      itemVersion: '1',
      objectiveId: 'synthetic-obj-b',
      languageScope: 'neutral',
      translationVersion: 'synthetic-1',
      kind: 'ordering',
      optionIds: ['p', 'q', 'r'],
    },
    {
      itemId: 'synthetic-numeric',
      itemVersion: '1',
      objectiveId: 'synthetic-obj-b',
      languageScope: 'neutral',
      translationVersion: 'synthetic-1',
      kind: 'numeric',
      unit: 'units',
    },
  ],
};

function makeView(
  overrides: Partial<AssessmentAttemptView> = {},
): AssessmentAttemptView {
  return {
    attemptId: ATTEMPT_ID,
    assessmentId: 'synthetic-demo',
    formId: 'synthetic-form-1',
    status: 'in_progress',
    revision: 0,
    createdAt: '2026-10-06T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z',
    finalisedAt: null,
    form: FORM,
    answers: [],
    result: null,
    ...overrides,
  };
}

function makeResult(): AssessmentResultDto {
  return {
    attemptId: ATTEMPT_ID,
    assessmentId: 'synthetic-demo',
    assessmentVersion: '1.0.0',
    formId: 'synthetic-form-1',
    formVersion: '1.0.0',
    scoringRuleVersion: '1.0.0',
    languageScope: 'en',
    translationVersion: 'synthetic-1.0.0',
    totalItems: 4,
    correct: 1,
    incorrect: 1,
    skipped: 2,
    score: 1,
    items: [],
    objectives: [
      {
        objectiveId: 'synthetic-obj-a',
        items: 2,
        correct: 1,
        incorrect: 1,
        skipped: 0,
      },
      {
        objectiveId: 'synthetic-obj-b',
        items: 2,
        correct: 0,
        incorrect: 0,
        skipped: 2,
      },
    ],
  };
}

interface Handlers {
  start: () => Promise<ApiOutcome<AssessmentAttemptView>>;
  list: () => Promise<ApiOutcome<AssessmentAttemptList>>;
  getAttempt: (id: string) => Promise<ApiOutcome<AssessmentAttemptView>>;
  saveAnswers: (
    id: string,
    body: SaveAnswersRequest,
  ) => Promise<ApiOutcome<AssessmentAttemptView>>;
  submit: (id: string) => Promise<ApiOutcome<AssessmentResultDto>>;
  result: (id: string) => Promise<ApiOutcome<AssessmentResultDto>>;
}

function network<T>(): Promise<ApiOutcome<T>> {
  return Promise.resolve({ kind: 'networkError' });
}

function makeHarness(partial: Partial<Handlers> = {}): {
  api: AssessmentApi;
  calls: Record<keyof Handlers, number>;
} {
  const calls: Record<keyof Handlers, number> = {
    start: 0,
    list: 0,
    getAttempt: 0,
    saveAnswers: 0,
    submit: 0,
    result: 0,
  };
  const handlers: Handlers = {
    start: () => network(),
    list: () => network(),
    getAttempt: () => network(),
    saveAnswers: () => network(),
    submit: () => network(),
    result: () => network(),
    ...partial,
  };
  const api: AssessmentApi = {
    start: () => {
      calls.start += 1;
      return handlers.start();
    },
    list: () => {
      calls.list += 1;
      return handlers.list();
    },
    getAttempt: (_token, id) => {
      calls.getAttempt += 1;
      return handlers.getAttempt(id);
    },
    saveAnswers: (_token, id, body) => {
      calls.saveAnswers += 1;
      return handlers.saveAnswers(id, body);
    },
    submit: (_token, id) => {
      calls.submit += 1;
      return handlers.submit(id);
    },
    result: (_token, id) => {
      calls.result += 1;
      return handlers.result(id);
    },
  };
  return { api, calls };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function storeFor(
  api: AssessmentApi,
): ReturnType<typeof createAssessmentStore> {
  return createAssessmentStore(api, () => TOKEN);
}

test('resume restores the server-persisted answers and revision', async () => {
  const { api } = makeHarness({
    getAttempt: () =>
      Promise.resolve({
        kind: 'success',
        status: 200,
        data: makeView({
          revision: 3,
          answers: [
            {
              itemId: 'synthetic-single',
              response: { kind: 'single-answer', selectedOptionId: 's3' },
            },
          ],
        }),
      }),
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);

  const state = store.getState();
  assert.equal(state.load, 'ready');
  assert.equal(state.revision, 3);
  assert.deepEqual(state.draft['synthetic-single'], {
    kind: 'single-answer',
    selectedOptionId: 's3',
  });
  assert.equal(state.editedIds.length, 0);
});

test('save sends only pending edits and clears them on success', async () => {
  const bodies: SaveAnswersRequest[] = [];
  const { api } = makeHarness({
    getAttempt: () => Promise.resolve({ kind: 'success', status: 200, data: makeView() }),
    saveAnswers: (_id, body) => {
      bodies.push(body);
      return Promise.resolve({
        kind: 'success',
        status: 200,
        data: makeView({
          revision: 1,
          answers: body.answers,
        }),
      });
    },
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);
  store.setAnswer('synthetic-single', {
    kind: 'single-answer',
    selectedOptionId: 's1',
  });
  const ok = await store.save();

  assert.equal(ok, true);
  assert.equal(bodies.length, 1);
  assert.deepEqual(bodies[0].answers, [
    {
      itemId: 'synthetic-single',
      response: { kind: 'single-answer', selectedOptionId: 's1' },
    },
  ]);
  assert.equal(store.getState().editedIds.length, 0);
  assert.equal(store.getState().revision, 1);
});

test('clearing an answered item sends a skipped response', async () => {
  const bodies: SaveAnswersRequest[] = [];
  const { api } = makeHarness({
    getAttempt: () =>
      Promise.resolve({
        kind: 'success',
        status: 200,
        data: makeView({
          revision: 2,
          answers: [
            {
              itemId: 'synthetic-single',
              response: { kind: 'single-answer', selectedOptionId: 's1' },
            },
          ],
        }),
      }),
    saveAnswers: (_id, body) => {
      bodies.push(body);
      return Promise.resolve({
        kind: 'success',
        status: 200,
        data: makeView({ revision: 3, answers: [] }),
      });
    },
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);
  store.clearAnswer('synthetic-single');
  await store.save();

  assert.deepEqual(bodies[0].answers, [
    { itemId: 'synthetic-single', response: { kind: 'skipped' } },
  ]);
});

test('a duplicate save while one is in flight does not call the API twice', async () => {
  const gate = deferred<ApiOutcome<AssessmentAttemptView>>();
  const { api, calls } = makeHarness({
    getAttempt: () => Promise.resolve({ kind: 'success', status: 200, data: makeView() }),
    saveAnswers: () => gate.promise,
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);
  store.setAnswer('synthetic-single', {
    kind: 'single-answer',
    selectedOptionId: 's1',
  });

  const first = store.save();
  const second = await store.save();
  assert.equal(second, false);
  assert.equal(calls.saveAnswers, 1);

  gate.resolve({
    kind: 'success',
    status: 200,
    data: makeView({ revision: 1, answers: [] }),
  });
  assert.equal(await first, true);
});

test('submit saves pending answers before finalising', async () => {
  const { api, calls } = makeHarness({
    getAttempt: () => Promise.resolve({ kind: 'success', status: 200, data: makeView() }),
    saveAnswers: (_id, body) =>
      Promise.resolve({
        kind: 'success',
        status: 200,
        data: makeView({ revision: 1, answers: body.answers }),
      }),
    submit: () =>
      Promise.resolve({ kind: 'success', status: 200, data: makeResult() }),
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);
  store.setAnswer('synthetic-single', {
    kind: 'single-answer',
    selectedOptionId: 's1',
  });

  const outcome = await store.submit();
  assert.equal(outcome.kind, 'finalised');
  assert.equal(calls.saveAnswers, 1);
  assert.equal(calls.submit, 1);
  assert.equal(store.getState().status, 'finalised');
});

test('submit is blocked when the pre-submit save fails', async () => {
  const { api, calls } = makeHarness({
    getAttempt: () => Promise.resolve({ kind: 'success', status: 200, data: makeView() }),
    saveAnswers: () =>
      Promise.resolve({
        kind: 'clientError',
        status: 409,
        code: 'REVISION_CONFLICT',
      }),
    submit: () =>
      Promise.resolve({ kind: 'success', status: 200, data: makeResult() }),
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);
  store.setAnswer('synthetic-single', {
    kind: 'single-answer',
    selectedOptionId: 's1',
  });

  const outcome = await store.submit();
  assert.equal(outcome.kind, 'unsaved');
  assert.equal(calls.submit, 0);
  assert.equal(store.getState().conflict, true);
});

test('a clean attempt submits without a save call', async () => {
  const { api, calls } = makeHarness({
    getAttempt: () => Promise.resolve({ kind: 'success', status: 200, data: makeView() }),
    submit: () =>
      Promise.resolve({ kind: 'success', status: 200, data: makeResult() }),
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);

  const outcome = await store.submit();
  assert.equal(outcome.kind, 'finalised');
  assert.equal(calls.saveAnswers, 0);
  assert.equal(calls.submit, 1);
});

test('a duplicate submit while one is in flight is rejected', async () => {
  const gate = deferred<ApiOutcome<AssessmentResultDto>>();
  const { api, calls } = makeHarness({
    getAttempt: () => Promise.resolve({ kind: 'success', status: 200, data: makeView() }),
    submit: () => gate.promise,
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);

  const first = store.submit();
  const second = await store.submit();
  assert.equal(second.kind, 'busy');
  assert.equal(calls.submit, 1);

  gate.resolve({ kind: 'success', status: 200, data: makeResult() });
  assert.equal((await first).kind, 'finalised');
});

test('a revision conflict keeps local edits and blocks further saves until resolved', async () => {
  const bodies: SaveAnswersRequest[] = [];
  const serverAnswers: ResponseEntryDto[] = [
    {
      itemId: 'synthetic-single',
      response: { kind: 'single-answer', selectedOptionId: 's3' },
    },
    {
      itemId: 'synthetic-multi',
      response: { kind: 'multiple-select', selectedOptionIds: ['s1'] },
    },
  ];
  let getView = makeView({
    revision: 3,
    answers: [
      {
        itemId: 'synthetic-single',
        response: { kind: 'single-answer', selectedOptionId: 's1' },
      },
    ],
  });
  let saveOutcome: ApiOutcome<AssessmentAttemptView> = {
    kind: 'clientError',
    status: 409,
    code: 'REVISION_CONFLICT',
  };
  const { api, calls } = makeHarness({
    getAttempt: () =>
      Promise.resolve({ kind: 'success', status: 200, data: getView }),
    saveAnswers: (_id, body) => {
      bodies.push(body);
      return Promise.resolve(saveOutcome);
    },
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);
  store.setAnswer('synthetic-single', {
    kind: 'single-answer',
    selectedOptionId: 's2',
  });

  assert.equal(await store.save(), false);
  assert.equal(store.getState().conflict, true);
  assert.deepEqual(store.getState().draft['synthetic-single'], {
    kind: 'single-answer',
    selectedOptionId: 's2',
  });

  // A second save is a no-op while the conflict is unresolved.
  assert.equal(await store.save(), false);
  assert.equal(calls.saveAnswers, 1);

  // Keep-local recovery adopts the fresh revision but keeps only the edit.
  getView = makeView({ revision: 4, answers: serverAnswers });
  await store.keepLocalEdits();
  assert.equal(store.getState().conflict, false);
  assert.equal(store.getState().revision, 4);
  assert.deepEqual(store.getState().draft['synthetic-single'], {
    kind: 'single-answer',
    selectedOptionId: 's2',
  });
  assert.deepEqual(store.getState().saved['synthetic-multi'], {
    kind: 'multiple-select',
    selectedOptionIds: ['s1'],
  });

  saveOutcome = {
    kind: 'success',
    status: 200,
    data: makeView({ revision: 5, answers: serverAnswers }),
  };
  await store.save();
  assert.equal(bodies[bodies.length - 1].revision, 4);
  assert.deepEqual(bodies[bodies.length - 1].answers, [
    {
      itemId: 'synthetic-single',
      response: { kind: 'single-answer', selectedOptionId: 's2' },
    },
  ]);
});

test('a finalised attempt is read-only', async () => {
  const { api, calls } = makeHarness({
    getAttempt: () =>
      Promise.resolve({
        kind: 'success',
        status: 200,
        data: makeView({
          status: 'finalised',
          finalisedAt: '2026-10-06T01:00:00.000Z',
          result: makeResult(),
        }),
      }),
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);

  assert.equal(store.getState().status, 'finalised');
  store.setAnswer('synthetic-single', {
    kind: 'single-answer',
    selectedOptionId: 's1',
  });
  assert.deepEqual(store.getState().draft, {});
  const outcome = await store.submit();
  assert.equal(outcome.kind, 'already-finalised');
  assert.equal(calls.submit, 0);
});

test('load recovers from unauthorized and not-found without inventing state', async () => {
  const unauthorized = storeFor(
    makeHarness({
      getAttempt: () => Promise.resolve({ kind: 'unauthorized' }),
    }).api,
  );
  await unauthorized.loadAttempt(ATTEMPT_ID);
  assert.equal(unauthorized.getState().load, 'error');
  assert.equal(unauthorized.getState().loadError, 'unauthorized');

  const notFound = storeFor(
    makeHarness({
      getAttempt: () =>
        Promise.resolve({
          kind: 'clientError',
          status: 404,
          code: 'ATTEMPT_NOT_FOUND',
        }),
    }).api,
  );
  await notFound.loadAttempt(ATTEMPT_ID);
  assert.equal(notFound.getState().loadError, 'not-found');
});

test('start surfaces disabled synthetic availability', async () => {
  const { api } = makeHarness({
    start: () =>
      Promise.resolve({
        kind: 'clientError',
        status: 404,
        code: 'ASSESSMENT_NOT_AVAILABLE',
      }),
  });
  const store = storeFor(api);
  const id = await store.startNew();
  assert.equal(id, null);
  assert.equal(store.getState().startError, 'not-available');
  assert.equal(store.getState().load, 'empty');
});

test('an ambiguous submit is reconciled against the server', async () => {
  let finalised = false;
  const { api, calls } = makeHarness({
    getAttempt: () =>
      Promise.resolve({
        kind: 'success',
        status: 200,
        data: finalised
          ? makeView({
              status: 'finalised',
              finalisedAt: '2026-10-06T01:00:00.000Z',
              result: makeResult(),
            })
          : makeView(),
      }),
    submit: () => Promise.resolve({ kind: 'networkError' }),
  });
  const store = storeFor(api);
  await store.loadAttempt(ATTEMPT_ID);

  const outcome = await store.submit();
  assert.equal(outcome.kind, 'error');
  assert.equal(store.getState().submitAmbiguous, true);

  // The server had actually finalised it; reconcile must confirm and load it.
  finalised = true;
  await store.reconcile();
  assert.equal(store.getState().status, 'finalised');
  assert.equal(store.getState().submitAmbiguous, false);
  assert.ok(store.getState().result);
  assert.equal(calls.submit, 1);
});
