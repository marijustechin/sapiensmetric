# T-014 — Frontend-only publication preparation (archived)

- **ID:** T-014
- **Type:** Release preparation (frontend-only; no new dependency)
- **Created:** 2026-09-26
- **Archive date:** 2026-09-28
- **Final status:** Approved (human review granted)
- **Approved:** 2026-09-28

---

> T-014 prepared a reproducible **frontend-only public release** of the T-013
> website and deployed it to production, including the consent-gated GTM→GA4
> integration and the WebDAV deployment tooling. The owner accepted and authorised
> archival on 2026-09-28. The deployed frontend is an **artifact**, not a commit:
> the production artifact `64c4941cba87d08c` (operation `mulkgfk6-0768754a1976`)
> was **not** rebuilt from the finalisation commit, which contains documentation
> and tooling reconciliation. The original scope, evidence, and remaining
> operational follow-ups are preserved below.

## Scope

1. **Release build** — `scripts/build-public-release.sh` (`pnpm build:public`)
   builds the static export and assembles `dist/public-site/`, deterministically
   excluding the auth/account/admin route directories. No API/DB/SMTP/OAuth
   secrets are required to build or serve it.
2. **Public runtime** — public pages initiate no API requests, session
   bootstrap/refresh, or OAuth probes; the public area has no auth provider and no
   links to unavailable application routes.
3. **Publication content** — operator **Marijus Šmiginas** where appropriate;
   Privacy describes the release accurately; no invented hosting/retention facts.
4. **Hosting / Search Console** — `docs/release-hosting.md` documents the
   document-root contents, backup/upload/verify/rollback, HTTPS, canonical
   hostname, deep-link refresh, 404, indexing checks, and Search Console steps.
5. **Verification** — `scripts/verify-public-release.sh` checks the release
   directory; the full `pnpm verify` chain runs unchanged.

## Confirmed release decisions (D-026)

Origin `https://sapiensmetric.eu`; operator Marijus Šmiginas (name only); public
contact `info@sapiensmetric.eu`; transactional sender `website@sapiensmetric.eu`;
hosting vHost (Bacloud migration announced, no assumptions); future API origin
`https://api.sapiensmetric.eu` (not deployed); first release = public
pages/articles only.

## Analytics extension (D-027)

The owner authorised consent-controlled GTM→GA4 as part of T-014. Basic Consent
Mode blocks GTM entirely until explicit analytics consent (no pre-consent
requests, no `<noscript>` iframe, no preconnect). Consent is versioned (180-day
expiry, safe storage), separate from the language preference, with an EN/LT banner
(equal Accept/Reject + privacy link) and a persistent footer "Cookie settings"
entry; withdrawal persists rejection, removes analytics cookies where accessible,
and reloads. Collection is limited to the production host and eligible public
routes with one sanitized `page_view` per page; advertising consent stays denied.
GTM container `GTM-WRBRTKRT` / GA4 `G-0CR4C3KPH3`.

### Container import-format correction

The container file was corrected to the GTM **UI import/export format** (uppercase
`Parameter`/condition enums — `TEMPLATE`, `LIST`, `MAP`, `INTEGER`, `EQUALS` —
while tag identifiers stay lowercase `googtag`/`gaawe`/`v`), fixing the UI
rejection `Unrecognized value [template]`. Validated by
`scripts/verify-gtm-container.mjs` (`pnpm verify:gtm`, part of `pnpm verify`).

### Consent Mode command-format fix (frontend)

Real GTM Preview initially showed "Consent not configured. Default consent state
has not been set" and both tags firing. **Proven cause:** the dataLayer bootstrap
pushed consent commands as **plain Arrays** (`['consent','default',{...}]`). GTM's
runtime only reaches its consent processor (`SD['consent']`) when the message is
an **Arguments object** (the canonical `function gtag(){ dataLayer.push(arguments); }`
shape); plain Arrays take GTM's `Array.isArray` branch and are silently dropped.
Verified against the real container runtime: `google_tag_data.ics.usedDefault` is
`false` for a plain Array and `true` for an Arguments object. **Fix:**
`analytics.ts` builds consent commands via `createGtagLayerPush` (Arguments
objects); default denies all four signals, update grants `analytics_storage` only
and keeps `ad_storage`/`ad_user_data`/`ad_personalization` denied. Regression:
`apps/web/shared/lib/analytics.test.ts` (Arguments shape / GTM predicate) and
`scripts/verify-consent-gtm-runtime.mjs` (`pnpm verify:consent-runtime`,
real-runtime).

### Owner-confirmed publication and consent (2026-09-28)

- GTM-WRBRTKRT was **published** with version name **"GA4 – consent-gated public
  site"**. The **numerical version ID was not supplied** and is not asserted.
- Real **Tag Assistant** at `spa_page_view` showed all four defaults denied, then
  `analytics_storage` granted while `ad_storage`, `ad_user_data`, and
  `ad_personalization` remained denied.
- The owner **disabled and saved** GA4 Enhanced Measurement **"Page changes based
  on browser history events"**. Other Enhanced Measurement options **remained
  enabled** (do not document all Enhanced Measurement as disabled).
