import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  scoreAttempt,
  type KeyedFormSnapshot,
  type ResponseEntry,
} from '@sapiensmetric/assessment';
import type { AppConfig } from '../../../config/env.js';
import type { UserStore } from '../../users/user-store.js';
import { AssessmentService } from '../assessment.service.js';
import type {
  AssessmentAttemptStore,
  AttemptRecord,
  FinaliseOutcome,
  SaveAnswersOutcome,
} from '../assessment-attempt.store.js';
import { ASTRONOMY_ITEMS } from './astronomy-bank.js';

const ATTEMPT_ID = '22222222-2222-4222-8222-222222222222';
const USER = 'user-1';

function config(
  astronomyDraftEnabled: boolean,
  reviewEnabled = false,
): AppConfig {
  return {
    assessments: { syntheticEnabled: false, astronomyDraftEnabled, reviewEnabled },
  } as unknown as AppConfig;
}

/** Eligible reviewer by default; override per test via `usersWith`. */
const users: UserStore = {
  findById: async () => ({ reviewEligible: true }),
} as unknown as UserStore;

function usersWith(reviewEligible: boolean): UserStore {
  return {
    findById: async () => ({ reviewEligible }),
  } as unknown as UserStore;
}

class FakeStore implements AssessmentAttemptStore {
  records: AttemptRecord[] = [];

  async create(userId: string, snapshot: KeyedFormSnapshot): Promise<AttemptRecord> {
    const now = new Date('2026-10-09T10:00:00.000Z');
    const record: AttemptRecord = {
      id: ATTEMPT_ID,
      userId,
      snapshot,
      answers: [],
      status: 'in_progress',
      hasProgress: false,
      revision: 0,
      result: null,
      createdAt: now,
      updatedAt: now,
      finalisedAt: null,
    };
    this.records.push(record);
    return record;
  }

  async findOwned(userId: string, attemptId: string): Promise<AttemptRecord | null> {
    return this.records.find((r) => r.id === attemptId && r.userId === userId) ?? null;
  }

  async listOwned(userId: string): Promise<AttemptRecord[]> {
    return this.records.filter((r) => r.userId === userId);
  }

  async saveAnswers(
    userId: string,
    attemptId: string,
    revision: number,
    ops: ResponseEntry[],
  ): Promise<SaveAnswersOutcome> {
    void userId;
    void attemptId;
    void revision;
    void ops;
    return { status: 'ok', attempt: this.records[0] };
  }

  async finalise(_userId: string, attemptId: string): Promise<FinaliseOutcome> {
    const record = this.records.find((r) => r.id === attemptId);
    if (!record) return { status: 'not_found' };
    const responses: ResponseEntry[] = [
      {
        itemId: ASTRONOMY_ITEMS[0].itemId,
        response: {
          kind: 'single-answer',
          selectedOptionId: ASTRONOMY_ITEMS[0].correctOptionIds[0],
        },
      },
    ];
    record.answers = responses;
    record.result = scoreAttempt(record.snapshot, {
      attemptId: record.id,
      status: 'submitted',
      responses,
    });
    record.status = 'finalised';
    record.finalisedAt = new Date('2026-10-09T10:05:00.000Z');
    return { status: 'ok', attempt: record };
  }
}

function errorCode(error: unknown): string | undefined {
  const response = (error as { getResponse?: () => unknown }).getResponse?.();
  return (response as { code?: string } | undefined)?.code;
}

function errorMessage(error: unknown): string | undefined {
  const response = (error as { getResponse?: () => unknown }).getResponse?.();
  return (response as { message?: string } | undefined)?.message;
}

