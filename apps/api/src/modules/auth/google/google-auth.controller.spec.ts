import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../../../config/env.js';
import { AuthController } from '../auth.controller.js';
import { AuthService } from '../auth.service.js';
import { AccessTokenGuard } from '../access-token.guard.js';
import { Argon2PasswordService, PASSWORD_SERVICE } from '../password.service.js';
import { JwtTokenService, TOKEN_SERVICE } from '../token.service.js';
import { ActionTokenService } from '../action-token.service.js';
import { IpRateLimiter } from '../ip-rate-limiter.js';
import { MAILER_SERVICE, SmtpMailer } from '../../mailer/mailer.service.js';
import { MAIL_TRANSPORT, MailTransport } from '../../mailer/transport.js';
import { USER_STORE, UserStore, UserRecord } from '../../users/user-store.js';
import {
  SESSION_STORE,
  SessionStore,
  SessionRecord,
} from '../sessions/session-store.js';
import {
  ACTION_TOKEN_STORE,
  ActionTokenIssueResult,
  ActionTokenStore,
} from '../action-tokens/action-token.store.js';
import {
  IDENTITY_STORE,
  IdentityRecord,
  IdentityStore,
} from '../identities/identity-store.js';
import { GoogleAuthController } from './google-auth.controller.js';
import { GoogleAuthService } from './google-auth.service.js';
import {
  OAuthTransactionService,
  OAUTH_TX_COOKIE_NAME,
} from './oauth-transaction.service.js';
import {
  GOOGLE_ID_TOKEN_VERIFIER,
  GoogleIdentityClaims,
  GoogleIdTokenVerifier,
} from './google-id-token.service.js';
import { GOOGLE_TOKEN_CLIENT, GoogleTokenClient } from './google-token.client.js';

const ORIGIN = 'http://localhost:3333';
const API = 'http://localhost:3334';
const REDIRECT = `${API}/auth/google/callback`;
const TEST_SECRET = 'test-secret-that-is-definitely-long-enough-123456';
const PASSWORD = 'a-reasonable-password-123';

type HttpApp = NestFastifyApplication;

function testConfig(googleEnabled = true): AppConfig {
  return {
    api: { port: 3334 },
    db: {
      host: '127.0.0.1',
      port: 3307,
      database: 'd',
      username: 'u',
      password: 'p',
    },
    cors: { origin: ORIGIN },
    jwt: { secret: TEST_SECRET, accessTokenTtlSeconds: 900 },
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
      clientId: 'client-123.apps.googleusercontent.com',
      clientSecret: 'client-secret-value-for-tests-0123456789',
      redirectUri: REDIRECT,
      enabled: googleEnabled,
    },
  };
}

class InMemoryUserStore implements UserStore {
  private readonly map = new Map<string, UserRecord>();

