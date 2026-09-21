import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import type { Locale } from '@sapiensmetric/contracts';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard } from './access-token.guard.js';
import {
  Argon2PasswordService,
  PASSWORD_SERVICE,
  PasswordService,
} from './password.service.js';
import { JwtTokenService, TOKEN_SERVICE } from './token.service.js';
import { ActionTokenService } from './action-token.service.js';
import { IpRateLimiter } from './ip-rate-limiter.js';
import { MAILER_SERVICE, SmtpMailer } from '../mailer/mailer.service.js';
import {
  MAIL_TRANSPORT,
  MailMessage,
  MailTransport,
} from '../mailer/transport.js';
import { USER_STORE, UserStore, UserRecord } from '../users/user-store.js';
import {
  SESSION_STORE,
  SessionStore,
  SessionRecord,
} from './sessions/session-store.js';
import {
  ACTION_TOKEN_STORE,
  ActionTokenIssueResult,
  ActionTokenPurpose,
  ActionTokenRecord,
  ActionTokenStore,
} from './action-tokens/action-token.store.js';

const ORIGIN = 'http://localhost:3001';
const TEST_SECRET = 'test-secret-that-is-definitely-long-enough-123456';
const PASSWORD = 'a-reasonable-password-123';

type HttpApp = NestFastifyApplication;

