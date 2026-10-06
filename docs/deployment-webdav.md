# WebDAV deployment automation (public frontend, T-014)

Deploys the **frontend-only** public release (`dist/public-site/`, see
`docs/release-hosting.md`) to the cPanel Web Disk (restricted to `public_html`,
read/write) via WebDAV.

> **Production deployments were explicitly authorised and performed on
> 2026-09-28** (operations `muliubrg-822e9fdae477` and `mulkgfk6-0768754a1976`)
> **and 2026-10-06** (operation `mux030hl-e8032efd1883`). Any further upload
> requires the same explicit authorisation.

## Credentials (never printed/committed/bundled/uploaded)

1. Copy the template and edit locally:
   `cp .env.deploy.local.example .env.deploy.local`.
2. **Enter the password in `.env.deploy.local`, on the `WEBDAV_PASSWORD=` line
   only** — no quotes, no surrounding spaces, no shell `$()`/`${}`.
3. `.env.deploy.local` is git-ignored (added before the template). The tooling
   **parses the file as data** (never sources it as shell code) and builds the
   Basic-auth header in memory; the password is never printed, bundled, or
   uploaded.

Variables: `WEBDAV_URL`, `WEBDAV_USERNAME`, `WEBDAV_PASSWORD`.
TLS certificate verification is always on; the tool refuses to run if
`NODE_TLS_REJECT_UNAUTHORIZED=0` is set.

## Commands

```bash
pnpm build:public          # produce dist/public-site
pnpm deploy:check          # read-only: TLS + auth + PROPFIND root; reports mapping
pnpm deploy:plan           # dry run: artifact id, exact PUTs (assets first), baseline plan
pnpm deploy:apply          # real upload; starts a NEW operation (needs authorisation)
pnpm deploy:verify         # post-deployment GET checks of the canonical site
# resume an interrupted operation (same baseline):
pnpm deploy:apply -- --operation <operationId>
# rollback one operation (restores that operation's baseline):
pnpm deploy:rollback -- --operation <operationId> --confirm
```

Manual equivalents: `node scripts/deploy-webdav.mjs
<check|plan|apply|rollback|verify> [--env .env.deploy.local]
[--artifact dist/public-site] [--remote-base URL] [--site https://sapiensmetric.eu]
[--operation <operationId>] [--confirm]`.

### check (read-only)

Authenticates over TLS and issues a `Depth: 1` PROPFIND of the WebDAV root. It
**determines the actual path mapping**: if the root lists `public_html/`, the
deployment base becomes `<URL>/public_html/`; otherwise the account is assumed
chrooted to `public_html` and the base stays `<URL>/`. Override with
`--remote-base` if needed. Certificate verification is never disabled.

**Verified 2026-09-27 (read-only, standard `pnpm deploy:check`):** TLS
verification passed, authentication `OK` (PROPFIND 207), `OPTIONS` advertises
`PROPFIND/PUT/GET/HEAD/…`. The account is **chrooted to `public_html`**
(`/public_html/` probe → missing; root is the web root), so the deployment base
is **`https://sapiensmetric.eu:2078/`** — do **not** append `/public_html/`.
Credentials live in the ignored **`.env.deploy.local`** (moved from `.env`), so
the standard `pnpm deploy:check|plan|apply|rollback|verify` commands work.

**Observed server behaviour (cPanel):** `PROPFIND` returns **HTTP 207 with an
empty `<d:response>` body** — never rely on the listing text for existence.
Existence is determined by **HTTP status**: `HEAD` (200 → exists, 404/410 →
missing) with a `PROPFIND` (207/404) fallback; **401/403/5xx/network errors are
never treated as "missing"** (the tool aborts). Backups use `GET` and verify a
non-empty body. A **known-file confirmation** matched: `sitemap.xml` via WebDAV
returned `200` (cPanel labels it `application/download`) and via the public site
`200 application/xml`.

### plan (dry run, read-only existence checks)

