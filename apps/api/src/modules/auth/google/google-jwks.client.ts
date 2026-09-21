import { Injectable } from '@nestjs/common';
import { createPublicKey, type JsonWebKey, type KeyObject } from 'node:crypto';

export const GOOGLE_JWKS = Symbol('GOOGLE_JWKS');

export interface GoogleJwksProvider {
  /** Return the public key for a token `kid`, or null when unknown. */
  getKey(kid: string): Promise<KeyObject | null>;
}

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const JWKS_TTL_MS = 60 * 60 * 1000;

/**
 * Google ID-token signing keys. Fetched from Google's JWKS endpoint and cached;
 * this class opens no connection until an ID token must be verified, so the
 * service is inert when Google is unconfigured or unused.
 */
@Injectable()
export class GoogleJwksClient implements GoogleJwksProvider {
  private cache: { keys: Map<string, KeyObject>; fetchedAt: number } | null =
    null;

  async getKey(kid: string): Promise<KeyObject | null> {
    if (!this.cache || Date.now() - this.cache.fetchedAt > JWKS_TTL_MS) {
      await this.refresh();
    }
    return this.cache?.keys.get(kid) ?? null;
  }

  private async refresh(): Promise<void> {
    const response = await fetch(GOOGLE_JWKS_URL);
    if (!response.ok) {
      throw new Error('Google JWKS fetch failed.');
    }
    const body = (await response.json()) as { keys?: JsonWebKey[] };
    const keys = new Map<string, KeyObject>();
    for (const jwk of body.keys ?? []) {
      if (jwk.kty === 'RSA' && typeof jwk.kid === 'string') {
        keys.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
      }
    }
    this.cache = { keys, fetchedAt: Date.now() };
  }
}
