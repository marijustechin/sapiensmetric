# T-009 — next-intl bilingual frontend refactor (LT/EN UI) (active)

- **ID:** T-009
- **Type:** Implementation (web frontend i18n refactor; one authorised dependency)
- **Created:** 2026-09-21
- **Status:** Active (in progress). Not yet reviewed or archived.

---

> T-009 is authorised by the explicit human task request. It replaces the
> hand-duplicated LT/EN page structure with `next-intl`, shared locale-aware
> routes/components, and checked-in message catalogues. It adds **one**
> dependency (`next-intl`), which is explicitly authorised by this task. No
> other dependency may be added. Do not archive T-009 or start another task
> until a human has reviewed and approved it.

## Objective

Consolidate the duplicated Lithuanian/English authentication frontend into a
single locale-aware implementation per route, using `next-intl` for UI
translation and checked-in message catalogues, while preserving the exact
existing route matrix, the static-export build, all auth/OAuth security
behaviour, and the current functional (non-redesigned) styling.

This is a **UI translation/consolidation** task only. Assessment content,
questions, explanations, scoring, API/database content localisation, and the
Russian language are explicitly out of scope.

## Product decision (binding)

- Supported UI locales are exactly `lt` and `en`.
- Explicit locale-prefixed URLs are preserved: `/lt/...` and `/en/...`.
- `/` remains the existing static language chooser.
- No runtime browser-language detection.
- No server middleware/proxy (in Next.js 16 the file is `proxy.ts`; it is not
  added). Static-export compatibility is mandatory.
- `next-intl` is the UI i18n layer. Future **assessment-item** translations
  belong in the API/database model, not in the UI message catalogues.

## Binding context and constraints

- Next.js App Router **static export** (`output: 'export'`) must be preserved.
- The only configured API base is `NEXT_PUBLIC_API_BASE_URL`; no localhost URL
  may be hardcoded.
- The access token is held **in memory only** (never storage/URL/logs/HTML).
- Refresh uses the existing **HttpOnly** refresh cookie
  (`credentials: 'include'`).
- Verification/reset action tokens are **fragment-only** (`#token=...`), read on
  explicit user action only; GET/prefetch must never consume a token.
- `returnTo` must be same-origin and safe; an arbitrary external URL must never
  be used as a redirect target.
- The language switcher must not use `document.cookie`.
- Google sign-in and its default LT/EN account destinations must be unchanged,
  and the Google button copy remains localised.
- No API change, no database change, no auth-behaviour change.
- No visual redesign. Design tokens, logo selection, favicon work, and
  responsive polish are separate future work.

## Exact route matrix (unchanged)

| Route (lt and en) | Purpose | Protection |
| --- | --- | --- |
| `/` | language chooser (static, bilingual by design) | public |
| `/lt`, `/en` | locale home with auth navigation | public |
| `/lt/auth/register`, `/en/auth/register` | registration form | public |
| `/lt/auth/login`, `/en/auth/login` | login form (`?returnTo=`) | public |
| `/lt/auth/verify-email`, `/en/auth/verify-email` | resend request + `#token=` confirm | public |
| `/lt/auth/forgot-password`, `/en/auth/forgot-password` | reset request | public |
| `/lt/auth/reset-password`, `/en/auth/reset-password` | `#token=` + new password | public |
| `/lt/account`, `/en/account` | authenticated account state + logout | **protected (client gate)** |

## Required implementation

1. Add the current compatible `next-intl` version through pnpm. This dependency
   is explicitly authorised (and is the only one added).
2. Static-export-compatible App Router configuration:
   - locale segment structure based on `app/[locale]/...`;
   - build-time generation for `lt` and `en` via `generateStaticParams`;
   - no middleware/proxy requirement;
   - the static build must emit all existing public routes and remain
     refresh-safe on Bacloud-style static hosting (each emitted directory
     contains its own `index.html`, so direct requests and refreshes resolve).
3. Move UI copy to structured message files `messages/lt.json` and
   `messages/en.json`.
4. Consolidate duplicated LT/EN auth/home/account pages and shared navigation
   into one implementation per route.
