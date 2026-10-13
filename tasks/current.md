# T-023 — Closed SapiensMetric production-review environment on the shared Oracle server (active)

- **ID:** T-023
- **Type:** Infrastructure + application + publication (closed review
  environment on the existing Oracle host; no public launch).
- **Created:** 2026-10-12
- **Status:** Active — **BLOCKED on missing privileged server access** (see
  "Blocker"). Independent preparation is in progress. No application or
  infrastructure change has been installed on the server.
- **Authorization (owner, 2026-10-12):** host the SapiensMetric API on the
  Oracle server alongside the existing Sokoladas infrastructure (separate Compose
  project, separate MySQL database); publish the login/account/admin/assessment
  shells for direct access while keeping **public registration disabled** and
  public navigation free of Login/Admin/Assessment links; permit draft
  assessment review only for explicitly authorised test accounts; scoped
  infrastructure changes, commits/pushes, migrations and deployment are
  authorised. "Do not request deployment permission again."
- **Baseline:** T-022 transitioned (owner-authorised) and committed/pushed as
  `23c6a9c`; T-022 browser acceptance remains pending.

---

> T-023 deploys a **closed** SapiensMetric production-review environment on
> `79.76.117.246` (`sokoladas-demo`, ARM64, Ubuntu 26.04) alongside the accepted
> Sokoladas staging stack, reusing the **existing** Nginx/Certbot edge. Nothing is
> publicly indexed or advertised: this is a private review environment for
> authorised reviewers only. Unreviewed astronomy items remain drafts.

## Scope

1. **Pre-change inspection** of both projects and the live shared server
   (documented in `docs/closed-review-deployment.md`).
2. **Task-state reconciliation** — finish outstanding T-022 fixes, verify the
   `hasProgress` migration's handling of pre-existing saved unfinished attempts,
   commit the prerequisites (done: `23c6a9c`), and make T-023 the single active
   task.
3. **Protect Sokoladas** — record current release/routes/health, take recoverable
   backups, keep recovery material off the web root and out of Git with a secure
   off-host copy, prepare restore steps, apply additive changes, validate proxy
   config before reload, avoid restarting unrelated services, and recheck
   Sokoladas after every shared change.
4. **Isolated SapiensMetric backend** — separate Compose project/application,
   separate MySQL instance/database credentials, persistent volumes, scoped
   networks, ARM64 images, private DB/app ports, API HTTPS via the existing edge,
   `api.sapiensmetric.eu` certificate + renewal, bounded logs, explicit
   migrations (`synchronize=false`), secure secrets, exact production origin +
   credentialed CORS/cookies/Origin protection.
5. **Closed authentication and assessment review** — disable public credentials
   registration at the API boundary; prevent Google OAuth account creation (leave
   Google disabled if production config is unavailable); provision the owner's
   account through a secure operator workflow (no dev DB clone, no bootstrap HTTP
   endpoint); server-enforced test-account eligibility for private review; keep
   `NODE_ENV=production` and add a **separate default-off closed-review
   capability**; keep astronomy drafts reviewer-only; enable no synthetic fixture
   publicly; preserve versioned scoring, feedback, history visibility and draft
   warnings.
6. **Frontend publication** — publish the EN/LT login/account/admin/assessment
   static shells through the established CI/CD, keep registration unavailable and
   remove registration CTAs from the closed login flow, keep private routes
   noindex/out of the sitemap and out of GA4/GTM, preserve the existing
   public-only release profile with **added explicit closed-release
   build/verification expectations** (not a global deletion of exclusions).
7. **Owner-requested Yoast-style sitemap** — compare the current generator with an
   actual Yoast sitemap and official docs; implement a standards-compliant
   `sitemap.xml` index + child sitemaps for this static site (keep `/sitemap.xml`
   a valid entry point); preserve canonical HTTPS non-www URLs, truthful `lastmod`
   and multilingual discovery; exclude private routes and the remembered-language
   root redirect; update robots/release tooling/verification to validate the index
   and all children; generate from repository content only; record exactly what
   changed without claiming it proves the Search Console cause.
8. **Verification and handover** — `pnpm verify`, real-MySQL integration checks,
   production HTTPS/login/refresh/logout, registration rejection, unauthorised
   assessment rejection, an authorised astronomy journey, key-isolation and
   no-analytics checks, mobile rendering + hamburger/logout, Sokoladas recheck,
   observed workflow conclusions, source/release/migration/backup/rollback
   records, and `sm-oracle-infra` documentation of the shared server and both
   applications.

