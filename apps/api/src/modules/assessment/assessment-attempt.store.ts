import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  scoreAttempt,
  type KeyedFormSnapshot,
  type ResponseEntry,
  type ScoringResult,
} from '@sapiensmetric/assessment';
import { AssessmentAttempt } from './assessment-attempt.entity.js';

export type AttemptStatus = 'in_progress' | 'finalised';

export interface AttemptRecord {
  id: string;
  userId: string;
  snapshot: KeyedFormSnapshot;
  answers: ResponseEntry[];
  status: AttemptStatus;
  revision: number;
  result: ScoringResult | null;
  createdAt: Date;
  updatedAt: Date;
  finalisedAt: Date | null;
}

export type SaveAnswersOutcome =
  | { status: 'ok'; attempt: AttemptRecord }
  | { status: 'not_found' }
  | { status: 'finalised' }
  | { status: 'conflict'; currentRevision: number };

export type FinaliseOutcome =
  | { status: 'ok'; attempt: AttemptRecord }
  | { status: 'already'; attempt: AttemptRecord }
  | { status: 'not_found' };

export const ASSESSMENT_ATTEMPT_STORE = Symbol('ASSESSMENT_ATTEMPT_STORE');

export interface AssessmentAttemptStore {
  create(userId: string, snapshot: KeyedFormSnapshot): Promise<AttemptRecord>;
  findOwned(userId: string, attemptId: string): Promise<AttemptRecord | null>;
  listOwned(userId: string): Promise<AttemptRecord[]>;
  /**
   * Apply a partial answer save under an optimistic revision check, serialised
   * by a pessimistic row lock. Items whose response is `skipped` are cleared.
   */
  saveAnswers(
    userId: string,
    attemptId: string,
    revision: number,
    ops: ResponseEntry[],
  ): Promise<SaveAnswersOutcome>;
  /**
   * Finalise under a pessimistic row lock. Idempotent: a second call returns the
   * already-stored result, so concurrent submissions yield one finalisation.
   * Scoring runs inside the transaction, so a scoring/validation failure rolls
   * back with nothing persisted.
   */
  finalise(userId: string, attemptId: string): Promise<FinaliseOutcome>;
}

/** Pure helper: apply partial save operations (skipped clears) to stored answers. */
export function applySaveOps(
  existing: readonly ResponseEntry[],
  ops: readonly ResponseEntry[],
): ResponseEntry[] {
  const byItem = new Map<string, ResponseEntry>();
  for (const entry of existing) {
    byItem.set(entry.itemId, entry);
  }
  for (const op of ops) {
    if (op.response.kind === 'skipped') {
      byItem.delete(op.itemId);
    } else {
      byItem.set(op.itemId, op);
    }
  }
  return [...byItem.values()];
}

function toRecord(row: AssessmentAttempt): AttemptRecord {
  return {
    id: row.id,
    userId: row.userId,
    snapshot: row.snapshot as KeyedFormSnapshot,
    answers: (row.answers as ResponseEntry[]) ?? [],
    status: row.status,
    revision: row.revision,
    result: (row.result as ScoringResult | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    finalisedAt: row.finalisedAt,
  };
}

@Injectable()
export class TypeOrmAssessmentAttemptStore implements AssessmentAttemptStore {
  constructor(
    @InjectRepository(AssessmentAttempt)
    private readonly repo: Repository<AssessmentAttempt>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    snapshot: KeyedFormSnapshot,
  ): Promise<AttemptRecord> {
    const entity = this.repo.create({
      userId,
      assessmentId: snapshot.assessmentId,
      assessmentVersion: snapshot.assessmentVersion,
      formId: snapshot.formId,
      formVersion: snapshot.formVersion,
      languageScope: snapshot.languageScope,
      translationVersion: snapshot.translationVersion,
      scoringRuleVersion: snapshot.scoringRuleVersion,
      snapshot,
      answers: [],
      status: 'in_progress',
      revision: 0,
      result: null,
      finalisedAt: null,
    });
    return toRecord(await this.repo.save(entity));
  }

  async findOwned(
    userId: string,
    attemptId: string,
  ): Promise<AttemptRecord | null> {
    const row = await this.repo.findOne({ where: { id: attemptId } });
    if (!row || row.userId !== userId) {
      return null;
    }
    return toRecord(row);
  }

  async listOwned(userId: string): Promise<AttemptRecord[]> {
    const rows = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toRecord);
  }

  async saveAnswers(
    userId: string,
    attemptId: string,
    revision: number,
    ops: ResponseEntry[],
  ): Promise<SaveAnswersOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(AssessmentAttempt);
      const row = await repo
        .createQueryBuilder('a')
        .setLock('pessimistic_write')
        .where('a.id = :id', { id: attemptId })
        .getOne();

      if (!row || row.userId !== userId) {
        return { status: 'not_found' };
      }
      if (row.status === 'finalised') {
        return { status: 'finalised' };
      }
      if (row.revision !== revision) {
        return { status: 'conflict', currentRevision: row.revision };
      }

      row.answers = applySaveOps((row.answers as ResponseEntry[]) ?? [], ops);
      row.revision += 1;
      return { status: 'ok', attempt: toRecord(await repo.save(row)) };
    });
  }

  async finalise(userId: string, attemptId: string): Promise<FinaliseOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(AssessmentAttempt);
      const row = await repo
        .createQueryBuilder('a')
        .setLock('pessimistic_write')
        .where('a.id = :id', { id: attemptId })
        .getOne();

      if (!row || row.userId !== userId) {
        return { status: 'not_found' };
      }
      if (row.status === 'finalised' && row.result) {
        return { status: 'already', attempt: toRecord(row) };
      }

      // Authoritative scoring of the persisted snapshot + answers using the
      // shared core. Throws a coded AssessmentError on malformed input; the
      // transaction then rolls back with nothing persisted.
      const result = scoreAttempt(row.snapshot as KeyedFormSnapshot, {
        attemptId: row.id,
        status: 'submitted',
        responses: (row.answers as ResponseEntry[]) ?? [],
      });

      row.status = 'finalised';
      row.result = result;
      row.finalisedAt = new Date();
      row.revision += 1;
      return { status: 'ok', attempt: toRecord(await repo.save(row)) };
    });
  }
}
