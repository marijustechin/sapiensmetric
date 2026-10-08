#!/usr/bin/env node
/**
 * verify-navigation-runtime.mjs — real-browser checks for the T-020 public
 * navigation, markup, and responsive layout.
 *
 * Serves the built static export (`apps/web/out`, or `--base <url>`) and drives
 * headless Chromium over CDP at mobile and desktop widths in EN and LT:
 * horizontal overflow, landmarks/skip link, hamburger drawer open/close, focus
 * entry/containment/return, Escape and backdrop dismissal, route selection,
 * locale switching, and that the public navigation exposes no unavailable
 * application destinations.
 *
 * With `--base https://sapiensmetric.eu` it additionally checks the analytics
 * consent banner interaction (banner present, drawer stacking/focus, banner
 * restored after dismissal). The consent banner only renders on the production
 * host, so it is skipped for local bases.
 *
 * Needs a local Chromium; it is a diagnostic regression tool (like
 * `verify-consent-gtm-runtime.mjs`) and is NOT part of `pnpm verify`.
 * Run: `node scripts/verify-navigation-runtime.mjs [--base <url>]`.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH
  ?? ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable']
    .find((p) => existsSync(p));
if (!CHROME) {
  console.log('verify-navigation-runtime: SKIP (no Chromium binary found; set CHROME_PATH).');
  process.exit(0);
}

const args = process.argv.slice(2);
const baseArgIndex = args.indexOf('--base');
const explicitBase = baseArgIndex >= 0 ? args[baseArgIndex + 1] : (process.env.BASE_URL ?? '');
const OUT_DIR = resolve('apps/web/out');
const serveStatic = !explicitBase;
const PORT = Number(process.env.PORT ?? 8123);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9456);
const BASE = explicitBase || `http://127.0.0.1:${PORT}`;
const isProduction = BASE.startsWith('https://');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
const check = (name, cond, detail = '') => {
  if (!cond) failures += 1;
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// --- static server for the built export ------------------------------------
let server = null;
if (serveStatic) {
  if (!existsSync(OUT_DIR)) {
    console.log(`verify-navigation-runtime: SKIP (no build at ${OUT_DIR}; run pnpm build).`);
    process.exit(0);
  }
  server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    const send = async (file, status = 200) => {
      const body = await readFile(file);
      res.writeHead(status, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    };
    try {
      const direct = join(OUT_DIR, rel);
      const target = rel.endsWith('/') ? join(direct, 'index.html') : direct;
      if ((await stat(target)).isFile()) return await send(target);
      const asDir = join(direct, 'index.html');
      if ((await stat(asDir)).isFile()) return await send(asDir);
      throw new Error('not found');
    } catch {
      try { return await send(join(OUT_DIR, '404.html'), 404); }
      catch { res.writeHead(404); res.end('not found'); }
    }
  });
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
}

// --- chromium ---------------------------------------------------------------
const userDir = mkdtempSync(join(tmpdir(), 'nav-runtime-'));
const child = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${userDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });

async function waitBrowser() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`); if (r.ok) return; } catch {}
    await sleep(200);
  }
  throw new Error('chromium did not start');
}

async function newSession(viewport) {
  const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); p?.(m); }
  };
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))
      .result?.result?.value;
  const key = async (keyName, code, keyCode, modifiers = 0) => {
    const base = { key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, modifiers };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width, height: viewport.height, deviceScaleFactor: 1,
    mobile: viewport.width < 768,
  });
  const goto = async (path) => {
    await send('Page.navigate', { url: `${BASE}${path}` });
    for (let i = 0; i < 80; i++) {
      const ready = await evaluate(`document.readyState === 'complete' && !!document.querySelector('main#main-content, [role=dialog], header')`);
      if (ready) break;
      await sleep(150);
    }
    await sleep(250);
  };
  const close = async () => {
    await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${target.id}`).catch(() => {});
    ws.close();
  };
  return { send, evaluate, key, goto, close };
}

const viewports = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
];

const PUBLIC_PATHS = new Set([
  '', 'assessment-guide', 'understanding-results', 'about', 'contact', 'privacy', 'articles',
]);

function isPublicHref(href, locale) {
  const prefix = `/${locale}/`;
  if (!href.startsWith(prefix)) return false;
  const rest = href.slice(prefix.length).replace(/\/+$/, '');
  if (rest === '') return true;
  const first = rest.split('/')[0];
  return PUBLIC_PATHS.has(first) || rest.startsWith('articles/');
}

try {
  await waitBrowser();

  for (const viewport of viewports) {
    const session = await newSession(viewport);
    const { evaluate, key, goto, close } = session;

    for (const locale of ['en', 'lt']) {
      const label = `${viewport.name}px/${locale}`;

      // No horizontal overflow on the main public pages.
      for (const path of [`/${locale}/`, `/${locale}/assessment-guide/`, `/${locale}/about/`, `/${locale}/articles/`, `/${locale}/contact/`, `/${locale}/privacy/`]) {
        await goto(path);
        const overflow = await evaluate(`document.documentElement.scrollWidth - window.innerWidth`);
        check(`no horizontal overflow on ${path} @ ${viewport.name}`, overflow <= 1, `overflow=${overflow}`);
      }

      await goto(`/${locale}/`);
      const landmarks = await evaluate(`JSON.stringify({
        header: !!document.querySelector('header'),
        main: !!document.querySelector('main#main-content'),
        footer: !!document.querySelector('footer'),
        skip: !!document.querySelector('a[href="#main-content"]'),
        imagesHaveAlt: Array.from(document.querySelectorAll('img')).every((i) => i.hasAttribute('alt')),
        h1: document.querySelectorAll('h1').length,
      })`);
      const lm = JSON.parse(landmarks);
      check(`${label} landmarks + skip link`, lm.header && lm.main && lm.footer && lm.skip, landmarks);
      check(`${label} exactly one h1`, lm.h1 === 1, `h1=${lm.h1}`);
      check(`${label} all images have alt`, lm.imagesHaveAlt);

      // Open the drawer.
      await evaluate(`document.querySelector('[aria-controls="site-menu"]').click()`);
      await sleep(250);
      const opened = JSON.parse(await evaluate(`JSON.stringify((() => {
        const dialog = document.querySelector('[role=dialog][aria-modal=true]');
        const trigger = document.querySelector('[aria-controls="site-menu"]');
        const root = document.getElementById('site-root');
        const links = dialog ? Array.from(dialog.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')) : [];
        return {
          dialog: !!dialog,
          expanded: trigger.getAttribute('aria-expanded'),
          focusInside: dialog ? dialog.contains(document.activeElement) : false,
          inert: root ? root.hasAttribute('inert') : false,
          bodyOverflow: getComputedStyle(document.body).overflow,
          links,
          current: dialog ? Array.from(dialog.querySelectorAll('a[aria-current="page"]')).map((a) => a.getAttribute('href')) : [],
          minTarget: dialog ? Math.min(...Array.from(dialog.querySelectorAll('a,button')).map((el) => el.getBoundingClientRect().height)) : 0,
        };
      })())`));
      check(`${label} drawer opens`, opened.dialog);
      check(`${label} menu button aria-expanded=true`, opened.expanded === 'true');
      check(`${label} focus enters the drawer`, opened.focusInside);
      check(`${label} background is inert`, opened.inert);
      check(`${label} body scroll locked`, opened.bodyOverflow === 'hidden');
      check(`${label} nav exposes only public destinations`, opened.links.length > 0 && opened.links.every((h) => isPublicHref(h, locale)), JSON.stringify(opened.links));
      check(`${label} current page indicated`, opened.current.length === 1, JSON.stringify(opened.current));
      check(`${label} touch targets >= 44px`, opened.minTarget >= 44, `min=${opened.minTarget}`);

      // Tab containment.
      let contained = true;
      for (let i = 0; i < 6; i++) {
        await key('Tab', 'Tab', 9);
        const inside = await evaluate(`document.querySelector('[role=dialog]')?.contains(document.activeElement) ?? false`);
        if (!inside) contained = false;
      }
      check(`${label} focus stays inside the drawer while tabbing`, contained);

      // Escape returns focus to the trigger.
      await key('Escape', 'Escape', 27);
      await sleep(200);
      const closed = JSON.parse(await evaluate(`JSON.stringify((() => {
        const trigger = document.querySelector('[aria-controls="site-menu"]');
        const root = document.getElementById('site-root');
        return {
          dialog: !!document.querySelector('[role=dialog]'),
          expanded: trigger.getAttribute('aria-expanded'),
          focusOnTrigger: document.activeElement === trigger,
          inert: root ? root.hasAttribute('inert') : false,
          bodyOverflow: getComputedStyle(document.body).overflow,
        };
      })())`));
      check(`${label} Escape closes the drawer`, !closed.dialog && closed.expanded === 'false');
      check(`${label} focus returns to the trigger`, closed.focusOnTrigger);
      check(`${label} inert removed after close`, !closed.inert);
      check(`${label} body scroll restored`, closed.bodyOverflow !== 'hidden');

      // Backdrop dismiss.
      await evaluate(`document.querySelector('[aria-controls="site-menu"]').click()`);
      await sleep(200);
      await evaluate(`document.querySelector('[role=dialog]').parentElement.firstElementChild.click()`);
      await sleep(200);
      check(`${label} backdrop click closes the drawer`, !(await evaluate(`!!document.querySelector('[role=dialog]')`)));

      // Route selection closes the drawer and navigates.
      await evaluate(`document.querySelector('[aria-controls="site-menu"]').click()`);
      await sleep(200);
      await evaluate(`document.querySelector('[role=dialog] a[href="/${locale}/assessment-guide/"]').click()`);
      await sleep(500);
      const routed = JSON.parse(await evaluate(`JSON.stringify({ dialog: !!document.querySelector('[role=dialog]'), path: location.pathname })`));
      check(`${label} nav link navigates and closes the drawer`, !routed.dialog && routed.path === `/${locale}/assessment-guide/`, routed.path);
    }

    // Locale switch preserves the equivalent route.
    await goto(`/en/about/`);
    await evaluate(`Array.from(document.querySelectorAll('header button')).find((b) => !b.hasAttribute('aria-controls'))?.click()`);
    await sleep(500);
    const switched = await evaluate(`location.pathname`);
    check(`${viewport.name}px locale switch preserves route`, switched === '/lt/about/', switched);

    await close();
  }

  // Consent interaction + public destinations (production only: the banner is
  // gated to the production host).
  if (isProduction) {
    const session = await newSession({ width: 390, height: 844 });
    const { evaluate, key, goto, close } = session;
    await goto('/en/');
    const banner = JSON.parse(await evaluate(`JSON.stringify((() => {
      // The consent banner is the only direct <section> child of #site-root.
      const region = document.querySelector('#site-root > section');
      return { present: !!region, body: !!region };
    })())`));
    check('consent banner present on production', banner.present && banner.body);

    await evaluate(`document.querySelector('[aria-controls="site-menu"]').click()`);
    await sleep(250);
    const stacking = JSON.parse(await evaluate(`JSON.stringify((() => {
      const dialog = document.querySelector('[role=dialog]');
      const backdrop = dialog ? dialog.parentElement : null;
      const region = document.querySelector('#site-root > section');
      const z = (el) => (el ? Number(getComputedStyle(el).zIndex) || 0 : 0);
      const bannerButton = region ? region.querySelector('button') : null;
      // The banner sits inside the inert region, so it must not be reachable.
      bannerButton?.focus();
      return {
        drawerAboveBanner: z(backdrop) > z(region),
        focusTrapped: dialog ? dialog.contains(document.activeElement) : false,
        bannerInert: !!document.getElementById('site-root')?.hasAttribute('inert'),
      };
    })())`));
    check('drawer stacks above the consent banner', stacking.drawerAboveBanner);
    check('consent banner is inert while the drawer is open', stacking.bannerInert);
    check('focus stays in the drawer (banner not reachable)', stacking.focusTrapped);

    await key('Escape', 'Escape', 27);
    await sleep(200);
    const bannerAfter = await evaluate(`!!document.querySelector('#site-root > section') && !document.getElementById('site-root').hasAttribute('inert')`);
    check('consent banner restored after dismissing the drawer', bannerAfter);
    await close();
  } else {
    console.log('note  consent-banner interaction checks run only against the production base (--base https://…).');
  }
} catch (error) {
  check('browser probe completed without error', false, String(error));
} finally {
  child.kill('SIGKILL');
  server?.close();
  try { rmSync(userDir, { recursive: true, force: true }); } catch {}
}

console.log('');
if (failures) {
  console.log(`verify-navigation-runtime: ${failures} failed`);
  process.exit(1);
}
console.log('verify-navigation-runtime: all checks passed.');
