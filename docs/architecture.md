# Architecture — Sapiens Metric

## Overview

pnpm monorepo. The assessment/scoring logic is isolated in a pure TypeScript
package so it can be validated and reused without any UI, framework, or
database dependency.

## Intended packages

- `apps/web` → **@sapiensmetric/web** — public web application.
  - Next.js App Router, **static export** for the public marketing/site pages.
  - UI internationalisation: **next-intl** (T-009, D-019) with the `lt`/`en`
    `app/[locale]` structure and checked-in message catalogues.
  - Tailwind CSS + shadcn/ui (shadcn deferred; not installed in T-003).
  - Zod contracts for shared/API schemas.
- `apps/api` → **@sapiensmetric/api** — API service.
  - NestJS + Fastify. `GET /health` plus the T-005 credentials auth core
    (`/auth/*`) backed by MySQL via **TypeORM + mysql2**.
  - MySQL Community Server 8.0.46 (local Docker via T-004), server charset
    utf8mb4; driver **TypeORM + mysql2**.
  - API source layout:
    - `apps/api/src/config/` — environment configuration;
    - `apps/api/src/database/` — TypeORM data source and migration scripts;
    - `apps/api/src/database/migrations/` — committed migrations;
    - `apps/api/src/modules/users/` — User feature;
    - `apps/api/src/modules/auth/` — authentication feature;
    - `apps/api/src/modules/auth/sessions/` — refresh-session persistence.
- `packages/assessment` → **@sapiensmetric/assessment** — independent, pure
  TypeScript package. T-016 implements a versioned, deterministic **scoring core**
  (form snapshots, validation, results) with tests (see
  `docs/assessment-scoring.md`, T-016). No UI, framework, DB, network, or clock
  dependencies.
- `packages/contracts` → **@sapiensmetric/contracts** — Zod schemas shared
  between web and API: health, auth, admin, and the client-safe assessment
  attempt contracts.

## Foundation scaffold (T-003)

T-003 created the minimal web/API baseline:

- pnpm workspace monorepo (`pnpm-workspace.yaml`, root `package.json`);
- `apps/web` (`@sapiensmetric/web`): Next.js App Router with static export,
  Tailwind baseline, and a minimal non-marketing development page;
- `apps/api` (`@sapiensmetric/api`): NestJS + Fastify with `GET /health`;
  T-005 added the credentials auth core (`/auth/*`, TypeORM + mysql2,
  migrations-only) — see `docs/authentication.md`;
- `packages/contracts` (`@sapiensmetric/contracts`): shared Zod health-response
  contract;
- `packages/assessment` (`@sapiensmetric/assessment`): compilable pure
  TypeScript package (no items, fixtures, or assessment claims; the versioned
  scoring core was added later by T-016).

T-003 resolved O-001 (test runner: Vitest, D-011) and O-005 (package names,
D-012).

## T-006 email verification and password reset (implemented, approved, archived)

T-006 implements "Email verification and password-reset delivery through generic
SMTP", per D-016 (`docs/decisions.md`) and the archived task record
(`tasks/done/2026-09-21-email-verification-and-password-reset-delivery.md`). It
adds:

- a provider-agnostic mailer module (`apps/api/src/modules/mailer/`) using
  generic authenticated SMTP (nodemailer) behind a transport boundary; no
  provider SDK; implicit TLS for `SMTP_SECURE=true` and required STARTTLS (no
  plaintext fallback) otherwise;
- opaque, SHA-256-hashed, purpose-scoped, single-use, expiring action tokens
  (24h verification, 30min reset), persisted in `email_action_tokens`, with a
  nullable `users.emailVerifiedAt`;
- non-enumerating `/auth/email-verification/*` and `/auth/password-reset/*`
  endpoints; requests issue/send only for eligible accounts and always return a
  generic 202;
