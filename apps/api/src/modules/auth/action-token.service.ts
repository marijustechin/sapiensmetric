import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import {
  ACTION_TOKEN_STORE,
  ActionTokenPurpose,
  ActionTokenStore,
} from './action-tokens/action-token.store.js';

/** Per user-and-purpose issuance cooldown (D-016): 15 minutes. */
export const ACTION_TOKEN_COOLDOWN_MS = 15 * 60 * 1000;

export type IssueActionTokenResult =
  | { status: 'issued'; rawToken: string; id: string }
  | { status: 'cooldown' };

@Injectable()
export class ActionTokenService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(ACTION_TOKEN_STORE) private readonly store: ActionTokenStore,
  ) {}

  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private ttlSeconds(purpose: ActionTokenPurpose): number {
    return purpose === 'verify'
      ? this.config.tokens.verificationTtlSeconds
      : this.config.tokens.passwordResetTtlSeconds;
  }

  async issue(
    userId: string,
    purpose: ActionTokenPurpose,
  ): Promise<IssueActionTokenResult> {
    const rawToken = this.generate();
    const expiresAt = new Date(
      Date.now() + this.ttlSeconds(purpose) * 1000,
    );
    const result = await this.store.issue(
      userId,
      purpose,
      this.hash(rawToken),
      expiresAt,
      ACTION_TOKEN_COOLDOWN_MS,
    );
    if (result.status === 'cooldown') {
      return { status: 'cooldown' };
    }
    return { status: 'issued', rawToken, id: result.id };
  }

  /** Roll back an issuance after a transport rejection before SMTP acceptance. */
  async revoke(id: string): Promise<void> {
    await this.store.deleteById(id);
  }

  async consumeVerification(rawToken: string): Promise<boolean> {
    return this.store.consumeVerification(this.hash(rawToken));
  }

  async consumeForPasswordReset(
    rawToken: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.store.consumeForPasswordReset(
      this.hash(rawToken),
      passwordHash,
    );
  }

  async purgeStale(): Promise<number> {
    return this.store.deleteStale();
  }
}