Enumerates `dist/public-site/`, performs **read-only** existence checks against
the remote base, and prints the **artifact id (content-based)**, the exact PUT
list with **content-hashed/stable-name assets (`_next/`, `branding/`) first**,
then pages, plus **create vs overwrite** counts, the preserved paths, and the
baseline that `apply` would create. No writes — `plan` never creates a baseline.

- Without `--operation`, `plan` reports that **a new operation (fresh id +
  baseline) will be created on apply**.
- With `--operation <id>`, it loads that baseline's manifest and verifies the
  artifact contents and destination match before reporting a resume.

Observed 2026-09-27: artifact id **`e01bae832f1abcf5`**, **159 files** (25 assets
first) → **8 create** (all new content-hashed assets), **151 overwrite** (incl.
the four stable-name branding WebP files and pages), base
`https://sapiensmetric.eu:2078/`.

### apply (explicit authorisation)

Requires `--confirm` (the `deploy:apply` script supplies it). For each file:

- if the remote file exists, it is **downloaded to the operation baseline**
  before overwriting;
- the file is uploaded with `PUT`;
- if a `PUT` returns **409 (Conflict)** — cPanel returns this for a file inside a
  **new directory** — the tool creates the missing parent collections
  idempotently with `MKCOL` (existing collections return 405/3xx and are treated
  as present) and retries the `PUT` once. It never deletes or modifies anything;
- `.htaccess`, `.well-known/**`, and unrelated remote files are **never touched**
  — there is **no mirror and no delete**;
- previous content-hashed assets are **retained** (existing visitors keep
  working; retained unused assets are acceptable after rollback).

**Stable-name assets** (`branding/*.webp`) have no content hash, so they are
**overwriteable and are backed up** like any other overwritten file.

#### Artifact identity vs operation identity (corrected model)

Two identities are kept **separate**:

- **Artifact id** — `sha256` over the sorted lines
  `path \0 sha256(fileContents)` of `dist/public-site/` (first 16 hex chars).
  It describes *what* is being deployed and changes whenever any file's **bytes**
  change, even at the same size. It is *not* used to name a baseline.
- **Operation id** — a **fresh id per deployment operation** (`<base36 time>-<random>`),
  generated when an `apply` starts. Every new deployment of *the same artifact*
  gets a **new operation id and its own baseline**.

A baseline lives **outside the web directory**:

```
dist/deploy-baseline/<operationId>/
  manifest.json        # artifact id, destination, every overwrite backup + created path
  files/<path>         # the ORIGINAL remote content captured before first overwrite
```

`manifest.json` records `operationId`, `artifactId`, `remoteBase`, and per file
`path`, `action` (`overwrite` | `create`), `contentHash`, `backup` (for
overwrites), `bytes`, and timestamps. On `apply`:

- a **new** operation (no `--operation`) creates the baseline dir and writes the
  manifest **before** any PUT;
- each overwrite is captured **once** into `files/<path>`; a **retry reuses the
  existing capture** and never re-captures the original;
- each new path is recorded as `create` (no backup);
- backup files and manifest updates are written **atomically** (temp file +
  rename) **before** the corresponding remote file is overwritten.

**Resume (retry) is explicit.** Re-running `apply` **without** `--operation`
starts a *new* operation and a *new* baseline. To continue an interrupted
operation, pass it explicitly:

```bash
pnpm deploy:apply -- --operation <operationId>
```

