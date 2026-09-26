import { describe, it, expect, beforeAll } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { randomUUID } from 'node:crypto';
import type { UserRole, UserStatus } from '@sapiensmetric/contracts';
import { APP_CONFIG, AppConfig } from '../../config/env.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminGuard } from './admin.guard.js';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_STORE,
  AdminConflictError,
  AdminNotFoundError,
  type AdminActor,
  type AdminAuditInput,
  type AdminListQuery,
  type AdminListResult,
  type AdminStore,
  type AdminSummaryCounts,
  type AdminUserDetailRow,
  type AdminUserRow,
  type AuditRecord,
} from './admin-store.js';
import { JwtTokenService, TOKEN_SERVICE } from '../auth/token.service.js';
import { Argon2PasswordService, PASSWORD_SERVICE } from '../auth/password.service.js';
import { USER_STORE, UserStore, UserRecord } from '../users/user-store.js';
import {
  SESSION_STORE,
  SessionStore,
  SessionRecord,
} from '../auth/sessions/session-store.js';

const ORIGIN = 'http://localhost:3333';
const SECRET = 'test-secret-that-is-definitely-long-enough-123456';

function testConfig(): AppConfig {
  return {
    api: { port: 3000 },
    db: { host: '127.0.0.1', port: 3307, database: 'd', username: 'u', password: 'p' },
    cors: { origin: ORIGIN },
    jwt: { secret: SECRET, accessTokenTtlSeconds: 900 },
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
    google: { clientId: null, clientSecret: null, redirectUri: null, enabled: false },
  };
}

class InMemoryUserStore implements UserStore {
  readonly map = new Map<string, UserRecord>();

  add(input: {
    email: string;
    role?: UserRole;
    status?: UserStatus;
    verified?: boolean;
  }): UserRecord {
    const user: UserRecord = {
      id: randomUUID(),
      email: input.email,
      passwordHash: 'hash',
      emailVerifiedAt: input.verified === false ? null : new Date(),
      role: input.role ?? 'user',
      status: input.status ?? 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.map.set(user.id, user);
    return user;
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    for (const u of this.map.values()) if (u.email === email) return Promise.resolve(u);
    return Promise.resolve(null);
  }

  findById(id: string): Promise<UserRecord | null> {
    return Promise.resolve(this.map.get(id) ?? null);
  }

  create(data: { email: string; passwordHash: string }): Promise<UserRecord> {
    return Promise.resolve(this.add({ email: data.email, verified: false }));
  }
}

class InMemorySessionStore implements SessionStore {
  readonly map = new Map<string, SessionRecord>();

  issue(userId: string): SessionRecord {
    const session: SessionRecord = {
      id: randomUUID(),
      userId,
      tokenHash: randomUUID(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000),
      revokedAt: null,
      replacedBySessionId: null,
      revokedReason: null,
    };
    this.map.set(session.id, session);
    return session;
  }

  activeCountForUser(userId: string): number {
    let count = 0;
    for (const s of this.map.values()) if (s.userId === userId && !s.revokedAt) count += 1;
    return count;
  }

  findByTokenHash(): Promise<SessionRecord | null> {
    return Promise.resolve(null);
  }
  findById(id: string): Promise<SessionRecord | null> {
    return Promise.resolve(this.map.get(id) ?? null);
  }
  issueSession(userId: string): Promise<SessionRecord> {
    return Promise.resolve(this.issue(userId));
  }
  rotate(): Promise<{ session: SessionRecord; replacedBySessionId: string } | null> {
    return Promise.resolve(null);
  }
  revokeAllByToken(): Promise<void> {
    return Promise.resolve();
  }
  revokeAllForUser(userId: string, reason: string): Promise<void> {
    for (const s of this.map.values()) {
      if (s.userId === userId && !s.revokedAt) {
        s.revokedAt = new Date();
        s.revokedReason = reason;
      }
    }
    return Promise.resolve();
  }
}

/**
 * In-memory AdminStore. All mutations run synchronously (no `await` inside) so
 * concurrent calls serialise on the event loop, mirroring the database
 * transaction/lock semantics being tested.
 */
class InMemoryAdminStore implements AdminStore {
  readonly audit: AuditRecord[] = [];
  throwOnNextMutation = false;

