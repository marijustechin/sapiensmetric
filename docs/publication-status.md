# Publication status — SapiensMetric public site

As of **2026-10-06 (Europe/Vilnius)**. Single entry point for the publication,
SEO, Google-services, and deployment state of the public frontend.

**Status labels** (used throughout): `implemented` (in the repository),
`deployed` (live on production), `external` (configured in an external service),
`verified` (with evidence/date), `pending` (not done), `unverified` (no evidence),
`owner-reported`, `checked-2026-09-27` (external check), `re-checked` (personally
re-run in this session). Detailed instructions live in the linked docs; this page
does not duplicate them.

Related detail: `docs/release-hosting.md` (deploy/rollback, redirects,
Search Console), `docs/deployment-webdav.md` (WebDAV automation),
`docs/gtm/README.md` (GTM container), `docs/publication-checklist.md`.

## 1. Repository and release

| Item | State |
| --- | --- |
| T-013 (public website/content/SEO) | `implemented`, archived; committed and pushed as **`5da3ac7`** (`re-checked`) |
| T-014 (frontend-only release prep; analytics extension; WebDAV tooling; consent-command fix) | `implemented`, **approved and archived** at `tasks/done/2026-09-26-frontend-only-publication-preparation.md`; committed/pushed in the T-014 finalisation commit (see git log). Deployed artifact `64c4941cba87d08c` (`re-checked`) |
| **T-018 (favicon/manifest)** | `implemented`, **approved and archived** 2026-10-06 (`tasks/done/2026-10-06-favicon-manifest-data.md`); committed/pushed as **`f1d0e69`** |
| **T-019 (minimal local synthetic-assessment UI)** | `implemented`, **approved and archived** 2026-10-06 (`tasks/done/2026-10-06-minimal-local-synthetic-assessment-ui.md`); owner-confirmed in the browser. **Local/development only — not deployed, not publication-ready.** |
| **T-020 (hamburger nav, mobile/markup review, reproducible sitemap, HTML-conformance fixes)** | `implemented` + **frontend-only deployed** 2026-10-06 (owner-authorised; two deployments); **not committed/pushed/archived** — READY_FOR_HUMAN_REVIEW in `tasks/current.md` |
| Release build | `pnpm build:public` → `dist/public-site/` (`implemented`; artifact present locally) |
| Public release scope | informational pages + articles only; auth/account/admin/assessment and the API are **excluded** (`implemented`) |
| **Deployed artifact (current)** | **artifact id `7facf7e558173e17`** (167 files; 7 create / 160 overwrite), operation **`mux42oos-932ee20e6c2c`**, deployed **2026-10-06 23:08–23:12 EEST** (20:08–20:12 UTC) (`re-checked`) — T-020 plus the HTML-conformance fixes (valid global 404, consent `<section>` without a redundant `role`) |
| Deployment destination | **`https://sapiensmetric.eu:2078/`** (WebDAV URL root; account chrooted to `public_html`; do not append `/public_html/`) (`re-checked`) |
| Deployment baseline (rollback source) | **`dist/deploy-baseline/mux42oos-932ee20e6c2c/`** (160 backups + `manifest.json`) (`re-checked`) |
| Rollback command | `pnpm deploy:rollback -- --operation mux42oos-932ee20e6c2c --confirm` |
| Prior deployments (superseded) | artifact `779cf9f32f90f277`, operation `mux3032z-9200a465dd4a`, 2026-10-06 22:38–22:42 EEST (nav/markup + 20-URL sitemap); artifact `97e89b25b1edd8a9`, operation `mux030hl-e8032efd1883`, 2026-10-06 21:16–21:21 EEST (favicon/manifest); earlier `64c4941cba87d08c` / `mulkgfk6-0768754a1976` |
| Source HEAD / repo-vs-deployed | source HEAD **`0af704e`** plus the **uncommitted T-020 changes**; deployed artifact id `7facf7e558173e17` — **not** a commit hash |

## 2. Hosting (`owner-reported`; plan `owner-confirmed` 2026-10-06)

- Current frontend provider: **vHost**, cPanel, Apache, no SSH — **temporary**.
- Owner-confirmed migration plan (2026-10-06): the frontend moves to **Bacloud**
  in **approximately three months**; the timing is **tentative**.
- The **Bacloud** target has **no Node.js runtime** (static hosting only). The
  **backend** will therefore use a **separate Node.js-capable provider, not yet
  selected**.
