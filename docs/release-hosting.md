# Release & hosting runbook — frontend-only public site (T-014)

How to build, upload, verify, and roll back the **public website only**. This
does not publish the API or change DNS/mail/hosting accounts.

> Current publication state: see `docs/publication-status.md`. WebDAV automation:
> `docs/deployment-webdav.md`. Analytics (consent-gated GTM → GA4):
> `docs/gtm/README.md`.

## Build the deployment directory

```bash
pnpm install
pnpm build:public          # builds the static export and assembles dist/public-site/
bash scripts/verify-public-release.sh
```

- **Artifact path:** `dist/public-site/`
- **Included:** `index.html` (root remembered-language entry), `404.html`,
  `robots.txt`, `sitemap.xml`, `_next/` (shared static bundle), `branding/`,
  and the public EN/LT pages: `/{en,lt}/` (home, assessment-guide,
  understanding-results, about, contact, privacy), `/{en,lt}/articles/` (index +
  three articles).
- **Excluded (deterministically, by route):** `/{en,lt}/auth/`,
  `/{en,lt}/account/`, `/{en,lt}/admin/`.
- **No secrets required:** the public build uses only the public API base value
  (unused at runtime by public pages); it does not require DB/SMTP/OAuth
  values, and public pages make no API requests.

## What belongs in the website document root

Upload the **contents of `dist/public-site/`** into the website document root
for `sapiensmetric.eu` (e.g. `public_html/`):

- `index.html`, `404.html`, `robots.txt`, `sitemap.xml`
- `_next/` and `branding/` (shared assets)
- `en/` and `lt/` (with no `auth`, `account`, or `admin` subdirectories)

> WebDAV automation for this upload is documented separately in
> `docs/deployment-webdav.md` (`pnpm deploy:check|plan|apply|verify`). The manual
> procedure below remains the fallback.

## Upload procedure (vHost; Bacloud migration announced)

1. **Backup** the current document root: download/archive it (e.g.
   `public_html-backup-YYYYMMDD.tar.gz`). Keep it until the release is verified.
2. **Upload** the contents of `dist/public-site/` over the document root,
   preserving directory structure (`en/`, `lt/`, `_next/`, `branding/`).
   Do not upload `dist/public-site/` as a nested folder — its contents go at the
   root.
3. **Remove** any previously uploaded application route directories if present:
   `en/auth`, `en/account`, `en/admin` (and the `lt` equivalents).
4. **Verify** (see below), then optionally purge any provider cache.

Hosting facts (`owner-reported`): current provider **vHost** (cPanel, Apache),
**no SSH**; `sapiensmetric.eu` uses **`public_html`**, which is shared with the
account's legacy main domain **`skygym.lt`** (no longer owned; the provider
cannot currently change the account's main domain). A **Bacloud** move is
expected but timing/configuration are unconfirmed. The provider has announced the
migration; do not assume a different control panel or server configuration.

Note: the manual upload procedure below is a fallback. WebDAV automation
(`docs/deployment-webdav.md`) performs the same release upload and **never
touches `.htaccess`, `.well-known/**`, or unrelated files**.

## Verification after upload

- `https://sapiensmetric.eu/` → remembered-language entry (redirects to the
  remembered or default locale, with the centred loading state).
- `https://sapiensmetric.eu/en/` and `/lt/` → public home; locale switch works.
- Deep-link refresh: `/en/articles/why-percentage-correct-is-not-a-percentile/`
  and `/lt/assessment-guide/` load directly (directory-style `index.html`).
- `https://sapiensmetric.eu/robots.txt` and `/sitemap.xml` are served and use
  `https://sapiensmetric.eu` URLs only.
- `https://sapiensmetric.eu/en/auth/login/` and `/en/admin/` must **not** serve
  application pages from this release (404/site error page is expected).
- HTTPS is enforced and redirects HTTP → HTTPS; the canonical hostname is
  consistent (`https://sapiensmetric.eu`, no `www`).
