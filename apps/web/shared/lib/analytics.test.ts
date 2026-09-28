import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPageContext,
  CONSENT_DEFAULT_DENIED,
  CONSENT_UPDATE_ACCEPTED,
  createAnalyticsGate,
  createGtagLayerPush,
  gtmBootstrapPushes,
  isEligibleAnalyticsPath,
  isProductionHost,
  markPageViewSent,
  pageLocation,
  sanitizePagePath,
  sanitizeReferrer,
} from './analytics.ts';

/**
 * GTM's own predicate for a "gtag command" message (from the container runtime:
 * `function Pb(a){ return !!a && (Object.prototype.toString.call(a) ===
 * "[object Arguments]" || Object.prototype.hasOwnProperty.call(a, "callee")); }`).
 * Plain Arrays do NOT satisfy it, so their `consent` command is dropped.
 */
const gtmProcessesAsCommand = (message: unknown): boolean =>
  !!message &&
  (Object.prototype.toString.call(message) === '[object Arguments]' ||
    Object.prototype.hasOwnProperty.call(message, 'callee'));

test('only the canonical production host is eligible', () => {
  assert.equal(isProductionHost('sapiensmetric.eu'), true);
  for (const host of ['localhost', '127.0.0.1', 'www.sapiensmetric.eu', 'sapiensmetric.eu.example.test', 'preview.vercel.app']) {
    assert.equal(isProductionHost(host), false, host);
  }
});

test('only eligible public routes are tracked', () => {
  for (const path of ['/', '/assessment-guide', '/understanding-results', '/about', '/contact', '/privacy', '/articles', '/articles/why-percentage-correct-is-not-a-percentile']) {
    assert.equal(isEligibleAnalyticsPath(path), true, path);
  }
  for (const path of ['/auth/login', '/account', '/admin', '/auth/register', '/articles/foo/bar', '/unknown']) {
    assert.equal(isEligibleAnalyticsPath(path), false, path);
  }
});

test('page paths are sanitized: no query strings, fragments, or trailing slashes', () => {
  assert.equal(sanitizePagePath('/articles/x?email=a@b.test#tok'), '/articles/x');
  assert.equal(sanitizePagePath('/lt/assessment-guide?foo=1'), '/lt/assessment-guide');
  assert.equal(sanitizePagePath('//articles//x/'), '/articles/x');
  assert.equal(sanitizePagePath('/'), '/');
  assert.equal(pageLocation('https://sapiensmetric.eu', '/articles/x?secret=1'), 'https://sapiensmetric.eu/articles/x');
});

test('page views are de-duplicated across remounts', () => {
  assert.equal(markPageViewSent('/articles/one'), true);
  assert.equal(markPageViewSent('/articles/one'), false);
  assert.equal(markPageViewSent('/articles/two'), true);
  assert.equal(markPageViewSent('/articles/two'), false);
});

test('the GTM load gate is idempotent', () => {
  const gate = createAnalyticsGate();
  assert.equal(gate.markLoaded(), true);
  assert.equal(gate.markLoaded(), false);
  assert.equal(gate.isLoaded(), true);
});

test('referrers are sanitised: same-origin path only, cross-origin omitted', () => {
  assert.equal(
    sanitizeReferrer('https://sapiensmetric.eu/en/assessment-guide?x=1#h', 'https://sapiensmetric.eu'),
    'https://sapiensmetric.eu/en/assessment-guide',
  );
  assert.equal(
    sanitizeReferrer('https://evil.example/steal?token=abc', 'https://sapiensmetric.eu'),
    '',
  );
  assert.equal(sanitizeReferrer('not a url', 'https://sapiensmetric.eu'), '');
  assert.equal(sanitizeReferrer('', 'https://sapiensmetric.eu'), '');
});

