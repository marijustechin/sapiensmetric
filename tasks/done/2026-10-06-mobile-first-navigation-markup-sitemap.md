# T-020 — Mobile-first navigation, markup review, and reproducible public sitemap (archived)

- **ID:** T-020
- **Type:** Frontend navigation/markup change + release reproducibility (no new
  dependency, no UI-framework migration).
- **Created:** 2026-10-06
- **Archive date:** 2026-10-09
- **Final status:** Approved (human review granted)
- **Approved:** 2026-10-09
- **Baseline:** T-019 archived; source HEAD `0af704e`; reviewed as an uncommitted
  working tree and frontend-deployed from that tree.

---

> T-020 replaced the public horizontal navigation with an accessible
> hamburger/drawer menu (all widths), performed a focused mobile/markup review of
> the public shell/pages, made the public sitemap reproducible from repository
> content (resolving the T-018 source/deployment discrepancy), and fixed two
> HTML-conformance defects. A follow-up repository audit (2026-10-09) performed
> bounded reconciliation corrections within the same task.

## Accepted scope

- **Drawer navigation:** generic, auth-free `shared/ui/drawer.tsx` (portal, focus
  enter/return, Tab containment, Escape/backdrop dismissal, `inert` background +
  scroll lock, reduced-motion transitions). `widgets/site-header` rewritten:
  logo → current locale home, visible language switch preserving the equivalent
  route, accessible menu button (`aria-expanded`/`aria-controls`), right-side
  drawer (near-full width on narrow, `max-w-sm` on desktop), close button,
  current-page `aria-current`, translated nav, ~44 px touch targets. Public
  destinations only; the authenticated app keeps its role-aware nav.
- **Mobile/markup review:** skip link to `#main-content`, `#site-root` inert
  target, translated `nav`/`footer` landmark labels, single `h1` per page, image
  `alt` handling (header mark decorative beside its wordmark), long-LT wrapping,
  consent-banner buttons ≥ 44 px and stacked below the drawer.
- **Reproducible sitemap:** `shared/content/sitemap.ts` (pure, content-derived)
  drives `app/sitemap.ts` — the **20** public EN/LT URLs (`/en/`, `/lt/`, five
  pages per locale, articles index + three articles), **root redirect excluded**,
  nonpublic routes excluded, reciprocal alternates, canonical HTTPS non-www,
  trailing slashes, truthful `lastmod`. The repository generator is authoritative;
  production is no longer seeded from a copied file.
- **HTML-conformance fixes:** removed the redundant consent `<section>`
  `role="region"`; replaced `app/not-found.tsx` with `app/global-not-found.tsx`
  (`experimental.globalNotFound`) so the 404 is one valid document.

## Repository audit corrections (2026-10-09, within T-020)

Full record: `docs/audit-2026-10-09.md`. Corrections included:
- duplicate answer `itemId`s rejected with `400 INVALID_ANSWERS`
  (`packages/contracts/src/assessment.ts` refine; contract + HTTP/controller
  regression specs);
- documentation reconciliation (README/TODO/current and architecture/testing/
  release/publication/authentication/local-development/fsd-light);
- harness tightening: public-release build + freshness/completeness verification
  inside `pnpm verify`; `deploy:verify` assessment exclusion + reserved-path guard;
  full auth `noindex` coverage; answer-key isolation grep over all `apps/web`;
  HTML-conformance script no longer shrinks its page set;
- reproducibility terminology clarified (repeatable release generation vs
  byte-identical independent builds).

## Verification evidence

- `pnpm verify` → **EXIT 0** (lint, typecheck, tests, FSD, build,
  `verify-static-export.sh` 125/0, `verify-public-release.sh` 98/0,
  `verify.sh` 823/0).
- Contracts tests 18/18; API unit suite 140/140.
- **Headless Chromium** (`scripts/verify-navigation-runtime.mjs`) at
  360/390/768/1280 px in EN+LT (local export and production): no horizontal
  overflow, landmarks + skip link, drawer open/focus/containment/return, Escape +
  backdrop, route selection, locale-route preservation, ≥44 px targets, public-only
  nav; production consent stacking/inert/restore.
- **Nu HTML Checker** (`scripts/verify-html-conformance.mjs`): built export and
  deployed EN/LT pages + `/404.html` = 0 errors / 0 warnings (only React
  informational trailing-slash notices, deliberately not post-processed).
- Harness self-demonstrations (isolated, reversible): dangling doc reference
  rejected; stale/changed/missing/extra release files rejected by the freshness
  check; `.htaccess` in the export rejected by the release builder.

## Deployment record (frontend-only; owner-authorised)

Production is **ahead of source**: the T-020 changes were deployed from the
uncommitted working tree. Do **not** relabel the deployed artifact as built from
this finalisation commit.

- **Current artifact `7facf7e558173e17`** (167 files), operation
  **`mux42oos-932ee20e6c2c`**, deployed **2026-10-06 23:08–23:12 EEST**, baseline
  `dist/deploy-baseline/mux42oos-932ee20e6c2c/` (160 backups). Rollback:
  `pnpm deploy:rollback -- --operation mux42oos-932ee20e6c2c --confirm`.
- Superseded: `779cf9f32f90f277` / `mux3032z-9200a465dd4a`;
  `97e89b25b1edd8a9` / `mux030hl-e8032efd1883`.
- Two distinct 404 facts: the deployed `/404.html` document is valid; unknown URLs
  may still be answered by Apache's own 404 (custom ErrorDocument unresolved,
  unchanged).

## Limitations / follow-ups

- Browser evidence is headless-Chromium; no hand-held device testing.
- Search Console ingestion remains **unconfirmed**; no causal link established
  between the former 20-vs-21 sitemap discrepancy and the ingestion failure.
- External follow-ups preserved: manifest `Content-Type`, custom-404
  ErrorDocument, GA4 settings/report review, API deployment, hosting migration
  plan (vHost temporary → Bacloud ~3 months, tentative; separate Node.js backend
  provider not yet selected).

## Reading order

1. `AGENTS.md`
2. `tasks/current.md`
3. `docs/architecture.md` (T-020 section)
4. `docs/testing.md` (T-020 checks)
5. `docs/audit-2026-10-09.md`
6. `docs/publication-status.md`, `docs/release-hosting.md`, `docs/deployment-webdav.md`
