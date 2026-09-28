#!/usr/bin/env node
/**
 * verify-consent-gtm-runtime.mjs — real-runtime Consent Mode check.
 *
 * Loads the REAL gtm.js for GTM-WRBRTKRT in headless Chromium and inspects GTM's
 * internal consent state (`google_tag_data.ics`) to prove the command shape is
 * what GTM actually processes:
 *
 *   - canonical gtag() Arguments object -> ics.usedDefault === true
 *   - plain Array (the T-014 defect)    -> ics.usedDefault === false
 *
 * This goes beyond "the mocked queue is in the right order": it exercises the
 * Google Tag Manager runtime itself. It needs a local Chromium and network access
 * to www.googletagmanager.com, so it is a diagnostic regression tool and is NOT
 * part of `pnpm verify`. Run: `node scripts/verify-consent-gtm-runtime.mjs`.
 *
 * The consent payload mirrors apps/web/shared/lib/analytics.ts
 * (CONSENT_DEFAULT_DENIED). Keep them in sync if the payload changes.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME_PATH
  ?? ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable']
    .find((p) => existsSync(p));
if (!CHROME) {
  console.log('verify-consent-gtm-runtime: SKIP (no Chromium binary found; set CHROME_PATH).');
  process.exit(0);
}

const GTM_ID = 'GTM-WRBRTKRT';
const GTM = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
const PORT = 9455;
const SITE = 8115;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const D = "{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'}";

const page = (shape) => `<!DOCTYPE html><html><head><meta charset="utf-8"><script>
window.dataLayer = window.dataLayer || [];
${shape === 'array'
  ? `dataLayer.push(['consent','default',${D}]);`
  : `function gtag(){ dataLayer.push(arguments); } gtag('consent','default',${D});`}
</script><script async src="${GTM}"></script></head><body>${shape}</body></html>`;

const server = createServer((req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(page(req.url.startsWith('/args') ? 'args' : 'array'));
});
await new Promise((r) => server.listen(SITE, '127.0.0.1', r));

const userDir = mkdtempSync(join(tmpdir(), 'consent-runtime-'));
const child = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });

async function waitBrowser() {
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return; } catch {} await sleep(200); }
  throw new Error('chromium did not start');
}

const observed = {};
let failures = 0;
const check = (name, cond, detail = '') => {
  if (!cond) failures += 1;
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

try {
  await waitBrowser();
  for (const slug of ['array', 'args']) {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0; const pending = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); p?.(m); } };
    const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalv = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${SITE}/${slug}` });
    for (let i = 0; i < 40; i++) { if (await evalv(`!!(window.google_tag_manager && window.google_tag_manager['${GTM_ID}'])`)) break; await sleep(250); }
    // `usedDefault` flips to true only after GTM's consent command processor ran.
    let usedDefault;
    for (let i = 0; i < 20; i++) {
      usedDefault = await evalv(`(() => { try { return window.google_tag_data && window.google_tag_data.ics ? window.google_tag_data.ics.usedDefault : null; } catch (e) { return null; } })()`);
      if (usedDefault !== null) break;
      await sleep(200);
    }
    observed[slug] = usedDefault;
    await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`).catch(() => {});
    ws.close();
  }
} catch (e) {
  console.log(`FAIL probe error — ${e}`);
  failures += 1;
} finally {
  child.kill('SIGKILL'); server.close();
  try { rmSync(userDir, { recursive: true, force: true }); } catch {}
}

console.log('');
check('Arguments object is processed by GTM (ics.usedDefault === true)', observed.args === true, `observed ${observed.args}`);
check('plain Array is NOT processed by GTM (ics.usedDefault === false)', observed.array === false, `observed ${observed.array}`);

console.log('');
if (failures) { console.log(`verify-consent-gtm-runtime: ${failures} failed`); process.exit(1); }
console.log('verify-consent-gtm-runtime: all checks passed (real GTM runtime).');
