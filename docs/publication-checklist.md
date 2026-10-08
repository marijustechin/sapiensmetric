# Publication checklist — SapiensMetric public site

Remaining human/owner actions and reconciled state. **Current-state entry point:
`docs/publication-status.md`.** Detailed instructions: `docs/release-hosting.md`,
`docs/deployment-webdav.md`, `docs/gtm/README.md`. Nothing here is invented.

## Content and legal
- [x] Public contact `info@sapiensmetric.eu` (owner-confirmed; `mailto` on
      Contact/Privacy + footer). Transactional sender stays
      `website@sapiensmetric.eu`.
- [x] Website operator **Marijus Šmiginas** (About + footer; name only).
- [ ] Operator legal/registration details (no registration number, address, or
      legal status asserted).
- [ ] Retention/consent specifics for the application account data (not part of
      the public release).
- [ ] Review the Privacy page against the actually deployed behaviour.

## Release artifact
- [x] Repeatable release build `pnpm build:public` → `dist/public-site/` (public
      pages/articles only; auth/account/admin/assessment excluded). Repeatable
      generation, not byte-identical independent builds — see
      `docs/deployment-webdav.md` "Reproducibility terminology".
- [x] Owner manually published the informational frontend (owner-reported; earlier
      revision).
- [x] **Deployed 2026-09-28 21:13–21:17 EEST** (18:13–18:17 UTC): artifact id
      `64c4941cba87d08c` (159 files; 4 create / 155 overwrite), operation
      `mulkgfk6-0768754a1976`, destination `https://sapiensmetric.eu:2078/`,
      baseline `dist/deploy-baseline/mulkgfk6-0768754a1976/`. (Supersedes the
      20:28–20:34 EEST deployment of `fcbbf30a7645982a` / `muliubrg-822e9fdae477`,
      which contained the pre-fix consent shape.)
- [x] T-014 approved, archived, committed, and pushed (2026-09-28). A deployed
      **artifact id** is a content identity, **not** a commit hash.
- [x] **Deployed 2026-10-06 21:16–21:21 EEST** (18:16–18:21 UTC): artifact id
      `97e89b25b1edd8a9` (166 files; 10 create / 156 overwrite), operation
      `mux030hl-e8032efd1883`, destination `https://sapiensmetric.eu:2078/`,
      baseline `dist/deploy-baseline/mux030hl-e8032efd1883/` — the T-018
      favicon/manifest update (`robots.txt`/`sitemap.xml` reconciled to the
      current production bytes). (Supersedes `64c4941cba87d08c` /
      `mulkgfk6-0768754a1976`.)

## Hosting and transport
- [x] Provider confirmed: **vHost**, cPanel, Apache, no SSH (owner-reported).
- [x] HTTPS + canonical non-www redirects verified 2026-09-27 (HTTP apex/HTTP www/
      HTTPS www → 301; HTTPS apex → 200); `.htaccess` block preserved
      (see `docs/release-hosting.md`).
- [x] `sitemap.xml` served 200 `application/xml`; `robots.txt` allows crawling and
      references it (checked 2026-09-27: 20 URLs).
- [x] **`robots.txt` resolved at the source (2026-10-06):** `apps/web/app/robots.ts`
      no longer emits `Host` (Google does not support it) and a normal
      `pnpm build:public` reproduces the intended file; production already omits
      `Host`, so no production copy is needed.
- [x] **Sitemap apex-root discrepancy RESOLVED (2026-10-06, owner policy):** the
      repository generator is authoritative and lists the **20** public EN/LT URLs
      (locale homes + pages + articles), **excluding the root redirect** and
      auth/account/admin/assessment. The T-020 deployment intentionally replaced
      the previous 21-URL production sitemap with the generated 20-URL version;
      production `sitemap.xml` is byte-identical to the artifact. No production
      copy is used.
- [x] Favicon/icon set + web manifest deployed 2026-10-06 (artifact
      `97e89b25b1edd8a9`, operation `mux030hl-e8032efd1883`); `/branding/*` icon
      URLs and `<head>` links verified; in-page owl logo preserved.