function testConfig(): AppConfig {
  return {
    api: { port: 3000 },
    db: { host: '127.0.0.1', port: 3307, database: 'd', username: 'u', password: 'p' },
    cors: { origin: ORIGIN },
    jwt: { secret: TEST_SECRET, accessTokenTtlSeconds: 900 },
    auth: {
      refreshSessionTtlMs: 30 * 24 * 60 * 60 * 1000,
      refreshSessionTtlSeconds: 30 * 24 * 60 * 60,
      cookieSecure: false,
    },
    mail: {
      host: '127.0.0.1',
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
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      enabled: false,
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

  create(data: { email: string; passwordHash: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: randomUUID(),
      email: data.email,
      passwordHash: data.passwordHash,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.map.set(user.id, user);
    return Promise.resolve(user);
  }

  markVerified(id: string): void {
    const user = this.map.get(id);
    if (user) user.emailVerifiedAt = new Date();
  }

  markUnverified(id: string): void {
    const user = this.map.get(id);
    if (user) user.emailVerifiedAt = null;
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
    reason: string,
  ): Promise<SessionRecord> {
    for (const s of this.map.values()) {
      if (s.userId === userId && !s.revokedAt) {
        s.revokedAt = new Date();
        s.revokedReason = reason;
      }
    }
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

  rotate(
    oldTokenHash: string,
    data: { tokenHash: string; expiresAt: Date },
  ): Promise<{ session: SessionRecord; replacedBySessionId: string } | null> {
    let old: SessionRecord | null = null;
    for (const s of this.map.values()) {
      if (s.tokenHash === oldTokenHash) {
        old = s;
        break;
      }
    }
    if (!old || old.revokedAt || old.expiresAt.getTime() < Date.now()) {
      return Promise.resolve(null);
    }
    const newId = randomUUID();
    old.revokedAt = new Date();
    old.revokedReason = 'rotation';
    old.replacedBySessionId = newId;
    const session: SessionRecord = {
      id: newId,
      userId: old.userId,
      tokenHash: data.tokenHash,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
      revokedAt: null,
      replacedBySessionId: null,
      revokedReason: null,
    };
    this.map.set(newId, session);
    return Promise.resolve({ session, replacedBySessionId: newId });
  }

  revokeAllByToken(tokenHash: string, reason: string): Promise<void> {
    let owner: string | null = null;
    for (const s of this.map.values()) {
      if (s.tokenHash === tokenHash) {
        owner = s.userId;
        break;
      }
    }
    if (owner !== null) {
      this.revokeAllForUser(owner, reason);
    }
    return Promise.resolve();
  }

  revokeAllForUser(userId: string, reason: string): void {
    for (const s of this.map.values()) {
      if (s.userId === userId && !s.revokedAt) {
        s.revokedAt = new Date();
        s.revokedReason = reason;
      }
    }
  }

  activeCountForUser(userId: string): number {
    let count = 0;
    for (const s of this.map.values()) {
      if (s.userId === userId && !s.revokedAt) count += 1;
    }
    return count;
  }
}

class InMemoryActionTokenStore implements ActionTokenStore {
  private readonly tokens = new Map<string, ActionTokenRecord>();

  constructor(
    private readonly users: InMemoryUserStore,
    private readonly sessions: InMemorySessionStore,
  ) {}

  async issue(
    userId: string,
    purpose: ActionTokenPurpose,
    tokenHash: string,
    expiresAt: Date,
    cooldownMs: number,
  ): Promise<ActionTokenIssueResult> {
    const latest = [...this.tokens.values()]
      .filter((t) => t.userId === userId && t.purpose === purpose)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (latest && Date.now() - latest.createdAt.getTime() < cooldownMs) {
      return { status: 'cooldown' };
    }
    for (const t of this.tokens.values()) {
      if (t.userId === userId && t.purpose === purpose && !t.consumedAt) {
        t.consumedAt = new Date();
      }
    }
    const id = randomUUID();
    this.tokens.set(id, {
      id,
      userId,
      purpose,
      tokenHash,
      createdAt: new Date(),
      expiresAt,
      consumedAt: null,
    });
    return { status: 'issued', id };
  }

  async deleteById(id: string): Promise<void> {
    this.tokens.delete(id);
  }

  async consumeVerification(tokenHash: string): Promise<boolean> {
    await Promise.resolve();
    const token = [...this.tokens.values()].find(
      (t) =>
        t.tokenHash === tokenHash && t.purpose === 'verify' && !t.consumedAt,
    );
    if (!token || token.expiresAt.getTime() < Date.now()) {
      return false;
    }
    token.consumedAt = new Date();
    this.users.markVerified(token.userId);
    return true;
  }

  async consumeForPasswordReset(
    tokenHash: string,
    passwordHash: string,
  ): Promise<boolean> {
    await Promise.resolve();
    const token = [...this.tokens.values()].find(
      (t) => t.tokenHash === tokenHash && t.purpose === 'reset' && !t.consumedAt,
    );
    if (!token || token.expiresAt.getTime() < Date.now()) {
      return false;
    }
    token.consumedAt = new Date();
    const user = await this.users.findById(token.userId);
    if (user) user.passwordHash = passwordHash;
    this.sessions.revokeAllForUser(token.userId, 'password_reset');
    return true;
  }

  async deleteStale(): Promise<number> {
    let removed = 0;
    for (const [id, t] of this.tokens) {
      if (t.consumedAt || t.expiresAt.getTime() < Date.now()) {
        this.tokens.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  liveCount(): number {
    return [...this.tokens.values()].filter(
      (t) => !t.consumedAt && t.expiresAt.getTime() >= Date.now(),
    ).length;
  }

  /** Test-only: drop all tokens so the surrounding cooldown starts fresh. */
  reset(): void {
    this.tokens.clear();
  }
}

class CountingPasswordService implements PasswordService {
  hashCount = 0;
  private readonly inner = new Argon2PasswordService();

  hash(password: string): Promise<string> {
    this.hashCount += 1;
    return this.inner.hash(password);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return this.inner.verify(password, hash);
  }
}

class FakeTransport implements MailTransport {
  messages: MailMessage[] = [];
  failNext = false;

  send(message: MailMessage): Promise<void> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error('transport rejected before acceptance'));
    }
    this.messages.push(message);
    return Promise.resolve();
  }
}

interface Harness {
  app: HttpApp;
  users: InMemoryUserStore;
  tokens: InMemoryActionTokenStore;
  transport: FakeTransport;
  passwords: CountingPasswordService;
}

async function buildHarness(): Promise<Harness> {
  const users = new InMemoryUserStore();
  const sessions = new InMemorySessionStore();
  const tokens = new InMemoryActionTokenStore(users, sessions);
  const transport = new FakeTransport();
  const passwords = new CountingPasswordService();

  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      AuthService,
      AccessTokenGuard,
      ActionTokenService,
      IpRateLimiter,
      { provide: APP_CONFIG, useValue: testConfig() },
      { provide: USER_STORE, useValue: users },
      { provide: SESSION_STORE, useValue: sessions },
      { provide: ACTION_TOKEN_STORE, useValue: tokens },
      { provide: MAIL_TRANSPORT, useValue: transport },
      { provide: MAILER_SERVICE, useClass: SmtpMailer },
      { provide: PASSWORD_SERVICE, useValue: passwords },
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
  return { app, users, tokens, transport, passwords };
}

function instance(app: HttpApp) {
  return app.getHttpAdapter().getInstance();
}

async function register(
  h: Harness,
  email: string,
  locale: Locale = 'en',
): Promise<void> {
  await instance(h.app).inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password: PASSWORD, locale },
  });
  // Registration now issues and sends a verification email (D-017). Tests that
  // target the explicit request endpoint reset the double so they start from a
  // clean transport and an unconsumed cooldown.
  h.transport.messages.length = 0;
  h.tokens.reset();
}

function tokenFrom(messages: MailMessage[], kind: string): string {
  const message = messages.find((m) =>
    m.text.includes(`/auth/${kind}#token=`),
  );
  if (!message) throw new Error(`no ${kind} message`);
  const match = /#token=([A-Za-z0-9_-]+)/.exec(message.text);
  if (!match) throw new Error(`no token in ${kind} message`);
  return match[1];
}

describe('T-006 email flow (Docker-free, fake transport)', () => {
  let h: Harness;

  beforeEach(async () => {
    h = await buildHarness();
  });

  afterEach(async () => {
    await h.app.close();
  });

  it('returns a generic 202 for an unknown email and sends nothing', async () => {
    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: { email: 'nobody@example.test', locale: 'en' },
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ status: 'accepted' });
    expect(h.transport.messages).toHaveLength(0);
  });

  it('does not issue a verification token for an already verified account', async () => {
    await register(h, 'verified@example.test');
    const user = await h.users.findByEmail('verified@example.test');
    h.users.markVerified(user!.id);
    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: { email: 'verified@example.test', locale: 'lt' },
    });
    expect(res.statusCode).toBe(202);
    expect(h.transport.messages).toHaveLength(0);
  });

  it('verifies an eligible account via the fragment link and then allows login', async () => {
    await register(h, 'user@example.test');
    const request = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: { email: 'user@example.test', locale: 'en' },
    });
    expect(request.statusCode).toBe(202);
    expect(h.transport.messages).toHaveLength(1);
    expect(h.transport.messages[0].text).toContain(
      '/en/auth/verify-email#token=',
    );
    expect(h.transport.messages[0].text).not.toContain('?token=');

    const blocked = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'user@example.test', password: PASSWORD },
    });
    expect(blocked.statusCode).toBe(401);

    const token = tokenFrom(h.transport.messages, 'verify-email');
    const confirm = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/confirm',
      payload: { token },
    });
    expect(confirm.statusCode).toBe(200);
    expect(confirm.json()).toEqual({ status: 'verified' });

    const login = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'user@example.test', password: PASSWORD },
    });
    expect(login.statusCode).toBe(200);
  });

  it('enforces the per-user-and-purpose cooldown without a second send', async () => {
    await register(h, 'cooldown@example.test');
    const body = { email: 'cooldown@example.test', locale: 'en' };
    const first = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: body,
    });
    const second = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: body,
    });
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(202);
    expect(second.json()).toEqual({ status: 'accepted' });
    expect(h.transport.messages).toHaveLength(1);
  });

  it('enforces the in-memory per-IP limit with the same generic 202', async () => {
    const ip = '10.9.9.9';
    for (let i = 0; i < 3; i += 1) {
      await instance(h.app).inject({
        method: 'POST',
        url: '/auth/email-verification/request',
        payload: { email: `unknown-${i}@example.test`, locale: 'en' },
        remoteAddress: ip,
      });
    }
    await register(h, 'limited@example.test');
    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: { email: 'limited@example.test', locale: 'en' },
      remoteAddress: ip,
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ status: 'accepted' });
    expect(h.transport.messages).toHaveLength(0);
  });

  it('rolls back a transport rejection: no usable token, no cooldown consumed', async () => {
    await register(h, 'rejected@example.test');
    const body = { email: 'rejected@example.test', locale: 'en' };

    h.transport.failNext = true;
    const failed = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: body,
    });
    expect(failed.statusCode).toBe(202);
    expect(failed.json()).toEqual({ status: 'accepted' });
    expect(h.tokens.liveCount()).toBe(0);

    const retried = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: body,
    });
    expect(retried.statusCode).toBe(202);
    expect(h.transport.messages).toHaveLength(1);

    const token = tokenFrom(h.transport.messages, 'verify-email');
    const confirm = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/confirm',
      payload: { token },
    });
    expect(confirm.statusCode).toBe(200);
  });

  it('never returns a token, URL, or email address in responses', async () => {
    await register(h, 'quiet@example.test');
    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: { email: 'quiet@example.test', locale: 'en' },
    });
    const serialised = JSON.stringify(res.json());
    expect(serialised).not.toContain('token');
    expect(serialised).not.toContain('http');
    expect(serialised).not.toContain('@');
  });

  it('rejects expired, wrong-purpose, and already-consumed tokens', async () => {
    const created = await h.users.create({
      email: 'store@example.test',
      passwordHash: 'hash',
    });

    await h.tokens.issue(
      created.id,
      'verify',
      'expired-hash',
      new Date(Date.now() - 1000),
      0,
    );
    expect(await h.tokens.consumeVerification('expired-hash')).toBe(false);

    await h.tokens.issue(
      created.id,
      'reset',
      'reset-hash',
      new Date(Date.now() + 60000),
      0,
    );
    expect(await h.tokens.consumeVerification('reset-hash')).toBe(false);

    await h.tokens.issue(
      created.id,
      'verify',
      'single-use-hash',
      new Date(Date.now() + 60000),
      0,
    );
    expect(await h.tokens.consumeVerification('single-use-hash')).toBe(true);
    expect(await h.tokens.consumeVerification('single-use-hash')).toBe(false);
  });

  it('invalidates the previous unused token when a new one is issued', async () => {
    const created = await h.users.create({
      email: 'replace@example.test',
      passwordHash: 'hash',
    });
    await h.tokens.issue(
      created.id,
      'verify',
      'old-hash',
      new Date(Date.now() + 60000),
      0,
    );
    await h.tokens.issue(
      created.id,
      'verify',
      'new-hash',
      new Date(Date.now() + 60000),
      0,
    );
    expect(await h.tokens.consumeVerification('old-hash')).toBe(false);
    expect(await h.tokens.consumeVerification('new-hash')).toBe(true);
  });

  it('allows exactly one success when a token is consumed concurrently', async () => {
    const created = await h.users.create({
      email: 'race@example.test',
      passwordHash: 'hash',
    });
    await h.tokens.issue(
      created.id,
      'verify',
      'race-hash',
      new Date(Date.now() + 60000),
      0,
    );
    const results = await Promise.all([
      h.tokens.consumeVerification('race-hash'),
      h.tokens.consumeVerification('race-hash'),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('password reset changes the password, consumes the token, and revokes all sessions', async () => {
    await register(h, 'reset@example.test');
    const user = await h.users.findByEmail('reset@example.test');
    h.users.markVerified(user!.id);

    const login = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'reset@example.test', password: PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    const accessToken = login.json().accessToken;

    const request = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/password-reset/request',
      payload: { email: 'reset@example.test', locale: 'lt' },
    });
    expect(request.statusCode).toBe(202);
    const token = tokenFrom(h.transport.messages, 'reset-password');

    const confirm = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      payload: { token, password: 'a-brand-new-password-456' },
    });
    expect(confirm.statusCode).toBe(200);
    expect(confirm.json()).toEqual({ status: 'reset' });

    const me = await instance(h.app).inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(401);

    const oldLogin = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'reset@example.test', password: PASSWORD },
    });
    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'reset@example.test',
        password: 'a-brand-new-password-456',
      },
    });
    expect(newLogin.statusCode).toBe(200);

    const replay = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      payload: { token, password: 'yet-another-password-789' },
    });
    expect(replay.statusCode).toBe(400);
  });

  it('limits password-reset confirmation per IP before Argon2 hashing', async () => {
    const ip = '10.1.1.1';
    const before = h.passwords.hashCount;

    for (let i = 0; i < 5; i += 1) {
      const res = await instance(h.app).inject({
        method: 'POST',
        url: '/auth/password-reset/confirm',
        payload: { token: `unknown-token-${i}`, password: PASSWORD },
        remoteAddress: ip,
      });
      expect(res.statusCode).toBe(400);
    }
    expect(h.passwords.hashCount - before).toBe(5);

    const limited = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      payload: { token: 'unknown-token-6', password: PASSWORD },
      remoteAddress: ip,
    });
    expect(limited.statusCode).toBe(400);
    expect(h.passwords.hashCount - before).toBe(5);
  });

  it('uses a fragment (never a query string) for reset links', async () => {
    await register(h, 'fragment@example.test');
    await instance(h.app).inject({
      method: 'POST',
      url: '/auth/password-reset/request',
      payload: { email: 'fragment@example.test', locale: 'lt' },
    });
    const message = h.transport.messages[0];
    expect(message.text).toContain('/lt/auth/reset-password#token=');
    expect(message.text).not.toContain('?token=');
  });

  it('records no secret, token, or URL in captured console output on failure', async () => {
    const output: string[] = [];
    const spies = [
      vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        output.push(args.map(String).join(' '));
      }),
      vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
        output.push(args.map(String).join(' '));
      }),
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        output.push(args.map(String).join(' '));
      }),
    ];
    try {
      await register(h, 'logcheck@example.test');
      h.transport.failNext = true;
      await instance(h.app).inject({
        method: 'POST',
        url: '/auth/email-verification/request',
        payload: { email: 'logcheck@example.test', locale: 'en' },
      });
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
    const joined = output.join('\n');
    expect(joined).not.toContain('http');
    expect(joined).not.toContain('token=');
    expect(joined).not.toContain('@');
  });
});
