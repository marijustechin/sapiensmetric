import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Locale } from '@sapiensmetric/contracts';
import { APP_CONFIG, AppConfig } from '../../../config/env.js';
import { PASSWORD_SERVICE, PasswordService } from '../password.service.js';
import { SESSION_STORE, SessionStore } from '../sessions/session-store.js';
import { TOKEN_SERVICE, TokenService } from '../token.service.js';
import {
  IDENTITY_STORE,
  IdentityStore,
  isDuplicateIdentityError,
} from '../identities/identity-store.js';
import {
  USER_STORE,
  UserRecord,
  UserStore,
  isDuplicateEntryError,
} from '../../users/user-store.js';
import {
  GOOGLE_ID_TOKEN_VERIFIER,
  GoogleIdTokenVerifier,
  GoogleIdentityClaims,
} from './google-id-token.service.js';
import { GOOGLE_TOKEN_CLIENT, GoogleTokenClient } from './google-token.client.js';
import { OAuthTransactionService } from './oauth-transaction.service.js';

const PROVIDER = 'google';

export class GoogleAuthError extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

export interface GoogleStartResult {
  cookieValue: string;
  redirectUrl: string;
}

export type GoogleCompleteResult =
  | {
      outcome: 'success';
      refreshToken: string;
      returnTo: string;
      locale: Locale;
    }
  | { outcome: 'error'; reason: string; locale: Locale };

@Injectable()
export class GoogleAuthService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(USER_STORE) private readonly users: UserStore,
    @Inject(IDENTITY_STORE) private readonly identities: IdentityStore,
    @Inject(SESSION_STORE) private readonly sessions: SessionStore,
    @Inject(PASSWORD_SERVICE) private readonly passwords: PasswordService,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(GOOGLE_ID_TOKEN_VERIFIER)
    private readonly idTokens: GoogleIdTokenVerifier,
    @Inject(GOOGLE_TOKEN_CLIENT)
    private readonly tokenClient: GoogleTokenClient,
    @Inject(OAuthTransactionService)
    private readonly transactions: OAuthTransactionService,
  ) {}

  isEnabled(): boolean {
    return this.transactions.isEnabled();
  }

  start(returnTo: string | undefined, locale: Locale): GoogleStartResult {
    if (!this.isEnabled() || !this.config.google.redirectUri) {
      throw new GoogleAuthError('unavailable');
    }
    const transaction = this.transactions.create(returnTo ?? '', locale);
    return {
      cookieValue: this.transactions.serialize(transaction),
      redirectUrl: this.transactions.buildAuthorizationUrl(
        transaction,
        this.config.google.redirectUri,
      ),
    };
  }

  async complete(input: {
    code?: string;
    state?: string;
    txCookie?: string;
  }): Promise<GoogleCompleteResult> {
    const transaction = this.transactions.verify(input.txCookie);
    const locale: Locale = transaction?.locale ?? 'en';

    if (!transaction) {
      return { outcome: 'error', reason: 'invalid_transaction', locale };
    }
    if (!input.state || input.state !== transaction.state) {
      return { outcome: 'error', reason: 'state_mismatch', locale };
    }
    if (!input.code) {
      return { outcome: 'error', reason: 'missing_code', locale };
    }
    if (!this.config.google.redirectUri) {
      return { outcome: 'error', reason: 'unavailable', locale };
    }

    let claims: GoogleIdentityClaims;
    try {
      const exchanged = await this.tokenClient.exchangeCode({
        code: input.code,
        codeVerifier: transaction.codeVerifier,
        redirectUri: this.config.google.redirectUri,
      });
      claims = await this.idTokens.verify(exchanged.idToken, transaction.nonce);
    } catch {
      return { outcome: 'error', reason: 'token_validation_failed', locale };
    }

    let user: UserRecord;
    try {
      user = await this.resolveAccount(claims);
    } catch {
      return { outcome: 'error', reason: 'account_rejected', locale };
    }

    const refreshToken = this.tokens.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.config.auth.refreshSessionTtlMs);
    await this.sessions.issueSession(
      user.id,
      {
        tokenHash: this.tokens.hashRefreshToken(refreshToken),
        expiresAt,
      },
      'google',
    );

    return {
      outcome: 'success',
      refreshToken,
      returnTo: transaction.returnTo,
      locale,
    };
  }

  /**
   * Account resolution (D-018). A Google identity is matched only by its
   * immutable `sub`; email participates solely in the automatic-linking rules
   * below and never by itself.
   */
  private async resolveAccount(
    claims: GoogleIdentityClaims,
  ): Promise<UserRecord> {
    const existing = await this.identities.findByProviderSubject(
      PROVIDER,
      claims.subject,
    );
    if (existing) {
      const user = await this.users.findById(existing.userId);
      if (!user) {
        throw new GoogleAuthError('orphan_identity');
      }
      return user;
    }

    if (!claims.email || !claims.emailVerified) {
      throw new GoogleAuthError('email_not_verified');
    }
    const normalized = claims.email.trim().toLowerCase();

    let user = await this.users.findByEmail(normalized);
    if (user && !user.emailVerifiedAt) {
      // Never auto-link to an unverified local credentials account.
      throw new GoogleAuthError('unverified_local_account');
    }
    if (!user) {
      const passwordHash = await this.passwords.hash(
        randomBytes(32).toString('base64url'),
      );
      try {
        user = await this.users.create({
          email: normalized,
          passwordHash,
          emailVerifiedAt: new Date(),
        });
      } catch (error) {
        if (!isDuplicateEntryError(error)) {
          throw error;
        }
        // Concurrent creation of the same email: reuse the winner.
        user = await this.users.findByEmail(normalized);
        if (!user || !user.emailVerifiedAt) {
          throw new GoogleAuthError('unverified_local_account');
        }
      }
    }

    try {
      await this.identities.create({
        userId: user.id,
        provider: PROVIDER,
        subject: claims.subject,
      });
    } catch (error) {
      if (!isDuplicateIdentityError(error)) {
        throw error;
      }
      // The subject was linked concurrently; never reassign it to another user.
      const raced = await this.identities.findByProviderSubject(
        PROVIDER,
        claims.subject,
      );
      if (!raced) {
        throw error;
      }
      if (raced.userId !== user.id) {
        throw new GoogleAuthError('subject_linked_elsewhere');
      }
      const owner = await this.users.findById(raced.userId);
      if (!owner) {
        throw new GoogleAuthError('orphan_identity');
      }
      return owner;
    }

    return user;
  }
}