- 404: an unknown path returns the site's `404.html`.

## Rollback

Restore the backed-up document root archive over `public_html/` and re-check the
home page. Rollback is a file restore only; it does not touch DNS, mail, or the
API.

## Analytics (consent-controlled GTM → GA4)

- Analytics runs through GTM `GTM-WRBRTKRT` → GA4 `G-0CR4C3KPH3`, loaded **only
  after** the visitor accepts analytics (Basic Consent Mode; GTM itself is
  blocked until then). No GTM/GA4 `<script>`, preconnect, preload, or
  `<noscript>` iframe is present before consent.
- The container configuration is in `docs/gtm/` (importable JSON + setup). The
  owner imports, previews, and publishes it separately; preparing it does not
  activate collection.
- Deployment order: deploy the frontend first (consent gate), then publish the
  container; re-verify no pre-consent requests after publishing.
- Local acceptance (no production traffic): map the production hostname to your
  machine (`--host-resolver-rules="MAP sapiensmetric.eu 127.0.0.1"`) with the
  release served on a local port, and block `*googletagmanager.com*` /
  `*google-analytics.com*` in DevTools — the full procedure is in
  `docs/gtm/README.md`. The real container is validated only in GTM Preview.

## Preserve HTTPS and the non-www redirect

The production `.htaccess` contains this canonical/HTTPS redirect block
(`owner-reported`, externally confirmed 2026-09-27). **Preserve it exactly** —
neither the manual upload nor the WebDAV tooling may overwrite or delete it:

```apache
RewriteEngine On

RewriteCond %{HTTP_HOST} ^www\.sapiensmetric\.eu$ [NC]
RewriteRule ^ https://sapiensmetric.eu%{REQUEST_URI} [R=301,L]

RewriteCond %{HTTP_HOST} ^sapiensmetric\.eu$ [NC]
RewriteCond %{HTTPS} off
RewriteCond %{HTTP:X-Forwarded-SSL} !^on$ [NC]
RewriteRule ^ https://sapiensmetric.eu%{REQUEST_URI} [R=301,L]
```

After each upload, re-confirm: HTTP apex, HTTP `www`, and HTTPS `www` all **301**
to HTTPS apex; HTTPS apex is **200**; path+query are retained; deep-link
refreshes work.

## Search Console preparation (do NOT claim submission occurred)

Status (`owner-reported`): the Domain property for `sapiensmetric.eu` is
**DNS-verified**. The sitemap was submitted first with `www`, then without; the
latest screenshot still showed **"Could not read sitemap"** and **zero discovered
pages**. **Ingestion/indexing is NOT confirmed** — do not mark indexing
successful.

1. Domain property for `sapiensmetric.eu` — ownership already DNS-verified. Do
   not invent verification tokens.
2. Confirm `https://sapiensmetric.eu/sitemap.xml` (HTTPS, non-www) is submitted;
   if "Could not read sitemap" persists, use **live URL inspection** and recheck
   later.
3. Monitor Pages/Indexing reports; confirm auth/account/admin are absent from the
   sitemap and carry `noindex` if ever crawled.
4. Analytics is consent-gated GTM → GA4 (prepared in the repository; **not
   activated**) — see `docs/gtm/README.md`. Do not mark analytics active until the
   container is published and the frontend deployed.

## Explicitly out of scope

- No DNS, mail, or hosting-account changes; no API publication/activation.
- No hand-added `gtag.js`/GA4 scripts: analytics is consent-gated through GTM
  only (see `docs/gtm/README.md`).
- No changes to `SMTP_FROM` (`website@sapiensmetric.eu`).

## Missing hosting inputs

- Bacloud migration timing and final control-panel/document-root configuration.
- Whether a cache/purge step is needed after upload.
- HTTPS certificate management details (auto-renew?) — HTTPS is active.
- Server-side backups **outside** `public_html` (the WebDAV account is restricted
  to `public_html`; local backups are used otherwise).
