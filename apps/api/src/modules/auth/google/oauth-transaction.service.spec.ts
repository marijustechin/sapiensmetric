import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppConfig } from '../../../config/env.js';
import { OAuthTransactionService } from './oauth-transaction.service.js';
import { sanitizeReturnTo } from './return-to.js';

const ORIGIN = 'http://localhost:3001';

function testConfig(google?: Partial<AppConfig['google']>): AppConfig {
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
      clientId: 'client-123.apps.googleusercontent.com',
      clientSecret: 'client-secret-value-for-tests-0123456789',
      redirectUri: 'http://localhost:3334/auth/google/callback',
      enabled: true,
      ...google,
    },
  };
}

function service(google?: Partial<AppConfig['google']>) {
  return new OAuthTransactionService(testConfig(google));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('OAuthTransactionService (PKCE / state / nonce / cookie)', () => {
  it('creates high-entropy state, a nonce, and a PKCE S256 challenge', () => {
    const tx = service().create('/lt/account', 'lt');
    expect(tx.state.length).toBeGreaterThanOrEqual(32);
    expect(tx.nonce.length).toBeGreaterThanOrEqual(16);
    expect(tx.codeVerifier.length).toBeGreaterThanOrEqual(32);
    expect(tx.codeChallenge).not.toBe(tx.codeVerifier);
    expect(tx.locale).toBe('lt');
    expect(tx.returnTo).toBe('/lt/account');
    expect(tx.expiresAt).toBeGreaterThan(Date.now());
  });

  it('round-trips a cookie that verifies', () => {
    const s = service();
    const tx = s.create('/en/account', 'en');
    const cookie = s.serialize(tx);
    const verified = s.verify(cookie);
    expect(verified).toEqual(tx);
  });

  it('rejects a tampered cookie', () => {
    const s = service();
    const cookie = s.serialize(s.create('/en/account', 'en'));
    const [payload, signature] = cookie.split('.');
    const tampered = `${payload}.${signature.slice(0, -2)}xx`;
    expect(s.verify(tampered)).toBeNull();
    expect(s.verify(`${payload}x.${signature}`)).toBeNull();
    expect(s.verify(undefined)).toBeNull();
    expect(s.verify('not-a-cookie')).toBeNull();
  });

  it('rejects an expired transaction', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-21T00:00:00Z'));
    const s = service();
    const cookie = s.serialize(s.create('/en/account', 'en'));
    expect(s.verify(cookie)).not.toBeNull();
    vi.setSystemTime(new Date('2026-09-21T00:11:00Z'));
    expect(s.verify(cookie)).toBeNull();
  });

  it('uses HttpOnly/SameSite=Lax cookie options on path /auth/google', () => {
    const s = service();
    const set = s.setCookieOptions();
    expect(set.httpOnly).toBe(true);
    expect(set.sameSite).toBe('lax');
    expect(set.path).toBe('/auth/google');
    expect(set.maxAge).toBe(600);
    expect(s.clearCookieOptions().maxAge).toBeUndefined();
  });

  it('builds a Google authorization URL with PKCE and nonce', () => {
    const s = service();
    const tx = s.create('/en/account', 'en');
    const url = new URL(
      s.buildAuthorizationUrl(tx, 'http://localhost:3334/auth/google/callback'),
    );
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe(tx.codeChallenge);
    expect(url.searchParams.get('state')).toBe(tx.state);
    expect(url.searchParams.get('nonce')).toBe(tx.nonce);
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3334/auth/google/callback',
    );
  });

  it('reports availability from configuration', () => {
    expect(service().isEnabled()).toBe(true);
    expect(
      service({ clientId: null, clientSecret: null, enabled: false }).isEnabled(),
    ).toBe(false);
  });
});

describe('sanitizeReturnTo (Google returnTo allowlist)', () => {
  it('accepts same-origin paths and rejects external/unsafe targets', () => {
    expect(sanitizeReturnTo('/en/account', ORIGIN, '/en/account')).toBe(
      '/en/account',
    );
    expect(sanitizeReturnTo('https://evil.example/', ORIGIN, '/en/account')).toBe(
      '/en/account',
    );
    expect(sanitizeReturnTo('//evil.example/', ORIGIN, '/en/account')).toBe(
      '/en/account',
    );
    expect(sanitizeReturnTo('/\\evil', ORIGIN, '/en/account')).toBe('/en/account');
    expect(sanitizeReturnTo('javascript:alert(1)', ORIGIN, '/en/account')).toBe(
      '/en/account',
    );
    expect(sanitizeReturnTo(undefined, ORIGIN, '/en/account')).toBe('/en/account');
  });
});
