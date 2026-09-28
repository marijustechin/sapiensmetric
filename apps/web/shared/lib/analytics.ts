/**
 * Consent-gated GTM/GA4 integration (T-014 analytics extension).
 *
 * Basic Consent Mode: the GTM script is injected ONLY after explicit analytics
 * consent, on the production host and eligible public routes. Advertising
 * consent stays denied. All page context passed to Google tags is sanitised
 * (no query strings, fragments, or external referrers). See D-027.
 *
 * The pure helpers are exported for unit testing; the browser functions are
 * no-ops outside the browser.
 */

export const GTM_CONTAINER_ID = 'GTM-WRBRTKRT';
export const GA4_MEASUREMENT_ID = 'G-0CR4C3KPH3';
export const PRODUCTION_HOST = 'sapiensmetric.eu';
export const GTM_SCRIPT_ID = 'sapiensmetric-gtm';

/** Locale-less public routes eligible for collection (next-intl pathnames). */
const ELIGIBLE_EXACT = new Set([
  '/',
  '/assessment-guide',
  '/understanding-results',
  '/about',
  '/contact',
  '/privacy',
  '/articles',
]);

export function isProductionHost(hostname: string): boolean {
  return hostname === PRODUCTION_HOST;
}

export function isEligibleAnalyticsPath(pathname: string): boolean {
  const path = sanitizePagePath(pathname);
  if (ELIGIBLE_EXACT.has(path)) return true;
  return /^\/articles\/[a-z0-9-]+$/.test(path);
}

/** Strip query strings and fragments and normalise to a leading-slash path. */
export function sanitizePagePath(pathname: string): string {
  let path = pathname.split('?')[0].split('#')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

export function pageLocation(origin: string, pathname: string): string {
  return `${origin}${sanitizePagePath(pathname)}`;
}

/**
 * Referrer sanitisation: only same-origin referrers are kept, reduced to
 * origin + path (no query/fragment). Cross-origin referrers are omitted.
 */
export function sanitizeReferrer(referrer: string, origin: string): string {
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    if (url.origin !== origin) return '';
    return `${url.origin}${sanitizePagePath(url.pathname)}`;
  } catch {
    return '';
  }
}

export interface PageContext {
  page_path: string;
  page_location: string;
  page_title: string;
  page_referrer: string;
}

/** Build the sanitised page context passed to Google tags. */
export function buildPageContext(input: {
  origin: string;
  pathname: string;
  title: string;
  referrer?: string;
}): PageContext {
  const path = sanitizePagePath(input.pathname);
  return {
    page_path: path,
    page_location: `${input.origin}${path}`,
    page_title: input.title,
    page_referrer: sanitizeReferrer(input.referrer ?? '', input.origin),
  };
}

/**
 * Consent Mode `default`: all four signals denied *before* any Google tag can
 * process consent. Advertising stays denied for the lifetime of the integration.
 */
export const CONSENT_DEFAULT_DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const;

/**
 * Consent Mode `update` after explicit acceptance: `analytics_storage` granted;
 * `ad_storage`, `ad_user_data`, and `ad_personalization` remain denied.
 */
export const CONSENT_UPDATE_ACCEPTED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted',
} as const;

/**
 * Reproduces the canonical `gtag()` helper:
 *
 *   function gtag(){ dataLayer.push(arguments); }
 *
 * GTM's dataLayer dispatch branches on `Array.isArray(message)` first, so a
 * **plain Array** such as `['consent', 'default', {...}]` is routed to GTM's
 * array/global-method branch and the `consent` command is **silently dropped**
 * (Consent Mode stays "not configured"). Only an **Arguments object** (matching
 * `Object.prototype.toString.call(m) === '[object Arguments]'`, or having its
 * own `callee`) reaches GTM's consent processor `SD['consent']`. Do not replace
 * this with a plain array literal.
 */
export function createGtagLayerPush(
  push: (command: unknown) => unknown,
): (...args: unknown[]) => void {
  return function gtag(): void {
    // GTM Consent Mode only processes an Arguments object; a rest parameter or
    // plain Array is ignored, so this must not be a rest parameter.
    // eslint-disable-next-line prefer-rest-params
    push(arguments);
  };
}

/**
 * The dataLayer bootstrap pushed immediately before the GTM script is appended:
 * `consent default` (all four denied), `consent update` (analytics granted), the
 * sanitised page context, then the standard `gtm.js` event. Consent is therefore
 * established before the Google tag (configuration) fires on `gtm.js`.
 */
export function gtmBootstrapPushes(
  now: number,
  context: PageContext,
): unknown[] {
  const pushes: unknown[] = [];
  const gtag = createGtagLayerPush((command) => pushes.push(command));
  gtag('consent', 'default', CONSENT_DEFAULT_DENIED);
  gtag('consent', 'update', CONSENT_UPDATE_ACCEPTED);
  pushes.push(context);
  pushes.push({ 'gtm.start': now, event: 'gtm.js' });
  return pushes;
}

/** An idempotent guard so GTM is never inserted twice. */
export interface AnalyticsGate {
  markLoaded(): boolean;
  isLoaded(): boolean;
}

export function createAnalyticsGate(): AnalyticsGate {
  let loaded = false;
  return {
    markLoaded(): boolean {
      if (loaded) return false;
      loaded = true;
      return true;
    },
    isLoaded(): boolean {
      return loaded;
    },
  };
}

/**
 * Module-level dedupe that survives React remounts: returns true only the first
 * time a given sanitized path is sent within this page session.
 */
let lastSentPath: string | null = null;
export function markPageViewSent(pathname: string): boolean {
  const path = sanitizePagePath(pathname);
  if (lastSentPath === path) return false;
  lastSentPath = path;
  return true;
}

type DataLayer = unknown[];

function dataLayer(): DataLayer | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { dataLayer?: DataLayer };
  w.dataLayer = w.dataLayer ?? [];
  return w.dataLayer;
}

/**
 * Inject the GTM script once (after consent). Consent and sanitised page
 * context are pushed first. No `<noscript>` iframe.
 */
export function ensureGtmLoaded(context: PageContext): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (document.getElementById(GTM_SCRIPT_ID)) return false;
  const layer = dataLayer();
  if (!layer) return false;

  for (const push of gtmBootstrapPushes(Date.now(), context)) {
    layer.push(push);
  }

  const script = document.createElement('script');
  script.async = true;
  script.id = GTM_SCRIPT_ID;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
  document.head.appendChild(script);
  return true;
}

/** Fire one sanitized page_view for the current eligible page. */
export function pushPageView(context: PageContext): void {
  const layer = dataLayer();
  if (!layer) return;
  layer.push({ event: 'spa_page_view', ...context });
}

/** Remove this integration's analytics cookies where accessible. */
export function deleteAnalyticsCookies(): void {
  if (typeof document === 'undefined') return;
  const names = document.cookie
    .split(';')
    .map((entry) => entry.split('=')[0].trim())
    .filter(
      (name) => name === '_ga' || name.startsWith('_ga_') || name === '_gcl_au',
    );
  for (const name of names) {
    const domains = ['', `; domain=${PRODUCTION_HOST}`, `; domain=.${PRODUCTION_HOST}`];
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
}