- request gating: per-user-and-purpose 15-minute cooldown plus an in-memory
  per-IP limit (3 calls per hour per IP per endpoint), and an in-memory per-IP
  limit of 5 password-reset confirmation calls per hour per IP applied before
  Argon2 hashing; the limiter expires stale entries and caps distinct keys at
  10,000 (new keys rejected without allocation); a transport rejection rolls
  back the token and does not consume the cooldown;
- the verification access gate on login, refresh, and every session-
  authenticated route;
- a minimal LT/EN browser flow across six static pages with fragment-only
  tokens;
- public web/API configuration through the single root `.env`: `PUBLIC_APP_URL`
  and `CORS_ORIGIN` are exact canonical HTTP(S) origins that must be equal after
  canonicalisation (`PUBLIC_APP_URL` is the web/browser origin used in email
  links); `NEXT_PUBLIC_API_BASE_URL` is the separately validated, only exposed
  build-time web value and missing/invalid configuration fails the static web
  build; `API_PORT` is the validated local Nest listener port and need not equal
  the public API URL port (production may sit behind a reverse proxy); no secret
  under the `NEXT_PUBLIC_` prefix;
- canonical Origin enforcement on refresh and on every `POST /auth/logout`
  attempt, before considering whether a refresh cookie is present;
- a data-minimisation/retention privacy gate document
  (`docs/email-verification.md`); O-006 remains open.

API source layout additions:

- `apps/api/src/modules/mailer/` — mailer boundary + generic SMTP transport.
- `apps/api/src/modules/auth/action-tokens/` — EmailActionToken entity/store.
- `apps/api/src/modules/auth/action-token.service.ts` — token generation,
  hashing, TTLs, and consumption.
- `apps/api/src/modules/auth/ip-rate-limiter.ts` — in-memory per-IP limiter.
- `apps/api/src/database/migrations/1781440000001-CreateEmailActionTokens.ts`.
- `apps/api/src/database/cleanup-action-tokens.ts` — explicit retention cleanup.
- `apps/api/src/smtp-smoke.ts` — opt-in live-SMTP smoke command.

## T-008 authentication frontend (static export)

T-008 adds the classical LT/EN browser journey over the existing auth API. It is
a static-export Next.js frontend; no server route, API change, database change,
or new dependency is introduced (the focused unit test uses the built-in Node
test runner).

- Frontend logic: `apps/web/features/auth/auth-api.ts` (typed fetch client using
  `NEXT_PUBLIC_API_BASE_URL` with `credentials: 'include'`),
  `apps/web/features/auth/auth-types.ts`, and
  `apps/web/features/auth/auth-navigation.ts` (same-origin `returnTo`
  validation). The generic API base helper stays in
  `apps/web/shared/api/public-api-base.mjs`.
- React state: `apps/web/features/auth/auth-provider.tsx` holds the access
  token in memory only and performs the refresh + `/auth/me` bootstrap.

(Paths reflect the T-011 FSD light re-layering; see below and `docs/fsd-light.md`.)
- Routes: `/{lt,en}` home, `/{lt,en}/auth/{login,register,verify-email,forgot-password,reset-password}`,
  and the protected `/{lt,en}/account`. T-009 later consolidated these LT/EN
  pages under a single `app/[locale]` implementation (see below).

## T-009 UI internationalisation (next-intl, static export)

T-009 replaces the hand-duplicated LT/EN page structure with `next-intl`,
shared locale-aware routes/components, and checked-in message catalogues. It
adds `next-intl` as the UI i18n layer (D-019) and keeps the static-export build,
the exact route matrix, and all auth/OAuth security behaviour unchanged.

- i18n configuration: `apps/web/shared/i18n/routing.ts` (locales `lt`/`en`,
  `localePrefix: 'always'`), `apps/web/shared/i18n/request.ts` (message loading
  for the explicit locale; no request headers, cookies, or proxy), and
  `apps/web/shared/i18n/navigation.ts` (locale-aware
  `Link`/`useRouter`/`usePathname`).
