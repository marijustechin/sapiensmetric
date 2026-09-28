import { describe, it, expect } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { AppConfig } from '../../config/env.js';
import { AssessmentService } from './assessment.service.js';
import { buildSyntheticForm } from './synthetic-form.js';
import type {
  AssessmentAttemptStore,
  AttemptRecord,
  FinaliseOutcome,
  SaveAnswersOutcome,
} from './assessment-attempt.store.js';

function configWith(syntheticEnabled: boolean): AppConfig {
  return { assessments: { syntheticEnabled } } as unknown as AppConfig;
}

function attemptRecord(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  const when = new Date('2026-01-01T10:00:00.000Z');
  return {
    id: '11111111-1111-1111-1111-111111111111',
    userId: 'user-1',
    snapshot: buildSyntheticForm(),
    answers: [],
    status: 'in_progress',
    revision: 0,
    result: null,
    createdAt: when,
    updatedAt: when,
    finalisedAt: null,
    ...overrides,
  };
}

class StubStore implements AssessmentAttemptStore {
  createResult: AttemptRecord = attemptRecord();
  findResult: AttemptRecord | null = attemptRecord();
  listResult: AttemptRecord[] = [attemptRecord()];
  saveResult: SaveAnswersOutcome = { status: 'ok', attempt: attemptRecord() };
  finaliseResult: FinaliseOutcome = { status: 'not_found' };

  async create(): Promise<AttemptRecord> {
    return this.createResult;
  }
  async findOwned(): Promise<AttemptRecord | null> {
    return this.findResult;
  }
  async listOwned(): Promise<AttemptRecord[]> {
    return this.listResult;
  }
  async saveAnswers(): Promise<SaveAnswersOutcome> {
    return this.saveResult;
  }
  async finalise(): Promise<FinaliseOutcome> {
    return this.finaliseResult;
  }
}

describe('AssessmentService — availability', () => {
  it('refuses to start when synthetic content is disabled', async () => {
    const service = new AssessmentService(configWith(false), new StubStore());
    await expect(service.start('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('starts an attempt and returns a public form without keys', async () => {
    const service = new AssessmentService(configWith(true), new StubStore());
    const view = await service.start('user-1');
    expect(view.form.items).toHaveLength(4);
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain('correctOptionId');
    expect(serialized).not.toContain('acceptedValue');
  });
});

describe('AssessmentService — saves and validation', () => {
  it('rejects malformed answers before persisting', async () => {
    const store = new StubStore();
    const service = new AssessmentService(configWith(true), store);
    await expect(
      service.saveAnswers('user-1', 'attempt-1', 0, [
        {
          itemId: 'synthetic-single',
          response: { kind: 'single-answer', selectedOptionId: 'nope' },
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects saves to a finalised attempt', async () => {
    const store = new StubStore();
    store.findResult = attemptRecord({ status: 'finalised' });
    const service = new AssessmentService(configWith(true), store);
    await expect(
      service.saveAnswers('user-1', 'attempt-1', 0, []),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('surfaces a revision conflict', async () => {
    const store = new StubStore();
    store.saveResult = { status: 'conflict', currentRevision: 3 };
    const service = new AssessmentService(configWith(true), store);
    await expect(
      service.saveAnswers('user-1', 'attempt-1', 2, []),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('hides attempts owned by another user (404)', async () => {
    const store = new StubStore();
    store.findResult = null;
    const service = new AssessmentService(configWith(true), store);
    await expect(service.get('user-2', 'attempt-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AssessmentService — submission', () => {
  it('returns the stored result when already finalised (idempotent)', async () => {
    const store = new StubStore();
    const result = {
      attemptId: '11111111-1111-1111-1111-111111111111',
      assessmentId: 'synthetic-demo',
      assessmentVersion: '1.0.0',
      formId: 'synthetic-form-1',
      formVersion: '1.0.0',
      scoringRuleVersion: '1.0.0',
      languageScope: 'en' as const,
      translationVersion: 'synthetic-1.0.0',
      totalItems: 4,
      correct: 4,
      incorrect: 0,
      skipped: 0,
      score: 4,
      items: [],
      objectives: [],
    };
    store.finaliseResult = {
      status: 'already',
      attempt: attemptRecord({ status: 'finalised', result }),
    };
    const service = new AssessmentService(configWith(true), store);
    await expect(service.submit('user-1', 'attempt-1')).resolves.toEqual(result);
  });

  it('refuses to return a result for an unfinalised attempt', async () => {
    const service = new AssessmentService(configWith(true), new StubStore());
    await expect(
      service.result('user-1', 'attempt-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
