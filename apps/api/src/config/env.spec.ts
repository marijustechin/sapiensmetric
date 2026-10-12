import { describe, it, expect, vi } from 'vitest';

// Mock dotenv so the tests can assert that an explicitly supplied `env` object
// never triggers a root `.env` read or a `process.env` side effect.
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

import { config as dotenvConfig } from 'dotenv';
import { loadAppConfig } from './env.js';

function baseEnv(overrides: Record<string, string>): NodeJS.ProcessEnv {
  return {
    MYSQL_DATABASE: 'sapiensmetric_test',
    MYSQL_USER: 'app',
    MYSQL_PASSWORD: 'secret',
    CORS_ORIGIN: 'http://localhost:3333',
    JWT_SECRET: 'test-secret-that-is-definitely-long-enough-123456',
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'user',
    SMTP_PASSWORD: 'secret',
    SMTP_FROM: 'no-reply@example.test',
    PUBLIC_APP_URL: 'http://localhost:3333',
    ...overrides,
  };
}

describe('public origin configuration', () => {
  it('accepts a matching canonical pair despite a trailing slash', () => {
    const config = loadAppConfig(
      baseEnv({
        CORS_ORIGIN: 'http://localhost:3333/',
        PUBLIC_APP_URL: 'http://localhost:3333',
      }),
    );

    expect(config.cors.origin).toBe('http://localhost:3333');
    expect(config.publicAppUrl).toBe('http://localhost:3333');
  });

  it('rejects a mismatched canonical pair', () => {
    expect(() =>
      loadAppConfig(
        baseEnv({
          CORS_ORIGIN: 'http://localhost:3333',
          PUBLIC_APP_URL: 'http://localhost:3002',
        }),
      ),
    ).toThrow(/equal after canonicalisation/);
  });

  it('verifies an explicit API_PORT value', () => {
    expect(loadAppConfig(baseEnv({ API_PORT: '3334' })).api.port).toBe(3334);
  });

  it('falls back to the schema default 3000 when API_PORT is absent', () => {
    // baseEnv deliberately does not define API_PORT.
    expect(loadAppConfig(baseEnv({})).api.port).toBe(3000);
  });

  it('rejects invalid API_PORT values', () => {
    expect(() => loadAppConfig(baseEnv({ API_PORT: '0' }))).toThrow();
    expect(() => loadAppConfig(baseEnv({ API_PORT: '70000' }))).toThrow();
    expect(() => loadAppConfig(baseEnv({ API_PORT: 'not-a-port' }))).toThrow();
  });

  it('rejects a non-origin value (path or wildcard)', () => {
    expect(() =>
      loadAppConfig(
        baseEnv({
          CORS_ORIGIN: 'http://localhost:3333/app',
          PUBLIC_APP_URL: 'http://localhost:3333',
        }),
      ),
    ).toThrow();
    expect(() =>
      loadAppConfig(
        baseEnv({
          CORS_ORIGIN: '*',
          PUBLIC_APP_URL: '*',
        }),
      ),
    ).toThrow();
  });
});

describe('dotenv isolation', () => {
  it('does not read the root .env when an explicit env object is supplied', () => {
    vi.mocked(dotenvConfig).mockClear();
    loadAppConfig(baseEnv({}));
    expect(dotenvConfig).not.toHaveBeenCalled();
  });

  it('does not mutate process.env when an explicit env object is supplied', () => {
    const before = { ...process.env };
    loadAppConfig(baseEnv({}));
    expect(process.env).toEqual(before);
  });
});

describe('T-023 closed-review and registration flags', () => {
  it('defaults to public behaviour (registration on, Google create on, review off)', () => {
    const config = loadAppConfig(baseEnv({}));
    expect(config.auth.registrationEnabled).toBe(true);
    expect(config.google.allowAccountCreation).toBe(true);
    expect(config.assessments.reviewEnabled).toBe(false);
  });

  it('reads the closed-review settings without refusing under NODE_ENV=production', () => {
    const config = loadAppConfig(
      baseEnv({
        NODE_ENV: 'production',
        REGISTRATION_ENABLED: 'false',
        GOOGLE_ALLOW_ACCOUNT_CREATION: 'false',
        ASSESSMENT_REVIEW_ENABLED: 'true',
      }),
    );
    expect(config.auth.registrationEnabled).toBe(false);
    expect(config.google.allowAccountCreation).toBe(false);
    expect(config.assessments.reviewEnabled).toBe(true);
  });

  it('still refuses the development astronomy gate in production', () => {
    expect(() =>
      loadAppConfig(baseEnv({ NODE_ENV: 'production', ASSESSMENT_ASTRONOMY_DRAFT_ENABLED: 'true' })),
    ).toThrow(/must not be enabled in production/);
  });
});

describe('T-023 file-backed secrets', () => {
  it('expands a *_FILE variable into the plain secret', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = mkdtempSync(join(tmpdir(), 'sm-env-'));
    const file = join(dir, 'jwt');
    writeFileSync(file, 'file-backed-secret-value-that-is-long-enough\n');
    const env = baseEnv({ JWT_SECRET: '' });
    delete (env as Record<string, string>).JWT_SECRET;
    env.JWT_SECRET_FILE = file;
    const config = loadAppConfig(env);
    expect(config.jwt.secret).toBe('file-backed-secret-value-that-is-long-enough');
  });

  it('throws clearly when a *_FILE path is unreadable', () => {
    const env = baseEnv({ JWT_SECRET: '' });
    delete (env as Record<string, string>).JWT_SECRET;
    env.JWT_SECRET_FILE = '/nonexistent/path/for/tests';
    expect(() => loadAppConfig(env)).toThrow(/Could not read JWT_SECRET_FILE/);
  });
});
