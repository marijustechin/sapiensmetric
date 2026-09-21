/**
 * Same-origin `returnTo` validation for the Google flow (D-018). Only absolute
 * paths on the configured public app origin are accepted; everything else falls
 * back, so an attacker-supplied value can never redirect off-origin.
 */
export function sanitizeReturnTo(
  value: unknown,
  origin: string,
  fallback: string,
): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  if (trimmed.includes('\\')) {
    return fallback;
  }
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return fallback;
  }
  try {
    const url = new URL(trimmed, origin);
    if (url.origin !== origin) {
      return fallback;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