- Planned public API origin remains **https://api.sapiensmetric.eu** — **not
  deployed**. API deployment is **pending** and is **not authorised by T-019**.
- `sapiensmetric.eu` uses **`public_html`**, shared with the account's legacy main
  domain **`skygym.lt`**; the owner no longer owns `skygym.lt` and the provider
  cannot currently change the account's main domain.
- Public contact **info@sapiensmetric.eu** confirmed working; operator
  **Marijus Šmiginas**; transactional sender remains **website@sapiensmetric.eu**.

## 3. Redirects and SEO

The owner installed this production `.htaccess` block (`owner-reported`; preserve
it — the deployment tooling never uploads or deletes `.htaccess`):

```apache
RewriteEngine On

RewriteCond %{HTTP_HOST} ^www\.sapiensmetric\.eu$ [NC]
RewriteRule ^ https://sapiensmetric.eu%{REQUEST_URI} [R=301,L]

RewriteCond %{HTTP_HOST} ^sapiensmetric\.eu$ [NC]
RewriteCond %{HTTPS} off
RewriteCond %{HTTP:X-Forwarded-SSL} !^on$ [NC]
RewriteRule ^ https://sapiensmetric.eu%{REQUEST_URI} [R=301,L]
```

External checks **2026-09-27** (`checked-2026-09-27`): HTTP apex, HTTP `www`, and
HTTPS `www` return **301** to HTTPS apex; HTTPS apex returns **200**; a query
string was retained (`/en/articles/?redirect_check=1`); `sitemap.xml` returns
**200 `application/xml`**, parses, and contains **20** public EN/LT URLs, all
HTTPS without `www`; `robots.txt` allows crawling and references that sitemap.

**`robots.txt` is source-generated and matches production (`re-checked`,
2026-10-06):** `apps/web/app/robots.ts` now emits only the allow-all rule and the
production sitemap line, and **no `Host` directive** (Google no longer supports
`Host`). A normal `pnpm build:public` reproduces this file; no production copy is
needed, and the earlier `Host:` mismatch is resolved at the source.

**Sitemap source-vs-deployment discrepancy — RESOLVED (`re-checked`,
2026-10-06):** before T-020 the deployed `sitemap.xml` had **21** URLs including
the apex `https://sapiensmetric.eu/`, while the repository generator produced
**20** and omitted it. Under the owner-approved T-020 policy the repository
generator is now **authoritative**: the sitemap lists the **20** public EN/LT
URLs (both locale homes `/en/` and `/lt/`, the five public pages per locale, the
articles index, and the three articles), with reciprocal EN/LT alternates,
canonical HTTPS non-www URLs, trailing slashes, and truthful `lastmod` dates. The
**root remembered-language redirect is deliberately excluded**, and
auth/account/admin/assessment are excluded. The generator is derived from
repository content (no fixed URL ceiling; new pages/articles are picked up
automatically). The T-020 deployment **intentionally replaced the 21-URL
production sitemap with the generated 20-URL version**; production
`sitemap.xml` and `robots.txt` bytes now match the artifact.

> **Search Console:** No causal link has been established between the previous
> 20-versus-21 URL discrepancy and Search Console's sitemap ingestion failure.
> Source/deployment consistency is resolved; Search Console ingestion remains
> unconfirmed (see §4 and Next actions).

**PageSpeed** (`checked-2026-09-27`, historical lab, tested the then-current `www`
URL; not a guarantee for later releases):
`https://pagespeed.web.dev/analysis/https-www-sapiensmetric-eu-en/z9rmdwd0t5?form_factor=mobile`
— mobile and desktop **100** for Performance, Accessibility, Best Practices, SEO;
mobile **FCP 0.9s, LCP 1.4s, TBT 20ms, CLS 0**. Follow-ups: cache lifetimes,
response compression, oversized displayed logo.

## 4. Google services

