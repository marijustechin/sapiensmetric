# T-021 — CI and automatic frontend publication (archived)

- **ID:** T-021
- **Type:** CI/CD + release tooling (GitHub Actions; no application redesign, no
  dependency upgrades).
- **Created:** 2026-10-09
- **Archive date:** 2026-10-09
- **Final status:** Approved (human review granted)
- **Approved:** 2026-10-09
- **Baseline:** T-020 archived; source HEAD `1b35e03` at task start.

---

> T-021 added GitHub Actions CI (`pnpm verify` on pull requests) and an
> automatic, frontend-only publication pipeline: a push to `main` builds the
> public release once, persists an encrypted pre-deployment baseline off-runner,
> uploads the exact verified artifact over WebDAV, verifies production, and
> records the deployment. `workflow_dispatch` provides recovery/redeployment and
> rollback.

## Delivered

- `.github/workflows/ci.yml` — PRs and non-`main` pushes run `pnpm verify`; never
  deploy; `contents: read`; no production secrets.
- `.github/workflows/deploy.yml` — `main` push + `workflow_dispatch`:
  classify → verify (build once) → baseline (capture + encrypted off-runner
  persistence) → deploy (exact artifact + production verify) → record. Actions
  pinned to full commit SHAs. `concurrency: production-frontend`,
  `cancel-in-progress: false`; stale-release guard; fresh operation per
  deployment; same-operation resume only.
- `scripts/deploy-webdav.mjs` — `--ci` reads `WEBDAV_*` from the environment
  (never printed, no env file on runners); `baseline` command captures overwritten
  originals + manifest **without** production writes; `apply --operation` resumes
  the same operation. TLS verification and reserved-path protection preserved.
- `scripts/ci-should-deploy.mjs` (+ tests) — conservative classification: skips
  only `docs/`, `tasks/`, `apps/api/`, `packages/assessment/`, and a root-markdown
  allow-list; web/public assets, lockfile, `package.json`, `scripts/`, `.github/`
  and **`packages/contracts/`** always deploy; unknown favours deployment.
- `scripts/restore-baseline.mjs` (+ tests) — creates the destination parent on a
  fresh runner, extracts and validates the baseline manifest (fails closed).
- Backup design: encrypted (`openssl` AES-256-CBC/PBKDF2-200k) Actions artifact,
  owner-held passphrase, retention 90 days (explicitly **not** permanent).
- Durable deployment records in `docs/deployments/` (CI-committed, `[skip ci]`).
- Docs: `docs/deployment-webdav.md` (CI/CD, credentials table, failure/resume/
  rollback, backup retention/recovery, reproducibility terminology),
  `docs/release-hosting.md`, `docs/publication-status.md`, `docs/testing.md`,
  `README.md`; corrected `engines.node` to `>=22.18.0`.

## Verification

- `pnpm verify` → EXIT 0 (static-export 125/0, public-release 98/0, harness
  829/0); deploy/classifier/restore tests 22/22.
- Read-only `baseline` run against production captured 164 overwrites with no
  production write (temp baseline removed afterwards).
- **First automatic deployment succeeded** (run #6, source `84ec5b1`): all jobs
  succeeded; artifact `4ad00f748d5c2d7e`, operation `mv0jf68i-80ea22b4c68e`,
  baseline artifact run `37889657578`; record
  `docs/deployments/20261009T055411Z-84ec5b1….md` (commit `028b46c`). Independent
  checks: public routes 200, app routes 404, `robots.txt`/`sitemap.xml` byte-match
  the repository export (20 sitemap URLs).
- **Docs-only control** (run #7, `549c5e4`): classify succeeded, all deploy jobs
  skipped — confirming doc-only changes do not deploy.
- Two bring-up defects were fixed (`7d64561` baseline extraction destination;
  `84ec5b1` deploy-job checkout); both failed **before** any production PUT, and
  the no-PUT-on-failure guarantee held.

## Limitations / follow-ups

- Baselines are 90-day encrypted Actions artifacts, not permanent; adopt the
  documented durable off-host destination before relying on multi-month rollback.
- The deployment record commit is best-effort (`continue-on-error`) — always
  supplementary, never backup persistence.
- "Content identity" is per-artifact (repeatable generation, not byte-identical
  independent builds).
- Preserved unresolved follow-ups: Search Console ingestion (unconfirmed),
  hosting manifest MIME / custom-404, analytics review, API deployment, hosting
  migration plan.

## Reading order

1. `AGENTS.md`
2. `docs/deployment-webdav.md` (Continuous deployment)
3. `docs/release-hosting.md`
4. `docs/testing.md`
5. `docs/publication-status.md`
