#!/usr/bin/env node
/**
 * deploy-webdav.mjs — WebDAV deployment automation for the public frontend
 * (T-014 extension). Dependency-free (Node built-ins + global fetch).
 *
 * Identity model (corrected):
 *   - artifactId  = sha256 over sorted `path \0 sha256(fileContents)` lines.
 *   - operationId = fresh id per deployment operation (never derived from the
 *                   artifactId). Each operation gets its own pre-deployment
 *                   baseline, even when deploying the same artifact again.
 *   Retries resume a specific operation (`--operation <id>`), which verifies the
 *   artifact contents and destination match before continuing. A baseline is
 *   never silently reused just because the artifactId matches.
 *
 * Backup files and manifest updates are written atomically (temp file + rename)
 * BEFORE the corresponding remote file is overwritten.
 *
 * Commands: check | plan | apply | rollback | verify. Credentials are parsed as
 * data from `.env.deploy.local`; TLS verification is always on.
 */
import { createHash, randomBytes } from 'node:crypto';
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  renameSync,
} from 'node:fs';
import { readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ARTIFACT_DEFAULT = 'dist/public-site';
const ENV_DEFAULT = '.env.deploy.local';
const SITE_DEFAULT = 'https://sapiensmetric.eu';
const BASELINE_ROOT = 'dist/deploy-baseline';
const KNOWN_FILE = 'sitemap.xml';

// --- pure helpers (exported for tests) ------------------------------------

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/** Artifact identity from sorted paths + cryptographic content hashes. */
export function artifactIdentity(hashes) {
  const lines = [...hashes]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((h) => `${h.path}\u0000${h.sha256}`)
    .join('\n');
  return createHash('sha256').update(lines).digest('hex').slice(0, 16);
}

export function newOperationId(now = Date.now(), rand = randomBytes(6).toString('hex')) {
  return `${now.toString(36)}-${rand}`;
}

/**
 * Capture the remote file into the baseline only when this operation has no
 * prior entry for it. Existing entries are never re-captured, so a retry cannot
 * overwrite (or accidentally re-base) the original pre-deployment content.
 */
export function shouldCaptureBaseline(entry) {
  return !entry;
}

/** Resume must match the operation's artifact contents and destination. */
export function assertResumeMatches(manifest, { artifactId, remoteBase }) {
  if (manifest.artifactId !== artifactId) {
    throw new Error(
      `Artifact contents differ from operation ${manifest.operationId} (${manifest.artifactId} != ${artifactId}); start a new operation.`,
    );
  }
  if (manifest.remoteBase !== remoteBase) {
    throw new Error(
      `Destination differs from operation ${manifest.operationId} (${manifest.remoteBase} != ${remoteBase}); start a new operation.`,
    );
  }
}

/** Path : size only identifies nothing; kept for readable reporting. */
export function sortKeysForUpload(keys) {
  const isAsset = (k) => k.startsWith('_next/') || k.startsWith('branding/');
  return [...keys].sort((a, b) => {
    const d = Number(isAsset(b)) - Number(isAsset(a));
    return d !== 0 ? d : a.localeCompare(b);
  });
}

// --- env / args ------------------------------------------------------------

export function parseEnvFile(text) {
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[key] = value;
  }
  return env;
}

export function parseArgs(argv) {
  const args = { command: null, env: ENV_DEFAULT, artifact: ARTIFACT_DEFAULT, site: SITE_DEFAULT, confirm: false, remoteBase: null, operation: null };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--env') args.env = argv[++i];
    else if (a === '--artifact') args.artifact = argv[++i];
    else if (a === '--site') args.site = argv[++i];
    else if (a === '--remote-base') args.remoteBase = argv[++i];
    else if (a === '--operation' || a === '--baseline') args.operation = argv[++i];
    else if (a === '--confirm') args.confirm = true;
    else positional.push(a);
  }
  args.command = positional[0] ?? null;
  return args;
}