| Service | State |
| --- | --- |
| Search Console Domain property `sapiensmetric.eu` | ownership **DNS TXT verified** (`owner-reported`) |
| Sitemap submission | submitted first with `www`, then without; latest screenshot still showed **"Could not read sitemap"** and **zero discovered pages**; **ingestion/indexing NOT confirmed** (`pending`) |
| GA4 measurement ID | **G-0CR4C3KPH3** (`external`, owner-created) |
| GTM web container | **GTM-WRBRTKRT** (`external`, owner-created) |
| Analytics consent integration + GTM JSON | `implemented`; GTM file corrected to the **UI import format** and validated locally (`pnpm verify:gtm`) |
| Consent-gated frontend deployed | **`deployed`** 2026-09-28 (artifact `64c4941cba87d08c`, operation `mulkgfk6-0768754a1976`; **superseded** by the current artifact `7facf7e558173e17`) |
| Consent Mode command format | **Fixed and deployed 2026-09-28**: consent commands are gtag **Arguments objects** (`createGtagLayerPush`), not plain Arrays. Production browser checks: fresh/Reject → **no Google requests**; Accept + restored consent → `gtm.js?id=GTM-WRBRTKRT` with `google_tag_data.ics.usedDefault:true`, `analytics_storage` granted, advertising denied |
| GTM import (SM-Workspace) | **owner-confirmed done**: corrected container imported into **SM-Workspace**; **both tags reviewed** by the owner |
| GTM container publication | **owner-confirmed published** 2026-09-28, version name **"GA4 – consent-gated public site"**; the **numerical version ID was not supplied** and is not asserted |
| Real Tag Assistant consent check | **owner-confirmed** (2026-09-28): all four defaults **denied**, then `analytics_storage` **granted** while `ad_storage`/`ad_user_data`/`ad_personalization` stayed **denied** |
| GA4 collection (owner-observed Realtime) | **owner-confirmed**: EN/LT page and article views received after publication (incognito, outside Preview) |
| Controlled production collection check | **observed** (current deployment, fresh profile): exactly one `page_view` per accept → Articles → article → locale → reload; `tid=G-0CR4C3KPH3`; consistent **slash-less** `page_location`/`page_path`; no query/fragment (`docs/gtm/README.md`) |
| GA4 Enhanced Measurement | **owner-confirmed**: "Page changes based on browser history events" **disabled and saved**; **other Enhanced Measurement options remained enabled**. Remaining options and Signals/advertising: **pending** review |
| Realtime trailing-slash rows | `/en/assessment-guide` **and** `/en/assessment-guide/` both appeared in Realtime; **cause not established** and **not reproduced** by the current controlled check (`pending`) |

## 5. WebDAV automation (production deployment complete)

- Endpoint **`https://sapiensmetric.eu:2078/`**, account
  **`webdav@sapiensmetric.eu`**, cPanel scope **`public_html`** (read/write)
  (`owner-reported`).
- **Credential migration done:** the three `WEBDAV_*` settings were moved from
  `.env` into the git-ignored **`.env.deploy.local`** (values preserved); the
  standard `pnpm deploy:check` now works (`re-checked`, 2026-09-27).
- **Connectivity + mapping verified** (`re-checked`, 2026-09-27): TLS on, auth
  `OK` (PROPFIND 207), `OPTIONS` advertises `PROPFIND/PUT/GET/HEAD/…`; account
  **chrooted to `public_html`**, so the **deployment base is the URL root** — do
  **not** append `/public_html/`. Known-file confirmation matched (`sitemap.xml`:
  WebDAV `200`, public `200 application/xml`).
- **Empty-PROPFIND handled:** cPanel returns 207 with an empty body; existence is
  decided by HTTP status (`HEAD`, `PROPFIND` fallback); 401/403/5xx/network are
  never treated as "missing".
- **Read-only plan complete** (`re-checked`, 2026-09-27): content-based artifact
  id `e01bae832f1abcf5`, base `https://sapiensmetric.eu:2078/`, **159 files**
  (assets first), **8 create / 151 overwrite**, `.htaccess`/`.well-known`
  preserved. Artifact identity (content hashes) is separate from **operation
  identity**: each `apply` gets a fresh operation id and its own baseline
  (`dist/deploy-baseline/<operationId>/`); `plan` created no baseline.
- **Production deployment done** (`re-checked`, 2026-09-28): owner authorised the
  upload; a **fresh operation `muliubrg-822e9fdae477`** deployed artifact
  **`fcbbf30a7645982a`** (159 files; 8 create / 151 overwrite) to
  `https://sapiensmetric.eu:2078/`. All **151 overwritten originals were backed up**
  and the manifest persisted **before** each overwrite; baseline
  `dist/deploy-baseline/muliubrg-822e9fdae477/`. `.htaccess`, `.well-known/**`,
  unrelated remote files, and previous hashed assets were **not touched** (no
  mirror/delete). Rollback: `pnpm deploy:rollback -- --operation
  muliubrg-822e9fdae477 --confirm`.