- [x] **T-020 navigation/markup + reproducible sitemap deployed 2026-10-06**
      (artifact `779cf9f32f90f277`, operation `mux3032z-9200a465dd4a`); drawer nav
      + responsive/markup change; `/robots.txt` and `/sitemap.xml` byte-identical
      to the artifact; excluded routes 404. Headless-Chromium checks at
      360/390/768/1280 px EN+LT (local build) and on production
      (`scripts/verify-navigation-runtime.mjs`).
- [x] **T-020 HTML-conformance fixes deployed 2026-10-06** (artifact
      `7facf7e558173e17`, operation `mux42oos-932ee20e6c2c`, baseline
      `dist/deploy-baseline/mux42oos-932ee20e6c2c/`); production `/404.html`,
      `/en/`, `/lt/`, an article page, `/robots.txt` and `/sitemap.xml`
      byte-identical to the artifact. **Not committed/pushed/archived** —
      READY_FOR_HUMAN_REVIEW.
- [x] **HTML conformance (Nu HTML Checker)** — root redirect, both locale
      homepages, articles index, article/content pages and the global 404, on the
      built export **and on the deployed EN/LT pages and `/404.html`**:
      **0 errors / 0 warnings** (`scripts/verify-html-conformance.mjs`); only the
      React informational "trailing slash on void elements" notices remain
      (recorded, not post-processed). The deployed `/404.html` document is valid;
      unknown URLs may still be served by Apache's own 404 (separate, unchanged).
- [ ] **Manifest MIME mapping (owner/hosting):** `/branding/site.webmanifest` is
      served 200 with **no `Content-Type`**; mapping `.webmanifest` to
      `application/manifest+json` is required (cPanel MIME Types or owner-managed
      `.htaccess`).
- [ ] **Custom 404 handling (hosting):** unknown paths return Apache's 404 (the
      ErrorDocument attempt also 404s); the generated `/404.html` is deployed.
- [ ] `public_html` is shared with the legacy main domain `skygym.lt` (owner no
      longer owns it; provider cannot change the main domain) — owner-reported.
- [ ] **Hosting migration plan (owner-confirmed 2026-10-06):** current frontend
      **vHost** hosting is **temporary**; the frontend is planned to move to
      **Bacloud** in **~3 months (tentative)**. Bacloud has **no Node.js runtime**;
      the **backend** will use a **separate Node.js-capable provider, not yet
      selected**. Planned API origin stays **https://api.sapiensmetric.eu**; API
      deployment is **pending** and not authorised by the current work.
      Cache/purge step unknown.
- [ ] Manifest `Content-Type` and custom-404 ErrorDocument remain **separate
      tracked follow-ups** (see below / `docs/publication-status.md`).

## SEO / Search Console
- [x] Canonicals, hreflang, `noindex` on non-public routes, sitemap/robots
      implemented and verified in the export and (per external checks) live.
- [ ] Search Console Domain property DNS-verified (owner-reported); sitemap
      submission still returned **"Could not read sitemap"** with **zero
      discovered pages** — ingestion/indexing **NOT confirmed**; recheck / use
      live URL inspection.

## Analytics and consent (T-014 extension; D-027)
Repository readiness (implemented; **activated 2026-09-28**):
- [x] Basic Consent Mode: GTM `GTM-WRBRTKRT` loaded only after explicit consent;
      no pre-consent requests or `<noscript>` iframe.
- [x] GA4 `G-0CR4C3KPH3` through the single GTM container (no separate gtag.js).
- [x] Accessible EN/LT consent UI + footer "Cookie settings"; versioned
      preference (180-day expiry, safe storage); advertising consent denied.
- [x] Eligible public routes only; one sanitized `page_view` per page; no
      collection on root redirect/auth/account/admin; local/preview sends nothing.
- [x] Consent commands use the gtag **Arguments** shape GTM processes (plain
      Arrays are silently ignored); default denies all four signals, update grants
      `analytics_storage` only, advertising stays denied. Regression:
      `analytics.test.ts` + `pnpm verify:consent-runtime` (real runtime,
      `ics.usedDefault`). Verified 2026-09-28.

Owner actions:
- [x] Import the corrected GTM container into **SM-Workspace** and review both tags
      (owner-confirmed, 2026-09-28).
