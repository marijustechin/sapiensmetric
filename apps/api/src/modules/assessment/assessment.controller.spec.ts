import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import { AssessmentController } from './assessment.controller.js';
import { AssessmentService } from './assessment.service.js';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import {
  ASSESSMENT_ATTEMPT_STORE,
  applySaveOps,
  type AssessmentAttemptStore,
  type AttemptRecord,
  type FinaliseOutcome,
  type SaveAnswersOutcome,
} from './assessment-attempt.store.js';
import type { KeyedFormSnapshot } from '@sapiensmetric/assessment';
import { buildSyntheticForm } from './synthetic-form.js';
import { toAttemptView } from './assessment-view.js';

/**
 * HTTP/controller-boundary regression for duplicate answer entries
 * (repo audit 2026-10-09).
 *
 * `docs/assessments.md` guarantees a malformed answer payload — explicitly
 * including duplicate entries — is rejected as `400 INVALID_ANSWERS`. This test
 * drives the real controller (through Fastify HTTP) with the real
 * `AssessmentService` and an in-memory store, so it exercises the exact
 * validation boundary: the controller parses the body before any persistence or
 * ownership lookup, so a duplicate payload must not reach the store at all.
 *
 * Docker-free (no MySQL); it complements the contract-level and DB-integration
 * suites.
 */

const USER = 'user-1';
const ATTEMPT = '11111111-1111-4111-8111-111111111111';
const ORIGIN = 'http://localhost:3333';
const SECRET = 'test-secret-that-is-definitely-long-enough-123456';

function testConfig(): AppConfig {
  return {
    api: { port: 3000 },
    db: { host: '127.0.0.1', port: 3307, database: 'd', username: 'u', password: 'p' },
    cors: { origin: ORIGIN },
    jwt: { secret: SECRET, accessTokenTtlSeconds: 900 },
    auth: {
      refreshSessionTtlMs: 30 * 24 * 60 * 60 * 1000,
      refreshSessionTtlSeconds: 30 * 24 * 60 * 60,
      cookieSecure: false,
    },
    mail: {
      host: '127.0.0.1',
      port: 1025,
      secure: false,
      user: 'u',
      password: 'p',
      from: 'no-reply@example.test',
      testRecipient: null,
    },
    tokens: { verificationTtlSeconds: 86400, passwordResetTtlSeconds: 1800 },
    publicAppUrl: ORIGIN,
    assessments: { syntheticEnabled: false },
    google: { clientId: null, clientSecret: null, redirectUri: null, enabled: false },
  };
}

function seedRecord(snapshot: KeyedFormSnapshot): AttemptRecord {
  const when = new Date('2026-10-09T10:00:00.000Z');
  return {
    id: ATTEMPT,
    userId: USER,
    snapshot,
    answers: [
      {
        itemId: 'synthetic-single',
        response: { kind: 'single-answer', selectedOptionId: 's3' },
      },
    ],
    status: 'in_progress',
    revision: 4,
    result: null,
    createdAt: when,
    updatedAt: when,
    finalisedAt: null,
  };
}

/** In-memory store that records whether persistence happened. */
class InMemoryAssessmentStore implements AssessmentAttemptStore {
  calls = { create: 0, findOwned: 0, listOwned: 0, saveAnswers: 0, finalise: 0 };

  constructor(public record: AttemptRecord) {}

  async create(): Promise<AttemptRecord> {
    this.calls.create += 1;
    throw new Error('create not expected in this test');
  }

  async findOwned(userId: string, attemptId: string): Promise<AttemptRecord | null> {
    this.calls.findOwned += 1;
    if (userId !== this.record.userId || attemptId !== this.record.id) return null;
    return { ...this.record };
  }

  async listOwned(): Promise<AttemptRecord[]> {
    this.calls.listOwned += 1;
    return [{ ...this.record }];
  }

  async saveAnswers(
    userId: string,
    attemptId: string,
    revision: number,
    ops: Parameters<AssessmentAttemptStore['saveAnswers']>[3],
  ): Promise<SaveAnswersOutcome> {
    this.calls.saveAnswers += 1;
    if (userId !== this.record.userId || attemptId !== this.record.id) {
      return { status: 'not_found' };
    }
    if (this.record.status === 'finalised') return { status: 'finalised' };
    if (this.record.revision !== revision) {
      return { status: 'conflict', currentRevision: this.record.revision };
    }
    this.record = {
      ...this.record,
      answers: applySaveOps(this.record.answers, ops),
      revision: this.record.revision + 1,
      updatedAt: new Date('2026-10-09T10:05:00.000Z'),
    };
    return { status: 'ok', attempt: { ...this.record } };
  }

