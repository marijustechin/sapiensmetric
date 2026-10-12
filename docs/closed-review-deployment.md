# Closed SapiensMetric production-review environment — recon, plan, blocker

**Status: independent preparation complete; live installation BLOCKED** (missing
privileged access). Reconnaissance below was gathered 2026-10-12. This document
separates **observed** facts from **untested** proposals, per the repository's
evidence rules. No live change has been made.

Related: task `tasks/current.md` (T-023), decision `docs/decisions.md` (D-028),
infrastructure authorities `../sokoladas/sm-oracle-infra/AGENTS.md`,
`../sokoladas/sm-oracle-infra/docs/application-deployment-contract.md`,
`../sokoladas/sm-oracle-infra/docs/deployment.md`.

## 1. Observed live topology (read-only SSH, 2026-10-12)

Host `79.76.117.246` = `sokoladas-demo`, DNS `sokoladas.eu`.

| Area | Observation |
| --- | --- |
| Architecture / OS | `aarch64`, Ubuntu 26.04.1 LTS, kernel `7.0.0-1010-oracle` |
| Resources | 2 vCPU, 11 GiB RAM (~1.1 GiB used, ~10 GiB available), `/dev/sda1` 45 G, 22 G used, **23 G available** |
| Public listeners | `0.0.0.0:80`, `0.0.0.0:443`, `:22`; loopback DNS only. No app/DB port published |
| Sokoladas stack | Compose project `sokoladas-staging`: `proxy` (nginx, healthy), `certbot`, `api` (healthy) |
| Applied release | `ci-ee19b7375e4d` (source `smshop` `ee19b737…`), previous `ci-e94150c92e67`; `/opt/sokoladas-staging/{releases,template,state,evidence,backup}` root-owned |
| Backups | `sokoladas-backup.timer` daily 03:00 Europe/Vilnius (rclone `crypt` → Google Drive) |
| Edge proxy config | `nginx.conf` serves only `sokoladas.eu`/`www`; unmatched HTTP → `503`, unmatched HTTPS → `444`. ACME HTTP-01 webroot `/var/www/acme` exists only for `sokoladas.eu`/`www` |
| Certificates | Let's Encrypt `sokoladas.eu` (+`www`), expiry 2026-12-07; containerised renewal loop |
| DNS | `api.sapiensmetric.eu → 79.76.117.246` (authoritative + resolver agree); `sapiensmetric.eu → 213.226.189.237` (vHost, public site) |

## 2. Access model (the blocker)

| Account | Capability (observed) |
| --- | --- |
| `marijus` | SSH key login; member of `sudo` but `sudo -n -l` → **"interactive authentication is required"**; **no Docker access** (`permission denied` on `/var/run/docker.sock`) |
| `deploy` | SSH key login (same `~/.ssh/id_ed25519_oracle`); may run **only** `sudo -n /usr/local/sbin/sokoladas-deploy` (`status`/`stage`/`release`/`rollback`) — a Sokoladas-specific entry point that builds only the fixed `/opt/sokoladas-staging/template`; not general root/Docker |

**Consequence:** creating a separate Compose project, adding a new server block
to the shared edge proxy, issuing a certificate for `api.sapiensmetric.eu`,
provisioning root-managed secrets, and refreshing the release template all require
**root**. The scoped `sokoladas-deploy` path cannot do any of this and must not be
repurposed. See §9 for the exact inputs required.

## 3. Sokoladas protection (plan; not executed)

Before any shared change:

1. Record the current release (`ci-ee19b7375e4d`), routes/health
   (`sokoladas.eu` apex, `/api`, `/media`, `/health/ready`) and certificate
   fingerprints.
2. Capture recoverable configuration + database backups using the existing
   `sokoladas-backup` procedure; keep recovery material **outside the web root
   and out of Git**, with the existing secure off-host copy (Google Drive,
   rclone `crypt`).
3. Prepare exact restoration steps (image rollback restores only
   `frontend`/`api`; schema is forward-only).
4. Apply **additive** changes; validate proxy config with `nginx -t` before
   reload; do not restart unrelated services.
5. Recheck Sokoladas after every shared proxy/certificate/network change and
   after the final deployment.
6. The `smshop` CI auto-deploys `main` through the entry point; coordinate any
   cross-repository push with that trigger (no `smshop` push is planned here).

## 4. Proposed SapiensMetric architecture (repository preparation; not installed)

Separate Compose project (working name `sapiensmetric-review`, directory
`/opt/sapiensmetric-review`), additive to the existing edge:

```text
Internet 443 (existing nginx proxy, sokoladas-staging)
  ├── sokoladas.eu            → existing frontend/api        (UNCHANGED)
  └── api.sapiensmetric.eu    → sapiensmetric-api:3000       (NEW server block)

sapiensmetric-review project:
  sapiensmetric-api   NestJS (ARM64 image)  — no published ports
  sapiensmetric-db    MySQL 8.4 (ARM64)     — internal only, named volume
```

- **Networking:** the API joins the existing `sokoladas-staging_edge` network
  (declared `external` in the SapiensMetric Compose) so the existing proxy can
  reach it **without changing the proxy's own compose**. The DB stays on a
  private internal network; the API also joins the existing `egress` path (SMTP).
  No competing proxy and no published host ports for API/DB.
- **Proxy change (additive, root):** add an HTTP ACME + redirect server block for
  `api.sapiensmetric.eu` and an HTTPS server block with its certificate; add an
  `upstream sapiensmetric_api { server sapiensmetric-api:3000 resolve; }`. This
  is a **template refresh** of the Sokoladas release (administrator operation).