function loadCredentials(envPath) {
  if (!existsSync(envPath)) throw new Error(`Missing ${envPath}. Copy .env.deploy.local.example to ${envPath} and enter the password locally.`);
  const env = parseEnvFile(readFileSync(envPath, 'utf8'));
  const { WEBDAV_URL: url, WEBDAV_USERNAME: username, WEBDAV_PASSWORD: password } = env;
  if (!url || !username) throw new Error('WEBDAV_URL and WEBDAV_USERNAME must be set.');
  if (!password) throw new Error(`WEBDAV_PASSWORD is empty. Enter it locally in ${envPath} on the WEBDAV_PASSWORD= line.`);
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new Error('Refusing to run with TLS certificate verification disabled.');
  return { url: url.endsWith('/') ? url : `${url}/`, auth: `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}` };
}

// --- atomic persistence ----------------------------------------------------

function writeFileAtomic(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

function downloadAtomic(buffer, dest) {
  writeFileAtomic(dest, buffer);
}

/**
 * Create missing parent WebDAV collections for a file path, from the
 * deployment base downwards. MKCOL is idempotent here: an existing collection
 * typically returns 405 (Method Not Allowed) or a 3xx redirect, treated as
 * "already present". Used only as recovery when a PUT returns 409 (Conflict:
 * parent collection missing). It never deletes or modifies anything.
 */
async function ensureCollections(remoteBase, key, auth) {
  const parts = key.split('/').slice(0, -1); // drop the file name
  let acc = remoteBase;
  for (const part of parts) {
    acc += `${part}/`;
    const res = await fetch(acc, { method: 'MKCOL', headers: { Authorization: auth } });
    if ([200, 201, 204, 301, 302, 405].includes(res.status)) continue;
    throw new Error(`MKCOL ${acc} failed with ${res.status}.`);
  }
}

// --- WebDAV helpers --------------------------------------------------------

const PROPFIND_BODY = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/><d:getcontentlength/></d:prop></d:propfind>`;

async function propfind(url, depth, auth) {
  const res = await fetch(url, { method: 'PROPFIND', headers: { Depth: String(depth), Authorization: auth, 'Content-Type': 'application/xml; charset=utf-8' }, body: depth === 0 ? undefined : PROPFIND_BODY });
  if (res.status === 401) throw new Error('Authentication failed (401).');
  if (res.status !== 207) throw new Error(`PROPFIND ${url} returned ${res.status}`);
  return res.text();
}

function hrefsFromXml(xml, base) {
  const basePath = new URL(base).pathname;
  const out = [];
  const re = /<(?:D:|d:)?href>([^<]+)<\/(?:D:|d:)?href>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    let href = m[1];
    try { href = decodeURIComponent(href); } catch {}
    const p = href.startsWith('http') ? new URL(href).pathname : href;
    out.push(p.startsWith(basePath) ? p.slice(basePath.length) : p);
  }
  return out;
}

export async function remoteStat(url, auth) {
  try {
    const head = await fetch(url, { method: 'HEAD', headers: { Authorization: auth } });
    if (head.ok) return { state: 'exists', status: head.status, via: 'HEAD' };
    if (head.status === 404 || head.status === 410) return { state: 'missing', status: head.status, via: 'HEAD' };
    if (head.status === 401 || head.status === 403 || head.status >= 500) return { state: 'error', status: head.status, via: 'HEAD' };
  } catch {
    return { state: 'error', status: 0, via: 'HEAD' };
  }
  try {
    const pf = await fetch(url, { method: 'PROPFIND', headers: { Depth: '0', Authorization: auth } });
    if (pf.status === 207) return { state: 'exists', status: 207, via: 'PROPFIND' };
    if (pf.status === 404 || pf.status === 410) return { state: 'missing', status: pf.status, via: 'PROPFIND' };
    return { state: 'error', status: pf.status, via: 'PROPFIND' };
  } catch {
    return { state: 'error', status: 0, via: 'PROPFIND' };
  }
}

async function fetchBuffer(url, auth) {
  const res = await fetch(url, { headers: { Authorization: auth } });
  if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) throw new Error(`GET ${url} returned an empty body`);
  return buffer;
}

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(relative(base, full).split('\\').join('/'));
  }
  return out;
}

function contentType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (path.endsWith('.xml')) return 'application/xml; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.js')) return 'text/javascript';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

function computeArtifact(artifact, ordered) {
  const hashes = ordered.map((path) => ({ path, sha256: sha256(readFileSync(join(artifact, path))) }));
  return { artifactId: artifactIdentity(hashes), hashes: new Map(hashes.map((h) => [h.path, h.sha256])) };
}

async function resolveRemoteBase(args, auth) {
  if (args.remoteBase) return args.remoteBase.endsWith('/') ? args.remoteBase : `${args.remoteBase}/`;
  const { url } = loadCredentials(args.env);
  const root = await propfind(url, 1, auth);
  const hasPublicHtml = hrefsFromXml(root, url).some((e) => e.replace(/\/$/, '') === 'public_html');
  return hasPublicHtml ? `${url}public_html/` : url;
}

// --- commands --------------------------------------------------------------

async function commandCheck(args) {
  const { url, auth } = loadCredentials(args.env);
  console.log(`WebDAV URL: ${url}`);
  console.log('TLS: certificate verification is ON (never disabled).');
  const root = await propfind(url, 1, auth);
  console.log('Authentication: OK (PROPFIND 207)');
  const entries = hrefsFromXml(root, url).filter((p) => p.replace(/\/$/, '') !== '');
  console.log(`Root PROPFIND entries: ${entries.length === 0 ? '(empty body — cPanel returns 207 with no <d:response>)' : entries.join(', ')}`);
  const hasPublicHtml = entries.some((e) => e.replace(/\/$/, '') === 'public_html');
  console.log(`/public_html/ probe: ${(await remoteStat(`${url}public_html/`, auth)).state}`);
  const knownWebdav = await fetch(`${url}${KNOWN_FILE}`, { headers: { Authorization: auth } });
  const knownPublic = await fetch(`${args.site.replace(/\/?$/, '/')}${KNOWN_FILE}`, { redirect: 'manual' });
  console.log(`Known file via WebDAV (${KNOWN_FILE}): ${knownWebdav.status} ${knownWebdav.headers.get('content-type') ?? ''}`);
  console.log(`Known file via public site (${KNOWN_FILE}): ${knownPublic.status} ${knownPublic.headers.get('content-type') ?? ''}`);
  console.log('');
  console.log(hasPublicHtml ? 'Path mapping: root lists public_html/ → base has /public_html/.' : 'Path mapping: chrooted to public_html (no public_html/ entry) → base is the URL root; do NOT append /public_html/.');
  console.log(`Deployment base: ${args.remoteBase ?? url}`);
}

async function planOrApply(args, apply) {
  const artifact = resolve(args.artifact);
  if (!existsSync(artifact)) throw new Error(`Artifact not found: ${artifact}. Run \`pnpm build:public\` first.`);
  const ordered = sortKeysForUpload(walk(artifact));
  // Hosting-controlled files must never be uploaded: an artifact copy of
  // `.htaccess` or `.well-known/**` would overwrite the remote originals even
  // though the tool performs no mirror/delete.
  const reserved = ordered.filter(
    (path) => path === '.htaccess' || path === '.well-known' || path.startsWith('.well-known/'),
  );
  if (reserved.length > 0) {
    throw new Error(
      `Artifact contains hosting-controlled paths that must not be uploaded: ${reserved.join(', ')}`,
    );
  }
  const { artifactId, hashes } = computeArtifact(artifact, ordered);

  const creds = loadCredentials(args.env);
  const auth = creds.auth;
  const remoteBase = await resolveRemoteBase(args, auth);

  if (apply && !args.confirm) throw new Error('`apply` requires `--confirm`. Use `plan` for a dry run.');

  console.log(`${apply ? 'APPLY' : 'PLAN'} — source ${artifact}`);
  console.log(`Remote base: ${remoteBase}`);
  console.log(`Artifact id (content): ${artifactId}   Files: ${ordered.length} (assets first: ${ordered.filter((k) => k.startsWith('_next/') || k.startsWith('branding/')).length})`);
  console.log(`Preserved (never uploaded/deleted): .htaccess, .well-known/, unrelated remote files (no mirror/delete)`);
  console.log('');

  let create = 0;
  let overwrite = 0;
  const creates = [];
  const overwrites = [];
  for (const key of ordered) {
    const stat = await remoteStat(`${remoteBase}${key}`, auth);
    if (stat.state === 'error') throw new Error(`Existence check for ${key} failed (${stat.via} ${stat.status}); not treating as missing.`);
    if (stat.state === 'missing') { create += 1; creates.push(key); } else { overwrite += 1; overwrites.push(key); }
  }
  console.log(`Create: ${create}   Overwrite (baseline): ${overwrite}`);
  console.log('Overwrites:'); for (const key of overwrites) console.log(`  overwrite ${key}`);
  console.log('Creates:'); for (const key of creates) console.log(`  create ${key}`);
  console.log(''); console.log('Upload order (assets first):'); for (const key of ordered) console.log(`  ${key}`);

  if (!apply) {
    if (args.operation) {
      const mPath = join(resolve(BASELINE_ROOT, args.operation), 'manifest.json');
      if (!existsSync(mPath)) throw new Error(`No baseline for operation ${args.operation}.`);
      const manifest = JSON.parse(readFileSync(mPath, 'utf8'));
      assertResumeMatches(manifest, { artifactId, remoteBase });
      console.log(`\nResume operation: ${args.operation} (artifact + destination match).`);
    } else {
      console.log(`\nA new operation (fresh id + baseline) will be created on apply.`);
    }
    console.log('Dry run only — no PUT/MKCOL/MOVE/DELETE performed.');
    return;
  }

  // Operation identity (separate from artifact identity).
  const opId = args.operation ?? newOperationId();
  const baselineDir = resolve(BASELINE_ROOT, opId);
  const manifestPath = join(baselineDir, 'manifest.json');
  let manifest;
  if (existsSync(manifestPath)) {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assertResumeMatches(manifest, { artifactId, remoteBase });
  } else {
    if (args.operation) throw new Error(`No baseline for operation ${opId}.`);
    manifest = { operationId: opId, artifactId, remoteBase, artifactPath: artifact, createdAt: new Date().toISOString(), entries: [] };
    writeFileAtomic(manifestPath, JSON.stringify(manifest, null, 2));
  }
  const byPath = new Map(manifest.entries.map((e) => [e.path, e]));
  const syncEntries = () => { manifest.entries = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path)); manifest.updatedAt = new Date().toISOString(); };
  const saveManifest = () => writeFileAtomic(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nOperation: ${opId}   Baseline: ${baselineDir}`);
  let uploaded = 0;
  for (const key of ordered) {
    const contentHash = hashes.get(key);
    let entry = byPath.get(key);
    if (entry?.contentHash && entry.contentHash !== contentHash) {
      throw new Error(`Artifact content for ${key} differs from operation ${opId}; start a new operation.`);
    }
    const stat = await remoteStat(`${remoteBase}${key}`, auth);
    if (stat.state === 'error') throw new Error(`Existence check for ${key} failed (${stat.via} ${stat.status}).`);
    if (stat.state === 'exists') {
      if (shouldCaptureBaseline(entry)) {
        const backupRel = `files/${key}`;
        const backupAbs = join(baselineDir, backupRel);
        const buffer = await fetchBuffer(`${remoteBase}${key}`, auth);
        downloadAtomic(buffer, backupAbs); // backup persisted (atomic) before overwrite
        entry = { path: key, action: 'overwrite', contentHash, backup: backupRel, bytes: buffer.length, capturedAt: new Date().toISOString() };
        byPath.set(key, entry);
        syncEntries();
        saveManifest(); // manifest persisted (atomic) before overwrite
        console.log(`  baseline ${key} (${buffer.length} bytes)`);
      } else if (entry.action === 'overwrite') {
        // Retry of this operation: the original baseline must still be present.
        if (!existsSync(join(baselineDir, entry.backup))) {
          throw new Error(`Baseline backup for ${key} is missing in operation ${opId}; refusing to continue (the original baseline cannot be reconstructed).`);
        }
      }
      // entry.action === 'create' → created by this operation earlier; nothing to capture.
    } else {
      if (entry?.action === 'overwrite') throw new Error(`Remote file ${key} is missing but was captured as an overwrite; refusing to continue.`);
      if (!entry) {
        entry = { path: key, action: 'create', contentHash, createdAt: new Date().toISOString() };
        byPath.set(key, entry);
        syncEntries();
        saveManifest();
      }
    }
    const putOnce = () => fetch(`${remoteBase}${key}`, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': contentType(key) },
      body: readFileSync(join(artifact, key)),
    });
    let res = await putOnce();
    if (res.status === 409) {
      // cPanel returns 409 when the parent collection does not exist: create
      // the (missing) directory chain idempotently, then retry once.
      await ensureCollections(remoteBase, key, auth);
      res = await putOnce();
    }
    if (![200, 201, 204].includes(res.status)) {
      throw new Error(`PUT ${key} failed with ${res.status}. Resume with \`apply --confirm --operation ${opId}\` (forward recovery; baseline preserved).`);
    }
    uploaded += 1;
  }
  syncEntries();
  saveManifest();
  console.log(`\nUploaded ${uploaded} files. Operation ${opId}; baseline: ${baselineDir}`);
  console.log(`Rollback: node scripts/deploy-webdav.mjs rollback --operation ${opId} --confirm`);
}

