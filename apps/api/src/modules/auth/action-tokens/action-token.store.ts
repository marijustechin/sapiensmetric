import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { AuthSession } from '../sessions/auth-session.entity.js';
import { User } from '../../users/user.entity.js';
import { EmailActionToken } from './email-action-token.entity.js';

export type ActionTokenPurpose = 'verify' | 'reset';

export interface ActionTokenRecord {
  id: string;
  userId: string;
  purpose: ActionTokenPurpose;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
}

export type ActionTokenIssueResult =
  | { status: 'issued'; id: string }
  | { status: 'cooldown' };

export const ACTION_TOKEN_STORE = Symbol('ACTION_TOKEN_STORE');

export interface ActionTokenStore {
  /**
   * Atomically issue a token for the user and purpose: under the per-user lock,
   * enforce the issuance cooldown, invalidate every previous unused token for
   * the same user and purpose, then create the new one.
   */
  issue(
    userId: string,
    purpose: ActionTokenPurpose,
    tokenHash: string,
    expiresAt: Date,
    cooldownMs: number,
  ): Promise<ActionTokenIssueResult>;
  /**
   * Delete a token created by a failed issuance (transport rejection rollback),
   * so no usable token remains and the cooldown is not consumed.
   */
  deleteById(id: string): Promise<void>;
  /**
   * Atomically consume a verification token and mark the user verified.
   * Returns false for unknown, wrong-purpose, consumed, or expired tokens.
   */
  consumeVerification(tokenHash: string): Promise<boolean>;
  /**
   * Atomically consume a reset token, change the password hash, and revoke every
   * active refresh session for the user, in one transaction.
   */
  consumeForPasswordReset(
    tokenHash: string,
    passwordHash: string,
  ): Promise<boolean>;
  /** Remove consumed and expired tokens (minimising retention). */
  deleteStale(): Promise<number>;
}

@Injectable()
export class TypeOrmActionTokenStore implements ActionTokenStore {
  constructor(
    @InjectRepository(EmailActionToken)
    private readonly repo: Repository<EmailActionToken>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  private lockUser(manager: EntityManager, userId: string) {
    return manager
      .getRepository(User)
      .createQueryBuilder('u')
      .setLock('pessimistic_write')
      .where('u.id = :id', { id: userId })
      .getOne();
  }

  async issue(
    userId: string,
    purpose: ActionTokenPurpose,
    tokenHash: string,
    expiresAt: Date,
    cooldownMs: number,
  ): Promise<ActionTokenIssueResult> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, userId);
      const tokens = manager.getRepository(EmailActionToken);

      const latest = await tokens.findOne({
        where: { userId, purpose },
        order: { createdAt: 'DESC' },
      });
      if (latest && Date.now() - latest.createdAt.getTime() < cooldownMs) {
        return { status: 'cooldown' as const };
      }

      await tokens.update(
        { userId, purpose, consumedAt: IsNull() },
        { consumedAt: new Date() },
      );

      const entity = tokens.create({
        userId,
        purpose,
        tokenHash,
        expiresAt,
      });
      const saved = await tokens.save(entity);
      return { status: 'issued' as const, id: saved.id };
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async consumeVerification(tokenHash: string): Promise<boolean> {
    const found = await this.repo.findOne({
      where: { tokenHash, purpose: 'verify', consumedAt: IsNull() },
    });
    if (!found) {
      return false;
    }

    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, found.userId);
      const tokens = manager.getRepository(EmailActionToken);
      const token = await tokens.findOne({
        where: { id: found.id, consumedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!token || token.expiresAt.getTime() < Date.now()) {
        return false;
      }

      await tokens.update(
        { id: token.id, consumedAt: IsNull() },
        { consumedAt: new Date() },
      );
      await manager
        .getRepository(User)
        .update({ id: token.userId }, { emailVerifiedAt: new Date() });
      return true;
    });
  }

  async consumeForPasswordReset(
    tokenHash: string,
    passwordHash: string,
  ): Promise<boolean> {
    const found = await this.repo.findOne({
      where: { tokenHash, purpose: 'reset', consumedAt: IsNull() },
    });
    if (!found) {
      return false;
    }

    return this.dataSource.transaction(async (manager) => {
      await this.lockUser(manager, found.userId);
      const tokens = manager.getRepository(EmailActionToken);
      const token = await tokens.findOne({
        where: { id: found.id, consumedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!token || token.expiresAt.getTime() < Date.now()) {
        return false;
      }

      await tokens.update(
        { id: token.id, consumedAt: IsNull() },
        { consumedAt: new Date() },
      );
      await manager
        .getRepository(User)
        .update({ id: token.userId }, { passwordHash });
      await manager.getRepository(AuthSession).update(
        { userId: token.userId, revokedAt: IsNull() },
        { revokedAt: new Date(), revokedReason: 'password_reset' },
      );
      return true;
    });
  }

  async deleteStale(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('consumedAt IS NOT NULL OR expiresAt < :now', { now: new Date() })
      .execute();
    return result.affected ?? 0;
  }
}
