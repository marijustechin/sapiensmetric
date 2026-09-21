import { describe, it, expect } from 'vitest';
import { loadAppConfig } from './env.js';

function baseEnv(overrides: Record<string, string>): NodeJS.ProcessEnv {
  return {
    MYSQL_DATABASE: 'sapiensmetric_test',
    MYSQL_USER: 'app',
    MYSQL_PASSWORD: 'secret',
    CORS_ORIGIN: 'http://localhost:3001',
    JWT_SECRET: 'test-secret-that-is-definitely-long-enough-123456',
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'user',
    SMTP_PASSWORD: 'secret',
    SMTP_FROM: 'no-reply@example.test',
    PUBLIC_APP_URL: 'http://localhost:3001',
    ...overrides,
  };
}

describe('public origin configuration', () => {
  it('accepts a matching canonical pair despite a trailing slash', () => {
    const config = loadAppConfig(
      baseEnv({
        CORS_ORIGIN: 'http://localhost:3001/',
        PUBLIC_APP_URL: 'http://localhost:3001',
      }),
    );

    expect(config.cors.origin).toBe('http://localhost:3001');
    expect(config.publicAppUrl).toBe('http://localhost:3001');
  });

  it('rejects a mismatched canonical pair', () => {
    expect(() =>
      loadAppConfig(
        baseEnv({
          CORS_ORIGIN: 'http://localhost:3001',
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
          CORS_ORIGIN: 'http://localhost:3001/app',
          PUBLIC_APP_URL: 'http://localhost:3001',
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
