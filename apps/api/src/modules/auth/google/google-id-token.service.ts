import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { APP_CONFIG, AppConfig } from '../../../config/env.js';
import { GOOGLE_JWKS, GoogleJwksProvider } from './google-jwks.client.js';

export const GOOGLE_ID_TOKEN_VERIFIER = Symbol('GOOGLE_ID_TOKEN_VERIFIER');

export interface GoogleIdentityClaims {
  /** Immutable OIDC subject — the sole stable identity key. */
  subject: string;
  email: string | null;
  emailVerified: boolean;
  nonce: string | null;
}

export interface GoogleIdTokenVerifier {
  verify(idToken: string, expectedNonce: string): Promise<GoogleIdentityClaims>;
}

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/**
 * Verifies a Google ID token: RS256 signature against the JWKS key selected by
 * `kid`, issuer/audience/expiry via `jsonwebtoken`, plus the `nonce` binding.
 * A decoded-but-unverified payload is never trusted.
 */
@Injectable()
export class GoogleIdTokenService implements GoogleIdTokenVerifier {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(GOOGLE_JWKS) private readonly jwks: GoogleJwksProvider,
  ) {}

  async verify(
    idToken: string,
    expectedNonce: string,
  ): Promise<GoogleIdentityClaims> {
    const clientId = this.config.google.clientId;
    if (!clientId) {
      throw new Error('Google sign-in is not configured.');
    }

    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      throw new Error('Invalid Google ID token header.');
    }
    const key = await this.jwks.getKey(decoded.header.kid);
    if (!key) {
      throw new Error('Unknown Google signing key.');
    }

    const payload = jwt.verify(idToken, key, {
      algorithms: ['RS256'],
      audience: clientId,
      issuer: GOOGLE_ISSUERS,
    }) as jwt.JwtPayload;

    if (typeof payload.nonce !== 'string' || payload.nonce !== expectedNonce) {
      throw new Error('Google ID token nonce mismatch.');
    }
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Google ID token is missing sub.');
    }

    const email = typeof payload.email === 'string' ? payload.email : null;
    const emailVerified =
      payload.email_verified === true || payload.email_verified === 'true';

    return {
      subject: payload.sub,
      email,
      emailVerified,
      nonce: payload.nonce,
    };
  }
}