- **Corrective deployment done** (`re-checked`, 2026-09-28 21:13–21:17 EEST): a
  **new operation `mulkgfk6-0768754a1976`** deployed the consent-command fix,
  artifact **`64c4941cba87d08c`** (159 files; 4 create / 155 overwrite), baseline
  `dist/deploy-baseline/mulkgfk6-0768754a1976/` (155 backups), same destination.
  Remote content matched the artifact **159/159**; `pnpm deploy:verify` all ok;
  `.htaccess`/`.well-known`/unrelated files/previous hashed assets preserved.
  Rollback: `pnpm deploy:rollback -- --operation mulkgfk6-0768754a1976 --confirm`.
- **Favicon/manifest deployment done** (`re-checked`, 2026-10-06 21:16–21:21 EEST):
  a **new operation `mux030hl-e8032efd1883`** deployed artifact
  **`97e89b25b1edd8a9`** (166 files; 10 create / 156 overwrite), baseline
  `dist/deploy-baseline/mux030hl-e8032efd1883/` (156 backups). Preflight: 24 HTML
  files and 108 Next.js RSC `.txt` payloads changed for the new head links; 10
  remote files were new (3 `_next` build manifests + 7 branding icon/manifest
  files); **no unexpected non-HTML changes**. `robots.txt`/`sitemap.xml` were
  reconciled to the current production bytes first, so the upload did not change
  them (hashes matched before and after). Post-deploy `pnpm deploy:verify` all ok;
  production serves the icon/manifest URLs (`/branding/*`) with correct types and
  the `<head>` declares them, the in-page owl logo is still referenced, the old
  WebP favicon is no longer referenced, and auth/account/admin remain 404.
  Rollback: `pnpm deploy:rollback -- --operation mux030hl-e8032efd1883 --confirm`.
  **Post-note (2026-10-06):** `robots.txt` is now generated from
  `apps/web/app/robots.ts` without a `Host` directive (matches production; no
  production copy needed).
- **T-020 navigation/markup + sitemap deployment done** (`re-checked`,
  2026-10-06 22:38–22:42 EEST): a **new operation `mux3032z-9200a465dd4a`**
  deployed artifact **`779cf9f32f90f277`** (167 files; 8 create / 159 overwrite),
  baseline `dist/deploy-baseline/mux3032z-9200a465dd4a/` (159 backups). The exact
  planned artifact was applied without a rebuild between plan and apply.
  `.htaccess`, `.well-known/**`, unrelated remote files and previous hashed assets
  were preserved; auth/account/admin/assessment remain excluded (404). Post-deploy
  `pnpm deploy:verify` all ok; production `/robots.txt` and `/sitemap.xml` are
  **byte-identical** to the artifact; the production sitemap has **20** URLs with
  the root redirect excluded (intentional replacement of the previous 21-URL
  file). Rollback:
  `pnpm deploy:rollback -- --operation mux3032z-9200a465dd4a --confirm`.
- **HTML-conformance fixes deployment done** (`re-checked`, 2026-10-06
  23:08–23:12 EEST): a **new operation `mux42oos-932ee20e6c2c`** deployed artifact
  **`7facf7e558173e17`** (167 files; 7 create / 160 overwrite), fresh baseline
  `dist/deploy-baseline/mux42oos-932ee20e6c2c/` (160 backups). Exact planned
  artifact applied without a rebuild; `.htaccess`/`.well-known`/unrelated files and
  previous hashed assets preserved; app routes remain 404. Post-deploy: all
  `pnpm deploy:verify` routes ok; production `/404.html`, `/en/`, `/lt/`, an
  article page, `/robots.txt` and `/sitemap.xml` are **byte-identical** to the
  artifact; **Nu HTML Checker on the deployed EN/LT pages and `/404.html` reports
  0 errors / 0 warnings** (only informational trailing-slash notices). Two distinct
  404 facts: the deployed `/404.html` **document is valid**, while **unknown URLs
  may still be answered by Apache's own 404** (separate custom-ErrorDocument issue,
  unchanged). Rollback:
  `pnpm deploy:rollback -- --operation mux42oos-932ee20e6c2c --confirm`.
