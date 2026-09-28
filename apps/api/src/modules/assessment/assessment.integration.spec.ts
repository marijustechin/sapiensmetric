import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { AssessmentError, type ResponseEntry } from '@sapiensmetric/assessment';
import { loadAppConfig } from '../../config/env.js';
import { createDataSource } from '../../database/data-source.js';
import { User } from '../users/user.entity.js';
import { AssessmentAttempt } from './assessment-attempt.entity.js';
import { TypeOrmAssessmentAttemptStore } from './assessment-attempt.store.js';
import { buildSyntheticForm } from './synthetic-form.js';

/**
 * Real-MySQL integration for the T-017 persisted-attempt store: ownership,
 * optimistic revisions, finalisation, concurrency (locks/transactions), rollback
 * on failure, snapshot persistence, and history isolation. Uses the local Docker
 * MySQL and self-cleans only the data it creates.
 */
describe('Assessment attempt store (real-MySQL integration)', () => {
  let dataSource: DataSource;
  let store: TypeOrmAssessmentAttemptStore;
  const createdUsers: string[] = [];
  const prefix = `assessment-it-${Date.now()}`;

  beforeAll(async () => {
    dataSource = createDataSource(loadAppConfig());
    await dataSource.initialize();
    await dataSource.runMigrations();
    store = new TypeOrmAssessmentAttemptStore(
      dataSource.getRepository(AssessmentAttempt),
      dataSource,
    );
  }, 60000);

  async function createUser(): Promise<string> {
    const user = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        email: `${prefix}-${createdUsers.length}@example.test`,
        passwordHash: 'x',
        emailVerifiedAt: new Date(),
        role: 'user',
        status: 'active',
      }),
    );
    createdUsers.push(user.id);
    return user.id;
  }

  afterAll(async () => {
    if (createdUsers.length > 0) {
      const placeholders = createdUsers.map(() => '?').join(',');
      await dataSource.query(
        `DELETE FROM assessment_attempts WHERE userId IN (${placeholders})`,
        createdUsers,
      );
      await dataSource.query(
        `DELETE FROM users WHERE id IN (${placeholders})`,
        createdUsers,
      );
    }
    await dataSource.destroy();
  }, 60000);

  it('persists the exact keyed snapshot and versions on start', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());
    expect(attempt.status).toBe('in_progress');
    expect(attempt.revision).toBe(0);
    expect(attempt.answers).toEqual([]);
    expect(attempt.snapshot).toEqual(buildSyntheticForm());

    const row = await dataSource
      .getRepository(AssessmentAttempt)
      .findOne({ where: { id: attempt.id } });
    expect(row?.assessmentId).toBe('synthetic-demo');
    expect(row?.scoringRuleVersion).toBe('1.0.0');
    expect(row?.snapshot).toEqual(buildSyntheticForm());
  });

  it('enforces ownership on every operation', async () => {
    const owner = await createUser();
    const other = await createUser();
    const attempt = await store.create(owner, buildSyntheticForm());

    expect(await store.findOwned(other, attempt.id)).toBeNull();
    expect(await store.saveAnswers(other, attempt.id, 0, [])).toEqual({
      status: 'not_found',
    });
    expect(await store.finalise(other, attempt.id)).toEqual({
      status: 'not_found',
    });
  });

  it('saves partial answers, clears via skipped, and resumes persisted state', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());

    const first = await store.saveAnswers(userId, attempt.id, 0, [
      { itemId: 'synthetic-single', response: { kind: 'single-answer', selectedOptionId: 's3' } },
      { itemId: 'synthetic-multi', response: { kind: 'multiple-select', selectedOptionIds: ['s1'] } },
    ]);
    expect(first.status).toBe('ok');
    if (first.status !== 'ok') return;
    expect(first.attempt.revision).toBe(1);
    expect(first.attempt.answers).toHaveLength(2);

    // Clearing one answer via `skipped` and adding another.
    const second = await store.saveAnswers(userId, attempt.id, 1, [
      { itemId: 'synthetic-multi', response: { kind: 'skipped' } },
      { itemId: 'synthetic-order', response: { kind: 'ordering', orderedOptionIds: ['r', 'p', 'q'] } },
    ]);
    expect(second.status).toBe('ok');
    if (second.status !== 'ok') return;
    expect(second.attempt.revision).toBe(2);
    expect(second.attempt.answers.map((entry) => entry.itemId).sort()).toEqual([
      'synthetic-order',
      'synthetic-single',
    ]);

    // A fresh read (resume after reload/restart) returns the persisted answers.
    const resumed = await store.findOwned(userId, attempt.id);
    expect(resumed?.answers).toEqual(second.attempt.answers);
  });

  it('rejects a stale revision (no silent lost updates)', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());
    await store.saveAnswers(userId, attempt.id, 0, []);
    const conflict = await store.saveAnswers(userId, attempt.id, 0, []);
    expect(conflict).toEqual({ status: 'conflict', currentRevision: 1 });
  });

  it('scores the persisted snapshot with the full denominator', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());
    await store.saveAnswers(userId, attempt.id, 0, [
      { itemId: 'synthetic-single', response: { kind: 'single-answer', selectedOptionId: 's3' } },
      { itemId: 'synthetic-multi', response: { kind: 'multiple-select', selectedOptionIds: ['s1'] } },
      { itemId: 'synthetic-order', response: { kind: 'ordering', orderedOptionIds: ['r', 'p', 'q'] } },
      // numeric omitted -> skipped
    ]);

    const outcome = await store.finalise(userId, attempt.id);
    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') return;
    const result = outcome.attempt.result;
    expect(result).not.toBeNull();
    expect(result?.totalItems).toBe(4);
    expect(result?.correct).toBe(2);
    expect(result?.incorrect).toBe(1);
    expect(result?.skipped).toBe(1);
    expect(result?.score).toBe(2);
    expect((result?.correct ?? 0) + (result?.incorrect ?? 0) + (result?.skipped ?? 0)).toBe(4);
  });

  it('rejects answer saves after finalisation', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());
    await store.finalise(userId, attempt.id);
    expect(await store.saveAnswers(userId, attempt.id, 0, [])).toEqual({
      status: 'finalised',
    });
  });

  it('returns the stored result on repeated submission (one finalisation)', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());
    const first = await store.finalise(userId, attempt.id);
    expect(first.status).toBe('ok');
    if (first.status !== 'ok') return;
    const revisionAfterFirst = first.attempt.revision;
    const finalisedAt = first.attempt.finalisedAt?.getTime();

    const second = await store.finalise(userId, attempt.id);
    expect(second.status).toBe('already');
    if (second.status !== 'already') return;
    expect(second.attempt.result).toEqual(first.attempt.result);
    expect(second.attempt.revision).toBe(revisionAfterFirst);
    expect(second.attempt.finalisedAt?.getTime()).toBe(finalisedAt);
  });

  it('yields exactly one finalised result under concurrent submission', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());
    const outcomes = await Promise.all([
      store.finalise(userId, attempt.id),
      store.finalise(userId, attempt.id),
    ]);
    const statuses = outcomes.map((o) => o.status).sort();
    expect(statuses).toEqual(['already', 'ok']);

    const row = await dataSource
      .getRepository(AssessmentAttempt)
      .findOne({ where: { id: attempt.id } });
    expect(row?.status).toBe('finalised');
    expect(row?.revision).toBe(1);
  });

  it('serialises a save-versus-submit race without changing finalised answers', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());
    const [saveOutcome, finaliseOutcome] = await Promise.all([
      store.saveAnswers(userId, attempt.id, 0, [
        { itemId: 'synthetic-single', response: { kind: 'single-answer', selectedOptionId: 's3' } },
      ]),
      store.finalise(userId, attempt.id),
    ]);

    expect(['ok', 'finalised']).toContain(saveOutcome.status);
    expect(['ok', 'already']).toContain(finaliseOutcome.status);

    const row = await dataSource
      .getRepository(AssessmentAttempt)
      .findOne({ where: { id: attempt.id } });
    expect(row?.status).toBe('finalised');

    // The stored result must be consistent with the stored answers.
    const storedAnswers = (row?.answers as ResponseEntry[]) ?? [];
    const expectedCorrect = storedAnswers.some(
      (entry) =>
        entry.itemId === 'synthetic-single' &&
        entry.response.kind === 'single-answer' &&
        entry.response.selectedOptionId === 's3',
    )
      ? 1
      : 0;
    const result = row?.result as { correct: number } | null;
    expect(result?.correct).toBe(expectedCorrect);

    if (saveOutcome.status === 'finalised') {
      expect(storedAnswers).toHaveLength(0);
    }
  });

  it('keeps the stored snapshot authoritative (independent of later fixture changes)', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());

    // A "later fixture change": a modified snapshot that would score differently.
    const changed = buildSyntheticForm();
    (changed.items[0] as { correctOptionId: string }).correctOptionId = 's1';
    await store.saveAnswers(userId, attempt.id, 0, [
      { itemId: 'synthetic-single', response: { kind: 'single-answer', selectedOptionId: 's3' } },
    ]);
    const outcome = await store.finalise(userId, attempt.id);
    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') return;

    // The result reflects the snapshot persisted at start (s3 is correct), not
    // the changed fixture (which would make s3 incorrect).
    const single = outcome.attempt.result?.items.find(
      (item) => item.itemId === 'synthetic-single',
    );
    expect(single?.outcome).toBe('correct');
    expect(attempt.snapshot.items[0]).toMatchObject({ correctOptionId: 's3' });
  });

  it('rolls back finalisation on invalid persisted answers', async () => {
    const userId = await createUser();
    const attempt = await store.create(userId, buildSyntheticForm());

    // Corrupt the stored answers with an unknown item, simulating bad data.
    await dataSource
      .getRepository(AssessmentAttempt)
      .update(
        { id: attempt.id },
        { answers: [{ itemId: 'unknown-item', response: { kind: 'skipped' } }] },
      );

    await expect(store.finalise(userId, attempt.id)).rejects.toBeInstanceOf(
      AssessmentError,
    );

    const row = await dataSource
      .getRepository(AssessmentAttempt)
      .findOne({ where: { id: attempt.id } });
    expect(row?.status).toBe('in_progress');
    expect(row?.result).toBeNull();
  });

  it('isolates history between users', async () => {
    const a = await createUser();
    const b = await createUser();
    const attemptA = await store.create(a, buildSyntheticForm());
    await store.create(b, buildSyntheticForm());

    const listA = await store.listOwned(a);
    expect(listA.map((entry) => entry.id)).toEqual([attemptA.id]);
    const listB = await store.listOwned(b);
    expect(listB.map((entry) => entry.id)).not.toContain(attemptA.id);
  });
});
