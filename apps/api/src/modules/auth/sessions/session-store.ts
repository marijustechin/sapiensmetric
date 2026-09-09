import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { AuthSession } from './auth-session.entity.js';
import { User } from '../../users/user.entity.js';

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBySessionId: string | null;
  revokedReason: string | null;
}

export const SESSION_STORE = Symbol('SESSION_STORE');

export interface SessionIssueData {
  tokenHash: string;
  expiresAt: Date;
}

export interface SessionStore {
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  findById(id: string): Promise<SessionRecord | null>;
  /**
   * Atomic login issuance: revoke all active sessions for the user, then
   * create exactly one new session. Serialised so concurrent logins leave a
   * single active session.
   */
  issueSession(
    userId: string,
    data: SessionIssueData,
    reason: string,
  ): Promise<SessionRecord>;
  /**
   * Atomic refresh rotation under the per-user lock: revoke the active session
   * for oldTokenHash (recording replacedBySessionId) and create its
   * replacement. Returns null when the old session is missing, revoked, or
   * expired, so a lost race yields no new session.
   */
  rotate(
    oldTokenHash: string,
    data: SessionIssueData,
  ): Promise<{ session: SessionRecord; replacedBySessionId: string } | null>;
  /**
   * Atomic token-based logout: revoke every active session for the user that
   * owns the token. Locking the user row first makes this serialise against
   * refresh/login and guarantees no successor survives.
   */
  revokeAllByToken(
    tokenHash: string,
    reason: string,
  ): Promise<void>;
}

@Injectable()
export class TypeOrmSessionStore implements SessionStore {
  constructor(
    @InjectRepository(AuthSession)
    private readonly repo: Repository<AuthSession>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    return this.repo.findOne({ where: { tokenHash } });
  }

  findById(id: string): Promise<SessionRecord | null> {
    return this.repo.findOne({ where: { id } });
  }

  private lockUser(manager: import('typeorm').EntityManager, userId: string) {
    return manager
      .getRepository(User)
      .createQueryBuilder('u')
      .setLock('pessimistic_write')
      .where('u.id = :id', { id: userId })
      .getOne();
  }

  private async revokeAllActive(
    manager: import('typeorm').EntityManager,
    userId: string,
    reason: string,
  ): Promise<void> {
    const sessions = manager.getRepository(AuthSession);
    await sessions.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }

  async issueSession(
    userId: string,
    data: SessionIssueData,
    reason: string,
  ): Promise<SessionRecord> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, userId);
      await this.revokeAllActive(manager, userId, reason);
      const sessions = manager.getRepository(AuthSession);
      const entity = sessions.create({ ...data, userId });
      return sessions.save(entity);
    });
  }

  async rotate(
    oldTokenHash: string,
    data: SessionIssueData,
  ): Promise<{ session: SessionRecord; replacedBySessionId: string } | null> {
    // Resolve the token to its user before opening the transaction.
    const old = await this.repo.findOne({ where: { tokenHash: oldTokenHash } });
    if (!old) {
      return null;
    }

    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, old.userId);

      const sessions = manager.getRepository(AuthSession);
      const current = await sessions.findOne({ where: { id: old.id } });
      if (
        !current ||
        current.revokedAt ||
        current.expiresAt.getTime() < Date.now()
      ) {
        return null;
      }

      const newId = randomUUID();
      await sessions.update(
        { id: current.id, revokedAt: IsNull() },
        {
          revokedAt: new Date(),
          revokedReason: 'rotation',
          replacedBySessionId: newId,
        },
      );

      const entity = sessions.create({ ...data, userId: current.userId, id: newId });
      const session = await sessions.save(entity);
      return { session, replacedBySessionId: newId };
    });
  }

  async revokeAllByToken(tokenHash: string, reason: string): Promise<void> {
    const old = await this.repo.findOne({ where: { tokenHash } });
    if (!old) {
      return;
    }
    await this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, old.userId);
      await this.revokeAllActive(manager, old.userId, reason);
    });
  }
}
