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
| Release build | `pnpm build:public` → `dist/public-site/` (`implemented`; artifact present locally) |
| Public release scope | informational pages + articles only; auth/account/admin and the API are **excluded** (`implemented`) |
| **Deployed artifact (current)** | **artifact id `97e89b25b1edd8a9`** (166 files; 10 create / 156 overwrite), operation **`mux030hl-e8032efd1883`**, deployed **2026-10-06 21:16–21:21 EEST** (18:16–18:21 UTC) (`re-checked`) — the favicon/manifest update |
| Deployment destination | **`https://sapiensmetric.eu:2078/`** (WebDAV URL root; account chrooted to `public_html`; do not append `/public_html/`) (`re-checked`) |
| Deployment baseline (rollback source) | **`dist/deploy-baseline/mux030hl-e8032efd1883/`** (156 backups + `manifest.json`) (`re-checked`) |
| Rollback command | `pnpm deploy:rollback -- --operation mux030hl-e8032efd1883 --confirm` |
| Prior deployment (superseded) | artifact `64c4941cba87d08c`, operation `mulkgfk6-0768754a1976`, 2026-09-28 21:13–21:17 EEST (consent-command fix); earlier `fcbbf30a7645982a` / `muliubrg-822e9fdae477` |
| Source HEAD / repo-vs-deployed | source HEAD `f1d0e69`; deployed artifact id `97e89b25b1edd8a9` — **not** a commit hash |

## 2. Hosting (`owner-reported`)

- Provider: **vHost**, cPanel, Apache. No SSH access.
- `sapiensmetric.eu` uses **`public_html`**, shared with the account's legacy main
  domain **`skygym.lt`**; the owner no longer owns `skygym.lt` and the provider
  cannot currently change the account's main domain.
- A future **Bacloud** move is expected; timing and final configuration
  **unconfirmed**.
- Public contact **info@sapiensmetric.eu** confirmed working; operator
  **Marijus Šmiginas**; transactional sender remains **website@sapiensmetric.eu**.
- Future API origin **https://api.sapiensmetric.eu** — not deployed.

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

**Owner SEO changes preserved (`re-checked`, 2026-10-06):** production
`robots.txt` and `sitemap.xml` differ from the repository build — `robots.txt` no
longer contains a `Host:` line, and `sitemap.xml` contains **21** URLs (now
including `https://sapiensmetric.eu/`). These are owner/hosting changes and were
**not** reverted: the T-018 favicon deployment used the **current production
bytes** for both files (hashes matched production before and after the upload).
The repository build still generates the earlier 20-URL sitemap; reconciling the
generator with the owner's SEO policy is an **open follow-up** (the observation is
not an instruction to change SEO policy).

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
| Consent-gated frontend deployed | **`deployed`** 2026-09-28 (current artifact `64c4941cba87d08c`, operation `mulkgfk6-0768754a1976`) |
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
   release's baseline is `dist/deploy-baseline/mux030hl-e8032efd1883/`.
5. **Manifest MIME mapping (owner/hosting, `pending`):** production serves
   `/branding/site.webmanifest` **200 but with no `Content-Type` header** (Apache
   has no `.webmanifest` mapping), which risks browsers rejecting the manifest.
   Fix requires a hosting MIME mapping to `application/manifest+json` for
   `.webmanifest` (cPanel MIME Types or an owner-managed `.htaccess` `AddType`);
   the `.htaccess` is owner-managed and preserved by the tooling.
6. **Custom 404 handling (hosting observation, `pending`):** unknown paths return
   Apache's own 404 page and the ErrorDocument attempt also 404s; the generated
   `/404.html` **is** deployed (200, with the icon links). This is pre-existing
   hosting configuration, not caused by T-018.
7. Optional future: GitHub Actions deployment (not started).

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
- `checked-2026-09-27` (external): redirect, query-retention, sitemap/robots, and
  PageSpeed results above.
- `owner-reported`: hosting, provider, `skygym.lt`, Bacloud timing, Search Console
  DNS verification and sitemap attempts, GA4/GTM creation, public contact,
  operator, the `.htaccess` block, and the GTM import into SM-Workspace.
- `owner-confirmed` (2026-09-28): GTM container publication (version name
  "GA4 – consent-gated public site"; numerical version ID not supplied), the Tag
  Assistant consent states, the GA4 Enhanced Measurement change (only history-based
  page changes disabled), and the GA4 Realtime page/article views.
- Not claimed: successful Search Console sitemap ingestion/indexing; GA4
  report-level verification beyond the owner's Realtime view; the cause of the
  Realtime trailing-slash duplicate; the GTM numerical version ID; or a specific
  deployed **commit** (the deployed **artifact id** is `64c4941cba87d08c`; T-014 is
  committed, archived, and pushed).
