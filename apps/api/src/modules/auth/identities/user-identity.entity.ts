import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/user.entity.js';

/**
 * Durable provider identity (D-018). A Google account is identified solely by
 * its immutable OIDC `sub`, stored as `subject`; `provider` keeps the table
 * open to future providers without changing the schema again.
 */
@Entity('user_identities')
@Unique('IDX_user_identities_provider_subject', ['provider', 'subject'])
export class UserIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  @Index('IDX_user_identities_userId')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 32 })
  provider!: string;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