- **Tooling gap found and fixed during deploy:** the first `apply` stopped with
  **HTTP 409** on `PUT _next/static/o_lQS7h7de0Z3kNMCfWnJ/_buildManifest.js` because
  the remote lacked that **new** collection and the tool never issued `MKCOL`. The
  tool now creates missing parent collections idempotently on `409` and retries;
  the deployment was completed by resuming the **same operation** (same artifact,
  same destination). See `docs/deployment-webdav.md`.
- Historical note: the earlier owner-reported summary listed WebDAV
  connectivity/mapping as unverified; that is superseded by the re-checked
  results above.

## 6. Next actions (in order)

1. **GA4 settings review** (`pending`, owner): decide the remaining Enhanced
   Measurement options and the Google Signals / advertising-personalisation
   settings. Only **"Page changes based on browser history events"** is currently
   disabled; do not describe all Enhanced Measurement as disabled.
2. **Search Console sitemap ingestion** (`pending`/not confirmed): "Could not read
   sitemap" with zero discovered pages; recheck and use live URL inspection; do
   **not** mark indexing successful.
3. **Realtime trailing-slash duplicate** (`pending`, cause not established): if
   `/en/assessment-guide/` (with slash) reappears alongside the slash-less row,
   capture fresh Realtime/DebugView details and check a GA4 report we can inspect;
   do not infer duplication from aggregate counts. The current controlled check
   does not reproduce it.
4. **Future releases**: rebuild, then `pnpm deploy:plan` → `pnpm deploy:apply`
   (new operation) → `pnpm deploy:verify`. Rollback any release with
   `pnpm deploy:rollback -- --operation <operationId> --confirm`. The current
   release's baseline is `dist/deploy-baseline/mux42oos-932ee20e6c2c/`.
5. **Manifest MIME mapping (owner/hosting, `pending`):** production serves
   `/branding/site.webmanifest` **200 but with no `Content-Type` header** (Apache
   has no `.webmanifest` mapping), which risks browsers rejecting the manifest.
   Fix requires a hosting MIME mapping to `application/manifest+json` for
   `.webmanifest` (cPanel MIME Types or an owner-managed `.htaccess` `AddType`);
   the `.htaccess` is owner-managed and preserved by the tooling.
6. **Custom 404 handling (hosting observation, `pending`):** unknown paths return
   Apache's own 404 page and the ErrorDocument attempt also 404s; the generated
   `/404.html` **is** deployed (200, with the icon links). This is pre-existing
   hosting configuration, not caused by T-018/T-020.
7. **HTML-conformance fixes (`done`, deployed 2026-10-06):** the nested-document
   404 (`app/global-not-found.tsx`) and the consent `<section>`'s redundant
   `role="region"` are fixed and **deployed** in artifact `7facf7e558173e17`
   (operation `mux42oos-932ee20e6c2c`). Nu HTML Checker (`scripts/verify-html-conformance.mjs`)
   on the built export **and on the deployed EN/LT pages and `/404.html`** reports
   **0 errors / 0 warnings**; only the React informational "trailing slash on void
   elements" notices remain, intentionally **not** post-processed.
8. Optional future: GitHub Actions deployment (not started).

> **Analytics status:** container published and Realtime views owner-confirmed;
> Tag Assistant confirmed the consent states. Continued operation depends on the
> pending items above. Reviewing GA4 reports (beyond Realtime screenshots) has not
> been performed here.

> Credential note: the `WEBDAV_*` settings now live in the git-ignored
> `.env.deploy.local`; the standard `pnpm deploy:check|plan|apply|rollback|verify`
> commands work without `--env`.

## Evidence and fact labels

- `re-checked` in this session (2026-09-28): repository state (git log/status, file
  presence); WebDAV read-only connectivity/path mapping (2026-09-27); two
  production deployments — `muliubrg-822e9fdae477` (`fcbbf30a7645982a`, with the
  `409`/`MKCOL` resume) and the corrective `mulkgfk6-0768754a1976`
  (`64c4941cba87d08c`); post-deploy HTTP/static checks (redirects, routes, full
  159/159 content hashes, content types, consent strings); and a headless-Chromium
  production consent test on `https://sapiensmetric.eu/en/` (fresh/Reject → no
  Google requests; Accept + restored consent → GTM loads with recognised defaults,
  analytics granted, advertising denied); and the controlled GA4 collection check
  (one `page_view` per transition/reload, correct measurement ID, slash-less
  `page_location`/`page_path`, no query/fragment). The GTM runtime check
  (`scripts/verify-consent-gtm-runtime.mjs`) is supplementary evidence.
