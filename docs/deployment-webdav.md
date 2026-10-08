# WebDAV deployment automation (public frontend, T-014)

Deploys the **frontend-only** public release (`dist/public-site/`, see
`docs/release-hosting.md`) to the cPanel Web Disk (restricted to `public_html`,
read/write) via WebDAV.

> **Production deployments were explicitly authorised and performed on
> 2026-09-28** (operations `muliubrg-822e9fdae477` and `mulkgfk6-0768754a1976`)
> **and 2026-10-06** (operations `mux030hl-e8032efd1883`,
> `mux3032z-9200a465dd4a`, and `mux42oos-932ee20e6c2c` — see the observed
> deployments below). Any further upload requires the same explicit authorisation.

## Reproducibility terminology (read before calling a build "reproducible")

Two distinct properties, deliberately not conflated here:

- **Repeatable release generation** — *established.* `pnpm build:public` (or
  `build-public-release.sh --no-build` after `pnpm build`) deterministically turns
  the current `apps/web/out` into a complete `dist/public-site/` with the
  documented route exclusions. `verify-public-release.sh` now proves the release
  equals that export file-for-file (contents included), and
  `verify-static-export.sh` proves the export shape.
- **Byte-identical independent builds** — *not established, and not claimed.* The
  Next.js build emits a build-scoped id and hash-named `_next` assets, so two
  independent builds of identical source differ in those bytes. The `Host`/SEO
  outputs are content-stable, but the bundle is not bit-for-bit reproducible.

Consequences/controls:

- **Artifact identity is content-based** (`artifactIdentity` = sorted
  `path\0sha256`): it identifies the *exact* artifact being deployed, so
  `plan`/`apply`/`resume`/`rollback` are consistent and a fresh operation gets a
  fresh baseline. Do **not** relabel an artifact as belonging to a commit it was
  not built from.
- **Do not pin `generateBuildId` solely to suppress the changing identifier.**
  Pinning the id alone does not make the build reproducible (asset contents and
  other build inputs still vary); it would only hide the difference and could
  mislead the identity model. A future decision to pursue byte-reproducible builds
  must be justified on its own merits (deterministic toolchain/inputs) and
  recorded before changing the config.
