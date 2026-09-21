import { describe, it, expect } from 'vitest';

const moduleUrl = new URL(
  '../../../web/lib/public-api-base.mjs',
  import.meta.url,
).href;

interface PublicApiBaseModule {
  normalizePublicApiBaseUrl: (value: unknown) => string;
}

async function load(): Promise<PublicApiBaseModule> {
  return (await import(moduleUrl)) as PublicApiBaseModule;
}

describe('web NEXT_PUBLIC_API_BASE_URL validation', () => {
  it('accepts HTTP(S), keeps a path prefix, and normalises only a trailing slash', async () => {
    const { normalizePublicApiBaseUrl } = await load();

    expect(normalizePublicApiBaseUrl('http://localhost:3334')).toBe(
      'http://localhost:3334',
    );
    expect(normalizePublicApiBaseUrl('http://localhost:3334/')).toBe(
      'http://localhost:3334',
    );
    expect(normalizePublicApiBaseUrl('https://example.test/api')).toBe(
      'https://example.test/api',
    );
    expect(normalizePublicApiBaseUrl('https://example.test/api/')).toBe(
      'https://example.test/api',
    );
  });

  it('rejects userinfo, query strings, and fragments', async () => {
    const { normalizePublicApiBaseUrl } = await load();

    expect(() => normalizePublicApiBaseUrl('https://user:pass@example.test')).toThrow(
      /userinfo/,
    );
    expect(() => normalizePublicApiBaseUrl('https://example.test/?a=1')).toThrow(
      /query/,
    );
    expect(() =>
      normalizePublicApiBaseUrl('https://example.test/#fragment'),
    ).toThrow(/fragment/);
  });

  it('rejects non-HTTP(S) and missing values', async () => {
    const { normalizePublicApiBaseUrl } = await load();

    expect(() => normalizePublicApiBaseUrl('ftp://example.test')).toThrow();
    expect(() => normalizePublicApiBaseUrl('/api')).toThrow();
    expect(() => normalizePublicApiBaseUrl('')).toThrow();
    expect(() => normalizePublicApiBaseUrl(undefined)).toThrow();
  });
});