  async finalise(): Promise<FinaliseOutcome> {
    this.calls.finalise += 1;
    throw new Error('finalise not expected in this test');
  }
}

async function buildHarness(record: AttemptRecord) {
  const store = new InMemoryAssessmentStore(record);
  const moduleRef = await Test.createTestingModule({
    controllers: [AssessmentController],
    providers: [
      AssessmentService,
      { provide: ASSESSMENT_ATTEMPT_STORE, useValue: store },
      { provide: APP_CONFIG, useValue: testConfig() },
    ],
  })
    .overrideGuard(AccessTokenGuard)
    .useValue({
      canActivate: (context: import('@nestjs/common').ExecutionContext) => {
        const request = context.switchToHttp().getRequest<{ userId: string }>();
        request.userId = USER;
        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  app.enableCors({ origin: ORIGIN, credentials: true });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return { app, store };
}

function instance(app: NestFastifyApplication) {
  return app.getHttpAdapter().getInstance();
}

describe('assessment answers — controller validation boundary', () => {
  let snapshot: KeyedFormSnapshot;
  let fixture: AttemptRecord;
  let app: NestFastifyApplication;
  let store: InMemoryAssessmentStore;

  beforeEach(async () => {
    snapshot = buildSyntheticForm();
    fixture = seedRecord(snapshot);
    const harness = await buildHarness(fixture);
    app = harness.app;
    store = harness.store;
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects duplicate itemId entries with 400 INVALID_ANSWERS and no persistence', async () => {
    const beforeAnswers = JSON.stringify(fixture.answers);
    const res = await instance(app).inject({
      method: 'PUT',
      url: `/assessments/attempts/${ATTEMPT}/answers`,
      payload: {
        revision: fixture.revision,
        answers: [
          {
            itemId: 'synthetic-single',
            response: { kind: 'single-answer', selectedOptionId: 's3' },
          },
          {
            itemId: 'synthetic-single',
            response: { kind: 'single-answer', selectedOptionId: 's1' },
          },
        ],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      statusCode: 400,
      code: 'INVALID_ANSWERS',
    });

    // The payload is rejected before any store interaction: no ownership lookup
    // and no save. The seeded answers and revision are therefore unchanged.
    expect(store.calls.saveAnswers).toBe(0);
    expect(store.calls.findOwned).toBe(0);
    expect(store.calls.create).toBe(0);
    expect(store.calls.finalise).toBe(0);
    expect(store.calls.listOwned).toBe(0);
    expect(store.record.revision).toBe(fixture.revision);
    expect(JSON.stringify(store.record.answers)).toBe(beforeAnswers);
  });

  it('rejects a malformed payload with 400 INVALID_ANSWERS before any store interaction', async () => {
    const res = await instance(app).inject({
      method: 'PUT',
      url: `/assessments/attempts/${ATTEMPT}/answers`,
      payload: {
        revision: fixture.revision,
        // Missing `response` — fails the request schema at the controller.
        answers: [{ itemId: 'synthetic-single' }],
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'INVALID_ANSWERS' });
    expect(store.calls.saveAnswers).toBe(0);
    expect(store.calls.findOwned).toBe(0);
  });

  it('persists a valid unique-item payload and advances the revision', async () => {
    const res = await instance(app).inject({
      method: 'PUT',
      url: `/assessments/attempts/${ATTEMPT}/answers`,
      payload: {
        revision: fixture.revision,
        answers: [
          {
            itemId: 'synthetic-multi',
            response: { kind: 'multiple-select', selectedOptionIds: ['s1', 's4'] },
          },
          { itemId: 'synthetic-numeric', response: { kind: 'numeric', value: 42 } },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(store.calls.saveAnswers).toBe(1);
    expect(store.calls.findOwned).toBe(1);

    const body = res.json();
    expect(body.revision).toBe(fixture.revision + 1);
    const persisted = store.record;
    expect(persisted.revision).toBe(fixture.revision + 1);
    expect(persisted.answers).toEqual(
      expect.arrayContaining([
        {
          itemId: 'synthetic-multi',
          response: { kind: 'multiple-select', selectedOptionIds: ['s1', 's4'] },
        },
        { itemId: 'synthetic-numeric', response: { kind: 'numeric', value: 42 } },
      ]),
    );
    // The view is the client-safe projection (option IDs only, no keys).
    expect(toAttemptView(persisted).answers).toEqual(persisted.answers);
  });
});
