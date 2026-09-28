import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Persisted assessment attempt (T-017).
 *
 * `snapshot` stores the **exact immutable keyed form snapshot** chosen by the
 * server when the attempt started, together with all scoring/version fields, so
 * a result can be reproduced even if the source fixture later changes.
 *
 * `snapshot`, `answers`, and `result` are JSON columns; the store reads/writes
 * them through the `@sapiensmetric/assessment` types. None of this column data
 * is ever returned to a client directly — only the public projection is.
 */
@Entity('assessment_attempts')
@Index('IDX_assessment_attempts_user', ['userId', 'createdAt'])
export class AssessmentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 64 })
  assessmentId!: string;

  @Column({ type: 'varchar', length: 32 })
  assessmentVersion!: string;

  @Column({ type: 'varchar', length: 64 })
  formId!: string;

  @Column({ type: 'varchar', length: 32 })
  formVersion!: string;

  @Column({ type: 'varchar', length: 16 })
  languageScope!: string;

  @Column({ type: 'varchar', length: 32 })
  translationVersion!: string;

  @Column({ type: 'varchar', length: 32 })
  scoringRuleVersion!: string;

  /** Exact keyed form snapshot (confidential: contains answer keys). */
  @Column({ type: 'json' })
  snapshot!: unknown;

  /** The caller's saved answers (response entries); absent item IDs are unanswered. */
  @Column({ type: 'json' })
  answers!: unknown;

  @Column({ type: 'varchar', length: 16, default: 'in_progress' })
  status!: 'in_progress' | 'finalised';

  /** Optimistic-concurrency revision; incremented on every successful save/submit. */
  @Column({ type: 'int', default: 0 })
  revision!: number;

  /** Stored scoring result (confidential-adjacent; contains no keys). */
  @Column({ type: 'json', nullable: true })
  result!: unknown | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  finalisedAt!: Date | null;
}
