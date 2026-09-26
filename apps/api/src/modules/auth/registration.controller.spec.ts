import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { Argon2PasswordService, PASSWORD_SERVICE } from './password.service.js';
import { JwtTokenService, TOKEN_SERVICE } from './token.service.js';
import { ActionTokenService } from './action-token.service.js';
import { IpRateLimiter } from './ip-rate-limiter.js';
import { MAILER_SERVICE, SmtpMailer } from '../mailer/mailer.service.js';
import { MAIL_TRANSPORT, MailMessage, MailTransport } from '../mailer/transport.js';
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

const ORIGIN = 'http://localhost:3333';
const TEST_SECRET = 'test-secret-that-is-definitely-long-enough-123456';
const PASSWORD = 'a-reasonable-password-123';

type HttpApp = NestFastifyApplication;

function testConfig(): AppConfig {
  return {
    api: { port: 3000 },
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
      emailVerifiedAt: null,
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
    if (!old || old.revokedAt) return Promise.resolve(null);
    old.revokedAt = new Date();
    const session: SessionRecord = {
      id: randomUUID(),
      userId: old.userId,
      tokenHash: data.tokenHash,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
      revokedAt: null,
      replacedBySessionId: null,
      revokedReason: null,
    };
    old.replacedBySessionId = session.id;
    this.map.set(session.id, session);
    return Promise.resolve({ session, replacedBySessionId: session.id });
  }

  revokeAllByToken(tokenHash: string, reason: string): Promise<void> {
    let owner: string | null = null;
    for (const s of this.map.values()) {
      if (s.tokenHash === tokenHash) {
        owner = s.userId;
        break;
      }
    }
    for (const s of this.map.values()) {
      if (owner !== null && s.userId === owner && !s.revokedAt) {
        s.revokedAt = new Date();
        s.revokedReason = reason;
      }
    }
    return Promise.resolve();
  }
}

class InMemoryActionTokenStore implements ActionTokenStore {
  private readonly tokens = new Map<string, ActionTokenRecord>();
  public issuedCount = 0;

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
    this.issuedCount += 1;
    return { status: 'issued', id };
  }

  async deleteById(id: string): Promise<void> {
    this.tokens.delete(id);
  }

  async consumeVerification(tokenHash: string): Promise<boolean> {
    const token = [...this.tokens.values()].find(
      (t) =>
        t.tokenHash === tokenHash && t.purpose === 'verify' && !t.consumedAt,
    );
    if (!token || token.expiresAt.getTime() < Date.now()) return false;
    token.consumedAt = new Date();
    return true;
  }

  async consumeForPasswordReset(): Promise<boolean> {
    return false;
  }

  async deleteStale(): Promise<number> {
    return 0;
  }

  liveCount(): number {
    return [...this.tokens.values()].filter(
      (t) => !t.consumedAt && t.expiresAt.getTime() >= Date.now(),
    ).length;
  }
}

class CountingTransport implements MailTransport {
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
  transport: CountingTransport;
}

async function buildHarness(): Promise<Harness> {
  const users = new InMemoryUserStore();
  const tokens = new InMemoryActionTokenStore();
  const transport = new CountingTransport();

  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      AuthService,
      AccessTokenGuard,
      ActionTokenService,
      IpRateLimiter,
      { provide: APP_CONFIG, useValue: testConfig() },
      { provide: USER_STORE, useValue: users },
      { provide: SESSION_STORE, useValue: new InMemorySessionStore() },
      { provide: ACTION_TOKEN_STORE, useValue: tokens },
      { provide: MAIL_TRANSPORT, useValue: transport },
      { provide: MAILER_SERVICE, useClass: SmtpMailer },
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
  return { app, users, tokens, transport };
}

function instance(app: HttpApp) {
  return app.getHttpAdapter().getInstance();
}

function registerPayload(email: string, locale: string) {
  return { email, password: PASSWORD, locale };
}

describe('T-008 conventional registration (Docker-free, fake transport)', () => {
  let h: Harness;

  beforeEach(async () => {
    h = await buildHarness();
  });

  afterEach(async () => {
    await h.app.close();
  });

  it('creates an unverified account and issues exactly one verification email', async () => {
    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/register',
      payload: registerPayload('new@example.test', 'lt'),
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ status: 'accepted' });

    expect(h.transport.messages).toHaveLength(1);
    expect(h.transport.messages[0].text).toContain(
      '/lt/auth/verify-email#token=',
    );
    expect(h.transport.messages[0].text).not.toContain('?token=');
    expect(h.tokens.issuedCount).toBe(1);

    const user = await h.users.findByEmail('new@example.test');
    expect(user?.emailVerifiedAt).toBeNull();
  });

  it('defaults the verification email locale to English when omitted', async () => {
    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'default@example.test', password: PASSWORD },
    });
    expect(res.statusCode).toBe(202);
    expect(h.transport.messages[0].text).toContain(
      '/en/auth/verify-email#token=',
    );
  });

  it('returns an explicit conflict for an already-registered email', async () => {
    await instance(h.app).inject({
      method: 'POST',
      url: '/auth/register',
      payload: registerPayload('dupe@example.test', 'en'),
    });
    expect(h.transport.messages).toHaveLength(1);
    expect(h.tokens.issuedCount).toBe(1);

    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/register',
      payload: registerPayload('dupe@example.test', 'en'),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
      message: expect.any(String),
    });
    // No second email and no second token for the duplicate attempt.
    expect(h.transport.messages).toHaveLength(1);
    expect(h.tokens.issuedCount).toBe(1);
    expect(h.users.countByEmail('dupe@example.test')).toBe(1);
  });

  it('keeps concurrency correct: one user, one 202, one email', async () => {
    const [a, b] = await Promise.all([
      instance(h.app).inject({
        method: 'POST',
        url: '/auth/register',
        payload: registerPayload('race@example.test', 'en'),
      }),
      instance(h.app).inject({
        method: 'POST',
        url: '/auth/register',
        payload: registerPayload('race@example.test', 'en'),
      }),
    ]);
    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([202, 409]);
    expect(h.users.countByEmail('race@example.test')).toBe(1);
    expect(h.transport.messages).toHaveLength(1);
    expect(h.tokens.issuedCount).toBe(1);
  });

  it('reports a recoverable failure when the verification email cannot be sent', async () => {
    h.transport.failNext = true;
    const res = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/register',
      payload: registerPayload('failed@example.test', 'en'),
    });
    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({
      statusCode: 502,
      code: 'VERIFICATION_EMAIL_DELIVERY_FAILED',
      message: expect.any(String),
    });

    // Account exists and stays unverified; no usable token and no email.
    const user = await h.users.findByEmail('failed@example.test');
    expect(user?.emailVerifiedAt).toBeNull();
    expect(h.tokens.liveCount()).toBe(0);
    expect(h.transport.messages).toHaveLength(0);

    // The unverified login gate is preserved.
    const blocked = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'failed@example.test', password: PASSWORD },
    });
    expect(blocked.statusCode).toBe(401);

    // Recoverable via the resend-verification flow.
    const resend = await instance(h.app).inject({
      method: 'POST',
      url: '/auth/email-verification/request',
      payload: { email: 'failed@example.test', locale: 'en' },
    });
    expect(resend.statusCode).toBe(202);
    expect(h.transport.messages).toHaveLength(1);
  });
});
