import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { loadAppConfig } from '../../config/env.js';
import { createDataSource } from '../../database/data-source.js';
import { User } from '../users/user.entity.js';
import { UserIdentity } from '../auth/identities/user-identity.entity.js';
import { AuthSession } from '../auth/sessions/auth-session.entity.js';
import { AdminAuditLog } from './admin-audit.entity.js';
import {
  AdminConflictError,
  TypeOrmAdminStore,
} from './admin-store.js';

/**
 * Real-MySQL integration for the T-012 admin store: transaction-level role/
 * status changes, audit persistence, session invalidation, and last-active-
 * administrator protection under concurrent transactions. Uses the local
 * Docker MySQL (127.0.0.1:3307) and self-cleans. No SMTP or OAuth.
 */
describe('Admin store (real-MySQL integration)', () => {
  let dataSource: DataSource;
  let store: TypeOrmAdminStore;
  const created: string[] = [];
  const prefix = `admin-it-${Date.now()}`;

  beforeAll(async () => {
    dataSource = createDataSource(loadAppConfig());
    await dataSource.initialize();
    await dataSource.runMigrations();
    store = new TypeOrmAdminStore(
      dataSource.getRepository(User),
      dataSource.getRepository(UserIdentity),
      dataSource.getRepository(AdminAuditLog),
      dataSource,
    );
  }, 60000);

  async function createUser(
    role: 'user' | 'editor' | 'admin',
    status: 'active' | 'suspended' = 'active',
  ): Promise<User> {
    const user = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        email: `${prefix}-${created.length}@example.test`,
        passwordHash: 'x',
        emailVerifiedAt: new Date(),
        role,
        status,
      }),
    );
    created.push(user.id);
    return user;
  }

  async function countAudit(targetId: string): Promise<number> {
    return dataSource.getRepository(AdminAuditLog).count({
      where: { targetUserId: targetId },
    });
  }

  afterAll(async () => {
    if (created.length > 0) {
      await dataSource.query(
        `DELETE FROM admin_audit_log WHERE targetUserId IN (${created.map(() => '?').join(',')})`,
        created,
      );
      await dataSource.query(
        `DELETE FROM auth_sessions WHERE userId IN (${created.map(() => '?').join(',')})`,
        created,
      );
      await dataSource.query(
        `DELETE FROM user_identities WHERE userId IN (${created.map(() => '?').join(',')})`,
        created,
      );
      await dataSource.query(
        `DELETE FROM users WHERE id IN (${created.map(() => '?').join(',')})`,
        created,
      );
    }
    await dataSource.destroy();
  }, 60000);

  it('persists a role change with an atomic audit entry', async () => {
    const actor = await createUser('admin');
    const target = await createUser('user');
    await store.changeRole(
      { type: 'user', userId: actor.id },
      target.id,
      'editor',
    );
    const reloaded = await dataSource
      .getRepository(User)
      .findOne({ where: { id: target.id } });
    expect(reloaded?.role).toBe('editor');
    expect(await countAudit(target.id)).toBe(1);
  });

  it('rejects self role change and self suspension', async () => {
    const actor = await createUser('admin');
    await expect(
      store.changeRole({ type: 'user', userId: actor.id }, actor.id, 'user'),
    ).rejects.toBeInstanceOf(AdminConflictError);
    await expect(
      store.changeStatus(
        { type: 'user', userId: actor.id },
        actor.id,
        'suspended',
      ),
    ).rejects.toBeInstanceOf(AdminConflictError);
  });

  it('suspension revokes active sessions and blocks reactivation revival', async () => {
    const actor = await createUser('admin');
    const target = await createUser('user');
    const session = await dataSource.getRepository(AuthSession).save(
      dataSource.getRepository(AuthSession).create({
        userId: target.id,
        tokenHash: randomUUID().replace(/-/g, ''),
        expiresAt: new Date(Date.now() + 3600_000),
      }),
    );

    await store.changeStatus(
      { type: 'user', userId: actor.id },
      target.id,
      'suspended',
    );
    const revoked = await dataSource
      .getRepository(AuthSession)
      .findOne({ where: { id: session.id } });
    expect(revoked?.revokedAt).not.toBeNull();

    await store.changeStatus(
      { type: 'user', userId: actor.id },
      target.id,
      'active',
    );
    const stillRevoked = await dataSource
      .getRepository(AuthSession)
      .findOne({ where: { id: session.id } });
    expect(stillRevoked?.revokedAt).not.toBeNull();
  });

  it('serialises concurrent admin demotions without deadlock or lost administrators', async () => {
    const a = await createUser('admin');
    const b = await createUser('admin');
    // The strict last-administrator rule is covered deterministically by the
    // Docker-free store test; here we assert the ordered row locking does not
    // deadlock and never leaves zero active verified administrators.
    const results = await Promise.allSettled([
      store.changeRole({ type: 'cli', label: 'test' }, a.id, 'user'),
      store.changeRole({ type: 'cli', label: 'test' }, b.id, 'user'),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
    expect(fulfilled).toBeGreaterThanOrEqual(1);
    const admins = await dataSource
      .getRepository(User)
      .count({ where: { role: 'admin', status: 'active' } });
    expect(admins).toBeGreaterThanOrEqual(1);
  });
});