## Delivered (repository implementation — unblocked work)

- T-022 verified (`pnpm verify` EXIT 0), committed and pushed as **`23c6a9c`**;
  transitioned to `tasks/done/` (owner-authorised; browser acceptance pending).
- **Production API image**: `apps/api/Dockerfile` (multi-stage, non-root UID
  10001, ARM64). `.github/workflows/api-image.yml` publishes
  `ghcr.io/marijustechin/sapiensmetric-api` (`linux/arm64`).
- **Closed-review capability**: default-off `ASSESSMENT_REVIEW_ENABLED`
  (production-capable) plus server-enforced per-account `users.reviewEligible`
  (migration `1781440000006`); `REVIEW_NOT_AUTHORISED` for unauthorised accounts.
- **Registration disabled** at the API boundary (`REGISTRATION_ENABLED`, 403
  `REGISTRATION_DISABLED`) and **Google cannot create accounts**
  (`GOOGLE_ALLOW_ACCOUNT_CREATION`); `GET /auth/capabilities` drives the UI.
- **Secure owner provisioning**: `owner:provision` CLI (generated password shown
  once; no HTTP bootstrap endpoint; grants admin + review eligibility).
- **File-backed secrets**: `JWT_SECRET_FILE` / `MYSQL_PASSWORD_FILE` /
  `SMTP_PASSWORD_FILE` support.
- **Closed-release frontend profile**: `build:closed` / `verify:closed`
  (public + private shells, private shells noindex) and a guarded, manual
  `.github/workflows/deploy-closed.yml` (kept inactive until verified); the
  public-only profile and its exclusions are unchanged.
- **Yoast-style sitemap**: `/sitemap.xml` is a `<sitemapindex>` over
  `/page-sitemap.xml` and `/article-sitemap.xml`, generated from content
  (canonical HTTPS non-www, truthful `lastmod`, EN/LT alternates, 20 URLs);
  release tooling/verification validate the index and every child.
- **Deployment package**: `deploy/` (Compose project `sapiensmetric-review`,
  MySQL 8.0.46, secrets templates, runbook, backup/rollback) and the
  `api.sapiensmetric.eu` proxy/certificate additions in the authoritative
  `sm-oracle-infra/deploy/proxy/nginx.conf` (with markers for a safe two-phase
  certificate rollout).
- **Reviewed privileged installer** `deploy/install-closed-review.sh` (idempotent,
  validates configuration, starts the database/API **before** touching nginx so the
  new upstream resolves, then a two-phase proxy/certificate rollout with `nginx -t`
  before every reload and a proxy-config backup, explicit migration, owner
  provisioning with `--password-out`, Sokoladas recheck, removes the staged SMTP
  secret, and prints recovery by failure point) and the one-command wrapper
  `deploy/run-install.sh` (uses the owner's existing sudo access; no passwordless
  sudo/Docker added). Owner email confirmed: `m.smiginas@gmail.com`.
- **Verified production image + digests:** API `ghcr.io/marijustechin/sapiensmetric-api@sha256:d78b0e717f1901bea5e21c90670d3fe5df3843b03c26dcb16decf3a85aa0dd2e`
  (`linux/arm64`, source `8ff8e3e`; **public package — no registry credential
  required**, confirmed by an unauthenticated pull); MySQL
  `mysql:8.0.46@sha256:7dcddc01f13bab2f15cde676d44d01f61fc9f99fe7785e86196dfc07d358ae2b`.
- **Separate SapiensMetric backup job** (sm-oracle-infra `backup/sapiensmetric-backup.sh`,
  systemd timer, `../sokoladas/sm-oracle-infra/docs/sapiensmetric-backups.md`): MySQL dump + config to the
  existing rclone `crypt` remote under `sapiensmetric-backups/sets`, with a MySQL
  restore procedure. It does not reuse the Sokoladas PostgreSQL backup and does
  not alter the Sokoladas sets.

## Verification

- `pnpm verify` → **EXIT 0** (web 129/0; static-export 126/0; public-release
  102/0; closed-release 50/0; harness updated for T-023).
- `nginx -t` passes against the modified authoritative proxy config (dummy
  certs), proving the additive routing is syntactically valid.
