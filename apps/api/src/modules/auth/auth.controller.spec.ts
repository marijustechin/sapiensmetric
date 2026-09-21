import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { Argon2PasswordService, PASSWORD_SERVICE } from './password.service.js';
import { JwtTokenService, TOKEN_SERVICE } from './token.service.js';
import {
  USER_STORE,
  UserStore,
  UserRecord,
} from '../users/user-store.js';
import {
  SESSION_STORE,
  SessionStore,
  SessionRecord,
} from './sessions/session-store.js';
import { ActionTokenService } from './action-token.service.js';
import { IpRateLimiter } from './ip-rate-limiter.js';
import { MAILER_SERVICE, SmtpMailer } from '../mailer/mailer.service.js';
import { MAIL_TRANSPORT, MailTransport } from '../mailer/transport.js';
import {
  ACTION_TOKEN_STORE,
  ActionTokenStore,
} from './action-tokens/action-token.store.js';

const stubActionTokenStore: ActionTokenStore = {
  issue: () => Promise.resolve({ status: 'issued' as const, id: 'stub' }),
  deleteById: () => Promise.resolve(),
  consumeVerification: () => Promise.resolve(false),
  consumeForPasswordReset: () => Promise.resolve(false),
  deleteStale: () => Promise.resolve(0),
};

const stubTransport: MailTransport = { send: () => Promise.resolve() };

const ORIGIN = 'http://localhost:3001';
const TEST_SECRET = 'test-secret-that-is-definitely-long-enough-123456';