describe('astronomy draft gating and access (T-022)', () => {
  let store: FakeStore;

  beforeEach(() => {
    store = new FakeStore();
  });

  it('refuses to start the draft when the gate is off, identifying astronomy (not synthetic)', async () => {
    const service = new AssessmentService(config(false), store, users);
    await expect(service.startAstronomyDraft(USER)).rejects.toBeInstanceOf(NotFoundException);
    await service.startAstronomyDraft(USER).catch((e) => {
      expect(errorCode(e)).toBe('ASSESSMENT_NOT_AVAILABLE');
      expect(errorMessage(e)).toMatch(/Astronomy draft/);
      expect(errorMessage(e)).not.toMatch(/Synthetic/);
    });
  });

  it('identifies the synthetic module when synthetic is disabled', async () => {
    const service = new AssessmentService(config(false), store, users);
    await service.start(USER).catch((e) => {
      expect(errorCode(e)).toBe('ASSESSMENT_NOT_AVAILABLE');
      expect(errorMessage(e)).toMatch(/Synthetic assessment/);
      expect(errorMessage(e)).not.toMatch(/Astronomy/);
    });
  });

  it('starts an astronomy-draft attempt when the gate is on', async () => {
    const service = new AssessmentService(config(true), store, users);
    const view = await service.startAstronomyDraft(USER);
    expect(view.assessmentId).toBe('astronomy-draft');
    expect(view.form.items).toHaveLength(25);
    // The public view must not leak keys.
    expect(JSON.stringify(view)).not.toContain('correctOptionId');
  });

  it('serves localized content without keys for an owned attempt', async () => {
    const service = new AssessmentService(config(true), store, users);
    await service.startAstronomyDraft(USER);
    const content = await service.content(USER, ATTEMPT_ID, 'lt');
    expect(content.locale).toBe('lt');
    expect(content.items[0].prompt).toBe(ASTRONOMY_ITEMS[0].prompt.lt);
    expect(JSON.stringify(content)).not.toContain('correctOptionId');
  });

  it('refuses feedback before submission', async () => {
    const service = new AssessmentService(config(true), store, users);
    await service.startAstronomyDraft(USER);
    await service.feedback(USER, ATTEMPT_ID, 'en').then(
      () => {
        throw new Error('feedback should not be available before submission');
      },
      (error) => {
        expect(error).toBeInstanceOf(ConflictException);
        expect(errorCode(error)).toBe('ATTEMPT_NOT_FINALISED');
      },
    );
  });

  it('serves feedback after submission, with explanations and sources', async () => {
    const service = new AssessmentService(config(true), store, users);
    await service.startAstronomyDraft(USER);
    await store.finalise(USER, ATTEMPT_ID);
    const feedback = await service.feedback(USER, ATTEMPT_ID, 'en');
    expect(feedback.totals.correct).toBe(1);
    expect(feedback.items[0].explanation).toBe(ASTRONOMY_ITEMS[0].explanation.en);
    expect(feedback.items[0].sources.length).toBeGreaterThan(0);
  });
});

describe('closed-review eligibility (T-023)', () => {
  let store: FakeStore;

  beforeEach(() => {
    store = new FakeStore();
  });

  it('allows an explicitly authorised reviewer when the review capability is on', async () => {
    const service = new AssessmentService(
      config(false, true),
      store,
      usersWith(true),
    );
    const view = await service.startAstronomyDraft(USER);
    expect(view.assessmentId).toBe('astronomy-draft');
    expect(view.form.items).toHaveLength(25);
  });

  it('refuses an unauthorised account with a distinct 403 (not "not available")', async () => {
    const service = new AssessmentService(
      config(false, true),
      store,
      usersWith(false),
    );
    await service.startAstronomyDraft(USER).then(
      () => {
        throw new Error('unauthorised review must be refused');
      },
      (error) => {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(errorCode(error)).toBe('REVIEW_NOT_AUTHORISED');
      },
    );
  });

  it('still refuses when neither the dev gate nor the review capability is on', async () => {
    const service = new AssessmentService(
      config(false, false),
      store,
      usersWith(true),
    );
    await service.startAstronomyDraft(USER).catch((e) => {
      expect(errorCode(e)).toBe('ASSESSMENT_NOT_AVAILABLE');
    });
  });

  it('reports capabilities per account: eligible reviewer sees the draft, others do not', async () => {
    const eligible = new AssessmentService(config(false, true), store, usersWith(true));
    const other = new AssessmentService(config(false, true), store, usersWith(false));
    expect(await eligible.capabilities(USER)).toEqual({
      synthetic: false,
      astronomyDraft: true,
    });
    expect(await other.capabilities(USER)).toEqual({
      synthetic: false,
      astronomyDraft: false,
    });
  });
});
