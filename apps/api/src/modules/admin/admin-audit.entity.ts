import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { AuditActorType } from '@sapiensmetric/contracts';

/**
 * Administrative audit trail (T-012). Holds no credentials or tokens; only
 * small before/after snapshots of the changed fields.
 */
@Entity('admin_audit_log')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 16 })
  actorType!: AuditActorType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actorLabel!: string | null;

  @Column({ type: 'varchar', length: 64 })
  action!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  targetUserId!: string | null;

  @Column({ type: 'json', nullable: true })
  beforeValue!: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  afterValue!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