test('page context passed to Google tags is fully sanitised', () => {
  const context = buildPageContext({
    origin: 'https://sapiensmetric.eu',
    pathname: '/lt/articles/why-percentage-correct-is-not-a-percentile?email=a@b.test#tok',
    title: 'Why percentage correct is not a percentile',
    referrer: 'https://sapiensmetric.eu/lt/articles?secret=1',
  });
  assert.equal(context.page_path, '/lt/articles/why-percentage-correct-is-not-a-percentile');
  assert.equal(
    context.page_location,
    'https://sapiensmetric.eu/lt/articles/why-percentage-correct-is-not-a-percentile',
  );
  assert.equal(context.page_referrer, 'https://sapiensmetric.eu/lt/articles');
  assert.ok(!JSON.stringify(context).includes('secret'));
  assert.ok(!JSON.stringify(context).includes('email'));

  const external = buildPageContext({
    origin: 'https://sapiensmetric.eu',
    pathname: '/en/',
    title: 'Home',
    referrer: 'https://evil.example/?token=abc',
  });
  assert.equal(external.page_referrer, '');
});

test('consent is established before the Google tag and gtm.js bootstrap', () => {
  const context = buildPageContext({
    origin: 'https://sapiensmetric.eu',
    pathname: '/en/',
    title: 'Home',
  });
  const pushes = gtmBootstrapPushes(123, context);
  const text = JSON.stringify(pushes);
  // analytics_storage denied by default first, then granted, then page context,
  // then gtm.js — so the configuration tag fires only after consent.
  assert.match(text.slice(0, text.indexOf('gtm.js')), /"analytics_storage":"denied"/);
  assert.match(text.slice(0, text.indexOf('gtm.js')), /"analytics_storage":"granted"/);
  assert.equal((pushes[pushes.length - 1] as { event?: string }).event, 'gtm.js');
  const grantedIndex = text.indexOf('"analytics_storage":"granted"');
  const gtmIndex = text.indexOf('gtm.js');
  assert.ok(grantedIndex > -1 && grantedIndex < gtmIndex);
});

test('consent commands use the gtag Arguments shape that GTM actually processes', () => {
  const context = buildPageContext({ origin: 'https://sapiensmetric.eu', pathname: '/en/', title: 'Home' });
  const pushes = gtmBootstrapPushes(1, context);
  const def = pushes[0] as IArguments;
  const upd = pushes[1] as IArguments;

  // Regression for T-014: a plain Array (`['consent','default',{...}]`) is
  // routed to GTM's Array branch and the consent command is silently dropped,
  // leaving Consent Mode "not configured". GTM only reaches SD['consent'] when
  // the message is an Arguments object.
  assert.equal(Array.isArray(def), false, 'consent default must not be a plain Array');
  assert.equal(Array.isArray(upd), false, 'consent update must not be a plain Array');
  assert.equal(gtmProcessesAsCommand(def), true);
  assert.equal(gtmProcessesAsCommand(upd), true);

  assert.equal(def[0], 'consent');
  assert.equal(def[1], 'default');
  assert.equal(upd[0], 'consent');
  assert.equal(upd[1], 'update');

  // A plain Array is exactly what the predicate (and therefore GTM) rejects.
  assert.equal(gtmProcessesAsCommand(['consent', 'default', {}]), false);
});

test('the gtag layer push reproduces the standard Arguments object', () => {
  const captured: unknown[] = [];
  const gtag = createGtagLayerPush((command) => captured.push(command));
  gtag('consent', 'default', CONSENT_DEFAULT_DENIED);
  assert.equal(captured.length, 1);
  assert.equal(Array.isArray(captured[0]), false);
  assert.equal(gtmProcessesAsCommand(captured[0]), true);
  assert.equal((captured[0] as IArguments)[0], 'consent');
});

test('default denies all four signals; acceptance grants only analytics_storage', () => {
  const pushes = gtmBootstrapPushes(1, buildPageContext({ origin: 'https://sapiensmetric.eu', pathname: '/', title: 'Home' }));
  const def = pushes[0] as IArguments;
  const upd = pushes[1] as IArguments;
  assert.deepEqual(def[2], {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  assert.deepEqual(upd[2], {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  assert.deepEqual(CONSENT_DEFAULT_DENIED, def[2]);
  assert.deepEqual(CONSENT_UPDATE_ACCEPTED, upd[2]);
});
