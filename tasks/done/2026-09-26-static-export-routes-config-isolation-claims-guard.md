# T-010 — Static-export directory routes, config/test isolation, and claims guard (archived)

- **ID:** T-010
- **Archive date:** 2026-09-26
- **Final status:** Approved (human review granted)
- **Type:** Corrective implementation (web static export + local config + tests + docs; no auth/API/DB change)
- **Created:** 2026-09-26
- **Approved:** 2026-09-26

---

> T-010 was accepted by human review on 2026-09-26, including manual browser
> verification: root `/` remembers the selected `lt`/`en` locale and defaults to
> `/en/` in a clean browser; the centred loading state is acceptable;
> credentials registration, verification, login/logout, password reset, and SMTP
> delivery work; the web dev server starts on port 3333 with the ordinary
> package `dev` command; and the approved WebP branding assets are accepted. It
> is archived; its scope is preserved below.

## Objective

Remove the deficiencies found by an independent audit and leave a truthful,
self-consistent project picture, without changing any protected behaviour.

## Scope

### A. Static-export route correction (release blocker)

1. `apps/web/next.config.mjs` enables `trailingSlash: true`, so every public
   route is exported as `<route>/index.html` and resolves on plain shared static
   hosting with no Next server, middleware, proxy, or rewrite rules.
2. `scripts/verify-static-export.sh` (dependency-free) checks the built
   `apps/web/out`: expected routes have a non-empty `<route>/index.html`,
   localized pages declare the matching `<html lang>`, and the previous flat
   deep-route `.html` format has not returned. It is wired into `pnpm verify`
   (and available as `pnpm verify:static-export`).

### B. Configuration and test isolation

3. One documented local profile: web `http://localhost:3333`, API
   `http://localhost:3334` (`API_PORT`), MySQL `127.0.0.1:3307`. The web package
   `dev` script pins the port (`next dev -p 3333`), so
   `pnpm --filter @sapiensmetric/web dev` needs no manual CLI argument.
   `.env.example` and `docs/local-development.md` agree; `CORS_ORIGIN` =
   `PUBLIC_APP_URL` = web origin; `NEXT_PUBLIC_API_BASE_URL` = API origin; the
   Google redirect URI uses the API port (`3334`).
4. The web fallback locale (`DEFAULT_LOCALE`) is aligned to `en`, matching the
   API authentication default and the Google start default, with a test.
5. `loadAppConfig()` reads the root `.env` only when called without an explicit
   environment object; a supplied `env` does not read `.env` or mutate
   `process.env`, with tests.

### C. Claims guard

6. A proportional automated guard, `apps/web/lib/claims-guard.test.ts`, covers
   public user-facing UI text (`apps/web/messages/*.json`) and enforces the
   boundaries of `docs/claims-ladder.md` (IQ, percentile/norm comparison,
   predictive framing, construct-measurement, diagnostic, hiring, and validation
   claims), with a self-check.
7. The guard does not scan documentation, task records, or tests. Future
   report/result templates must be registered in the guard's source list.

### D. Continuity documentation

8. Outdated "no active task" comments in `scripts/verify.sh` and
   `docs/testing.md` were corrected.
9. `README.md`, `TODO.md`, `docs/architecture.md`, `docs/testing.md`,
   `docs/decisions.md`, and the task record describe what is really done, the
   directory-style `index.html` static-export contract, the true T-009
   commit/push state, that the assessment core is not started and why (blocked
   on O-002/O-003/O-006/O-007), and the next strategic step.

### E. Approved branding assets (amendment)

10. Marijus explicitly approved the four supplied WebP assets, superseding the
    T-009 "do not reference `apps/web/public/`" restriction **for these assets
    only**. They are used exactly as supplied (no conversion, recolouring,
    renaming, or recreation) and referenced from the stable public paths
    `/branding/sapiens-metric-logo-{dark,light,middle,favicon}.webp`.
11. The stable paths are centralised in `apps/web/lib/branding.ts`; the light
    shell uses the `dark` variant via `apps/web/app/_components/brand-mark.tsx`,
    and the supplied favicon is registered as the web app icon in both root
    layouts. `light`/`middle` remain reserved for non-light backgrounds.
12. D-021 records the stable asset interface and variant policy.

### F. Root route redirect (amendment)

