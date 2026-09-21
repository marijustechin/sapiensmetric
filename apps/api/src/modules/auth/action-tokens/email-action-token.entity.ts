import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity.js';

@Entity('email_action_tokens')
@Index(['userId', 'purpose'])
export class EmailActionToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 16 })
  purpose!: 'verify' | 'reset';

  @Column({ type: 'varchar', length: 64, unique: true })
  tokenHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  consumedAt!: Date | null;
}
