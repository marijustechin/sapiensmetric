import { describe, it, expect } from 'vitest';
import {
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AppConfig } from '../../../config/env.js';
import {
  GoogleIdTokenService,
  GoogleIdentityClaims,
} from './google-id-token.service.js';
import { GoogleJwksProvider } from './google-jwks.client.js';
import { GoogleAuthService } from './google-auth.service.js';
import { OAuthTransactionService } from './oauth-transaction.service.js';
import { GoogleTokenClient } from './google-token.client.js';
import { UserStore, UserRecord } from '../../users/user-store.js';
import { IdentityStore, IdentityRecord } from '../identities/identity-store.js';
import { SessionStore } from '../sessions/session-store.js';

const CLIENT_ID = 'local-test-client.apps.googleusercontent.com';
const ISSUER = 'https://accounts.google.com';
const KID = 'local-test-kid';
const ORIGIN = 'http://localhost:3001';
const NONCE = 'expected-nonce-value';

// Deterministic local RSA key pair — no network, no Google, no real creds.
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });

class LocalJwksProvider implements GoogleJwksProvider {
  constructor(private readonly keys: Map<string, KeyObject>) {}
  getKey(kid: string): Promise<KeyObject | null> {
    return Promise.resolve(this.keys.get(kid) ?? null);
  }
}

function config(): AppConfig {
  return {
    api: { port: 3334 },
    db: { host: '127.0.0.1', port: 3307, database: 'd', username: 'u', password: 'p' },
    cors: { origin: ORIGIN },
    jwt: { secret: 'j'.repeat(40), accessTokenTtlSeconds: 900 },
    auth: {
      refreshSessionTtlMs: 30 * 24 * 60 * 60 * 1000,
      refreshSessionTtlSeconds: 30 * 24 * 60 * 60,
      cookieSecure: false,
    },
    mail: {
      host: 'localhost',
      port: 1025,
      secure: false,
      user: 'u',
      password: 'p',
      from: 'no-reply@example.test',
      testRecipient: null,
    },
    tokens: { verificationTtlSeconds: 86400, passwordResetTtlSeconds: 1800 },
    publicAppUrl: ORIGIN,
    google: {
      clientId: CLIENT_ID,
      clientSecret: 'local-secret-value-0123456789abcdef',
      redirectUri: 'http://localhost:3334/auth/google/callback',
      enabled: true,
    },
  };
}

function service(keys: Map<string, KeyObject>) {
  return new GoogleIdTokenService(config(), new LocalJwksProvider(keys));
}

function signToken(
  payload: Record<string, unknown>,
  options: jwt.SignOptions = {},
): string {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: KID,
    issuer: ISSUER,
    audience: CLIENT_ID,
    expiresIn: 300,
    ...options,
  });
}

function base64url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

const validKeys = new Map<string, KeyObject>([[KID, publicKey]]);

