# T-009 — next-intl bilingual frontend refactor (LT/EN UI) (archived)

- **ID:** T-009
- **Archive date:** 2026-09-26
- **Final status:** Approved (human review granted)
- **Type:** Implementation (web frontend i18n refactor; one authorised dependency)
- **Created:** 2026-09-21
- **Approved:** 2026-09-26

---

> T-009 was accepted by human review on 2026-09-26. Its delivered frontend was
> exercised during the T-010 review (root behaviour, LT/EN journey, branding
> assets). The original task definition is preserved below; later supersessions
> by D-021/D-022 are noted inline.

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
  *(Superseded by D-022: `/` now redirects to the remembered/default locale;
  there is no interactive chooser.)*
- No runtime browser-language detection.
- No server middleware/proxy (in Next.js 16 the file is `proxy.ts`; it is not
  added). Static-export compatibility is mandatory.
- `next-intl` is the UI i18n layer. Future **assessment-item** translations
  belong in the API/database model, not in the UI message catalogues.

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

*(The `/` row is superseded by D-022: `/` is now a remembered-language redirect.)*

## Required implementation

1. Add the current compatible `next-intl` version through pnpm. This dependency
   is explicitly authorised (and is the only one added).
2. Static-export-compatible App Router configuration:
   - locale segment structure based on `app/[locale]/...`;
   - build-time generation for `lt` and `en` via `generateStaticParams`;
   - no middleware/proxy requirement;
   - the static build must emit all existing public routes and remain
     refresh-safe on Bacloud-style static hosting. (T-010 later made this
     literal by enabling `trailingSlash: true` and enforcing directory-style
     `index.html` routes.)
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
`apps/web/public/`. The untracked branding assets remain excluded unless Marijus
explicitly approves them.

*(Superseded by D-021: the four approved branding WebP assets are now referenced
from their stable `/branding/...` paths and committed as part of T-010. The rule
otherwise stands.)*

## Non-goals

- Translation of assessment items, questions, explanations, scoring, or any
  API/database content.
- Adding Russian (or any locale other than `lt`/`en`).
- Runtime browser-language detection or a server middleware/proxy.
- Any visual redesign, design tokens, logo/favicon work, or responsive polish.
- Any change to auth/OAuth API behaviour, database schema, or configuration.

## Acceptance criteria

- The exact route matrix above exists and builds as static export for both
  locales.
- All UI copy for the auth/home/account/navigation surface lives in
  `messages/lt.json` and `messages/en.json`; both catalogues expose the same
  critical keys with non-empty translations.
- LT/EN duplication for auth/home/account is consolidated to one implementation
  per route under `app/[locale]/...`; shared navigation is singular.
- The language switcher navigates to the equivalent route in the other locale,
  preserves a safe same-origin `returnTo`, and never uses `document.cookie`.
- `<html lang>` matches the active locale; localized title/metadata are present
  where the static structure permits.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and
  `bash scripts/verify.sh` pass; no SMTP smoke, live OAuth, deployment, or
  external call is performed.

---

## Approved-outcome summary

T-009 replaced the hand-duplicated LT/EN page structure with `next-intl`, shared
locale-aware routes/components, and checked-in message catalogues
(`apps/web/messages/lt.json`, `apps/web/messages/en.json`), preserving the
static-export build and all auth/OAuth behaviour. It added exactly one
dependency (`next-intl`). Delivered in commit `52fe481` and pushed to
`origin/main`.

T-010 subsequently made the static export directory-style
(`<route>/index.html`), replaced the `/` chooser with a remembered-language
redirect (D-022), and wired the approved branding assets (D-021).