async function commandRollback(args) {
  if (!args.confirm) throw new Error('`rollback` requires `--confirm`.');
  if (!args.operation) throw new Error('`rollback` requires --operation <operationId>.');
  const baselineDir = resolve(BASELINE_ROOT, args.operation);
  const manifestPath = join(baselineDir, 'manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`No baseline for operation ${args.operation}.`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const { auth } = loadCredentials(args.env);
  let restored = 0;
  for (const entry of manifest.entries) {
    if (entry.action !== 'overwrite') continue;
    const backupAbs = join(baselineDir, entry.backup);
    if (!existsSync(backupAbs)) throw new Error(`Baseline backup missing for ${entry.path}.`);
    const res = await fetch(`${manifest.remoteBase}${entry.path}`, { method: 'PUT', headers: { Authorization: auth, 'Content-Type': contentType(entry.path) }, body: readFileSync(backupAbs) });
    if (![200, 201, 204].includes(res.status)) throw new Error(`Restore PUT ${entry.path} failed with ${res.status}.`);
    restored += 1;
    console.log(`  restored ${entry.path}`);
  }
  const created = manifest.entries.filter((e) => e.action === 'create');
  console.log(`\nRestored ${restored} original files from operation ${args.operation}.`);
  console.log(`Newly created paths left in place (${created.length}; harmless unused hashed assets):`);
  for (const e of created) console.log(`  created ${e.path}`);
}

async function commandVerify(args) {
  const site = (args.site ?? SITE_DEFAULT).replace(/\/?$/, '/');
  const ok200 = ['', 'en/', 'lt/', 'en/assessment-guide/', 'lt/understanding-results/', 'en/about/', 'lt/contact/', 'en/privacy/', 'robots.txt', 'sitemap.xml'];
  const expect404 = ['en/auth/login/', 'lt/account/', 'en/admin/', 'en/assessment/', 'lt/assessment/'];
  let failures = 0;
  for (const path of ok200) {
    let status = 0;
    try { status = (await fetch(`${site}${path}`, { redirect: 'manual' })).status; } catch {}
    if (status !== 200) failures += 1;
    console.log(`${status === 200 ? 'ok  ' : 'FAIL'} /${path} -> ${status}`);
  }
  for (const path of expect404) {
    let status = 0;
    try { status = (await fetch(`${site}${path}`, { redirect: 'manual' })).status; } catch {}
    if (status !== 404) failures += 1;
    console.log(`${status === 404 ? 'ok  ' : 'FAIL'} /${path} -> ${status} (expect 404)`);
  }
  console.log(`\nverify: ${failures === 0 ? 'all ok' : `${failures} failed`}`);
  if (failures > 0) process.exitCode = 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'check') await commandCheck(args);
  else if (args.command === 'plan') await planOrApply(args, false);
  else if (args.command === 'apply') await planOrApply(args, true);
  else if (args.command === 'rollback') await commandRollback(args);
  else if (args.command === 'verify') await commandVerify(args);
  else {
    console.log('Usage: node scripts/deploy-webdav.mjs <check|plan|apply|rollback|verify> [--env .env.deploy.local] [--artifact dist/public-site] [--remote-base URL] [--site URL] [--operation <id>] [--confirm]');
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main().catch((error) => {
    console.error(`deploy-webdav: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}
