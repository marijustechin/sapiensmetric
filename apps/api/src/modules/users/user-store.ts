import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UserRole, UserStatus } from '@sapiensmetric/contracts';
import { User } from './user.entity.js';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const USER_STORE = Symbol('USER_STORE');

export interface UserStore {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(data: {
    email: string;
    passwordHash: string;
    /**
     * Optional: Google-created accounts are verified at creation (D-018);
     * credentials registrations leave this unset (null).
     */
    emailVerifiedAt?: Date | null;
  }): Promise<UserRecord>;
}

/**
 * Detects a MySQL duplicate-key (ER_DUP_ENTRY / errno 1062) error raised by
 * TypeORM, including its driver-wrapped forms.
 */
export function isDuplicateEntryError(error: unknown): boolean {
  const e = error as {
    code?: string;
    errno?: number;
    driverError?: { code?: string; errno?: number };
  };
  return (
    e?.code === 'ER_DUP_ENTRY' ||
    e?.errno === 1062 ||
    e?.driverError?.code === 'ER_DUP_ENTRY' ||
    e?.driverError?.errno === 1062
  );
}

@Injectable()
export class TypeOrmUserStore implements UserStore {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    emailVerifiedAt?: Date | null;
  }): Promise<UserRecord> {
    // Role/status intentionally not settable here: every created account
    // defaults to `user` / `active` (public registration can never escalate).
    return this.repo.save(this.repo.create(data));
  }
}