- **Certificate:** issue `api.sapiensmetric.eu` into the **existing**
  `letsencrypt` volume via the existing certbot model (HTTP-01 through the shared
  `acme_webroot`); the existing renewal loop then covers it. Existing
  `sokoladas.eu` certificate is untouched.
- **Runtime:** pinned ARM64 images, `restart: unless-stopped`, `init`, non-root
  UID, health checks, bounded logs (inherit the host `local` 10m×3 policy).
- **Migrations:** explicit (`pnpm --filter @sapiensmetric/api migration:run`);
  TypeORM `synchronize: false` (already the case).
- **Secrets:** root-managed files under `/etc/sapiensmetric/secrets/`, mounted
  read-only; never printed, committed, bundled, or reused from Sokoladas.

## 5. Application prerequisites (in the SapiensMetric repository; not yet done)

These do not need server access and are the next implementation work:

- **No Dockerfile exists** for `apps/api` — production image + ARM64 build/publish
  is a hard prerequisite for deployment.
- The API config (`apps/api/src/config/env.ts`) currently requires **all** SMTP
  values (not optional) and requires `CORS_ORIGIN == PUBLIC_APP_URL`. A closed
  review deployment therefore needs SMTP credentials and a defined web origin.
- **Closed-review capability:** a new default-off flag (separate from the
  development-only `ASSESSMENT_*` flags) that enables draft review only for
  server-enforced authorised test accounts under `NODE_ENV=production`.
- **Public registration disabled at the API boundary**; **Google OAuth must not
  create accounts** (leave Google disabled if no production Google config).
- **Operator provisioning workflow** for the owner's account (no bootstrap HTTP
  endpoint, no dev DB clone, no reused sessions).
- **Frontend closed-release profile** publishing the EN/LT
  login/account/admin/assessment shells (registration unavailable, CTAs removed,
  private routes `noindex`, out of sitemap and GA4/GTM), preserving the existing
  public-only profile and adding closed-release checks rather than deleting
  exclusions.

## 6. Frontend publication plan

- Web origin stays `https://sapiensmetric.eu` (existing public host, Apache);
  API origin `https://api.sapiensmetric.eu`. Credentialed CORS with the exact
  production origin, `SameSite=Lax` cookies (same registrable domain), existing
  Origin protections unchanged.
- Extend the established CI/CD with a **closed-release** artifact/build profile
  that includes the private shells; keep the public-only profile and its
  exclusion checks intact.
- **Release ordering:** verify API readiness and closed-access enforcement
  **before** publishing the shells that expose the private routes.

## 7. Yoast-style sitemap plan

- Compare `apps/web/app/sitemap.ts` with a real Yoast-generated sitemap and the
  official Yoast sitemap documentation.
- Implement a `sitemap.xml` **index** plus child sitemaps (e.g. pages,
  articles) generated from repository content only; keep `/sitemap.xml` a valid
  entry point; preserve canonical HTTPS non-www URLs, truthful `lastmod`, and
  EN/LT alternates.
- Exclude private routes and the remembered-language root redirect.
- Update `robots.txt`, `scripts/build-public-release.sh`,
  `scripts/verify-public-release.sh` and `scripts/verify-static-export.sh` to
  validate the index and every referenced child sitemap; do not manually copy
  production XML or fabricate dates.
- Record exactly what changed; do **not** claim this proves the cause of the
  Search Console ingestion failure.

## 8. Verification and handover plan

`pnpm verify`; real-MySQL integration checks; production HTTPS via
`https://api.sapiensmetric.eu`; login/refresh/logout; registration rejection;
unauthorised assessment rejection; an authorised astronomy
start/save/resume/submit/feedback journey; no keys before submission; no
assessment analytics payloads; mobile rendering + working hamburger/logout;
Sokoladas public/API recheck and existing certificate/deployment config; record
source commits, release identities, migrations, backup locations and rollback
steps; update `sm-oracle-infra` docs to describe the shared server and both
applications with ownership boundaries.

## 9. Exact missing inputs

1. **Privileged access** on `79.76.117.246` — the `marijus` sudo password, a
   root-capable account/key, or an agreed scoped root entry point for the
   SapiensMetric deployment (create project dir, edit proxy template, issue
   certificate, provision secrets).
2. **Production secrets** for SapiensMetric: MySQL database/user/password, a
   ≥32-character `JWT_SECRET`, and SMTP credentials (the config requires SMTP).
3. **Operator account email** for provisioning (no password to be sent here).
4. **Confirmations** of the Compose project name/directory, the API internal port
   (default `3000`), and the MySQL container image choice (`mysql:8.4`).

## 10. Observed vs untested

- **Observed:** all of §1, §2 and the existence/paths of the Sokoladas releases,
  template, state, evidence and backup directories; the DNS answers; the
  containers and listeners; the application config/absence of a Dockerfile.
- **Untested / proposed:** everything in §4–§8 — the architecture is a proposal
  from repository facts, not an installed or verified state. No certificate has
  been issued for `api.sapiensmetric.eu`, no image has been built or published,
  no secret has been provisioned, and no Sokoladas change has been made.
- **Not performed:** interactive browser checks, live T-023 deployment, and CI
  observation of the T-022 push (no `gh` CLI/token available; the push to the
  SapiensMetric `main` completed and is expected to trigger the existing
  public-frontend deploy workflow, which was not observed from here).
