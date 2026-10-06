# T-018 — Favicon/manifest data (archived)

- **ID:** T-018
- **Type:** Frontend branding/metadata change (no new dependency)
- **Created:** 2026-10-06
- **Archive date:** 2026-10-06
- **Final status:** Approved (human review granted)
- **Approved:** 2026-10-06
- **Baseline:** T-017 archived at commit `932031a`; no active task before this one.

---

> T-018 replaced the interim owl **WebP** favicon in browser/device metadata with
> the owner-supplied PNG/ICO icon set plus `site.webmanifest`. The in-page owl
> **logos** are preserved. Owner-authorised; owner-resolved decisions: public URL
> prefix `/branding/` (not `/`), and the WebP favicon is no longer used as the
> browser icon (owner found it too thin/unreadable at 32×32).

## Accepted outcome

The owner accepted T-018 on 2026-10-06. All seven supplied files are served from
`/branding/`, declared in the generated `<head>` with `/branding/...` paths, and
the manifest is corrected. The WebP favicon metadata was removed; the WebP logos
and in-page marks are unchanged.

## Delivered scope

- **Head integration:** both root layouts now declare the shared icon set via
  `apps/web/shared/branding/icon-metadata.ts` (`SITE_ICONS`/`SITE_MANIFEST`):
  `favicon.ico`, `icon` PNG 32×32, `icon` PNG 16×16, an additional 192×192 PNG
  `icon`, `apple-touch-icon` 180×180, and `manifest`. This covers the root
  locale-redirect page, EN/LT public pages, authenticated app pages, and the 404
  page (`app/not-found.tsx` declares the same links explicitly — it sits outside
  both route groups, so metadata does not reach it; React hoists them into the
  real `<head>`).
- **Old metadata removed:** no root layout or generated page declares
  `sapiens-metric-logo-favicon.webp` any more.
- **Manifest corrected** (`site.webmanifest`): `name`/`short_name`
  "SapiensMetric"; icon `src` = `/branding/android-chrome-192x192.png` and
  `/branding/android-chrome-512x512.png`; `start_url: "/"`; `scope: "/"`. Sizes,
  types, white theme/background, and `display: standalone` preserved. No service
  worker/offline/install prompt added.
- **Checks updated:** `scripts/verify.sh` (assets exist + layouts declare the
  shared icon set + manifest content), `scripts/verify-static-export.sh`
  (seven files in the export; head links with `/branding/...` on the root, EN/LT
  public + account pages and the 404; manifest icons resolve; no page declares the
  old WebP favicon), `scripts/verify-public-release.sh` and
  `scripts/build-public-release.sh` (seven files + head links in the public
  release).
- **Docs:** D-021 inline T-018 note; `docs/architecture.md`, `docs/testing.md`,
  `README.md` distinguish in-page WebP logos from browser/device icons.

## Files

- Supplied (kept as-is, bytes/filenames unchanged): `favicon.ico`,
  `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`,
  `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`
  under `apps/web/public/branding/`.
- Code/metadata: `apps/web/shared/branding/branding.ts`,
  `apps/web/shared/branding/icon-metadata.ts` (new),
  `apps/web/app/[locale]/layout.tsx`, `apps/web/app/(root)/layout.tsx`,
  `apps/web/app/not-found.tsx`.

## Verification evidence (actually collected)

- `pnpm verify` → **EXIT 0** (`verify.sh` 731/0; `verify-static-export.sh` 105/0).
- `pnpm build:public` → release assembled; `pnpm verify:public-release` → **90/0**.
- Local dev (`:3333`): `/branding/{favicon.ico,favicon-16x16.png,favicon-32x32.png,apple-touch-icon.png,android-chrome-192x192.png,android-chrome-512x512.png,site.webmanifest}`
  all **200** with correct content types; served `<head>` contains the manifest,
  ICO, 32×32, 16×16, 192×192 icon links and the apple-touch-icon.
- Static export asserts the links on the root, EN/LT public + account pages and
  **404**; manifest icon URLs resolve; **no page** still declares the old WebP
  favicon; the dark shell logo remains referenced.

**Not performed:** browser visual inspection of the rendered tab icon — no browser
was available in the session's tool catalog. This is a stated limitation, not
claimed evidence.

## Limitations / notes

- `next dev` (Next 16.3.4) auto-generates `apps/web/AGENTS.md` and
  `apps/web/CLAUDE.md` via `app-info-log.js` →
  `generate-agent-files.js`; they are generated noise, deliberately left
  untracked and **not** part of this task.
- No claim that search engines will refresh a cached icon immediately.
- No service worker/offline/PWA install prompt; no new dependency.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md`
3. `docs/decisions.md` (D-021)
4. `docs/architecture.md` (T-010 section, T-018 note)
5. `apps/web/shared/branding/branding.ts`