- The closed-release artifact builds and its verification passes (private shells
  present and noindex; sitemap excludes private routes and the root redirect).
- **Live production review environment (owner-executed, 2026-10-12/13), observed
  2026-10-13:**
  - `https://api.sapiensmetric.eu/health` → `200 {"status":"ok"}`;
    `…/health/ready` → `200 {"status":"ok"}` (DB reachable).
  - `…/auth/capabilities` → `{"google":false,"registration":false}`;
    `POST /auth/register` → **403** (registration disabled at the boundary);
    `GET /auth/google/status` → `{"available":false}`.
  - `http://api.sapiensmetric.eu/health` → **308** to HTTPS; certificate
    `subject=CN=api.sapiensmetric.eu`, valid to **2027-01-10** (Let's Encrypt).
  - Public sitemap: `/sitemap.xml` is the `<sitemapindex>`; `/page-sitemap.xml`
    and `/article-sitemap.xml` → **200** (14 + 6 = 20 public URLs; no private
    routes, no root redirect).
  - **Sokoladas unaffected:** `https://sokoladas.eu/` → 200,
    `/health/ready` → 200; the release template was refreshed and the proxy
    config backed up.
  - The owner account `m.smiginas@gmail.com` was provisioned via the operator
    workflow (owner-reported); the generated credential is written to a
    root-only file and was not printed. Independent sign-in acceptance is
    **pending the owner**.
  - Two real defects were found and fixed during the live run: the missing
    `sapiensmetric-api` network alias (502) and the `provision` service using
    `command` instead of `entrypoint` (`node: bad option: --email`).
  - **Owner-confirmed on production (owner's nine-step report, 2026-10-13):**
    password reset and sign-in; the assessment journey (**start → save → resume →
    submit → results**); **logout returning to home**; protected access requiring
    login; and **reopening the saved result**. This corrects the earlier note that
    logout and the assessment journey were unconfirmed.
  - **Awaiting owner visual confirmation:** the corrected production drawer
    (Home / Account / Assessment / Admin / Logout).
  - **Acceptance corrections resolved (T-023):**
    1. *Disappearing start control* — the assessment screen now has an explicit
       capabilities lifecycle (`loading` / `error` + Retry / `ready`), so the
       start control never renders as an empty area; a failed availability call
       is retryable instead of silently hiding the control.
    2. *Lithuanian after re-authentication* — `ensureLocalePrefix` guarantees the
       post-sign-in destination keeps the active locale; a locale-less `returnTo`
       can no longer fall back to the default locale.
    3. *Review wording* — the assessment banner and astronomy/feedback notes now
       say "closed review environment … unreviewed, not publication-ready"
       instead of "local development / local review only" (accurate on the
       production closed profile).
    4. *Pre-submission hint* — a hint next to Save/Submit states that answers are
       sent to the SapiensMetric application API and saved to the account (never
       advertising/analytics) and that feedback appears only after submission.
  - **Checker correction:** the credential-safe role check failed on production
    with ENOENT because the verification container did not mount the credential
    directory (the `provision` container writes `/run/sm-out/rolecheck-pw`, but the
    role-check container only mounted the checker). Fixed by mounting
    `/etc/sapiensmetric/initial-credentials:/run/sm-out:ro` and adding a
    checker-only scoped wrapper (`sapiensmetric-maint-api-role-check`). Proven
    locally in a container with the same mount. Revocation no longer disables the
    backup timer.
  - **API release note:** the role-bearing `/auth/me` change is in API source
    `5709f99` (image `sha256:4668103f…`); the **running** API image is still
    `sha256:d78b0e71…` (source `8ff8e3e`), which returns only `{id,email}` — so
    production Admin visibility requires the scoped API update (see Blocker).
  - **Authenticated drawer fixed (T-023):** `/auth/me` now returns the
    API-confirmed `role`; the drawer shows Home/Account/Assessment/Logout, adds
    **Admin** only for `role === 'admin'`, hides guest-only and recovery entries,
    and offers Register only when the API reports registration enabled. Rendered
    evidence (headless Chromium, registration disabled): guest → Home, Sign in;
    user → Home, Account, Assessment + Sign out; admin → … + Admin. Unit +
    contract coverage added (`auth-nav-items.test.ts`, `meResponseSchema` role,
    `/auth/me` role test).
- **Backup exercised via the scoped maintenance access (owner-executed,
  2026-10-13):** the SELECT-only `sapiensmetric_backup` account dumped
  `sapiensmetric_review` and the set **`2026-10-13T052942Z`** was uploaded and
  verified on the shared `crypt:` remote at `sapiensmetric-backups/sets`; the
  isolated `--network none` MySQL 8.0.46 restore **passed** the count comparison
  (evidence `/opt/sapiensmetric-review/backup/restore-evidence/2026-10-13T052942Z-2026-10-13T053249Z`).
  `sapiensmetric-maint-status` reported `OK backup 2026-10-13T052942Z uploaded and
  verified`. The scoped sudoers rule and wrappers were then **revoked** and the
  timer **disabled** by the owner, so no scheduled backup currently runs and the
  agent has no privileged path.

## Blocker (exact missing input — live install only)

Repository implementation is complete and verified locally; the **live install**
still requires **root** on `79.76.117.246` (see `docs/closed-review-deployment.md`
§2/§9): `marijus` has no passwordless sudo/Docker and `deploy` is scoped to
`sokoladas-deploy` only. The owner holds administrative access; the remaining
step is the owner running the reviewed installer (`deploy/run-install.sh`) through
their existing sudo. The installer generates the MySQL/JWT secrets itself and
provisions the confirmed owner account (`m.smiginas@gmail.com`); only the existing
authorised SMTP password is supplied (from a git-ignored file, never printed).
Backups: a separate SapiensMetric job now exists (sm-oracle-infra
`backup/sapiensmetric-backup.sh`); the first scheduled run/restore test is still
unobserved.

**API release roll-out (blocking production Admin visibility).** The running API
container is still the originally-pinned image
`ghcr.io/marijustechin/sapiensmetric-api@sha256:d78b0e71…` (source `8ff8e3e`),
whose `/auth/me` returns `{id,email}` only. The role-bearing `/auth/me` is in
image `sha256:4668103f…` (source `5709f99`). Updating the running API needs
privileged Docker (pull + migrate + `up -d api`), which the current session does
not have: the scoped sudoers rule and wrappers were **revoked** (`sudo -n` →
interactive authentication), and the previously-installed wrappers did not
include an API update. A bounded scoped operation now exists
(`sapiensmetric-maint-api-update`, staged at
`/home/marijus/sapiensmetric-install/maintenance-86c4edc/`); after the owner
re-runs that bootstrap, the agent can complete and verify the API update without
exposing any credential.

## Limitations (observed)

- **Closed workflow fixed (2026-10-13):** run `38352341584` failed at
  “Upload the exact verified closed artifact” because `deploy-webdav.mjs apply`
  defaulted to `dist/public-site` while only `dist/closed-site` was built. Fixed
  by passing `--artifact dist/closed-site` to **both** `baseline` and `apply`,
  adding an early closed-artifact validation step before the remote baseline
  call, using `verify --app-routes 200` for closed production checks, and a
  regression test (`scripts/deploy-closed-workflow.test.mjs`).
- **Explicit active production profile (2026-10-13):** `deploy/production-profile`
  (`public`|`closed`) is read by both workflows via
  `scripts/production-profile.mjs`. With `closed` active, the automatic workflow
  builds/deploys/verifies the complete closed artifact from each main push
  (`--artifact dist/closed-site`, `verify --app-routes 200`); with `public`, the
  public-only artifact is deployed and strictly verified (`--app-routes 404`).
  Activation stays guarded (`deploy-closed.yml`, `confirm=activate`) and is
  committed only after a successful closed deployment. Covered by
  `scripts/production-profile.test.mjs`.

- **The reworked sitemap is not yet live (observed 2026-10-12).** Frontend CI runs
  #12 (`992ce2f`), #13 (`2b140a4`) and #14 (`8ff8e3e`) each reported `success`, but
  their uploads were **skipped by the stale-release guard** — each run's
  deployment-record commit advanced `main` past that run's source commit, so the
  deploy job found `origin/main != github.sha` and skipped the PUT (a record was
  still written, which is why `success` alone is misleading). Production still
  serves the previous `<urlset>` (`last-modified 2026-10-09`) and
  `/page-sitemap.xml` / `/article-sitemap.xml` return 404. Publication needs a
  non-stale deployment: `workflow_dispatch` (mode `deploy`) on **Deploy public
  frontend**, or a fresh tip push whose guard runs before any record commit.
- The privileged installer and the SapiensMetric backup job are repository
  implementations, **not yet executed live**; the first run is unverified until
  the owner performs it.
- **First live run (owner, 2026-10-12) partially succeeded and exposed a real defect:**
  the installer reached phase 2 and issued a valid `api.sapiensmetric.eu`
  certificate (Sokoladas unaffected: apex/health 200), but `https://api.sapiensmetric.eu/`
  returned **502** and the run stopped at API readiness, so the owner credential
  was not created. Cause: the Compose service is named `api`, so its network alias
  was `api`, not the `sapiensmetric-api` referenced by the proxy upstream
  (unresolvable → 502). Fixed by giving the service an explicit
  `sapiensmetric-api` alias on the shared edge network (`deploy/compose.yaml`);
  the installer now also prints a best-effort upstream-resolution diagnosis.
  Re-running the installer after re-staging is idempotent (DB/volume/secrets and
  the certificate already exist).
- **Second live run (owner, 2026-10-13) confirmed the alias fix** — the API
  became reachable (`/health` 200, `/health/ready` 200,
  `/auth/capabilities` → `{"google":false,"registration":false}`, `POST /auth/register`
  → 403) and Sokoladas stayed 200. It then failed at provisioning with
  `node: bad option: --email`: `docker compose run provision --email …` **replaces**
  a service's `command`, and the Node image entrypoint prepends `node` to
  arguments starting with `-`. Fixed by giving the `provision` service an
  `entrypoint` instead of `command`, and the installer now asserts the generated
  credential file exists (failing closed otherwise).
- The verified image was built and run locally (AMD64); the published ARM64
  digest was pulled and inspected. T-022 browser acceptance remains pending.

## Ordered owner handoff (privileged; both authorised)

1. **One-time maintenance bootstrap** (installs the corrected backup/restore
   scripts, the SELECT-only MySQL backup account, the systemd timer, and a
   narrowly scoped passwordless sudo rule for the agent — fixed wrappers only):
   ```sh
   cd /home/marijus/sapiensmetric-install/c60fa7d/maintenance
   sudo bash bootstrap-sapiensmetric-maintenance.sh
   ```
   The agent then runs, without a password:
   `sudo -n /usr/local/sbin/sapiensmetric-maint-check`, `…-maint-status`,
   `…-maint-backup`, `…-maint-restore-verify`.
   Revocation: `sudo rm -f /etc/sudoers.d/sapiensmetric-maintenance` +
   remove the `/usr/local/sbin/sapiensmetric-maint-*` wrappers.
2. **Publish the closed frontend** (dispatch-only; the agent has no GitHub
   credential — an unauthenticated dispatch returns 401): GitHub → repo
   `marijustechin/sapiensmetric` → **Actions → Deploy closed review frontend →
   Run workflow → confirm = `activate`** (or `gh workflow run deploy-closed.yml
   -f confirm=activate`).
3. **Owner acceptance:** sign in at `https://sapiensmetric.eu/en/auth/login/`
   (or `/lt/`). There is **no in-app change-password**; the supported path is the
   password-reset flow — sign out, use
   `https://sapiensmetric.eu/en/auth/forgot-password/`, open the emailed link
   `https://sapiensmetric.eu/<locale>/auth/reset-password#token=…`, and set a new
   password. Owner sign-in is **not** claimed until the owner reports it.

## Boundaries

- No public launch, no indexing of private routes, no exposure/retake policy, no
  calibrated-difficulty, IQ/percentile or mastery claims.
- No fabricated acceptance or verification; observed results are reported
  separately from untested assumptions.
- Sokoladas remains protected: additive changes only, no competing proxy, no
  Sokoladas configuration replacement.

## Reading order

1. `AGENTS.md`
2. `docs/closed-review-deployment.md` (recon, plan, blocker)
3. `docs/architecture.md`, `docs/decisions.md`
4. `docs/astronomy-draft-bank.md`, `docs/assessment-ui.md`, `docs/authentication.md`
5. `docs/publication-status.md`, `docs/deployment-webdav.md`
6. `../sokoladas/AGENTS.md`, `../sokoladas/sm-oracle-infra/AGENTS.md`,
   `../sokoladas/sm-oracle-infra/docs/application-deployment-contract.md`