function testConfig(): AppConfig {
  return {
    api: { port: 3000 },
    db: { host: '127.0.0.1', port: 3307, database: 'd', username: 'u', password: 'p' },
    cors: { origin: ORIGIN },
    jwt: {
      secret: TEST_SECRET,
      accessTokenTtlSeconds: 900,
    },
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
    tokens: {
      verificationTtlSeconds: 86400,
      passwordResetTtlSeconds: 1800,
    },
    publicAppUrl: ORIGIN,
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
        throw error;
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

  markVerified(id: string): void {
    const user = this.map.get(id);
    if (user) {
      user.emailVerifiedAt = new Date();
    }
  }

  markUnverified(id: string): void {
    const user = this.map.get(id);
    if (user) {
      user.emailVerifiedAt = null;
    }
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

  // All mutation methods below run synchronously (no await inside), so they
  // are atomic within the single-threaded event loop and reproduce the
  // database's per-user-lock race-safe semantics.

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
    if (owner === null) {
      return Promise.resolve();
    }
    for (const s of this.map.values()) {
      if (s.userId === owner && !s.revokedAt) {
        s.revokedAt = new Date();
        s.revokedReason = reason;
      }
    }
    return Promise.resolve();
  }

  activeCountForUser(userId: string): number {
    let count = 0;
    for (const s of this.map.values()) {
      if (s.userId === userId && !s.revokedAt) count += 1;
    }
    return count;
  }
}

describe('AuthController (Docker-free HTTP)', () => {
  let app: NestFastifyApplication;
  let userStore: InMemoryUserStore;
  let sessionStore: InMemorySessionStore;

  const email = 'person@example.test';
  const password = 'a-reasonable-password-123';

  beforeAll(async () => {
    userStore = new InMemoryUserStore();
    sessionStore = new InMemorySessionStore();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        AccessTokenGuard,
        ActionTokenService,
        IpRateLimiter,
        { provide: APP_CONFIG, useValue: testConfig() },
        { provide: USER_STORE, useValue: userStore },
        { provide: SESSION_STORE, useValue: sessionStore },
        { provide: ACTION_TOKEN_STORE, useValue: stubActionTokenStore },
        { provide: MAIL_TRANSPORT, useValue: stubTransport },
        { provide: MAILER_SERVICE, useClass: SmtpMailer },
        { provide: PASSWORD_SERVICE, useClass: Argon2PasswordService },
        { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(fastifyCookie);
    app.enableCors({ origin: ORIGIN, credentials: true });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // T-006: the shared fixture user must be created as verified explicitly
  // before tests that exercise normal login/session behaviour.
  beforeEach(async () => {
    const existing = await userStore.findByEmail(email);
    if (existing && !existing.emailVerifiedAt) {
      userStore.markVerified(existing.id);
    }
  });

  function instance() {
    return app.getHttpAdapter().getInstance();
  }

  function cookieHeader(response: { headers: Record<string, unknown> }) {
    const raw = response.headers['set-cookie'];
    const list = Array.isArray(raw) ? raw : [raw].filter(Boolean);
    const value = list.find(
      (c) => typeof c === 'string' && c.startsWith('sm_refresh='),
    );
    return value ? (value as string).split(';')[0].split('=')[1] : undefined;
  }

  function setCookieRaw(response: { headers: Record<string, unknown> }): string {
    const raw = response.headers['set-cookie'];
    const list = Array.isArray(raw) ? raw : [raw].filter(Boolean);
    const value = list.find(
      (c) => typeof c === 'string' && c.startsWith('sm_refresh='),
    );
    return (value as string | undefined) ?? '';
  }

  it('registers a new account with a generic 202', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password },
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ status: 'accepted' });
  });

  it('returns an explicit conflict for a duplicate registration', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
      message: expect.any(String),
    });
  });

  it('handles concurrent registration without duplicates or leaks', async () => {
    const raceEmail = 'race@example.test';
    const [a, b] = await Promise.all([
      instance().inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: raceEmail, password },
      }),
      instance().inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: raceEmail, password },
      }),
    ]);
    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([202, 409]);
    expect(userStore.countByEmail(raceEmail)).toBe(1);
  });

  it('rejects a malformed email with a generic 400', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'not-an-email', password },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a short password with a generic 400', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'short@example.test', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects an overlong email with a generic 400 and never persists', async () => {
    const overlong = `${'a'.repeat(320)}@example.test`;
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: overlong, password },
    });
    expect(res.statusCode).toBe(400);
    expect(userStore.countByEmail(overlong)).toBe(0);
  });

  it('rejects an invalid login with a generic 401', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: 'wrong-password-123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('logs in and returns an access token plus a refresh cookie', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeTruthy();
    expect(cookieHeader(res)).toBeTruthy();
  });

  it('sets Max-Age on the refresh cookie from REFRESH_SESSION_TTL_DAYS', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const cookie = setCookieRaw(res);
    expect(cookie).toContain('Max-Age=2592000');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/auth');
  });

  it('serves /auth/me for a valid bearer token', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const accessToken = login.json().accessToken;
    const res = await instance().inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: expect.any(String), email });
  });

  it('rejects a token whose sub does not match the session user', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const decoded = jwt.decode(login.json().accessToken) as { sid: string };
    const forged = jwt.sign(
      { sub: '00000000-0000-0000-0000-000000000000', sid: decoded.sid },
      TEST_SECRET,
      { expiresIn: 900 },
    );
    const res = await instance().inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${forged}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rotates the refresh token and invalidates the previous one', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const firstRefresh = cookieHeader(login);

    const refresh = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { origin: ORIGIN, cookie: `sm_refresh=${firstRefresh}` },
    });
    expect(refresh.statusCode).toBe(200);
    expect(refresh.json().accessToken).toBeTruthy();
    const secondRefresh = cookieHeader(refresh);
    expect(secondRefresh).toBeTruthy();
    expect(secondRefresh).not.toBe(firstRefresh);

    const replay = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { origin: ORIGIN, cookie: `sm_refresh=${firstRefresh}` },
    });
    expect(replay.statusCode).toBe(401);
  });

  it('concurrent refresh yields exactly one success and one active session', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const refresh = cookieHeader(login);

    const [a, b] = await Promise.all([
      instance().inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
      }),
      instance().inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
      }),
    ]);

    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([200, 401]);

    const user = await userStore.findByEmail(email);
    expect(user).not.toBeNull();
    expect(sessionStore.activeCountForUser(user!.id)).toBe(1);
  });

  it('concurrent logins leave exactly one active session', async () => {
    const [a, b] = await Promise.all([
      instance().inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      }),
      instance().inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email, password },
      }),
    ]);
    expect(a.statusCode).toBe(200);
    expect(b.statusCode).toBe(200);

    const user = await userStore.findByEmail(email);
    expect(sessionStore.activeCountForUser(user!.id)).toBe(1);
  });

  it('rejects a refresh with an absent or mismatched origin', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const refresh = cookieHeader(login);

    const absent = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: `sm_refresh=${refresh}` },
    });
    expect(absent.statusCode).toBe(401);

    const mismatched = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: {
        origin: 'https://evil.example',
        cookie: `sm_refresh=${refresh}`,
      },
    });
    expect(mismatched.statusCode).toBe(401);
  });

  it('rejects logout without an Origin header and leaves the session usable', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const refresh = cookieHeader(login);

    const logout = await instance().inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie: `sm_refresh=${refresh}` },
    });
    expect(logout.statusCode).toBe(401);

    const refreshAfter = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
    });
    expect(refreshAfter.statusCode).toBe(200);
  });

  it('rejects logout with a mismatched Origin header and leaves the session usable', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const refresh = cookieHeader(login);

    const logout = await instance().inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        origin: 'https://evil.example',
        cookie: `sm_refresh=${refresh}`,
      },
    });
    expect(logout.statusCode).toBe(401);

    const refreshAfter = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
    });
    expect(refreshAfter.statusCode).toBe(200);
  });

  it('rejects logout with no Origin and no refresh cookie', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/logout',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects logout with a mismatched Origin and no refresh cookie', async () => {
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { origin: 'https://evil.example' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('clears the refresh cookie on logout and rejects /auth/me', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const accessToken = login.json().accessToken;
    const refresh = cookieHeader(login);

    const logout = await instance().inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
    });
    expect(logout.statusCode).toBe(204);

    const cookie = setCookieRaw(logout);
    expect(cookie).toContain('sm_refresh=');
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970');

    const me = await instance().inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(401);

    const refreshAfterLogout = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
    });
    expect(refreshAfterLogout.statusCode).toBe(401);
  });

  it('concurrent refresh and logout leave zero active sessions and no usable token', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    const refresh = cookieHeader(login);

    const [refreshRes, logoutRes] = await Promise.all([
      instance().inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
      }),
      instance().inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
      }),
    ]);

    expect(logoutRes.statusCode).toBe(204);
    const accepted =
      (refreshRes.statusCode === 401 && logoutRes.statusCode === 204) ||
      (refreshRes.statusCode === 200 && logoutRes.statusCode === 204);
    expect(accepted).toBe(true);

    const user = await userStore.findByEmail(email);
    expect(user).not.toBeNull();
    expect(sessionStore.activeCountForUser(user!.id)).toBe(0);

    if (refreshRes.statusCode === 200) {
      const accessToken = refreshRes.json().accessToken;
      const me = await instance().inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(me.statusCode).toBe(401);
    }
  });

  // --- T-006 verification access gate ------------------------------------

  it('rejects an unverified login with a generic 401 and issues no refresh cookie', async () => {
    const unverified = 'unverified@example.test';
    await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: unverified, password },
    });
    const res = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: unverified, password },
    });
    expect(res.statusCode).toBe(401);
    expect(setCookieRaw(res)).toBe('');
  });

  it('rejects an existing session when its user becomes unverified', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(login.statusCode).toBe(200);
    const accessToken = login.json().accessToken;
    const refresh = cookieHeader(login);
    const user = await userStore.findByEmail(email);
    expect(user).not.toBeNull();
    userStore.markUnverified(user!.id);

    const me = await instance().inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(401);

    const refreshed = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { origin: ORIGIN, cookie: `sm_refresh=${refresh}` },
    });
    expect(refreshed.statusCode).toBe(401);

    userStore.markVerified(user!.id);
  });

  it('permits normal login after verification succeeds', async () => {
    const pending = 'pending@example.test';
    await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: pending, password },
    });
    const blocked = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: pending, password },
    });
    expect(blocked.statusCode).toBe(401);

    const user = await userStore.findByEmail(pending);
    expect(user).not.toBeNull();
    userStore.markVerified(user!.id);

    const allowed = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: pending, password },
    });
    expect(allowed.statusCode).toBe(200);
  });
});
