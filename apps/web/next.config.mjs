import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';
import { normalizePublicApiBaseUrl } from './lib/public-api-base.mjs';

/**
 * next-intl is the UI i18n layer. It is configured for static export: no
 * middleware/proxy is added, and the request configuration resolves the locale
 * from the `[locale]` segment only.
 */
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * The static web build receives only the deliberately exposed public value
 * NEXT_PUBLIC_API_BASE_URL, resolved from the explicit environment or the
 * repository-root `.env` public entry. No other root `.env` value is read, and
 * no secret is copied into apps/web or browser bundles.
 *
 * Fail closed: a missing or invalid value fails the build. There is no
 * development fallback.
 */
function readRootEnvValue(key) {
  let dir = process.cwd();
  for (let i = 0; i < 12; i += 1) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      const pattern = new RegExp(`^${key}=(.*)$`, 'm');
      const match = pattern.exec(readFileSync(candidate, 'utf8'));
      return match ? match[1].trim().replace(/^["']|["']$/g, '') : undefined;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return undefined;
}

function resolvePublicApiBaseUrl() {
  const fromEnvironment = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const value =
    fromEnvironment && fromEnvironment.length > 0
      ? fromEnvironment
      : readRootEnvValue('NEXT_PUBLIC_API_BASE_URL');
  return normalizePublicApiBaseUrl(value ?? '');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  /**
   * Directory-style static routes: every page is emitted as its own
   * `<route>/index.html`. Production is plain shared static hosting with no
   * Next server, middleware, proxy, or rewrite rules, so a clean URL such as
   * `/lt/auth/login/` must resolve to a real file without hosting config.
   * A trailing slash is therefore part of the contract; the export invariant
   * in `scripts/verify-static-export.sh` enforces it.
   */
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: resolvePublicApiBaseUrl(),
  },
};

export default withNextIntl(nextConfig);
