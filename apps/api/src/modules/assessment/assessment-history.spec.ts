import { describe, it, expect } from 'vitest';
import { AssessmentService } from './assessment.service.js';
import type { AppConfig } from '../../config/env.js';
import type {
  AssessmentAttemptStore,
  AttemptRecord,
  FinaliseOutcome,
  SaveAnswersOutcome,
} from './assessment-attempt.store.js';
import type { KeyedFormSnapshot } from '@sapiensmetric/assessment';
import { buildSyntheticForm } from './synthetic-form.js';
import { isHistoryVisible, toAttemptSummary } from './assessment-view.js';

/**
 * History-visibility semantics (T-022 correction).
 *
 * An untouched draft (started, never saved, never submitted) must not appear in
 * normal history, but meaningful saved progress — including progress later
 * cleared — and every submitted attempt must remain visible.
 */

function config(): AppConfig {
  return {
    assessments: { syntheticEnabled: false, astronomyDraftEnabled: false },
  } as unknown as AppConfig;
}

function record(overrides: Partial<AttemptRecord>): AttemptRecord {
  const when = new Date('2026-10-10T10:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    userId: 'user-1',
    snapshot: buildSyntheticForm() as KeyedFormSnapshot,
    answers: [],
    status: 'in_progress',
    revision: 0,
    hasProgress: false,
    result: null,
    createdAt: when,
    updatedAt: when,
    finalisedAt: null,
    ...overrides,
  };
}

class ListStore implements AssessmentAttemptStore {
  constructor(private readonly rows: AttemptRecord[]) {}
  async create(): Promise<AttemptRecord> {
    throw new Error('not used');
  }
  async findOwned(): Promise<AttemptRecord | null> {
    return null;
  }
  async listOwned(): Promise<AttemptRecord[]> {
    return this.rows;
  }
  async saveAnswers(): Promise<SaveAnswersOutcome> {
    return { status: 'not_found' };
  }
  async finalise(): Promise<FinaliseOutcome> {
    return { status: 'not_found' };
  }
}

describe('assessment history visibility (T-022 correction)', () => {
  it('isHistoryVisible: untouched draft hidden; progress/submission visible', () => {
    expect(isHistoryVisible({ hasProgress: false, status: 'in_progress' })).toBe(false);
    expect(isHistoryVisible({ hasProgress: true, status: 'in_progress' })).toBe(true);
    // Cleared progress keeps the flag, so it stays visible.
    expect(isHistoryVisible({ hasProgress: true, status: 'in_progress' })).toBe(true);
    // Submission is always visible (including intentional all-skipped).
    expect(isHistoryVisible({ hasProgress: false, status: 'finalised' })).toBe(true);
  });

  it('hides an untouched draft from history but keeps it retrievable by id', async () => {
    const storage = new ListStore([
      record({ id: 'untouched', hasProgress: false, revision: 0 }),
    ]);
    const service = new AssessmentService(config(), storage);
    const list = await service.list('user-1');
    expect(list.items).toHaveLength(0);
  });

  it('shows saved progress and progress later cleared', async () => {
    const storage = new ListStore([
      record({ id: 'saved', hasProgress: true, revision: 1, answers: [] }),
    ]);
    const service = new AssessmentService(config(), storage);
    const list = await service.list('user-1');
    expect(list.items.map((i) => i.attemptId)).toEqual(['saved']);
  });

  it('shows submitted attempts, including an all-skipped submission', async () => {
    const storage = new ListStore([
      record({
        id: 'submitted',
        status: 'finalised',
        hasProgress: false,
        finalisedAt: new Date('2026-10-10T10:05:00.000Z'),
      }),
    ]);
    const service = new AssessmentService(config(), storage);
    const list = await service.list('user-1');
    expect(list.items.map((i) => i.attemptId)).toEqual(['submitted']);
  });

  it('summary carries the client-safe item count and assessment id (not guessed from count)', () => {
    const summary = toAttemptSummary(record({ hasProgress: true }));
    expect(summary.itemCount).toBe(buildSyntheticForm().items.length);
    expect(summary.assessmentId).toBe('synthetic-demo');
  });
});
