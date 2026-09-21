import { Inject, Injectable } from '@nestjs/common';
import {
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import type { Locale } from '@sapiensmetric/contracts';
import { APP_CONFIG, AppConfig } from '../../../config/env.js';
import { sanitizeReturnTo } from './return-to.js';

export const OAUTH_TX_COOKIE_NAME = 'sm_oauth_tx';
/** Short-lived transaction window (10 minutes). */
export const OAUTH_TX_TTL_SECONDS = 600;

export interface OAuthTransaction {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
  returnTo: string;
  locale: Locale;
  /** Expiry as epoch milliseconds. */
  expiresAt: number;
}

export interface CookieOptions {
  httpOnly: boolean;
  sameSite: 'lax';
  path: string;
  secure: boolean;
  maxAge?: number;
}

function base64url(input: Buffer): string {
  return input.toString('base64url');
}

function sha256Base64url(input: string): string {
  return base64url(createHash('sha256').update(input).digest());
}

@Injectable()
export class OAuthTransactionService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  isEnabled(): boolean {
    return this.config.google.enabled;
  }

  cookieName(): string {
    return OAUTH_TX_COOKIE_NAME;
  }

  cookiePath(): string {
    return '/auth/google';
  }

  setCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      path: this.cookiePath(),
      secure: this.config.auth.cookieSecure,
      maxAge: OAUTH_TX_TTL_SECONDS,
    };
  }

  clearCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      path: this.cookiePath(),
      secure: this.config.auth.cookieSecure,
    };
  }

  /**
   * HKDF-SHA256 derived HMAC key for the transaction cookie. Derived from the
   * Google client secret (falling back to the JWT secret when Google is
   * disabled so the cookie boundary can still be unit-tested).
   */
  private hmacKey(): Buffer {
    const secret =
      this.config.google.clientSecret ?? this.config.jwt.secret;
    const derived = hkdfSync(
      'sha256',
      Buffer.from(secret, 'utf8'),
      Buffer.from('sapiensmetric-oauth-tx-salt', 'utf8'),
      Buffer.from('sapiensmetric-oauth-tx-v1', 'utf8'),
      32,
    );
    return Buffer.from(derived);
  }

  private sign(payload: string): string {
    return base64url(createHmac('sha256', this.hmacKey()).update(payload).digest());
  }

  create(returnTo: string, locale: Locale): OAuthTransaction {
    const codeVerifier = base64url(randomBytes(32));
    return {
      state: base64url(randomBytes(32)),
      nonce: base64url(randomBytes(16)),
      codeVerifier,
      codeChallenge: sha256Base64url(codeVerifier),
      returnTo: sanitizeReturnTo(
        returnTo,
        this.config.publicAppUrl,
        `/${locale}/account`,
      ),
      locale,
      expiresAt: Date.now() + OAUTH_TX_TTL_SECONDS * 1000,
    };
  }

  serialize(transaction: OAuthTransaction): string {
    const payload = base64url(Buffer.from(JSON.stringify(transaction), 'utf8'));
    return `${payload}.${this.sign(payload)}`;
  }

  /** Returns the transaction, or null when tampered, malformed, or expired. */
  verify(cookieValue: string | undefined): OAuthTransaction | null {
    if (!cookieValue) {
      return null;
    }
    const parts = cookieValue.split('.');
    if (parts.length !== 2) {
      return null;
    }
    const [payload, signature] = parts;
    const expected = this.sign(payload);
    const provided = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      provided.length !== expectedBuffer.length ||
      !timingSafeEqual(provided, expectedBuffer)
    ) {
      return null;
    }
    try {
      const parsed = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as OAuthTransaction;
      if (
        typeof parsed.state !== 'string' ||
        typeof parsed.nonce !== 'string' ||
        typeof parsed.codeVerifier !== 'string' ||
        typeof parsed.codeChallenge !== 'string' ||
        typeof parsed.returnTo !== 'string' ||
        (parsed.locale !== 'lt' && parsed.locale !== 'en') ||
        typeof parsed.expiresAt !== 'number' ||
        parsed.expiresAt < Date.now()
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  buildAuthorizationUrl(transaction: OAuthTransaction, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.config.google.clientId ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: transaction.state,
      nonce: transaction.nonce,
      code_challenge: transaction.codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}