describe('GoogleIdTokenService (local RSA/JWKS, no network)', () => {
  it('accepts a valid RS256 token with matching kid/iss/aud/exp/nonce', async () => {
    const token = signToken({
      sub: 'subject-123',
      email: 'Local.User@Example.test',
      email_verified: true,
      nonce: NONCE,
    });
    const claims: GoogleIdentityClaims = await service(validKeys).verify(
      token,
      NONCE,
    );
    expect(claims).toEqual({
      subject: 'subject-123',
      email: 'Local.User@Example.test',
      emailVerified: true,
      nonce: NONCE,
    });
  });

  it('rejects a token signed by an unknown key', async () => {
    const token = signToken({ sub: 's', email_verified: true, nonce: NONCE }, {
      keyid: 'unknown-kid',
    });
    await expect(service(validKeys).verify(token, NONCE)).rejects.toThrow();
  });

  it('rejects a signature made with a different private key for a known kid', async () => {
    const token = jwt.sign(
      { sub: 's', email_verified: true, nonce: NONCE },
      other.privateKey,
      {
        algorithm: 'RS256',
        keyid: KID,
        issuer: ISSUER,
        audience: CLIENT_ID,
        expiresIn: 300,
      },
    );
    await expect(service(validKeys).verify(token, NONCE)).rejects.toThrow();
  });

  it('rejects a wrong issuer', async () => {
    const token = signToken(
      { sub: 's', email_verified: true, nonce: NONCE },
      { issuer: 'https://evil.example' },
    );
    await expect(service(validKeys).verify(token, NONCE)).rejects.toThrow();
  });

  it('rejects a wrong audience', async () => {
    const token = signToken(
      { sub: 's', email_verified: true, nonce: NONCE },
      { audience: 'someone-else.apps.googleusercontent.com' },
    );
    await expect(service(validKeys).verify(token, NONCE)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const token = signToken(
      { sub: 's', email_verified: true, nonce: NONCE },
      { expiresIn: -10 },
    );
    await expect(service(validKeys).verify(token, NONCE)).rejects.toThrow();
  });

  it('rejects a nonce mismatch', async () => {
    const token = signToken({
      sub: 's',
      email_verified: true,
      nonce: 'some-other-nonce',
    });
    await expect(service(validKeys).verify(token, NONCE)).rejects.toThrow();
  });

  it('rejects a token with an unsuitable or missing signing algorithm', async () => {
    const hs256 = jwt.sign(
      { sub: 's', email_verified: true, nonce: NONCE },
      'shared-secret',
      { algorithm: 'HS256', keyid: KID, issuer: ISSUER, audience: CLIENT_ID },
    );
    await expect(service(validKeys).verify(hs256, NONCE)).rejects.toThrow();

    const header = base64url(JSON.stringify({ alg: 'none', kid: KID }));
    const payload = base64url(
      JSON.stringify({ sub: 's', email_verified: true, nonce: NONCE }),
    );
    const algNone = `${header}.${payload}.`;
    await expect(service(validKeys).verify(algNone, NONCE)).rejects.toThrow();

    const noAlgHeader = base64url(JSON.stringify({ kid: KID }));
    const noAlg = `${noAlgHeader}.${payload}.`;
    await expect(service(validKeys).verify(noAlg, NONCE)).rejects.toThrow();
  });
});

// --- Case 8: decoded-but-unverified claims never reach account resolution ---

class CountingUserStore implements UserStore {
  findCalls = 0;
  createCalls = 0;
  findByEmail(): Promise<UserRecord | null> {
    this.findCalls += 1;
    return Promise.resolve(null);
  }
  findById(): Promise<UserRecord | null> {
    this.findCalls += 1;
    return Promise.resolve(null);
  }
  create(): Promise<UserRecord> {
    this.createCalls += 1;
    return Promise.reject(new Error('must not create'));
  }
}

class CountingIdentityStore implements IdentityStore {
  lookups = 0;
  creates = 0;
  findByProviderSubject(): Promise<IdentityRecord | null> {
    this.lookups += 1;
    return Promise.resolve(null);
  }
  create(): Promise<IdentityRecord> {
    this.creates += 1;
    return Promise.reject(new Error('must not create'));
  }
}

const noopSessions = {
  findByTokenHash: () => Promise.resolve(null),
  findById: () => Promise.resolve(null),
  issueSession: () => Promise.reject(new Error('must not issue')),
  rotate: () => Promise.resolve(null),
  revokeAllByToken: () => Promise.resolve(),
} as unknown as SessionStore;

const noopPasswords = {
  hash: () => Promise.resolve('unusable-hash'),
  verify: () => Promise.resolve(false),
};

const noopTokens = {
  signAccessToken: () => 'token',
  verifyAccessToken: () => {
    throw new Error('n/a');
  },
  generateRefreshToken: () => 'refresh-token',
  hashRefreshToken: () => 'refresh-hash',
};

class UnsignedTokenClient implements GoogleTokenClient {
  constructor(private readonly idToken: string) {}
  exchangeCode(): Promise<{ idToken: string }> {
    return Promise.resolve({ idToken: this.idToken });
  }
}

describe('GoogleAuthService rejects unverified claims before account resolution', () => {
  it('never calls identity/user stores for an unsigned token', async () => {
    const cfg = config();
    const transactions = new OAuthTransactionService(cfg);
    const transaction = transactions.create('/en/account', 'en');

    const header = base64url(JSON.stringify({ alg: 'none', kid: KID }));
    const payload = base64url(
      JSON.stringify({
        sub: 'sub-unsigned',
        email: 'attacker@example.test',
        email_verified: true,
        nonce: transaction.nonce,
      }),
    );
    const unsigned = `${header}.${payload}.`;

    const users = new CountingUserStore();
    const identities = new CountingIdentityStore();

    const idTokenService = new GoogleIdTokenService(
      cfg,
      new LocalJwksProvider(validKeys),
    );
    const google = new GoogleAuthService(
      cfg,
      users,
      identities,
      noopSessions,
      noopPasswords,
      noopTokens,
      idTokenService,
      new UnsignedTokenClient(unsigned),
      transactions,
    );

    const result = await google.complete({
      code: 'unsigned-code',
      state: transaction.state,
      txCookie: transactions.serialize(transaction),
    });

    expect(result).toEqual({
      outcome: 'error',
      reason: 'token_validation_failed',
      locale: 'en',
    });
    expect(identities.lookups).toBe(0);
    expect(identities.creates).toBe(0);
    expect(users.findCalls).toBe(0);
    expect(users.createCalls).toBe(0);
  });
});