- Message catalogues: `apps/web/messages/lt.json`, `apps/web/messages/en.json`.
- Routes: `apps/web/app/[locale]/...` — one implementation per route, generated
  for both locales via `generateStaticParams` in the `[locale]` root layout —
  plus `apps/web/app/(root)/` for `/`, which redirects to the remembered local
  language preference (`lt`/`en`, localStorage) or to `/en/` by default (D-022;
  there is no interactive chooser). The locale layout persists the preference on
  entry via `LocalePreferenceSync`.
  The `[locale]` layout is a root layout so `<html lang>` follows the active
  locale; the build has no `app/layout.tsx`.
- Pure helpers: `apps/web/shared/lib/locale-navigation.ts` (locale validation,
  same-route language switching, and safe `returnTo` locale remapping); the
  language switcher never uses `document.cookie`.
- No middleware/proxy and no runtime browser-language detection are added.
  The static build emits the same route matrix as T-008 (both locales, every
  public route) and remains refresh-safe on static hosting.
- Assessment-item translations are intentionally **not** in the UI catalogues;
  they belong in the API/database model (D-019).

## T-010 static-export routes, local profile, and claims guard

T-010 is a corrective task (D-020) that removes audit findings without changing
auth, API, database, SMTP, or OAuth behaviour:

- The static export is **directory-style**: `apps/web/next.config.mjs` sets
  `trailingSlash: true`, so every route is emitted as `<route>/index.html`
  (`/lt/`, `/lt/auth/login/`, `/en/account/`, …). Production is plain shared
  static hosting with no Next server, middleware, proxy, or rewrite rules, so a
  clean URL must resolve from the filesystem alone. `scripts/verify-static-export.sh`
  enforces this in the `pnpm verify` chain.
- The single documented local profile is web `http://localhost:3333`, API
  `http://localhost:3334` (`API_PORT`), MySQL `127.0.0.1:3307`; `.env.example`
  and `docs/local-development.md` agree.
- `loadAppConfig()` reads the root `.env` only when no explicit environment
  object is supplied, so tests stay `.env`-free and do not mutate `process.env`.
- The UI fallback locale is `en`, aligned with the API authentication default.
- `apps/web/shared/lib/claims-guard.test.ts` guards public UI copy against
  `docs/claims-ladder.md`; future report/result templates must register with it.
- The approved branding WebP logos are used as supplied from the stable
  `/branding/...` public paths (D-021); `apps/web/shared/branding/branding.ts`
  centralises the paths and `apps/web/shared/ui/brand-mark.tsx` renders the
  light-shell (`dark`) variant. **T-018** added the browser/device icon set
  (PNG/ICO + `site.webmanifest`, also under `/branding/...`), shared through
  `apps/web/shared/branding/icon-metadata.ts` and declared by both root layouts;
  the interim WebP favicon is retained as a file but is no longer used as the
  browser icon.

## T-011 FSD light web structure (behaviour-preserving)

T-011 (D-023) re-layers `apps/web` into a deliberately light
Feature-Sliced-Design-style structure: `app` (routes, layouts, metadata, and
route composition only), `widgets` (composed screen blocks such as the app shell
and auth navigation), `features` (user interactions such as auth and locale
preference), and `shared` (generic UI, branding, i18n infrastructure, API
helpers, and low-level utilities). The allowed import direction is
`app -> widgets -> features -> shared` (a module may import its own layer or any
lower one, never an upper one); `entities/` and `processes/` are intentionally
not introduced. `scripts/verify-fsd-boundaries.mjs` (dependency-free) enforces
this in the `pnpm verify` chain, and `docs/fsd-light.md` documents the policy and
the deliberate Next.js/next-intl exceptions. Routing, static export, locale
persistence, auth behaviour, public API configuration, and all tests are
unchanged; no API or database change.

## T-012 roles, account status, and administration

