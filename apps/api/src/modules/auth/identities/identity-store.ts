import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserIdentity } from './user-identity.entity.js';

export interface IdentityRecord {
  id: string;
  userId: string;
  provider: string;
  subject: string;
  createdAt: Date;
}

export const IDENTITY_STORE = Symbol('IDENTITY_STORE');

export interface IdentityStore {
  findByProviderSubject(
    provider: string,
    subject: string,
  ): Promise<IdentityRecord | null>;
  /**
   * Create an identity link. The unique `(provider, subject)` constraint makes
   * this the race-protection point; a duplicate-key error means another request
   * linked the same Google subject first.
   */
  create(data: {
    userId: string;
    provider: string;
    subject: string;
  }): Promise<IdentityRecord>;
}

/** MySQL duplicate-entry detection (ER_DUP_ENTRY / errno 1062). */
export function isDuplicateIdentityError(error: unknown): boolean {
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
export class TypeOrmIdentityStore implements IdentityStore {
  constructor(
    @InjectRepository(UserIdentity)
    private readonly repo: Repository<UserIdentity>,
  ) {}

  findByProviderSubject(
    provider: string,
    subject: string,
  ): Promise<IdentityRecord | null> {
    return this.repo.findOne({ where: { provider, subject } });
  }

  async create(data: {
    userId: string;
    provider: string;
    subject: string;
  }): Promise<IdentityRecord> {
    return this.repo.save(this.repo.create(data));
  }
}