5. Preserve the exact existing route matrix and functionality (table above).
6. Keep all auth and OAuth security behaviour unchanged:
   - fragment-only verification/reset tokens;
   - safe same-origin `returnTo`;
   - access token memory-only;
   - refresh-cookie/session bootstrap;
   - Google sign-in and its default LT/EN account destinations.
7. The language switcher must take the user to the equivalent available route
   in the other locale, preserving safe `returnTo` where applicable. It must
   not use `document.cookie`.
8. Ensure locale-appropriate document language (`<html lang>`) and basic
   localized title/metadata where the static App Router structure permits.
9. No visual redesign; preserve current functional styling.

## Strict asset rule

Do not modify, stage, rename, delete, convert, or reference anything under
`apps/web/public/`. The two untracked branding PNGs remain untouched and
excluded from this task and any future commit unless Marijus explicitly
approves them.

## Required outputs

- `apps/web/i18n/routing.ts`, `apps/web/i18n/request.ts`,
  `apps/web/i18n/navigation.ts` — next-intl routing, request config, and
  navigation wrappers.
- `apps/web/messages/lt.json`, `apps/web/messages/en.json` — structured UI
  catalogues.
- `apps/web/app/[locale]/...` — one implementation per locale route, with a
  root locale layout (document `lang`, provider, shared navigation).
- Refactored `apps/web/app/_components/*` — copy resolved through `next-intl`
  instead of inline LT/EN `COPY` maps, including the language switcher.
- `apps/web/lib/locale-navigation.ts` + `locale-navigation.test.ts` — pure,
  dependency-free same-route switching and `returnTo` locale remapping.
- `apps/web/lib/messages.test.ts` — locale validation and critical message-key
  completeness for both catalogues.
- Updated `apps/web/next.config.mjs` (next-intl plugin) and `package.json`.
- Updated docs (`docs/architecture.md`, `docs/testing.md`, `docs/decisions.md`)
  and harness (`scripts/verify.sh`), and this task record.
- No commit, push, deploy, or archival.

## Tests and verification

- Focused tests for locale validation, message loading/critical translation
  keys, localized navigation, same-route language switching, default account
  destinations, and `returnTo` preservation/rejection.
- Verify both locales in the static build and confirm the exact route matrix.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, integration
  tests where relevant, and `bash scripts/verify.sh`.
- Do **not** run SMTP smoke, live OAuth, deployment, migration beyond what is
  already applied, or contact external services.

## Non-goals

- Translation of assessment items, questions, explanations, scoring, or any
  API/database content.
- Adding Russian (or any locale other than `lt`/`en`).
- Runtime browser-language detection or a server middleware/proxy.
- Any visual redesign, design tokens, logo/favicon work, or responsive polish.
- Any change to auth/OAuth API behaviour, database schema, or configuration.
- Committing the untracked `apps/web/public/branding` assets.

## Acceptance criteria

- The exact route matrix above exists and builds as static export for both
  locales; `/` remains the static chooser.
- All UI copy for the auth/home/account/navigation surface lives in
  `messages/lt.json` and `messages/en.json`; both catalogues expose the same
  critical keys with non-empty translations.
- LT/EN duplication for auth/home/account is consolidated to one implementation
  per route under `app/[locale]/...`; shared navigation is singular.
- The language switcher navigates to the equivalent route in the other locale,
  preserves a safe same-origin `returnTo` (remapped to the target locale), and
  never uses `document.cookie`.
- `<html lang>` matches the active locale; localized title/metadata are present
  where the static structure permits.
- Access token remains memory-only; refresh cookie/`credentials: 'include'`
  unchanged; fragment-only tokens; safe same-origin `returnTo`; Google default
  LT/EN destinations unchanged.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and
  `bash scripts/verify.sh` pass; no SMTP smoke, live OAuth, deployment, or
  external call is performed.
- No commit, push, deploy, or archival.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md` (this file)
3. `docs/architecture.md`
4. `docs/testing.md`
5. `docs/authentication.md`
6. `docs/decisions.md`
7. `tasks/done/2026-09-21-classical-authentication-frontend.md`
