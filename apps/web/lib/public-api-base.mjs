/**
 * Validate and normalise the deliberately exposed web API base URL
 * (NEXT_PUBLIC_API_BASE_URL).
 *
 * - must be an absolute HTTP(S) URL;
 * - must not contain userinfo, a query string, or a fragment;
 * - may keep an intentional path prefix;
 * - only a trailing slash is normalised (no other URL parts are discarded).
 *
 * Dependency-free ESM so it can be used by the Next config and tested directly.
 */
export function normalizePublicApiBaseUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is required for the static web build: set it in the environment or the root .env public entry.',
    );
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be an absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL.');
  }
  if (url.username || url.password) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must not contain userinfo.');
  }
  if (url.search) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must not contain a query string.');
  }
  if (url.hash) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must not contain a fragment.');
  }

  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}