  findByEmail(email: string): Promise<UserRecord | null> {
    for (const u of this.map.values()) {
      if (u.email === email) return Promise.resolve(u);
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<UserRecord | null> {
    return Promise.resolve(this.map.get(id) ?? null);
  }

  create(data: {
    email: string;
    passwordHash: string;
    emailVerifiedAt?: Date | null;
  }): Promise<UserRecord> {
    for (const u of this.map.values()) {
      if (u.email === data.email) {
        const error = new Error('duplicate email') as Error & { code: string };
        error.code = 'ER_DUP_ENTRY';
        return Promise.reject(error);
      }
    }
    const user: UserRecord = {
      id: randomUUID(),
      email: data.email,
      passwordHash: data.passwordHash,
      emailVerifiedAt: data.emailVerifiedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.map.set(user.id, user);
    return Promise.resolve(user);
  }

  countByEmail(email: string): number {
    let count = 0;
    for (const u of this.map.values()) {
      if (u.email === email) count += 1;
    }
    return count;
  }
}

class InMemoryIdentityStore implements IdentityStore {
  private readonly map = new Map<string, IdentityRecord>();
  hideNext = false;

  findByProviderSubject(
    provider: string,
    subject: string,
  ): Promise<IdentityRecord | null> {
    if (this.hideNext) {
      this.hideNext = false;
      return Promise.resolve(null);
    }
    for (const i of this.map.values()) {
      if (i.provider === provider && i.subject === subject) {
        return Promise.resolve(i);
      }
    }
    return Promise.resolve(null);
  }

  create(data: {
    userId: string;
    provider: string;
    subject: string;
  }): Promise<IdentityRecord> {
    for (const i of this.map.values()) {
      if (i.provider === data.provider && i.subject === data.subject) {
        const error = new Error('duplicate identity') as Error & { code: string };
        error.code = 'ER_DUP_ENTRY';
        return Promise.reject(error);
      }
    }
    const identity: IdentityRecord = {
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    this.map.set(identity.id, identity);
    return Promise.resolve(identity);
  }

  countForSubject(provider: string, subject: string): number {
    let count = 0;
    for (const i of this.map.values()) {
      if (i.provider === provider && i.subject === subject) count += 1;
    }
    return count;
  }

  list(): IdentityRecord[] {
    return [...this.map.values()];
  }
}

class InMemorySessionStore implements SessionStore {
  private readonly map = new Map<string, SessionRecord>();

  findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    for (const s of this.map.values()) {
      if (s.tokenHash === tokenHash) return Promise.resolve(s);
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<SessionRecord | null> {
    return Promise.resolve(this.map.get(id) ?? null);
  }

  issueSession(
    userId: string,
    data: { tokenHash: string; expiresAt: Date },
  ): Promise<SessionRecord> {
    const session: SessionRecord = {
      id: randomUUID(),
      userId,
      tokenHash: data.tokenHash,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
      revokedAt: null,
      replacedBySessionId: null,
      revokedReason: null,
    };
    this.map.set(session.id, session);
    return Promise.resolve(session);
  }

  rotate(): Promise<null> {
    return Promise.resolve(null);
  }

  revokeAllByToken(): Promise<void> {
    return Promise.resolve();
  }

  count(): number {
    return this.map.size;
  }
}

const stubActionTokenStore: ActionTokenStore = {
  issue: (): Promise<ActionTokenIssueResult> =>
    Promise.resolve({ status: 'issued', id: 'stub' }),
  deleteById: (): Promise<void> => Promise.resolve(),
  consumeVerification: (): Promise<boolean> => Promise.resolve(false),
  consumeForPasswordReset: (): Promise<boolean> => Promise.resolve(false),
  deleteStale: (): Promise<number> => Promise.resolve(0),
};

const stubTransport: MailTransport = { send: () => Promise.resolve() };

class FakeIdTokenVerifier implements GoogleIdTokenVerifier {
  claims = new Map<string, GoogleIdentityClaims>();
  failNext = false;

  verify(idToken: string, expectedNonce: string): Promise<GoogleIdentityClaims> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error('invalid id token'));
    }
    const found = this.claims.get(idToken);
    if (!found) return Promise.reject(new Error('unknown id token'));
    if (found.nonce !== expectedNonce) {
      return Promise.reject(new Error('nonce mismatch'));
    }
    return Promise.resolve(found);
  }
}

class FakeTokenClient implements GoogleTokenClient {
  exchangeCode(input: { code: string }): Promise<{ idToken: string }> {
    return Promise.resolve({ idToken: input.code });
  }
}

interface Harness {
  app: HttpApp;
  users: InMemoryUserStore;
  identities: InMemoryIdentityStore;
  sessions: InMemorySessionStore;
  verifier: FakeIdTokenVerifier;
  transactions: OAuthTransactionService;
}

async function buildHarness(googleEnabled = true): Promise<Harness> {
  const users = new InMemoryUserStore();
  const identities = new InMemoryIdentityStore();
  const sessions = new InMemorySessionStore();
  const verifier = new FakeIdTokenVerifier();

  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController, GoogleAuthController],
    providers: [
      AuthService,
      GoogleAuthService,
      OAuthTransactionService,
      AccessTokenGuard,
      ActionTokenService,
      IpRateLimiter,
      { provide: APP_CONFIG, useValue: testConfig(googleEnabled) },
      { provide: USER_STORE, useValue: users },
      { provide: IDENTITY_STORE, useValue: identities },
      { provide: SESSION_STORE, useValue: sessions },
      { provide: ACTION_TOKEN_STORE, useValue: stubActionTokenStore },
      { provide: MAIL_TRANSPORT, useValue: stubTransport },
      { provide: MAILER_SERVICE, useClass: SmtpMailer },
      { provide: GOOGLE_ID_TOKEN_VERIFIER, useValue: verifier },
      { provide: GOOGLE_TOKEN_CLIENT, useValue: new FakeTokenClient() },
      { provide: PASSWORD_SERVICE, useClass: Argon2PasswordService },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  await app.register(fastifyCookie);
  app.enableCors({ origin: ORIGIN, credentials: true });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return {
    app,
    users,
    identities,
    sessions,
    verifier,
    transactions: app.get(OAuthTransactionService),
  };
}

function instance(app: HttpApp) {
  return app.getHttpAdapter().getInstance();
}

function cookieValue(
  response: { headers: Record<string, unknown> },
  name: string,
): string | undefined {
  const raw = response.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : [raw].filter(Boolean);
  const found = list.find(
    (c) => typeof c === 'string' && c.startsWith(`${name}=`),
  );
  return found ? (found as string).split(';')[0].split('=')[1] : undefined;
}

async function startFlow(
  h: Harness,
  options: { locale?: string; returnTo?: string } = {},
) {
  const params = new URLSearchParams({ locale: options.locale ?? 'en' });
  if (options.returnTo) params.set('returnTo', options.returnTo);
  const res = await instance(h.app).inject({
    method: 'GET',
    url: `/auth/google/start?${params.toString()}`,
  });
  const value = cookieValue(res, OAUTH_TX_COOKIE_NAME);
  const tx = value ? h.transactions.verify(value) : null;
  return { res, cookieValue: value, tx };
}

async function runCallback(
  h: Harness,
  input: {
    code: string;
    txCookieValue: string;
    state: string;
    claims: Omit<GoogleIdentityClaims, 'nonce'> & { nonce?: string };
  },
) {
  const tx = h.transactions.verify(input.txCookieValue);
  h.verifier.claims.set(input.code, {
    ...input.claims,
    nonce: input.claims.nonce ?? tx!.nonce,
  });
  return instance(h.app).inject({
    method: 'GET',
    url: `/auth/google/callback?code=${encodeURIComponent(input.code)}&state=${encodeURIComponent(input.state)}`,
    headers: { cookie: `${OAUTH_TX_COOKIE_NAME}=${input.txCookieValue}` },
  });
}

describe('T-007 Google OAuth (Docker-free, fakes)', () => {
  let h: Harness;

  beforeEach(async () => {
    h = await buildHarness();
  });

  afterEach(async () => {
    await h.app.close();
  });

  it('reports availability', async () => {
    const res = await instance(h.app).inject({
      method: 'GET',
      url: '/auth/google/status',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ available: true });
  });

  it('starts the flow with a signed transaction cookie', async () => {
    const { res, tx, cookieValue: value } = await startFlow(h, {
      locale: 'lt',
      returnTo: '/lt/account',
    });
    expect(res.statusCode).toBe(302);
    expect(String(res.headers.location)).toContain(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    const rawCookies = res.headers['set-cookie'];
    const cookieList = Array.isArray(rawCookies)
      ? rawCookies
      : [String(rawCookies)];
    const txHeader = cookieList.find((c) =>
      c.startsWith(`${OAUTH_TX_COOKIE_NAME}=`),
    );
    expect(txHeader).toBeDefined();
    expect(txHeader).toContain('HttpOnly');
    expect(value).toBeTruthy();
    expect(tx?.locale).toBe('lt');
    expect(tx?.returnTo).toBe('/lt/account');
  });

  it('allows only a safe same-origin returnTo', async () => {
    const { tx } = await startFlow(h, { returnTo: 'https://evil.example/steal' });
    expect(tx?.returnTo).toBe('/en/account');
  });

  it('propagates the login-query returnTo through start, transaction, and callback', async () => {
    // Mirrors /en/auth/login?returnTo=%2Fen%2Faccount -> Google button -> API.
    const { tx, cookieValue: value } = await startFlow(h, {
      locale: 'en',
      returnTo: '/en/account',
    });
    expect(tx?.returnTo).toBe('/en/account');
    const res = await runCallback(h, {
      code: 'code-return-en',
      txCookieValue: value!,
      state: tx!.state,
      claims: {
        subject: 'sub-return-en',
        email: 'return-en@example.test',
        emailVerified: true,
      },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`${ORIGIN}/en/account`);
  });

  it('defaults LT and EN targets when no returnTo is supplied', async () => {
    for (const locale of ['lt', 'en'] as const) {
      const fresh = await buildHarness();
      try {
        const { tx, cookieValue: value } = await startFlow(fresh, { locale });
        expect(tx?.returnTo).toBe(`/${locale}/account`);
        const res = await runCallback(fresh, {
          code: `code-default-${locale}`,
          txCookieValue: value!,
          state: tx!.state,
          claims: {
            subject: `sub-default-${locale}`,
            email: `default-${locale}@example.test`,
            emailVerified: true,
          },
        });
        expect(res.headers.location).toBe(`${ORIGIN}/${locale}/account`);
      } finally {
        await fresh.app.close();
      }
    }
  });

  it('rejects external/malformed returnTo and redirects to the safe default', async () => {
    const badValues = [
      'https://evil.example/steal',
      '//evil.example',
      'javascript:alert(1)',
      '/\\evil',
      'relative/path',
    ];
    for (const [index, bad] of badValues.entries()) {
      const { tx, cookieValue: value } = await startFlow(h, {
        locale: 'en',
        returnTo: bad,
      });
      expect(tx?.returnTo).toBe('/en/account');
      const res = await runCallback(h, {
        code: `code-bad-${index}`,
        txCookieValue: value!,
        state: tx!.state,
        claims: {
          subject: `sub-bad-${index}`,
          email: `bad-${index}@example.test`,
          emailVerified: true,
        },
      });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(`${ORIGIN}/en/account`);
    }
  });

  it('signs in to an existing linked user by immutable sub', async () => {
    const user = await h.users.create({
      email: 'linked@example.test',
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
    });
    await h.identities.create({
      userId: user.id,
      provider: 'google',
      subject: 'sub-existing',
    });
    const { tx, cookieValue: value } = await startFlow(h);
    const res = await runCallback(h, {
      code: 'code-existing',
      txCookieValue: value!,
      state: tx!.state,
      claims: {
        subject: 'sub-existing',
        // Different email must not matter: identity is matched by sub only.
        email: 'somethingelse@example.test',
        emailVerified: true,
      },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`${ORIGIN}/en/account`);
    expect(cookieValue(res, 'sm_refresh')).toBeTruthy();
    expect(h.users.countByEmail('somethingelse@example.test')).toBe(0);
  });

  it('creates one verified user for a new verified identity with no local match', async () => {
    const { tx, cookieValue: value } = await startFlow(h, { locale: 'lt' });
    const res = await runCallback(h, {
      code: 'code-new',
      txCookieValue: value!,
      state: tx!.state,
      claims: {
        subject: 'sub-new',
        email: 'New.User@Example.test',
        emailVerified: true,
      },
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`${ORIGIN}/lt/account`);
    const user = await h.users.findByEmail('new.user@example.test');
    expect(user).not.toBeNull();
    expect(user?.emailVerifiedAt).not.toBeNull();
    expect(h.identities.countForSubject('google', 'sub-new')).toBe(1);
  });

  it('auto-links a new identity to a matching verified credentials user', async () => {
    const existing = await h.users.create({
      email: 'both@example.test',
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
    });
    const { tx, cookieValue: value } = await startFlow(h);
    const res = await runCallback(h, {
      code: 'code-link',
      txCookieValue: value!,
      state: tx!.state,
      claims: {
        subject: 'sub-link',
        email: 'both@example.test',
        emailVerified: true,
      },
    });
    expect(res.statusCode).toBe(302);
    expect(h.users.countByEmail('both@example.test')).toBe(1);
    const identities = h.identities.list();
    expect(identities).toHaveLength(1);
    expect(identities[0].userId).toBe(existing.id);
  });

  it('rejects an unverified Google email and creates nothing', async () => {
    const { tx, cookieValue: value } = await startFlow(h);
    const res = await runCallback(h, {
      code: 'code-unverified-google',
      txCookieValue: value!,
      state: tx!.state,
      claims: {
        subject: 'sub-unverified',
        email: 'unverified@example.test',
        emailVerified: false,
      },
    });
    expect(res.statusCode).toBe(302);
    expect(String(res.headers.location)).toContain('googleError=account_rejected');
    expect(h.users.countByEmail('unverified@example.test')).toBe(0);
    expect(h.sessions.count()).toBe(0);
  });

  it('rejects when the Google email is missing', async () => {
    const { tx, cookieValue: value } = await startFlow(h);
    const res = await runCallback(h, {
      code: 'code-noemail',
      txCookieValue: value!,
      state: tx!.state,
      claims: { subject: 'sub-noemail', email: null, emailVerified: true },
    });
    expect(res.statusCode).toBe(302);
    expect(String(res.headers.location)).toContain('googleError=account_rejected');
    expect(h.identities.list()).toHaveLength(0);
  });

  it('rejects a match to an unverified local user and does not link', async () => {
    await h.users.create({
      email: 'pending@example.test',
      passwordHash: 'hash',
      emailVerifiedAt: null,
    });
    const { tx, cookieValue: value } = await startFlow(h);
    const res = await runCallback(h, {
      code: 'code-pending',
      txCookieValue: value!,
      state: tx!.state,
      claims: {
        subject: 'sub-pending',
        email: 'pending@example.test',
        emailVerified: true,
      },
    });
    expect(res.statusCode).toBe(302);
    expect(String(res.headers.location)).toContain('googleError=account_rejected');
    expect(h.identities.list()).toHaveLength(0);
  });

  it('never reassigns a Google sub already linked to another user', async () => {
    const other = await h.users.create({
      email: 'other@example.test',
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
    });
    await h.identities.create({
      userId: other.id,
      provider: 'google',
      subject: 'sub-conflict',
    });
    const matching = await h.users.create({
      email: 'match@example.test',
      passwordHash: 'hash',
      emailVerifiedAt: new Date(),
    });
    h.identities.hideNext = true; // forces the create-path conflict handling
    const { tx, cookieValue: value } = await startFlow(h);
    const res = await runCallback(h, {
      code: 'code-conflict',
      txCookieValue: value!,
      state: tx!.state,
      claims: {
        subject: 'sub-conflict',
        email: 'match@example.test',
        emailVerified: true,
      },
    });
    expect(res.statusCode).toBe(302);
    expect(String(res.headers.location)).toContain('googleError=account_rejected');
    expect(h.identities.countForSubject('google', 'sub-conflict')).toBe(1);
    expect(h.identities.list()[0].userId).toBe(other.id);
    expect(h.users.countByEmail('match@example.test')).toBe(1);
    expect(matching.id).not.toBe(other.id);
  });

  it('creates exactly one user/identity under concurrent first sign-in', async () => {
    const started = await Promise.all([startFlow(h), startFlow(h)]);
    const results = await Promise.all(
      started.map((s, index) =>
        runCallback(h, {
          code: `code-race-${index}`,
          txCookieValue: s.cookieValue!,
          state: s.tx!.state,
          claims: {
            subject: 'sub-race',
            email: 'race-google@example.test',
            emailVerified: true,
          },
        }),
      ),
    );
    expect(results.every((r) => r.statusCode === 302)).toBe(true);
    expect(h.users.countByEmail('race-google@example.test')).toBe(1);
    expect(h.identities.countForSubject('google', 'sub-race')).toBe(1);
    expect(h.sessions.count()).toBe(2); // one session per completed sign-in
  });

  it('rejects an invalid/absent transaction cookie', async () => {
    const res = await instance(h.app).inject({
      method: 'GET',
      url: '/auth/google/callback?code=x&state=y',
    });
    expect(res.statusCode).toBe(302);
    expect(String(res.headers.location)).toContain(
      'googleError=invalid_transaction',
    );
    expect(h.sessions.count()).toBe(0);
  });

  it('rejects a state mismatch', async () => {
    const { tx, cookieValue: value } = await startFlow(h);
    const res = await runCallback(h, {
      code: 'code-state',
      txCookieValue: value!,
      state: `${tx!.state}-tampered`,
      claims: { subject: 'sub-state', email: 'state@example.test', emailVerified: true },
    });
    expect(String(res.headers.location)).toContain('googleError=state_mismatch');
    expect(h.identities.list()).toHaveLength(0);
  });

  it('rejects when ID-token validation fails and links nothing', async () => {
    const { tx, cookieValue: value } = await startFlow(h);
    h.verifier.failNext = true;
    const res = await instance(h.app).inject({
      method: 'GET',
      url: `/auth/google/callback?code=bad&state=${encodeURIComponent(tx!.state)}`,
      headers: { cookie: `${OAUTH_TX_COOKIE_NAME}=${value}` },
    });
    expect(String(res.headers.location)).toContain(
      'googleError=token_validation_failed',
    );
    expect(h.users.countByEmail('bad@example.test')).toBe(0);
    expect(h.identities.list()).toHaveLength(0);
    expect(h.sessions.count()).toBe(0);
  });

  it('keeps Google UI unavailable without breaking password auth when disabled', async () => {
    const disabled = await buildHarness(false);
    try {
      const status = await instance(disabled.app).inject({
        method: 'GET',
        url: '/auth/google/status',
      });
      expect(status.json()).toEqual({ available: false });

      const start = await instance(disabled.app).inject({
        method: 'GET',
        url: '/auth/google/start?locale=en',
      });
      expect(start.statusCode).toBe(503);
      expect(start.json()).toEqual({
        statusCode: 503,
        code: 'GOOGLE_OAUTH_UNAVAILABLE',
        message: expect.any(String),
      });

      // Password registration/login still work with Google disabled.
      const registered = await instance(disabled.app).inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'pw@example.test', password: PASSWORD, locale: 'en' },
      });
      expect(registered.statusCode).toBe(202);
      const user = await disabled.users.findByEmail('pw@example.test');
      expect(user?.emailVerifiedAt).toBeNull();
    } finally {
      await disabled.app.close();
    }
  });
});