- After publication, the owner tested outside Preview in an **incognito** window;
  GA4 **Realtime** received EN/LT page and article views.
- Realtime also displayed both `/en/assessment-guide` and
  `/en/assessment-guide/`; the **cause is not established**.

### Controlled production collection check (current behaviour)

Run outside Preview in a fresh profile on the deployed artifact
`64c4941cba87d08c` (accept → Articles → open an article → switch locale → reload).
The actual `region1.google-analytics.com/g/collect` payloads showed exactly **one**
`page_view` per transition/reload, measurement ID **`G-0CR4C3KPH3`**, a
**consistent slash-less** `page_location`/`page_path` policy, and **no query
strings or fragments**. This is request-payload evidence (not a GA4 report
inspection; duplication was not inferred from aggregate counts). The historical
trailing-slash row was **not** reproduced by the current sequence.

## WebDAV deployment automation (extension)

`docs/deployment-webdav.md` + `scripts/deploy-webdav.mjs` add frontend-only
deployment to the cPanel Web Disk (`public_html`, read/write):
`pnpm deploy:check|plan|apply|rollback|verify`. Credentials live in the git-ignored
`.env.deploy.local` (template `.env.deploy.local.example`), parsed as data, never
printed/committed/bundled/uploaded; TLS verification is always on. **Artifact
identity** (sorted paths + `sha256` of file contents) is separate from **operation
identity**; every `apply` gets a fresh operation id and its own baseline
(`dist/deploy-baseline/<operationId>/` with `manifest.json` + `files/`). Retries
resume explicitly with `--operation <id>` (verifying contents and destination);
backups and the manifest are persisted atomically before overwrite. Focused tests:
`pnpm test:deploy` (part of `pnpm verify`).

Two authorised production deployments took place on 2026-09-28:

- **Initial:** operation `muliubrg-822e9fdae477`, artifact `fcbbf30a7645982a`
  (159 files; 8 create / 151 overwrite), baseline
  `dist/deploy-baseline/muliubrg-822e9fdae477/`. A first attempt stopped with
  **HTTP 409** on `PUT _next/static/o_lQS7h7de0Z3kNMCfWnJ/_buildManifest.js`
  (cPanel rejects a `PUT` into a new collection). The tool was fixed to create
  missing parent collections idempotently (`MKCOL`) on `409` and retry, and the
  **same operation** was resumed to completion. `.htaccess`, `.well-known/**`,
  unrelated remote files, and previous hashed assets were preserved.
- **Corrective:** operation **`mulkgfk6-0768754a1976`**, artifact
  **`64c4941cba87d08c`** (159 files; 4 create / 155 overwrite), baseline
  `dist/deploy-baseline/mulkgfk6-0768754a1976/`, deployed **21:13–21:17 EEST
  (18:13–18:17 UTC)**. Remote content matched the artifact **159/159**;
  `pnpm deploy:verify` all ok. Rollback:
  `pnpm deploy:rollback -- --operation mulkgfk6-0768754a1976 --confirm`.

## Acceptance evidence

- `pnpm verify` passed at finalisation (lint, typecheck, tests, `test:deploy`,
  `verify:gtm`, FSD boundaries, build, `verify-static-export.sh`, `verify.sh`).
- Both production deployments verified with `pnpm deploy:verify`; the corrective
  deployment additionally verified with a full **159/159** artifact↔remote content
  comparison and HTTP/static checks (redirects, sitemap, consent strings).
- Browser checks on production: fresh/Reject → **no Google requests**; Accept and
  restored consent → `gtm.js?id=GTM-WRBRTKRT` with
  `google_tag_data.ics.usedDefault:true`, `analytics_storage` granted, advertising
  denied.
- Owner-confirmed Tag Assistant consent states, GTM publication, Enhanced
  Measurement change, and GA4 Realtime page/article views.
- Human review accepted T-014 on 2026-09-28 (acceptance, archival, commit, push).

## Remaining operational follow-ups (not complete)

- **GA4 settings review** — the remaining Enhanced Measurement options and the
  Google Signals / advertising-personalisation settings are **unconfirmed**
  (pending).
- **Search Console sitemap ingestion** — "Could not read sitemap" with zero
  discovered pages; ingestion/indexing **NOT confirmed** (pending).
- **Realtime trailing-slash duplicate** — `/en/assessment-guide` and
  `/en/assessment-guide/` both appeared; cause not established and not reproduced
  by the current controlled check (pending).
- **GA4 report-level verification** beyond the owner's Realtime view (pending).
- **Hosting migration** — vHost→Bacloud timing and final document-root/cache
  config unconfirmed.
- **Content/legal** — operator legal/registration details; retention/consent
  specifics for account data; Privacy review against deployed behaviour.
- **Optional** — GitHub Actions deployment (not started).

## Non-goals (as scoped)

- DNS/mail/hosting-account changes; publishing the API.
- Any assessment, score, norm, or validation claim.
- Analytics without consent or a nonfunctional consent banner.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md`
3. `docs/release-hosting.md`
4. `docs/publication-checklist.md`
5. `docs/publication-status.md`
6. `docs/architecture.md`
7. `docs/decisions.md` (D-025, D-026, D-027)