- `re-checked` (2026-10-06): T-018 finalisation (commit **`f1d0e69`**); the
  favicon/manifest deployment (artifact `97e89b25b1edd8a9`, operation
  `mux030hl-e8032efd1883`, baseline `dist/deploy-baseline/mux030hl-e8032efd1883/`,
  166 files); the pre-upload audit (`robots.txt`/`sitemap.xml` reconciled to the
  current production bytes; 24 HTML + 108 RSC `.txt` payload changes; 10 new
  files; no unexpected non-HTML changes); and post-deploy checks (icon/manifest
  URLs + content types, `/branding/*` head links, in-page owl logo preserved,
  auth/account/admin 404). **No browser visual check** of the rendered tab icon
  (no browser in the session); the missing manifest `Content-Type` and the 404
  ErrorDocument behaviour were observed on production.
- `re-checked` (2026-10-06, T-020): implementation + frontend-only deployment of
  the hamburger navigation and reproducible sitemap (artifact
  `779cf9f32f90f277`, operation `mux3032z-9200a465dd4a`, baseline
  `dist/deploy-baseline/mux3032z-9200a465dd4a/`, 167 files; deployed
  22:38–22:42 EEST); plan/apply used the same artifact (no rebuild in between);
  `.htaccess`/`.well-known`/hashed assets preserved; excluded routes 404;
  production `robots.txt`/`sitemap.xml` byte-identical to the artifact with a
  **20-URL** sitemap (root excluded). **Headless-Chromium evidence**
  (`scripts/verify-navigation-runtime.mjs`) was run against the local static
  export at **360/390/768/1280 px in EN and LT** and against **production**:
  no horizontal overflow on the public pages, landmarks + skip link, single `h1`,
  image alt text, drawer open/close, focus entry/containment/return, Escape and
  backdrop dismissal, route selection, locale-route preservation, drawer touch
  targets ≥ 44 px, and the consent banner stacking/inert/restoration with the
  drawer open. See `docs/testing.md` for the exact checks.
- `re-checked` (2026-10-06, T-020 HTML-conformance follow-up): the corrected
  artifact **`7facf7e558173e17`** (operation `mux42oos-932ee20e6c2c`, baseline
  `dist/deploy-baseline/mux42oos-932ee20e6c2c/`, 167 files; 23:08–23:12 EEST) was
  applied without a rebuild; production `/404.html`, `/en/`, `/lt/`, an article
  page, `/robots.txt` and `/sitemap.xml` are **byte-identical** to the artifact;
  **Nu HTML Checker** on the built export and on the deployed EN/LT pages and
  `/404.html` = **0 errors / 0 warnings** (informational trailing-slash notices
  only). The deployed `/404.html` is a valid single document; unknown URLs may
  still be answered by Apache's own 404 (separate, unchanged).
- `checked-2026-09-27` (external): redirect, query-retention, sitemap/robots, and
  PageSpeed results above.
- `owner-reported`: hosting, provider, `skygym.lt`, Bacloud timing, Search Console
  DNS verification and sitemap attempts, GA4/GTM creation, public contact,
  operator, the `.htaccess` block, and the GTM import into SM-Workspace.
- `owner-confirmed` (2026-10-06): the owner tested the **T-019** synthetic
  assessment in the browser and confirmed the expected behaviour (the full
  start → answer → save → resume → submit → result → history journey). This is a
  general browser confirmation; **no** specific device, browser, or accessibility
  checks are asserted.
- `owner-confirmed` (2026-09-28): GTM container publication (version name
  "GA4 – consent-gated public site"; numerical version ID not supplied), the Tag
  Assistant consent states, the GA4 Enhanced Measurement change (only history-based
  page changes disabled), and the GA4 Realtime page/article views.
- Search Console: **no causal link has been established** between the previous
  20-versus-21 URL discrepancy and Search Console's sitemap ingestion failure;
  source/deployment consistency is resolved, but **Search Console ingestion
  remains unconfirmed**. Not claimed: successful Search Console sitemap
  ingestion/indexing; GA4 report-level verification beyond the owner's
  Realtime view; the cause of the Realtime trailing-slash duplicate; the GTM
  numerical version ID; or a specific deployed **commit** (the current deployed
  **artifact id** is `7facf7e558173e17`; the T-020 changes were deployed from the
  working tree and are **not yet committed**; T-014/T-018/T-019 statuses are
  recorded above).