T-012 (D-024) adds one role per user (`user` | `editor` | `admin`) and an account
status (`active` | `suspended`) separate from email verification, plus a
bilingual admin dashboard and an audit trail. Migration
`1781440000003-CreateRolesAndAdminAudit`; `synchronize` stays `false`. The admin
API lives in `apps/api/src/modules/admin/` (`GET /admin/summary|users|audit` and
role/status/revoke-session mutations) behind `AdminGuard`, which requires an
authenticated, active, verified administrator. Authorisation is re-evaluated per
request from the database, so demotion/suspension/revocation take effect
immediately. See `docs/authentication.md` and `tasks/current.md`. The web side
adds `entities/user`, `features/admin`, `widgets/admin-shell`, and
`apps/web/app/[locale]/admin/`, extending the FSD light direction to
`app -> widgets -> features -> entities -> shared`.

Deferred: `editor` content-management permissions; hard deletion, impersonation,
manual email verification, admin-set passwords, and additional email-sending
actions. Migration `1781440000003-CreateRolesAndAdminAudit`; bootstrap command
`pnpm --filter @sapiensmetric/api admin:promote -- --email <email> [--apply]`
(see `docs/local-development.md`).

## T-013 public website, educational content, and SEO

T-013 (D-025) adds a bilingual public website before any assessment release. The
locale surface is split into route groups: `app/[locale]/(site)/` (public pages
and articles, rendered by `widgets/site-shell`) and `app/[locale]/(app)/` (auth,
account, admin, rendered by `widgets/app-shell`). The locale root layout only
provides i18n plus locale-preference sync; the public area needs no auth
provider and works without the API.

Content is repository-managed typed data under `apps/web/shared/content/`
(no CMS), rendered by `shared/ui/content-page.tsx`. SEO is handled by
`shared/content/seo.ts` (canonical production URLs, reciprocal EN/LT `hreflang`,
Open Graph with absolute image URLs), with a generated `app/sitemap.ts`
(public pages/articles only) and `app/robots.ts` (crawling allowed so `noindex`
is readable). Auth/account/admin pages carry `noindex, nofollow`. A static 404
is provided. No analytics/tracking is loaded (T-014 plan in D-025). Claims
screening is split into `PRODUCT_COPY_RULES` and `EDUCATIONAL_CONTENT_RULES`
(`shared/lib/claims-rules.ts`). The three articles have an **Articles index** at
`apps/web/app/[locale]/(site)/articles/page.tsx` (with individual pages under
`articles/[slug]`), are listed in the primary navigation, and each article shows
a summary, review date, sources, and related links; the Assessment guide remains
a separate evergreen overview that links to the articles. next-intl resolves the locale for server-rendered links from the request
context; with no proxy/middleware the request locale is not derived from the URL,
so it fell back to the default and LT pages linked to EN. The fix builds hrefs
from the route `locale` param via `localeHref` (`shared/lib/locale-links.ts`),
and the shell threads the locale to header/footer; the export checks reject any
cross-locale public anchor. See `docs/content.md` for
authoring.

## T-014 frontend-only public release

T-014 (D-026) prepares a repeatable frontend-only release without changing the
application. `scripts/build-public-release.sh` (`pnpm build:public`) builds the
static export and assembles `dist/public-site/`, deterministically excluding the
`/{lt,en}/{auth,account,admin}` route directories; `_next` is the shared
content-hashed bundle. Public pages live in the `(site)` route group, which has
no auth provider and makes no API requests, so the release needs no API/DB/SMTP/
OAuth secrets. `scripts/verify-public-release.sh` checks the assembled
directory, and `docs/release-hosting.md` documents upload/rollback, HTTPS,
canonical hostname, deep links/404, indexing, and Search Console preparation.

Analytics extension (D-027): consent-controlled GTM → GA4. `shared/lib/consent.ts`
holds the versioned preference; `shared/lib/analytics.ts` holds host/path
eligibility, URL sanitisation, the idempotent GTM loader, and page-view dedupe;
`features/analytics/*` provides the consent provider, banner, and footer
settings; the GTM container configuration is in `docs/gtm/`. GTM is loaded only
after explicit consent (Basic Consent Mode), on the production host and eligible
public routes; advertising consent stays denied.