  constructor(private readonly users: InMemoryUserStore) {}

  private row(u: UserRecord): AdminUserRow {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerifiedAt: u.emailVerifiedAt,
      createdAt: u.createdAt,
    };
  }

  private activeAdmins(): UserRecord[] {
    return [...this.users.map.values()].filter(
      (u) => u.role === 'admin' && u.status === 'active' && u.emailVerifiedAt !== null,
    );
  }

  private push(input: AdminAuditInput): void {
    this.audit.push({
      id: randomUUID(),
      actorType: input.actor.type,
      actorUserId: input.actor.userId ?? null,
      actorLabel: input.actor.label ?? null,
      action: input.action,
      targetUserId: input.targetUserId,
      before: input.before,
      after: input.after,
      createdAt: new Date(),
    });
  }

  summary(): Promise<AdminSummaryCounts> {
    const all = [...this.users.map.values()];
    const verified = all.filter((u) => u.emailVerifiedAt !== null);
    const active = all.filter((u) => u.status === 'active');
    return Promise.resolve({
      totalUsers: all.length,
      verifiedUsers: verified.length,
      unverifiedUsers: all.length - verified.length,
      activeUsers: active.length,
      suspendedUsers: all.length - active.length,
      adminUsers: all.filter((u) => u.role === 'admin').length,
    });
  }

  listUsers(query: AdminListQuery): Promise<AdminListResult> {
    let rows = [...this.users.map.values()];
    if (query.search) {
      const needle = query.search.toLowerCase();
      rows = rows.filter((u) => u.email.toLowerCase().includes(needle));
    }
    if (query.role) rows = rows.filter((u) => u.role === query.role);
    if (query.status) rows = rows.filter((u) => u.status === query.status);
    if (query.verified !== undefined) {
      rows = rows.filter((u) => (u.emailVerifiedAt !== null) === query.verified);
    }
    rows.sort((a, b) => {
      const cmp =
        query.sort === 'email'
          ? a.email.localeCompare(b.email)
          : a.createdAt.getTime() - b.createdAt.getTime();
      return query.order === 'asc' ? cmp : -cmp;
    });
    const total = rows.length;
    const start = (query.page - 1) * query.pageSize;
    return Promise.resolve({
      items: rows.slice(start, start + query.pageSize).map((u) => this.row(u)),
      total,
    });
  }

  getUserDetail(id: string): Promise<AdminUserDetailRow | null> {
    const user = this.users.map.get(id);
    return Promise.resolve(user ? { ...this.row(user), providers: [] } : null);
  }

  changeRole(actor: AdminActor, targetId: string, role: UserRole): Promise<AdminUserRow> {
    if (this.throwOnNextMutation) {
      this.throwOnNextMutation = false;
      return Promise.reject(new Error('simulated failure'));
    }
    const target = this.users.map.get(targetId);
    if (!target) return Promise.reject(new AdminNotFoundError());
    if (actor.userId && actor.userId === target.id) {
      return Promise.reject(new AdminConflictError('cannot change your own role'));
    }
    if (target.role === 'admin' && role !== 'admin') {
      const admins = this.activeAdmins();
      if (admins.some((a) => a.id === target.id) && admins.length <= 1) {
        return Promise.reject(new AdminConflictError('last admin'));
      }
    }
    const before = { role: target.role };
    target.role = role;
    this.push({
      actor,
      action: ADMIN_AUDIT_ACTIONS.roleChanged,
      targetUserId: target.id,
      before,
      after: { role },
    });
    return Promise.resolve(this.row(target));
  }

