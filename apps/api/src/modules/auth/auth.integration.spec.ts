import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module.js';
import { loadAppConfig, AppConfig } from '../../config/env.js';
import { createDataSource } from '../../database/data-source.js';

describe('Auth (real-MySQL integration)', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;
  let config: AppConfig;

  const email = `integration-${Date.now()}@example.test`;
  const password = 'integration-password-123';

  beforeAll(async () => {
    config = loadAppConfig();
    dataSource = createDataSource(config);
    await dataSource.initialize();
    await dataSource.runMigrations();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.register(fastifyCookie);
    app.enableCors({ origin: config.cors.origin, credentials: true });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 60000);

  afterAll(async () => {
    try {
      await dataSource.query(
        'DELETE FROM auth_sessions WHERE userId IN (SELECT id FROM users WHERE email = ?)',
        [email],
      );
      await dataSource.query('DELETE FROM users WHERE email = ?', [email]);
    } finally {
      await app.close();
      await dataSource.destroy();
    }
  }, 60000);

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

  it('runs the full auth flow against the local MySQL database', async () => {
    const register = await instance().inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password },
    });
    expect(register.statusCode).toBe(202);

    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(login.statusCode).toBe(200);
    const accessToken = login.json().accessToken;
    const refresh = cookieHeader(login);
    expect(accessToken).toBeTruthy();
    expect(refresh).toBeTruthy();

    const me = await instance().inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(email);

    const refreshed = await instance().inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { origin: config.cors.origin, cookie: `sm_refresh=${refresh}` },
    });
    expect(refreshed.statusCode).toBe(200);
    const newRefresh = cookieHeader(refreshed);
    expect(newRefresh).toBeTruthy();

    const logout = await instance().inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { origin: config.cors.origin, cookie: `sm_refresh=${newRefresh}` },
    });
    expect(logout.statusCode).toBe(204);

    const meAfter = await instance().inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(meAfter.statusCode).toBe(401);
  });

  it('concurrent refresh leaves exactly one active session with correct linkage', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(login.statusCode).toBe(200);
    const refresh = cookieHeader(login);
    expect(refresh).toBeTruthy();

    const [a, b] = await Promise.all([
      instance().inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { origin: config.cors.origin, cookie: `sm_refresh=${refresh}` },
      }),
      instance().inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { origin: config.cors.origin, cookie: `sm_refresh=${refresh}` },
      }),
    ]);

    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([200, 401]);

    const rows = (await dataSource.query(
      'SELECT id, revokedAt, replacedBySessionId FROM auth_sessions WHERE userId = (SELECT id FROM users WHERE email = ?)',
      [email],
    )) as {
      id: string;
      revokedAt: Date | null;
      replacedBySessionId: string | null;
    }[];

    const active = rows.filter((r) => r.revokedAt === null);
    expect(active.length).toBe(1);

    const linked = rows.filter(
      (r) => r.replacedBySessionId === active[0].id,
    );
    expect(linked.length).toBe(1);
  });

  it('concurrent refresh and logout leave zero active sessions', async () => {
    const login = await instance().inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(login.statusCode).toBe(200);
    const refresh = cookieHeader(login);
    expect(refresh).toBeTruthy();

    const [refreshRes, logoutRes] = await Promise.all([
      instance().inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { origin: config.cors.origin, cookie: `sm_refresh=${refresh}` },
      }),
      instance().inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { origin: config.cors.origin, cookie: `sm_refresh=${refresh}` },
      }),
    ]);

    expect(logoutRes.statusCode).toBe(204);
    const accepted =
      (refreshRes.statusCode === 401 && logoutRes.statusCode === 204) ||
      (refreshRes.statusCode === 200 && logoutRes.statusCode === 204);
    expect(accepted).toBe(true);

    const rows = (await dataSource.query(
      'SELECT id, revokedAt FROM auth_sessions WHERE userId = (SELECT id FROM users WHERE email = ?)',
      [email],
    )) as { id: string; revokedAt: Date | null }[];

    const active = rows.filter((r) => r.revokedAt === null);
    expect(active.length).toBe(0);

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
});
