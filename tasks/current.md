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

## Delivered (this session)

- T-022 verified (`pnpm verify` EXIT 0), committed and pushed as **`23c6a9c`**
  (the pre-authorized prerequisite changes, including the local review repair and
  the `hasProgress` migration backfill).
- T-022 transitioned to `tasks/done/2026-10-09-versioned-astronomy-draft-bank.md`
  (owner-authorised transition; browser acceptance explicitly left pending).
- T-023 records the authorization, plan and blocker; `scripts/verify.sh` updated
  for the transition.
- Read-only reconnaissance of the shared server and both repositories recorded in
  `docs/closed-review-deployment.md`.

## Verification

- `pnpm verify` → **EXIT 0** (static-export 125/0, public-release 98/0, harness
  847/0) on the committed T-022 prerequisites.

## Blocker (exact missing input)

The agent has SSH as **`marijus`** and as **`deploy`** on `79.76.117.246`:

- `marijus` has **no passwordless sudo** (`sudo: interactive authentication is
  required`) and **no Docker access** (`permission denied` on the Docker socket).
- `deploy` may run **only** the scoped, Sokoladas-specific entry point
  `sudo -n /usr/local/sbin/sokoladas-deploy` (`status`/`stage`/`release`/
  `rollback`); it is **not** a general Docker or root path and builds only the
  fixed `/opt/sokoladas-staging/template`. There is no general root entry point
  and no `/opt/sapiensmetric` path.

Creating a **separate** Compose project, adding an `api.sapiensmetric.eu` server
block to the existing edge proxy, issuing/renewing its certificate, provisioning
root-managed secrets and refreshing the template all require **root** on the host.

**Required to proceed:** an interactive/privileged path on `79.76.117.246` —
either the `sudo` password for `marijus`, a general root-capable account, or an
agreed scoped root entry point for the SapiensMetric deployment — plus the
production secrets (SapiensMetric MySQL password, JWT access secret, operator
account email) and a decision confirming the Compose project name/ports and the
MySQL container-versus-host choice.

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