- The reproducible-from-source property that *is* claimed applies to the
  **sitemap/robots** (generated from repository content) and to the release
  **file set**, not to bundle bytes.

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
<check|plan|baseline|apply|rollback|verify> [--env .env.deploy.local] [--ci]
[--artifact dist/public-site] [--remote-base URL] [--site https://sapiensmetric.eu]
[--operation <operationId>] [--confirm]`.

`--ci` reads `WEBDAV_URL`/`WEBDAV_USERNAME`/`WEBDAV_PASSWORD` from the process
environment instead of `.env.deploy.local`; values are never printed. `baseline`
captures (but does not upload) a fresh operation's pre-deployment backups so CI
can persist them off-runner before `apply` overwrites anything.

## Continuous deployment (GitHub Actions, T-021)

Two workflows (pinned to full action SHAs):

- **`.github/workflows/ci.yml`** — on pull requests, non-`main` pushes and manual
  dispatch: `pnpm install --frozen-lockfile` then `pnpm verify` (lint, typecheck,
  unit/contract/API tests, FSD, build, static-export invariant, public-release
  freshness/completeness, harness). **Never deploys**; no production secrets;
  `permissions: contents: read`.
- **`.github/workflows/deploy.yml`** — on push to `main` and manual dispatch:
  `classify` → `verify` (builds the release **once**) → `baseline` (capture +
  encrypted off-runner persistence) → `deploy` (upload the **exact** verified
  artifact + production verify) → `record`.

Flow and guarantees:

1. **Classify** (`.github/workflows/deploy.yml`, `scripts/ci-should-deploy.mjs`):
   deployments are skipped only when every changed file is clearly frontend-
   irrelevant (`docs/`, `tasks/`, `apps/api/`, `packages/assessment/`, a small
   root-markdown allow-list). Web source, public assets, `package.json`,
   `pnpm-lock.yaml`, `scripts/` and `.github/` always deploy, and so does
   **`packages/contracts/`** — shared contract changes can affect frontend
   consumers, so until dependency-aware classification exists the conservative
   choice is to deploy. An unknown/empty change set also favours deployment.
2. **Build once**: the `verify` job runs `pnpm verify` and uploads
   `dist/public-site` as the `public-site` artifact. The `deploy` job downloads
   that artifact; it never rebuilds, so CI and production operate on identical
   bytes.
3. **Baseline before overwrite (mandatory)**: the `baseline` job runs
   `deploy-webdav.mjs baseline --ci` (read-only against production) to capture
   every file the release would overwrite, tars the baseline, encrypts it with
   `openssl` (AES-256-CBC, PBKDF2, 200k iterations) using the
   `BACKUP_ENCRYPTION_PASSPHRASE` secret, and uploads it as the `deploy-baseline`
   artifact (retention 90 days). The `deploy` job then **downloads** it,
   **checksum-verifies** the ciphertext, **decrypts** it with the passphrase,
   **extracts** it, and **asserts the manifest's operation id and artifact id
   match this run** — every one of these steps is a normal failing step with **no
   `continue-on-error`**. If *any* capture, encryption, upload, download,
   decryption or validation step fails, the deployment job stops and **no
   production PUT is issued**. `continue-on-error` is used **only** for the
   supplementary deployment-record commit, never for backup persistence.
4. **Upload**: `deploy-webdav.mjs apply --confirm --ci --operation <id>` resumes
   the baseline operation, keeps assets-first ordering, creates missing parent
   collections on `409`, preserves `.htaccess`/`.well-known`/unrelated files and
   previous hashed assets, and never mirrors or deletes.
5. **Verify production**: `deploy-webdav.mjs verify --site <PUBLIC_SITE_URL>`
   checks public routes/deep links (`/`, `/en/`, `/lt/`, guide, results, about,
   contact, privacy), `robots.txt`/`sitemap.xml`, and that `auth/account/admin/
   assessment` return 404. It checks HTTP reachability; the byte-level
   equivalence is proven earlier (the uploaded artifact is the verified one).
6. **Record**: a durable `docs/deployments/<timestamp>-<sha>.md` record (source
   SHA, run URL, artifact id, operation id, baseline artifact, rollback command)
   plus the run summary.

### Concurrency, overrides and failure

- `concurrency: production-frontend`, `cancel-in-progress: false`: one production
  write at a time; an in-flight deployment is never cancelled mid-way.
- A **stale-release guard** (push events only) skips a run whose `github.sha` is
  no longer `origin/main`, so an older queued release cannot overwrite a newer
  one. Manual `workflow_dispatch` bypasses the guard (explicit override).
- Each deployment uses a **fresh operation**; a retry resumes only the **same**
  operation with matching artifact id and destination (`assertResumeMatches`).
  A network/verification failure does **not** trigger blind rollback: the run
  reports the operation id and the forward-resume or rollback commands.
- **Failure recovery**: re-run the failed job (resumes the same operation), or
  `workflow_dispatch` → `mode: deploy` to redeploy `main`.
- **Rollback**: `workflow_dispatch` → `mode: rollback` with `operation` and the
  `run_id` that holds the encrypted `deploy-baseline` artifact; the job downloads
  and decrypts that baseline, then restores the overwritten originals. Created
  paths are left in place (harmless unused hashed assets).

### Required credentials and configuration

Configure a GitHub **environment named `production`** (recommended: require
reviewers) with:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `WEBDAV_USERNAME` | `webdav@sapiensmetric.eu` |
| Secret | `WEBDAV_PASSWORD` | the cPanel Web Disk password |
| Secret | `BACKUP_ENCRYPTION_PASSPHRASE` | a strong passphrase; store a copy **independently** (a password manager), not only in GitHub |
| Variable | `WEBDAV_URL` (optional) | defaults to `https://sapiensmetric.eu:2078/` |
| Variable | `PUBLIC_SITE_URL` (optional) | defaults to `https://sapiensmetric.eu` |
| Variable | `NEXT_PUBLIC_API_BASE_URL` (optional) | defaults to `https://api.sapiensmetric.eu` |

No other configuration is required (Actions artifacts/retention use the
repository defaults). To enter a secret locally (then paste the value into
GitHub, never into chat), use:

```bash
gh secret set WEBDAV_PASSWORD --env production            # prompts, not echoed
gh secret set WEBDAV_USERNAME --env production
gh secret set BACKUP_ENCRYPTION_PASSPHRASE --env production
```

### Backup retention and recovery (limitations)

- The encrypted `deploy-baseline` Actions artifact has a **90-day retention** and
  is **not a permanent backup**. The owner-held `BACKUP_ENCRYPTION_PASSPHRASE` is
  the independently stored recovery key; without it the baseline cannot be read.
- Recovery from a fresh machine/runner: download the artifact for the operation
  (`gh run download <run_id> -n deploy-baseline`), decrypt with the passphrase,
  extract under `dist/deploy-baseline/<operation>/`, then run
  `pnpm deploy:rollback -- --operation <operationId> --confirm` with local
  credentials.
- A durable off-host destination (object storage/backup host) is the recommended
  replacement once available; the design expects to swap the artifact step
  without changing the tool's operation/baseline invariants.
- Artifacts contain the **pre-deployment public files** (already public on the
  live site); they are still encrypted because they may capture transient or
  unreleased state. Do not treat them as secret-free without review.

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

> **Follow-up (2026-10-06):** `robots.txt` is generated from
> `apps/web/app/robots.ts` **without** a `Host` directive, so a normal build
> reproduces production and must not be copied back from production.

**Observed navigation/sitemap deployment (T-020, 2026-10-06, authorised):** the
artifact was built and verified, then planned and applied **without a rebuild**
(plan artifact id **`779cf9f32f90f277`**, 167 files; 8 create / 159 overwrite) as a
fresh operation **`mux3032z-9200a465dd4a`**, 167/167 uploaded. Baseline
`dist/deploy-baseline/mux3032z-9200a465dd4a/` (159 backups captured before
overwrites). `.htaccess`, `.well-known/**`, unrelated files and previous hashed
assets were preserved. Post-deploy `pnpm deploy:verify` all ok; production
`robots.txt` and `sitemap.xml` are **byte-identical** to the artifact, and the
sitemap has the intended **20** URLs (the repository generator is authoritative;
its predecessor's 21st apex-root entry was intentionally dropped). Rollback:
`pnpm deploy:rollback -- --operation mux3032z-9200a465dd4a --confirm`.

**Observed HTML-conformance deployment (T-020 follow-up, 2026-10-06,
authorised):** the corrected artifact (valid global 404, consent `<section>`
without a redundant `role="region"`) was built/verified and applied **without a
rebuild** as a **fresh operation `mux42oos-932ee20e6c2c`** — content-based
artifact id **`7facf7e558173e17`** (167 files; 7 create / 160 overwrite), 167/167
uploaded, baseline `dist/deploy-baseline/mux42oos-932ee20e6c2c/` (160 backups
captured before overwrites). `.htaccess`, `.well-known/**`, unrelated files and
previous hashed assets were preserved. Post-deploy: all `pnpm deploy:verify`
routes ok; production `/404.html`, `/en/`, `/lt/`, an article page, `/robots.txt`
and `/sitemap.xml` byte-identical to the artifact; Nu HTML Checker on the
deployed EN/LT pages and `/404.html` = 0 errors / 0 warnings. Rollback:
`pnpm deploy:rollback -- --operation mux42oos-932ee20e6c2c --confirm`.

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