## T-016 versioned assessment scoring core

T-016 implements the pure scoring core in `@sapiensmetric/assessment`
(`docs/assessment-scoring.md`). It scores **one submitted attempt** against one
**exact keyed form snapshot** and supports four item types (single answer, multiple
select, ordering, numeric with inclusive absolute tolerance), each worth one
point. `scoreAttempt` is deterministic and mutates nothing; `KeyedFormSnapshot` is
internal/confidential and `toPublicForm` produces a browser-safe projection with
no answer keys. Validation and unsupported rule versions throw coded
`AssessmentError`s; only `status: 'submitted'` attempts receive a final score over
the **full form** denominator (missing responses count as skipped). The package
has no UI/HTTP/DB/auth/env/network/clock dependency, and the engine hardcodes no
astronomy content, item count, or objectives. No API, database, or web change.

## T-017 persisted assessment attempts (synthetic, local/test only)

T-017 (`docs/assessments.md`) adds the first authenticated assessment vertical
slice on the API: start, save, resume, submit, list, and retrieve an attempt.
`apps/api/src/modules/assessment/` holds the entity, store, service, controller,
and a **server-side synthetic fixture** (`synthetic-form.ts`, prefixed
`synthetic-`). Migration `1781440000004-CreateAssessmentAttempts` adds
`assessment_attempts`, which stores the **exact keyed form snapshot** chosen at
start plus answers/result JSON, `status` (`in_progress`|`finalised`), and a
`revision` counter. Scoring reuses `@sapiensmetric/assessment` (no second
algorithm); submission is idempotent and transactionally finalises exactly once.
Concurrency uses a pessimistic row lock plus the optimistic revision. All routes
sit behind `AccessTokenGuard` and enforce ownership from `request.userId`; client
DTOs (`packages/contracts/src/assessment.ts`) never include answer keys. Synthetic
content is OFF by default (`ASSESSMENT_SYNTHETIC_ENABLED`) and the config refuses to
enable it in production. No web UI in T-017 (T-019 adds a local one); the API is
not deployed.

## T-019 minimal local synthetic-assessment UI (local/development only)

T-019 (`docs/assessment-ui.md`) adds the browser surface over the T-017 API so the
full start → answer → save → resume → submit → result → history journey can be
exercised locally. It follows FSD light:

- `apps/web/features/assessment/` — the feature: client-safe `assessment-types.ts`,
  the typed fetch client `assessment-api.ts` (the **single** module that knows the
  `/assessments/attempts` endpoints), pure answer helpers
  (`assessment-answers.ts`), the framework-free observable store
  (`assessment-store.ts`), and the item/runner/result/history components. It
  imports **no** auth, no analytics, and never the keyed `@sapiensmetric/assessment`
  package or the server synthetic fixture.
- `apps/web/widgets/assessment-screen/` — composes the feature with
  `features/auth` (injects an in-memory access-token getter) and the client-side
  `?attempt=` selection.
- `apps/web/app/[locale]/(app)/assessment/page.tsx` — thin route; `noindex`.

The page is a static-export shell (no dynamic attempt-ID path): the active attempt
is a client-side selection, read from `window.location`, so the build needs no
runtime data. The route is excluded from the public release and sitemap
(`build-public-release.sh`, `verify-public-release.sh`) and carries `noindex`. The
server stays authoritative for ownership, revisions, submission, and scoring.

## T-020 mobile-first public navigation and reproducible sitemap

T-020 replaces the public horizontal navigation with a hamburger/drawer menu used
at every width, does a focused mobile/markup review, and makes the public sitemap
reproducible from repository content.

- `apps/web/shared/ui/drawer.tsx` — a **generic, auth-free** modal drawer
  primitive: portal to `document.body`, focus moved in and returned to the
  trigger, Tab containment, Escape/backdrop dismissal, `inert` on the page region
  (`#site-root`) plus body scroll lock while modal, and `motion-reduce`
  transitions.