- [x] **Redeployed the frontend** with the Consent Mode command-format fix
      (2026-09-28; artifact `64c4941cba87d08c`, operation `mulkgfk6-0768754a1976`).
      Production browser check: fresh/Reject → no Google requests; Accept +
      restored consent → recognised defaults, `analytics_storage` granted,
      advertising denied. No GTM container change required.
- [x] **Owner Tag Assistant consent confirmation** (2026-09-28): at
      `spa_page_view`, all four defaults denied, then `analytics_storage` granted
      while `ad_storage`/`ad_user_data`/`ad_personalization` stayed denied.
- [x] **Published the GTM container** (2026-09-28), version name
      "GA4 – consent-gated public site" (numerical version ID not supplied).
- [x] **GA4 Realtime collection** owner-confirmed after publication (incognito,
      outside Preview): EN/LT page and article views received.
- [x] **GA4 Enhanced Measurement**: owner disabled and saved **"Page changes based
      on browser history events"**. Other Enhanced Measurement options **remained
      enabled** — do not document all Enhanced Measurement as disabled.
- [x] **Controlled production collection check** (2026-09-28): exactly one
      `page_view` per accept → Articles → article → locale → reload;
      `tid=G-0CR4C3KPH3`; consistent slash-less `page_location`/`page_path`; no
      query string or fragment.
- [ ] **GA4 settings review** (pending): decide the remaining Enhanced Measurement
      options and Google Signals / advertising-personalisation settings.
- [ ] **Realtime trailing-slash duplicate** (pending, cause not established):
      `/en/assessment-guide` and `/en/assessment-guide/` both appeared; the current
      controlled check did **not** reproduce it — do not infer duplication from
      aggregate counts.
- [ ] **GA4 report-level verification** beyond the owner's Realtime view (pending).

## WebDAV deployment automation
- [x] Endpoint `https://sapiensmetric.eu:2078/`, account `webdav@sapiensmetric.eu`,
      scope `public_html` (owner-reported).
- [x] Credentials migrated to the git-ignored `.env.deploy.local`; standard
      `pnpm deploy:check` works (2026-09-27).
- [x] Connectivity + mapping verified 2026-09-27 (TLS on, auth OK, chrooted to
      `public_html`; base = URL root; `sitemap.xml` confirmed via WebDAV + site).
- [x] Read-only `pnpm deploy:plan` completed: content-based artifact id
      `e01bae832f1abcf5`, 159 files (8 create / 151 overwrite),
      `.htaccess`/`.well-known` preserved; `plan` created no baseline.
- [x] Corrected identity/rollback model: artifact identity (sorted paths +
      content hashes) is separate from **operation identity** (fresh id per
      deployment, own baseline at `dist/deploy-baseline/<operationId>/` with
      `manifest.json` + `files/`); retries resume with `--operation <id>` and
      verify contents + destination; backups/manifest persisted atomically before
      overwrite; restore via `pnpm deploy:rollback -- --operation <id> --confirm`;
      created paths retained.
- [x] Focused tests `pnpm test:deploy` (6): same-size content change changes
      artifact identity; retry preserves the original baseline; a new deployment
      of the same artifact gets a new operation/baseline; resume verification.
- [x] **Production deployment performed 2026-09-28** (owner-authorised): operation
      `muliubrg-822e9fdae477`; `.htaccess`, `.well-known/**`, unrelated remote files,
      and previous hashed assets preserved (no mirror/delete). Post-deploy
      `pnpm deploy:verify` all ok.
- [x] Rollback available (restores the operation baseline):
      `pnpm deploy:rollback -- --operation muliubrg-822e9fdae477 --confirm`.
- [x] **Corrective production deployment 2026-09-28 21:13–21:17 EEST**
      (consent-command fix; owner-authorised): new operation
      `mulkgfk6-0768754a1976`, artifact `64c4941cba87d08c`, new baseline
      `dist/deploy-baseline/mulkgfk6-0768754a1976/`; remote content matched the
      artifact **159/159**. Rollback:
      `pnpm deploy:rollback -- --operation mulkgfk6-0768754a1976 --confirm`.
- [x] Tooling gap fixed during deploy: missing parent WebDAV collections are now
      created idempotently on HTTP `409` (cPanel rejected `PUT` into a new
      directory); the same operation was resumed to completion.
- [ ] Optional future: GitHub Actions deployment (not started).
