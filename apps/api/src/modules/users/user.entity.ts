import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'datetime', nullable: true })
  emailVerifiedAt!: Date | null;

  /** One role per user (T-012). Public registrations always default to `user`. */
  @Column({ type: 'varchar', length: 16, default: 'user' })
  role!: 'user' | 'editor' | 'admin';

  /** Account status, independent of email verification (T-012). */
  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: 'active' | 'suspended';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
