# T-021 — CI and automatic frontend publication (active)

- **ID:** T-021
- **Type:** CI/CD + release tooling (GitHub Actions; no application redesign, no
  dependency upgrades).
- **Created:** 2026-10-09
- **Status:** Active — **READY_FOR_HUMAN_REVIEW**. Implemented, committed and
  pushed. Automatic publication is configured but **not yet exercised** (requires
  owner-entered GitHub secrets/environment).
- **Baseline:** T-020 archived; source HEAD at T-020 finalisation (`1b35e03`).

---

> T-021 adds GitHub Actions CI (`pnpm verify` on pull requests) and an automatic,
> frontend-only publication pipeline: a push to `main` builds the public release
> **once**, captures a durable pre-deployment baseline, uploads the exact verified
> artifact via the existing WebDAV tooling, verifies production, and records the
> deployment. Failed prerequisite checks must prevent deployment. API deployment,
> DNS, Google accounts and hosting configuration are out of scope.

## Scope

1. **CI**: PRs run `pnpm verify` and never deploy; `main` runs `pnpm verify`
   before any deployment; a manual trigger exists for recovery/redeployment.
2. **Build once / deploy those bytes**: the deployment job reuses the verified
   artifact (no rebuild), keeping frontend-only scope.
3. **Change classification**: doc-only and API-only changes must not deploy;
   web/public assets, shared build deps, lockfile and release/deployment tooling
   must deploy; unknown relevant changes favour deployment.
4. **Credentials**: GitHub secrets/environment; the WebDAV tool reads them from the
   environment without an env file and never prints values; TLS verification and
   reserved-path protection preserved.
5. **Recoverable backups**: baseline captured and persisted (encrypted artifact,
   explicit retention + owner-held recovery key) before any overwrite; retrieval
   procedure documented.
6. **Concurrency/failure**: one production write at a time; no mid-flight cancel;
   stale-release guard; explicit manual override; fresh operation per deployment;
   same-operation resume only.
7. **Verify + record**: post-deploy route/deep-link/robots/sitemap/excluded checks;
   durable deployment record (source SHA, artifact id, operation id, backup
   location, time, outcome).
8. **Docs**: canonical deployment/publication/testing docs updated.

## Reading order

1. `AGENTS.md`
2. `docs/deployment-webdav.md`
3. `docs/release-hosting.md`
4. `docs/publication-status.md`
5. `docs/testing.md`