13. The root route `/` no longer presents the interactive bilingual chooser. It
    redirects to the user's remembered local language preference, or to the
    default locale `/en/` when there is none (D-022), superseding the `/`
    handling in D-019/D-020.
14. The preference is stored in **localStorage only** (`sapiensmetric.locale`)
    and persisted whenever a locale-prefixed page is entered (a direct visit to
    `/lt/` counts as selecting Lithuanian). `/` reads it and uses
    `window.location.replace`. No cookies, server state, SSR, middleware, proxy,
    or tracking. A zero-delay meta refresh is deliberately **not** used, because
    it would always win with `/en/` and defeat a remembered `lt` preference.
15. `/` renders a full-page, centred, unobtrusive spinner with an accessible
    loading status and no chooser/placeholder copy; with JavaScript disabled a
    documented English fallback link to `/en/` remains.
16. The `(chooser)` route group is renamed `(root)`; the `Chooser` message
    namespace is removed from both catalogues; `apps/web/lib/locale-preference.ts`
    holds the storage key/targets/resolution and
    `apps/web/lib/locale-preference.test.ts` covers it; the locale layout renders
    `LocalePreferenceSync`.

## Binding constraints

- Next.js App Router `output: 'export'`; production is plain shared static
  hosting with no server-side rewrite guarantee.
- No auth/API-contract/database/migration/SMTP/Google-OAuth change.
- The approved branding WebP assets are used exactly as supplied; their
  filenames and paths are stable.
- pnpm only. No new dependency.

## Required outputs

- `apps/web/next.config.mjs` (`trailingSlash: true`).
- `scripts/verify-static-export.sh` and the `package.json` `verify` chain.
- `.env.example`, `docs/local-development.md` (unified local profile).
- `apps/web/lib/locale-navigation.ts` + test (aligned default locale).
- `apps/api/src/config/env.ts` + `env.spec.ts` (env-file isolation).
- `apps/web/lib/claims-guard.test.ts` (claims guard).
- `apps/web/lib/branding.ts` + `apps/web/app/_components/brand-mark.tsx` and the
  root-layout favicon registration.
- `apps/web/app/(root)/{layout,page}.tsx` +
  `apps/web/app/_components/locale-preference-sync.tsx` +
  `apps/web/lib/locale-preference.ts` and test.
- `docs/decisions.md` (D-020, D-021, D-022), `docs/testing.md`,
  `docs/architecture.md`, `README.md`, `TODO.md`, `scripts/verify.sh`.
- The four approved branding WebP files under `apps/web/public/branding/`.

## Tests and verification

- `bash scripts/verify.sh`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `bash scripts/verify-static-export.sh`
- A local static HTTP smoke test loading deep routes with a trailing slash.
- No network, live SMTP, live Google OAuth, migration, or deployment.

## Non-goals

- Any change to authentication or OAuth behaviour, API contracts, the database,
  migrations, SMTP, or hosting/deployment.
- Any assessment item, scoring, norming, or claim work (still blocked).
- Any conversion, recolouring, renaming, or recreation of the approved branding
  assets, or any change to their stable filenames/paths.

## Acceptance criteria

- Every expected public route exists as `<route>/index.html`; the flat
  deep-route `.html` format is absent.
- Localized pages declare the matching `<html lang>`.
- `.env.example`, `docs/local-development.md`, CORS, and the web/API defaults
  describe one profile; `DEFAULT_LOCALE` is aligned and tested; env-file
  isolation is fixed and tested.
- The claims guard runs with the web tests and passes on both catalogues.
- The root route is a remembered-language redirect with an accessible centred
  loading state and no chooser.
- The approved branding assets reach the export and the favicon is registered.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
  `bash scripts/verify-static-export.sh`, and `bash scripts/verify.sh` pass.

---

## Approved-outcome summary

T-010 corrected the audit findings and was approved on 2026-09-26 after manual
browser verification. It made the static export directory-style
(`trailingSlash: true`, enforced by `scripts/verify-static-export.sh`), unified
the local profile to web `3333` / API `3334` / MySQL `3307`, isolated `.env`
handling for tests, added the public-UI claims guard, wired the four approved
WebP branding assets from their stable `/branding/...` paths (D-021), and
replaced the `/` chooser with a localStorage-backed remembered-language redirect
with a centred loading state (D-022). No auth, API-contract, database, SMTP, or
OAuth behaviour was changed, and no dependency was added.