Resume **verifies** the loaded manifest's `artifactId` and `remoteBase` against
the current artifact/destination (and each file's `contentHash`); a mismatch
**aborts**. A baseline is therefore **never silently reused just because the
artifact id matches**.

**Partial-upload recovery (forward):** deployments are **not atomic**. Resuming
the **same operation** adds/re-PUTs idempotently against the **same preserved
baseline**; this is *forward recovery, not rollback*.

**Rollback (baseline restore) — restores one operation:**

```bash
pnpm deploy:rollback -- --operation <operationId> --confirm   # explicit authorisation required
```

It PUTs back every `overwrite` backup from **that one operation's** baseline
(restoring the original pre-deployment content) and **leaves newly created
hashed assets in place** (harmless, and cheaper than deleting). It touches only
uploaded files; `.htaccess`/`.well-known` were never modified. Backups are local
because the WebDAV account is restricted to `public_html` (no server-side path
outside the web root); a remote-outside copy would need a separate account/path.

Observed (read-only, 2026-09-27): artifact id `e01bae832f1abcf5`, 159 files
(8 create / 151 overwrite); `plan` created no baseline.

**Observed production deployment (2026-09-28, authorised):** preflight plan
artifact id **`fcbbf30a7645982a`** (159 files; 8 create / 151 overwrite) →
`apply` started a fresh operation **`muliubrg-822e9fdae477`**. The first attempt
stopped at `PUT _next/static/o_lQS7h7de0Z3kNMCfWnJ/_buildManifest.js` with **409**
(the remote had no such collection and the tool issued no `MKCOL`). After the
parent-collection fix above, the **same operation** was resumed
(`pnpm deploy:apply -- --operation muliubrg-822e9fdae477`) with the same artifact
and destination and completed **159/159**. All **151 overwritten originals** were
backed up before overwrite; baseline
**`dist/deploy-baseline/muliubrg-822e9fdae477/`** (`manifest.json` + 151 files).
`.htaccess`, `.well-known/**`, unrelated remote files, and previous hashed assets
were preserved. Post-deploy `pnpm deploy:verify` all ok.

**Observed favicon/manifest deployment (2026-10-06, authorised):** preflight
reconciled `robots.txt` and `sitemap.xml` to the **current production bytes**
(owner SEO edits: `robots.txt` without a `Host:` line; `sitemap.xml` with 21 URLs
including `/`) so the release did **not** revert them. Plan artifact id
**`97e89b25b1edd8a9`** (166 files; 10 create / 156 overwrite) → fresh operation
**`mux030hl-e8032efd1883`**; 166/166 uploaded on the first attempt. Baseline
`dist/deploy-baseline/mux030hl-e8032efd1883/` (156 backups). Post-deploy
`pnpm deploy:verify` all ok; production icon/manifest URLs and head links
verified; `robots.txt`/`sitemap.xml` hashes unchanged. Rollback:
`pnpm deploy:rollback -- --operation mux030hl-e8032efd1883 --confirm`.

> **Follow-up (2026-10-06):** `robots.txt` is now generated from
> `apps/web/app/robots.ts` **without** a `Host` directive, so a normal build
> reproduces production and must not be copied back from production. The deployed
> `sitemap.xml` still contains the apex `https://sapiensmetric.eu/` that the
> generator omits — an open source/deployment discrepancy; resolve the policy
> **before** any future deployment instead of copying production over the build
> (see `docs/publication-status.md` §3).

### verify (post-deployment)

GETs the canonical site and checks: `/`, `/en/`, `/lt/`, guide, results, about,
contact, privacy, `robots.txt`, `sitemap.xml` return 200; excluded app routes
(`/en/auth/login/`, `/lt/account/`, `/en/admin/`) return 404. It also confirms
the HTTPS/non-www behavior implicitly (redirects are checked with
`redirect: 'manual'`).

## Local mock test (validated)

A minimal local WebDAV mock was used to validate `check`, `plan`, and an
`apply --confirm` without touching production: it listed `public_html/` so the
mapping was derived, a pre-existing `index.html` was backed up locally before
overwrite, `.htaccess`/`.well-known/**` were preserved, the three excluded app
routes were not uploaded, and hashed assets plus pages were present after apply.
The corrected **identity/resume/atomic-baseline** behaviour is covered by focused
unit tests: `pnpm test:deploy` (also part of `pnpm verify`). Use an HTTP mock only
for tooling tests; production is HTTPS with verification on.

## Notes

- The release scope is unchanged: public pages/articles only; no API, DB, SMTP,
  OAuth, analytics activation, or external account changes.
- Deploying does not publish the GTM container; analytics activation remains a
  separate owner step (see `docs/gtm/README.md`).