  changeStatus(
    actor: AdminActor,
    targetId: string,
    status: UserStatus,
  ): Promise<AdminUserRow> {
    if (this.throwOnNextMutation) {
      this.throwOnNextMutation = false;
      return Promise.reject(new Error('simulated failure'));
    }
    const target = this.users.map.get(targetId);
    if (!target) return Promise.reject(new AdminNotFoundError());
    if (actor.userId && actor.userId === target.id) {
      return Promise.reject(new AdminConflictError('cannot change your own status'));
    }
    if (status === 'suspended' && target.role === 'admin') {
      const admins = this.activeAdmins();
      if (admins.some((a) => a.id === target.id) && admins.length <= 1) {
        return Promise.reject(new AdminConflictError('last admin'));
      }
    }
    const before = { status: target.status };
    target.status = status;
    if (status === 'suspended') {
      for (const s of this.sessionsFor(target.id)) {
        if (!s.revokedAt) {
          s.revokedAt = new Date();
          s.revokedReason = 'suspended';
        }
      }
    }
    this.push({
      actor,
      action:
        status === 'suspended'
          ? ADMIN_AUDIT_ACTIONS.suspended
          : ADMIN_AUDIT_ACTIONS.reactivated,
      targetUserId: target.id,
      before,
      after: { status },
    });
    return Promise.resolve(this.row(target));
  }

  revokeSessions(actor: AdminActor, targetId: string): Promise<AdminUserRow> {
    const target = this.users.map.get(targetId);
    if (!target) return Promise.reject(new AdminNotFoundError());
    for (const s of this.sessionsFor(target.id)) {
      if (!s.revokedAt) {
        s.revokedAt = new Date();
        s.revokedReason = 'admin_revoke';
      }
    }
    this.push({
      actor,
      action: ADMIN_AUDIT_ACTIONS.sessionsRevoked,
      targetUserId: target.id,
      before: null,
      after: null,
    });
    return Promise.resolve(this.row(target));
  }