- `apps/web/widgets/site-header/site-header.tsx` — public header (logo → current
  locale home, visible language switch, accessible menu button with
  `aria-expanded`/`aria-controls`) plus the drawer's translated, current-page-aware
  navigation. Public destinations only; the authenticated app keeps its own nav.
- `apps/web/widgets/site-shell/site-shell.tsx` — adds a skip link
  (`#main-content`) and the `#site-root` inert target. `SiteFooter` uses
  translated landmark labels.
- `apps/web/shared/content/sitemap.ts` — pure, content-derived sitemap entries used
  by `app/sitemap.ts`: the 20 public EN/LT URLs (locale homes + pages + articles),
  excluding the root redirect and nonpublic routes, with reciprocal alternates and
  truthful `lastmod`. The repository generator is authoritative; production is no
  longer seeded from a copied file.
- `apps/web/app/global-not-found.tsx` — the global 404. Because the app has two
  root layouts and no `app/layout.tsx`, an ordinary `app/not-found.tsx` produced a
  nested document; the documented multi-root-layout mechanism
  (`experimental.globalNotFound`) emits a single valid document (with `lang`,
  styles, and the shared icon/manifest metadata). HTML conformance is checked by
  `scripts/verify-html-conformance.mjs` (Nu HTML Checker).

## T-007 Google OpenID Connect sign-in (implemented, approved, archived)

T-007 adds optional Google OIDC sign-in (authorization-code flow with PKCE)
over the existing auth API, per D-018.

- `apps/api/src/modules/auth/identities/` — `user_identities` entity/store
  (`provider`, `subject`, unique `(provider, subject)`, FK to `users`).
- `apps/api/src/modules/auth/google/` — transaction/PKCE service (HMAC-SHA256
  over an HKDF-derived key), JWKS + ID-token verification, token exchange,
  account resolution, and the `/auth/google/*` controller.
- Migration `1781440000002-CreateUserIdentities`.
- Reuses the existing refresh-session/cookie lifecycle; no token in URLs.
- The web login/register pages show a Google button when
  `/auth/google/status` reports it is available; Google stays optional and
  password authentication is unaffected.

## Explicitly deferred beyond T-003

- Google OAuth is T-007 (implemented, approved, archived).
- Product UI features and public marketing/site content beyond the minimal
  development page.
- shadcn component installation (unless a real UI need arises).
- Deployment/hosting/DNS configuration. (The **frontend-only public site** is now
  deployed to `https://sapiensmetric.eu` under T-014/T-018/T-020; **API
  deployment**, DNS changes, and hosting-account migration remain deferred.)
- Microservices, Redis, queues.
- vHosts Node-to-MySQL feasibility (later, separate infrastructure task).

## Out of scope (permanent)

- PostgreSQL and Prisma. The intended shared-hosting environment does not
  provide PostgreSQL, and Prisma is not an accepted runtime dependency there.
  Use MySQL + TypeORM + mysql2 instead.

## Confirmed database environment facts (observed, not implemented)

- DB server observed in the vHosts environment: **MySQL Community Server
  8.0.46-cll-lve**.
- Server charset: **utf8mb4**.
- Planned backend driver: **TypeORM + mysql2**.
- phpMyAdmin shows **local UNIX-socket access** for administration.

Local development uses the T-004 Docker MySQL 8.0.46 on `127.0.0.1:3307`
(single root `.env`, non-root application user, `synchronize` disabled,
committed migrations only).

Unverified / deferred (not configured in this phase):

- vHosts (production) NestJS runtime connectivity to the database.
- Production database credentials and database name.
- TCP versus UNIX-socket configuration for the vHosts NestJS runtime.
- Migration execution against vHosts.

No production database, entity, migration, env file, or connection test was
created.

## Principles

- Assessment/scoring stays framework- and database-free.
- Contracts are versioned (see `docs/assessment-principles.md`).
- Static export first for the public web surface; server features only where
  they are actually required.