  listAudit(targetUserId: string | null, limit: number): Promise<AuditRecord[]> {
    const rows = this.audit
      .filter((a) => (targetUserId ? a.targetUserId === targetUserId : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(rows.slice(0, limit));
  }

  /** Wired after construction so status suspension can revoke sessions. */
  sessions: InMemorySessionStore | null = null;
  private sessionsFor(userId: string): SessionRecord[] {
    if (!this.sessions) return [];
    return [...this.sessions.map.values()].filter((s) => s.userId === userId);
  }
}

describe('AdminController (Docker-free)', () => {
  let app: NestFastifyApplication;
  let users: InMemoryUserStore;
  let sessions: InMemorySessionStore;
  let adminStore: InMemoryAdminStore;
  let tokens: JwtTokenService;

  const admin = {} as UserRecord;
  const editor = {} as UserRecord;
  const normal = {} as UserRecord;
  const suspended = {} as UserRecord;

  async function bearer(user: UserRecord): Promise<string> {
    const session = sessions.issue(user.id);
    return tokens.signAccessToken({ sub: user.id, sid: session.id });
  }

  beforeAll(async () => {
    users = new InMemoryUserStore();
    sessions = new InMemorySessionStore();
    adminStore = new InMemoryAdminStore(users);
    adminStore.sessions = sessions;

    Object.assign(
      admin,
      users.add({ email: 'admin@example.test', role: 'admin' }),
    );
    Object.assign(
      editor,
      users.add({ email: 'editor@example.test', role: 'editor' }),
    );
    Object.assign(normal, users.add({ email: 'user@example.test' }));
    Object.assign(
      suspended,
      users.add({ email: 'suspended@example.test', status: 'suspended' }),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        AdminGuard,
        { provide: APP_CONFIG, useValue: testConfig() },
        { provide: ADMIN_STORE, useValue: adminStore },
        { provide: USER_STORE, useValue: users },
        { provide: SESSION_STORE, useValue: sessions },
        { provide: TOKEN_SERVICE, useClass: JwtTokenService },
        { provide: PASSWORD_SERVICE, useClass: Argon2PasswordService },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(fastifyCookie);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    tokens = new JwtTokenService(testConfig());
  });

  function inject(method: string, url: string, token?: string, payload?: unknown) {
    return app.getHttpAdapter().getInstance().inject({
      method: method as 'GET',
      url,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      payload: payload as object | undefined,
    });
  }

  it('rejects an unauthenticated request with 401', async () => {
    const res = await inject('GET', '/admin/summary');
    expect(res.statusCode).toBe(401);
  });

  it('rejects an ordinary user with 403', async () => {
    const res = await inject('GET', '/admin/summary', await bearer(normal));
    expect(res.statusCode).toBe(403);
  });

  it('rejects an editor with 403 (content permissions deferred)', async () => {
    const res = await inject('GET', '/admin/users', await bearer(editor));
    expect(res.statusCode).toBe(403);
  });

  it('rejects a suspended administrator session with 401', async () => {
    // Directly mark a suspended admin and issue a session.
    const suspendedAdmin = users.add({
      email: 'susp-admin@example.test',
      role: 'admin',
      status: 'suspended',
    });
    const res = await inject('GET', '/admin/summary', await bearer(suspendedAdmin));
    expect(res.statusCode).toBe(401);
  });

  it('returns summary counts to an administrator', async () => {
    const res = await inject('GET', '/admin/summary', await bearer(admin));
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalUsers).toBeGreaterThanOrEqual(4);
    expect(body.adminUsers).toBeGreaterThanOrEqual(1);
  });

  it('never exposes password hashes or internals in list/detail DTOs', async () => {
    const list = await inject('GET', '/admin/users', await bearer(admin));
    const detail = await inject(
      'GET',
      `/admin/users/${normal.id}`,
      await bearer(admin),
    );
    const text = `${list.body}${detail.body}`;
    expect(text).not.toContain('passwordHash');
    expect(text).not.toContain('tokenHash');
    expect(text).not.toContain('hash');
  });

  it('filters by role/status/verified, searches, paginates, and sorts deterministically', async () => {
    const byRole = await inject(
      'GET',
      '/admin/users?role=editor&sort=email&order=asc',
      await bearer(admin),
    );
    expect(byRole.statusCode).toBe(200);
    expect(byRole.json().items.every((u: AdminUserRow) => u.role === 'editor')).toBe(true);

    const suspendedOnly = await inject(
      'GET',
      '/admin/users?status=suspended',
      await bearer(admin),
    );
    expect(
      suspendedOnly.json().items.every((u: AdminUserRow) => u.status === 'suspended'),
    ).toBe(true);

    const unverified = await inject(
      'GET',
      '/admin/users?verified=false',
      await bearer(admin),
    );
    expect(
      unverified
        .json()
        .items.every((u: { emailVerified: boolean }) => u.emailVerified === false),
    ).toBe(true);

    const search = await inject(
      'GET',
      '/admin/users?search=editor@example.test',
      await bearer(admin),
    );
    expect(search.json().items.length).toBe(1);

    const paged = await inject(
      'GET',
      '/admin/users?page=1&pageSize=2&sort=email&order=asc',
      await bearer(admin),
    );
    expect(paged.json().pageSize).toBe(2);
    expect(paged.json().items.length).toBeLessThanOrEqual(2);
  });

  it('returns 404 for an unknown user id', async () => {
    const res = await inject(
      'GET',
      `/admin/users/${randomUUID()}`,
      await bearer(admin),
    );
    expect(res.statusCode).toBe(404);
  });

  it('allows an administrator to change another user role and records audit', async () => {
    const res = await inject(
      'PATCH',
      `/admin/users/${normal.id}/role`,
      await bearer(admin),
      { role: 'editor' },
    );
    expect(res.statusCode).toBe(200);
    expect(res.json().role).toBe('editor');
    const audit = await inject(
      'GET',
      `/admin/audit?targetUserId=${normal.id}`,
      await bearer(admin),
    );
    expect(audit.json().items[0].action).toBe(ADMIN_AUDIT_ACTIONS.roleChanged);
    // restore
    await inject('PATCH', `/admin/users/${normal.id}/role`, await bearer(admin), {
      role: 'user',
    });
  });

  it('prevents an administrator from changing their own role or status', async () => {
    const role = await inject(
      'PATCH',
      `/admin/users/${admin.id}/role`,
      await bearer(admin),
      { role: 'user' },
    );
    expect(role.statusCode).toBe(409);
    const status = await inject(
      'PATCH',
      `/admin/users/${admin.id}/status`,
      await bearer(admin),
      { status: 'suspended' },
    );
    expect(status.statusCode).toBe(409);
  });

  it('rejects a public role-escalation attempt in the request body', async () => {
    const res = await inject(
      'PATCH',
      `/admin/users/${normal.id}/role`,
      await bearer(admin),
      { role: 'superuser' },
    );
    expect(res.statusCode).toBe(400);
  });

  it('demotion removes admin access on the next request', async () => {
    const second = users.add({ email: 'admin2@example.test', role: 'admin' });
    const before = await inject('GET', '/admin/summary', await bearer(second));
    expect(before.statusCode).toBe(200);

    const demote = await inject(
      'PATCH',
      `/admin/users/${second.id}/role`,
      await bearer(admin),
      { role: 'user' },
    );
    expect(demote.statusCode).toBe(200);

    const after = await inject('GET', '/admin/summary', await bearer(second));
    expect(after.statusCode).toBe(403);
  });

  it('suspension invalidates access and refresh sessions and blocks refresh', async () => {
    const target = users.add({ email: 'suspend-target@example.test' });
    const targetToken = await bearer(target);
    const refreshSession = sessions.issue(target.id);

    const suspend = await inject(
      'PATCH',
      `/admin/users/${target.id}/status`,
      await bearer(admin),
      { status: 'suspended' },
    );
    expect(suspend.statusCode).toBe(200);
    expect(suspend.json().status).toBe('suspended');

    const meAfter = await inject('GET', '/admin/users', targetToken);
    expect(meAfter.statusCode).toBe(401);
    expect(sessions.map.get(refreshSession.id)?.revokedAt).not.toBeNull();

    // Reactivation must not revive revoked sessions.
    const reactivate = await inject(
      'PATCH',
      `/admin/users/${target.id}/status`,
      await bearer(admin),
      { status: 'active' },
    );
    expect(reactivate.statusCode).toBe(200);
    const stillRevoked = await inject('GET', '/admin/users', targetToken);
    expect(stillRevoked.statusCode).toBe(401);
  });

  it('revoke-all-sessions invalidates existing access immediately', async () => {
    const target = users.add({ email: 'revoke-target@example.test', role: 'editor' });
    const token = await bearer(target);
    const before = await inject('GET', '/admin/summary', token);
    expect(before.statusCode).toBe(403); // authenticated, non-admin

    const revoke = await inject(
      'POST',
      `/admin/users/${target.id}/revoke-sessions`,
      await bearer(admin),
      {},
    );
    expect(revoke.statusCode).toBe(200);
    const after = await inject('GET', '/admin/summary', token);
    expect(after.statusCode).toBe(401); // session revoked
  });

  it('protects against losing the last active verified administrator (store level, concurrent)', async () => {
    // Fresh isolated store/state for this rule.
    const isolatedUsers = new InMemoryUserStore();
    const store = new InMemoryAdminStore(isolatedUsers);
    const a = isolatedUsers.add({ email: 'a@example.test', role: 'admin' });
    const b = isolatedUsers.add({ email: 'b@example.test', role: 'admin' });

    const results = await Promise.allSettled([
      store.changeRole({ type: 'cli', label: 'test' }, a.id, 'user'),
      store.changeRole({ type: 'cli', label: 'test' }, b.id, 'user'),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected').length;
    expect(fulfilled).toBe(1);
    expect(rejected).toBe(1);
    expect(isolatedUsers.map.size).toBe(2);
  });

  it('writes no audit entry when a mutation fails', async () => {
    const before = adminStore.audit.length;
    adminStore.throwOnNextMutation = true;
    const res = await inject(
      'PATCH',
      `/admin/users/${editor.id}/role`,
      await bearer(admin),
      { role: 'user' },
    );
    expect(res.statusCode).toBe(500);
    expect(adminStore.audit.length).toBe(before);
    await inject('PATCH', `/admin/users/${editor.id}/role`, await bearer(admin), {
      role: 'editor',
    });
  });

  it('rejects an invalid uuid parameter with 400', async () => {
    const res = await inject('GET', '/admin/users/not-a-uuid', await bearer(admin));
    expect(res.statusCode).toBe(400);
  });
});
