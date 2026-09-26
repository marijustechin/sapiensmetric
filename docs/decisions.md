# Decision log — Sapiens Metric

Recorded decisions and open decisions. Decisions are dated and reversible
where noted. Update this file when a decision is made or changed.

## Decided

### D-001 — Product identity
- Name: **Sapiens Metric**; canonical domain: **sapiensmetric.eu**.
- Category: serious cognitive-ability and knowledge-assessment platform.
- Date: 2026-09-09.
- Status: decided. Non-reversible without explicit product owner sign-off.

### D-002 — Languages
- Product languages: Lithuanian and English.
- Date: 2026-09-09.
- Status: decided.

### D-003 — Hosting & infrastructure
- Domain registrar: **Bacloud**.
- Planned hosting: **vHosts.lt**.
- Date: 2026-09-09.
- Status: decided. Hosting/deployment is deferred, not configured in bootstrap.
- Confirmed environment observation (2026-09-09): the vHosts database
  environment is **MySQL Community Server 8.0.46-cll-lve**; server charset
  **utf8mb4**; phpMyAdmin exposes local UNIX-socket access. NestJS runtime
  connectivity, database credentials, database name, TCP-versus-socket
  configuration, and migration execution remain unverified and deferred. No
  database, entity, migration, env file, or connection test was created.

### D-004 — Technology direction
- pnpm monorepo.
- Public web: Next.js App Router with **static export**.
- API: NestJS + Fastify.
- Database: MySQL Community Server 8.0.46-cll-lve (vHosts), server charset
  utf8mb4; backend driver remains **TypeORM + mysql2**.
- UI: Tailwind + shadcn/ui.
- Contracts: Zod.
- Assessment/scoring logic: independent, pure TypeScript package.
- Date: 2026-09-09.
- Status: decided (direction). No scaffolding in bootstrap.

### D-005 — PostgreSQL and Prisma are out of scope
- The shared-hosting environment does not provide PostgreSQL, and Prisma is not
  an accepted runtime dependency there.
- Use MariaDB/MySQL + TypeORM + mysql2 instead.
- Date: 2026-09-09.
- Status: decided.

### D-006 — Scientific/ethical boundaries
- No IQ-score, clinical-diagnosis, hiring-recommendation, or scientific-
  validation claims until psychometric validation and representative norming
  exist.
- No copying/reconstruction of proprietary/protected instruments.
- Date: 2026-09-09.
- Status: decided (hard constraint).

### D-007 — Language handling of test content
- Items are classified as language-neutral, Lithuanian (`lt`), or English
  (`en`), with an explicit language-scope tag per item.
- Date: 2026-09-09.
- Status: decided.

### D-008 — Versioning
- Tests, items, scoring rules, and results are versioned; a result records the
  exact versions used to produce it.
- Date: 2026-09-09.
- Status: decided.

### D-009 — Bootstrap is documentation-first
- No application source, database schema, UI, API, auth, or deployment config
  in the bootstrap task.
- Date: 2026-09-09.
- Status: decided.

### D-010 — Workflow rules
- Every future task starts by reading AGENTS.md, relevant docs, and
  `tasks/current.md`; one task at a time; human review before archival; no
  silent scope expansion.
- Date: 2026-09-09.
- Status: decided.

### D-011 — Test runner (resolves O-001)
- Test runner: **Vitest**.
- Date: 2026-09-09.
- Rationale: runs inside the pnpm monorepo with no extra system dependencies,
  first-class TypeScript support, and a minimal API; it is used for the health
  contract and API health-endpoint tests created in T-003.
- Status: decided.

### D-012 — Workspace/package names (resolves O-005)
- Root workspace name: **sapiensmetric**.
- Package names: **@sapiensmetric/web** (`apps/web`), **@sapiensmetric/api**
  (`apps/api`), **@sapiensmetric/contracts** (`packages/contracts`),
  **@sapiensmetric/assessment** (`packages/assessment`).
- Date: 2026-09-09.
- Rationale: scoped names under the product namespace; directory layout
  `apps/*` and `packages/*` matches `docs/architecture.md`.
- Status: decided.

### D-013 — Credentials auth token strategy
- Credentials auth uses a short-lived JWT access token returned in the response
  body plus an opaque, rotating refresh token stored only in an HttpOnly
  cookie.
- Date: 2026-09-09.
- Status: decided. Authorises the explicitly scoped T-005 auth work only.

### D-014 — Refresh session semantics
- One active refresh session per user. A successful login revokes all prior
  active sessions for that user; refresh rotates the token; logout revokes the
  current session.
- Date: 2026-09-09.
- Status: decided. Authorises the explicitly scoped T-005 auth work only.

### D-015 — Deferred verification/delivery/social-login
- Email verification, password-reset delivery, and Google OAuth are
  deliberately deferred; T-005 must not claim production-ready account
  verification.
- Date: 2026-09-09.
- Status: decided. T-006 (email verification + password-reset delivery) and
  T-007 (Google OAuth) are later tasks.

### D-016 — Email action tokens, generic SMTP, and minimal LT/EN browser flow
- Standard authenticated SMTP behind a provider-agnostic boundary; no provider
  SDK or vendor-specific code.
- `users.emailVerifiedAt` is a nullable timestamp; action tokens are persisted
  in a dedicated table through a committed TypeORM migration only.
- Token values are `>=32` random bytes, base64url encoded, and only SHA-256
  hashes are persisted.
- Verification tokens expire after 24 hours; password-reset tokens after 30
  minutes; both values are configuration-driven and validated.
- Issuing a token atomically invalidates every previous unused token for the
  same user and purpose.
- Email-verification requests issue/send only for an existing unverified
  account; password-reset requests only for an existing account. Every request,
  including unknown, verified, cooldown-limited, and rate-limited cases, returns
  the same generic 202 body.
- A known account receives no new token or email more often than once per
  15 minutes per purpose. In addition, a small in-memory per-IP limit applies: a
  maximum of 3 request-endpoint calls per hour per IP per endpoint. This is
  defense-in-depth for this single-process bootstrap phase, not a distributed
  production claim; no Redis and no new data store are introduced. Every request
  still returns the same generic 202.
- A transport rejection before SMTP acceptance must leave no usable action token
  and must not consume the issuance cooldown. The API still returns the generic
  202 and may record only a safe operational failure without any token, URL,
  secret, password, or account identifier.
- Email verification is an access gate, not an informational flag. A user whose
  `emailVerifiedAt` is null receives the same generic 401 from
  `POST /auth/login` as invalid credentials; no access token or refresh cookie is
  issued. Refresh and every session-authenticated route, including
  `GET /auth/me`, reject an unverified user as unauthenticated, and existing
  sessions must not bypass the gate. The response must not reveal "email not
  verified". Once verification succeeds, the user may log in normally. Existing
  Docker-free fixtures and real-MySQL integration fixtures that test normal
  login/session behaviour must create verified users explicitly.
- Valid token consumption is atomic and single-use; password reset changes the
  Argon2id password and revokes all active refresh sessions in the same
  transaction.
- Browser flow is minimal LT/EN pages, with these exact routes:
  - `/lt/auth/verify-email`
  - `/en/auth/verify-email`
  - `/lt/auth/forgot-password`
  - `/en/auth/forgot-password`
  - `/lt/auth/reset-password`
  - `/en/auth/reset-password`
- Verification and reset email links carry the raw token in the URL fragment
  (`#token=...`), never a query string. Pages read the fragment client-side,
  remove it from browser history, and call POST confirmation endpoints only
  after an explicit user action. GET and link prefetching must never consume a
  token.
- The minimal browser flow is complete within its six routes: the verify-email
  page without a fragment provides the generic resend request form, and with
  `#token=` an explicit confirmation action; forgot-password provides the
  generic reset-request form; reset-password requires `#token=` and a new
  password and must not submit or consume a token on GET/prefetch.
- Public configuration uses only the single ignored root `.env`; no second
  web/API env file is introduced. `PUBLIC_APP_URL` is validated server-side and
  used solely to construct the email link origin. `NEXT_PUBLIC_API_BASE_URL` is
  a deliberately exposed, validated build-time web value used by the six static
  pages for API calls. No secret may use the `NEXT_PUBLIC_` prefix. The canonical
  `CORS_ORIGIN` is the only allowed browser origin for Origin checks; no wildcard
  CORS is introduced. The static web build receives only this public value from the root
  environment and must not copy secrets into `apps/web` or browser bundles.
- Public web configuration fails closed: `NEXT_PUBLIC_API_BASE_URL` is resolved
  only from the explicit environment or the root `.env` public entry and must be
  a validated absolute HTTP(S) URL.
  Missing or invalid configuration fails the static web build.
  No secret is exposed to or copied into the web bundle.
- `PUBLIC_APP_URL` and `CORS_ORIGIN` are validated as exact HTTP(S) origins (no
  wildcard, userinfo, path other than `/`, query, or fragment), stored as
  canonical origins, and must be equal after canonicalisation, so a harmless
  trailing slash cannot break Origin checks. `PUBLIC_APP_URL` is the web/browser
  origin used in email links. `NEXT_PUBLIC_API_BASE_URL` is a separately
  validated API base URL and may use a different port/origin. `SMTP_PORT` is
  validated as 1–65535 and `SMTP_FROM` as a valid mailbox address.
- `API_PORT` (1–65535) is the validated local Nest listener port and need not
  equal the public API URL port; production may sit behind a reverse proxy. For
  direct local development `NEXT_PUBLIC_API_BASE_URL` must point at
  the running API listener; the current human configuration uses 3334. The web
  API-base value rejects userinfo, query strings, and fragments, keeps an
  intentional path prefix, and normalises only a trailing slash.
- SMTP TLS never downgrades: `SMTP_SECURE=true` uses implicit TLS, and
  `SMTP_SECURE=false` requires STARTTLS with no plaintext fallback.
- Password-reset confirmation is protected against Argon2 denial of service by an
  in-memory per-IP limit of 5 password-reset confirmation calls per hour per IP,
  applied before password hashing. A limited confirmation receives the same
  generic 400 as any other invalid confirmation.
- The in-memory limiter is memory-bounded: stale entries expire and distinct keys
  are capped at 10,000 distinct keys; when full, new keys are rejected without
  being allocated while existing keys continue to be evaluated. Request endpoints
  still return the generic 202 when limited.
- POST /auth/logout rejects an absent or mismatched Origin on every attempt,
  before considering whether a refresh cookie is present.
- Date: 2026-09-18.
- Status: decided. Authorises only the explicitly scoped T-006 work after human
  execution approval.
- This does not resolve O-006 and does not authorise real product use or a
  compliance claim.

### D-017 — Conventional registration UX (verification on registration, explicit duplicate)
- Registration is **conventional and clear** rather than non-enumerating. This
  intentionally supersedes the earlier generic-`202` registration behaviour
  (which returned the same response for new and existing addresses).
- A **new** email address creates an unverified account and immediately issues
  and sends exactly **one** verification email, reusing the existing
  action-token issuance, cooldown, hashing, TTL, mailer, and transport-rejection
  handling. The verification email locale follows the request `locale`
  (`lt` | `en`; default `en` when omitted).
- An **already-registered** email address returns an explicit
  `409 { code: 'EMAIL_ALREADY_REGISTERED' }` conflict. This deliberately trades
  registration account-enumeration resistance for conventional UX.
- If verification delivery fails after account creation, the API returns a
  recoverable `502 { code: 'VERIFICATION_EMAIL_DELIVERY_FAILED' }`, keeps the
  account unverified, and removes the unusable token; the user then uses the
  resend-verification flow. Registration never reports false success and never
  retries delivery automatically.
- Concurrency: at most one user record is created per address and at most one
  verification email is issued; a concurrent loser receives the duplicate
  conflict and sends nothing.
- The unverified-user login/refresh/session access gate is unchanged.
- Scope: implements only the conventional registration flow within the T-008
  frontend/registration amendment. No Google OAuth, no assessment changes, and
  no database-schema change.
- Date: 2026-09-21.
- Status: decided. Authorises only the explicitly scoped T-008 registration
  amendment.

### D-018 — Google OpenID Connect sign-in
- Add Google sign-in using the OAuth 2.0 authorization-code flow with **PKCE
  (S256)**, on the static-export web frontend and the NestJS/Fastify API.
- A Google identity is identified **solely by the immutable OIDC `sub`**,
  persisted in a new `user_identities` table (`provider`, `subject`, unique
  `(provider, subject)`, FK to `users`). Email is never the identity key; it is
  used only for the automatic-linking rules below.
- Account rules (exact):
  - existing `sub` → sign in to its already-linked user;
  - new identity + verified Google email + no local match → create one verified
    local user and link;
  - new identity + verified Google email matching a **verified** credentials
    user → automatically link and sign in to that user;
  - Google email missing or not verified → reject; create/link nothing;
  - Google email matches an **unverified** local user → reject; do not link;
  - a `sub` already linked to another user → reject; never reassign it.
- Transaction cookie `sm_oauth_tx`: short-lived (10 min), `HttpOnly`,
  `SameSite=Lax`, path `/auth/google`, `Secure` in production, integrity
  protected with **HMAC-SHA256 over an HKDF-SHA256-derived key**. Tampered or
  expired cookies are rejected and the cookie is cleared after the callback.
- The ID token is validated properly (RS256 signature via Google JWKS selected
  by `kid`, `iss`, `aud`/client ID, `exp`, and the `nonce` binding); a decoded
  but unverified payload is never trusted.
- After successful Google authentication the existing refresh-session/HttpOnly
  cookie lifecycle is reused; tokens are never placed in URLs.
- Google is **optional**: without credentials `GET /auth/google/status` reports
  `{ available: false }`, `GET /auth/google/start` returns `503
  GOOGLE_OAUTH_UNAVAILABLE`, and password authentication is unaffected.
- No Google account link/unlink management UI in this scope.
- The unverified email/password login gate is unchanged; one account may use
  both password and Google sign-in.
- Date: 2026-09-21.
- Status: decided. Authorises only the explicitly scoped T-007 work.

### D-019 — UI internationalisation with next-intl
- The web UI i18n layer is **next-intl** (pinned, explicitly authorised
  dependency), used with the static-export App Router and an explicit
  `app/[locale]` segment for the two supported UI locales, `lt` and `en`.
- Locale-prefixed URLs are preserved (`/lt/...`, `/en/...`); `/` remains the
  existing static bilingual language chooser. No middleware/proxy and no
  runtime browser-language detection are added.
  (Superseded by D-022: `/` now redirects to the default locale; there is no
  chooser.)
- UI copy lives in checked-in message catalogues: `apps/web/messages/lt.json`
  and `apps/web/messages/en.json`.
- This decision covers **UI** translation only. Translation/localisation of
  assessment items, questions, explanations, scoring, or API/database content is
  **out of scope** here and belongs in the API/database assessment-item model,
  not in the UI message catalogues.
- Russian (or any locale other than `lt`/`en`) is not added.
- Date: 2026-09-21.
- Status: decided. Authorises only the explicitly scoped T-009 work.

### D-020 — Static-export directory routes, local profile, claims guard, and env-file isolation
- The public web app (`apps/web`) is a Next.js App Router static export
  (`output: 'export'`) with **`trailingSlash: true`**. Production is plain shared
  static hosting with no Next server, middleware, proxy, or rewrite rules, so
  every public route must be emitted as `<route>/index.html`. Clean URLs such as
  `/lt/auth/login/` and `/en/account/` therefore resolve from the filesystem
  alone. The earlier flat `route.html` export is a regression and is rejected by
  `scripts/verify-static-export.sh`, which is part of the `pnpm verify` chain.
- The single local development profile is: web (`next dev`) on
  `http://localhost:3333`, API listener on `http://localhost:3334` (`API_PORT`),
  and MySQL on `127.0.0.1:3307`. `.env.example` is the source of truth.
  `CORS_ORIGIN` equals `PUBLIC_APP_URL` (the web origin) and
  `NEXT_PUBLIC_API_BASE_URL` is the API origin. The web `dev` script pins the
  Next.js dev server to `3333` (no manual CLI argument), and the API port is
  `3334`, not `3333`, so the two do not collide.
- The UI fallback locale (`apps/web/shared/lib/locale-navigation.ts` `DEFAULT_LOCALE`)
  is `en`, deliberately matching the API authentication default (`en` when
  `locale` is omitted) and the Google start default. The `[locale]` layout still
  rejects unsupported locales and `/` remains the bilingual chooser.
  (Superseded by D-022: `/` now redirects to the default locale.)
- `loadAppConfig()` loads the single root `.env` only when called without an
  explicit environment object. A supplied `env` object (tests) neither reads the
  root `.env` nor mutates `process.env`.
- A proportional automated **claims guard** covers public user-facing UI text
  (`apps/web/messages/*.json`), enforcing the boundaries of
  `docs/claims-ladder.md`. Future report/result templates must register their
  text sources with the guard; it intentionally does not scan documentation,
  task records, or tests.
- This decision is corrective engineering. It does not change auth behaviour,
  API contracts, the database, SMTP/OAuth, or any assessment claim.
- Date: 2026-09-26.
- Status: decided. Authorises only the explicitly scoped T-010 corrective work.

### D-021 — Branding asset interface (stable WebP filenames and public paths)
- The approved brand assets are used **exactly as supplied**: no conversion,
  recolouring, renaming, or recreation. They live under the stable public path
  `apps/web/public/branding/` and are referenced as `/branding/<filename>`:
  - `sapiens-metric-logo-dark.webp` — dark strokes, for light backgrounds
    (the current app shell).
  - `sapiens-metric-logo-light.webp` — light strokes, for dark backgrounds
    (reserved).
  - `sapiens-metric-logo-middle.webp` — mid-gray strokes, for mid-tone
    backgrounds (reserved).
  - `sapiens-metric-logo-favicon.webp` — the supplied favicon mark.
- The filenames and paths are a **stable interface**: future visual tone
  adjustments may replace file contents, but must preserve these exact
  filenames and paths. Paths are centralised in `apps/web/shared/branding/branding.ts`.
- The variant is chosen for the actual background it sits on; the current shell
  is light, so `logo-dark` is used and the supplied favicon is registered as the
  web app icon in both root layouts.
- This supersedes the T-009 "do not reference `apps/web/public/`" bootstrap
  restriction for these four assets only; it was explicitly approved by Marijus.
- `scripts/verify.sh` asserts the assets exist and are referenced, and
  `scripts/verify-static-export.sh` asserts they reach the export and that the
  favicon is registered in the generated HTML.
- Date: 2026-09-26.
- Status: decided. Authorises only the branding-asset wiring within the active
  T-010 work.

### D-022 — Root route: remembered-language redirect (no chooser)
- The root route `/` is **not** an interactive language chooser. It redirects to
  the user's remembered local language preference, or to the default locale
  (`en`) when there is none.
- **Local preference (localStorage only):** the selected locale is persisted in
  browser localStorage under `sapiensmetric.locale` whenever a locale-prefixed
  page is entered (so a direct visit to `/lt/` counts as selecting Lithuanian),
  and read by `/` to choose the target. No cookies, server state, SSR,
  middleware, proxy, or tracking.
- **Resolution:** stored `lt` -> `/lt/`; stored `en` -> `/en/`; no or an
  unsupported stored value -> `/en/`. The redirect is a client-side
  `window.location.replace` (no back-button entry).
- **No meta refresh:** a zero-delay meta refresh is deliberately not used as the
  normal mechanism because it would always win with `/en/` and defeat a
  remembered `lt` preference.
- **JS-disabled fallback:** a documented English fallback link to `/en/` inside
  `<noscript>`; the remembered-language behaviour is not compromised to force an
  automatic no-JS redirect.
- **Loading state:** `/` renders a full-page, centred, unobtrusive spinner with
  an accessible loading status (`role="status"`, `aria-live="polite"`,
  `aria-busy="true"`, visually hidden "Loading") and no visible placeholder or
  chooser copy.
- The bilingual chooser screen and its `Chooser` message namespace are removed;
  the `(chooser)` route group is renamed `(root)`. This supersedes the `/`
  handling in D-019 and D-020.
- `apps/web/shared/lib/locale-preference.ts` holds the storage key, targets, and
  resolution; `locale-preference.test.ts` covers no-preference/`lt`/`en`/
  unsupported cases, persistence, storage failures, and the root page's loading
  state; `scripts/verify-static-export.sh` asserts the exported root renders the
  loading state, has no meta refresh, offers the English fallback, and presents
  no chooser.
- Date: 2026-09-26.
- Status: decided. Authorises only the explicitly scoped root-route change.

### D-023 — FSD light web frontend structure
- `apps/web` follows a deliberately **light** Feature-Sliced-Design-style
  structure with four layers: `app` (Next.js routes, layouts, metadata, and
  route composition only), `widgets` (composed screen blocks), `features` (user
  interactions), and `shared` (generic UI, branding, i18n infrastructure, API
  helpers, and low-level utilities).
- Allowed import direction: a module may import its own layer or any lower layer
  (`app` -> `widgets` -> `features` -> `shared`), never an upper one.
  `entities/` and `processes/` are intentionally **not** introduced;
  `entities/user` belongs to a later roles/admin task.
- Enforced by `scripts/verify-fsd-boundaries.mjs` (dependency-free; Node
  built-ins only), which is part of the `pnpm verify` chain. No architectural
  framework and no path-alias toolchain is added (relative imports only, so the
  modules run under the dependency-free Node test runner).
- Deliberate Next.js/next-intl exceptions (see `docs/fsd-light.md`): `app/`
  stays at the web root and holds routes/layouts/metadata plus `globals.css`;
  `messages/` and `public/` stay at the web root; framework config stays at the
  web root; i18n infrastructure lives in `shared/i18n`.
- Behaviour-preserving: routing, static export, locale persistence, auth
  behaviour, public API configuration, and all existing tests are unchanged. No
  API or database change.
- Date: 2026-09-26.
- Status: decided. Authorises only the explicitly scoped T-011 work.

### D-024 — User roles, account status, and administration
- One role per user: `user`, `editor`, or `admin`. Existing users and all public
  registrations (including Google sign-ups) default to `user`; public requests
  can never set or change a role. `editor` currently has ordinary account access
  only; content-management permissions are deferred.
- Account status (`active` | `suspended`) is separate from `emailVerifiedAt`.
  Added by migration `1781440000003-CreateRolesAndAdminAudit`; TypeORM
  `synchronize` stays `false`.
- Authorisation is re-evaluated on every request from the database (session row
  plus user role/status); no role is trusted from the JWT. Suspension
  invalidates access and refresh sessions and blocks new credentials/OAuth
  sessions; revoke-all invalidates access and refresh; reactivation does not
  revive revoked sessions; password reset and email verification never
  reactivate a suspended account.
- Self-protection (no self role change, no self-suspension) and
  last-active-verified-administrator protection are enforced inside the database
  transaction, including concurrent requests.
- Administrative mutations are recorded in `admin_audit_log` atomically with the
  change; audit entries hold no credentials or tokens and are read-only in the
  UI.
- Administrator bootstrap is a CLI (`admin:promote`) requiring an explicit target
  and a deliberate `--apply`; no public endpoint, default password, or
  first-registrant promotion. The action is attributed to an explicit CLI actor.
- FSD light gains an `entities` layer: the direction is
  `app -> widgets -> features -> entities -> shared`; `entities/user` must not
  import `features`. Tailwind scans `./entities/**`.
- Date: 2026-09-26.
- Status: decided. Authorises only the explicitly scoped T-012 work.

### D-025 — Public website, educational content, SEO, and the analytics boundary
- A useful public website is published before any assessment release. It presents
  SapiensMetric as a developing assessment project and states on every public
  page that assessments are **not available yet**. No tests, scores, norms,
  validation, credentials, customers, testimonials, partnerships, team members,
  or launch dates are invented.
- Public content is repository-managed (typed data under `apps/web/shared/content/`,
  no CMS/database), authored naturally in English and Lithuanian, with recorded
  sources and review dates. Educational discussion of IQ and percentiles is
  allowed only when accurate and separated from product claims.
- The claims guard is split: strict `PRODUCT_COPY_RULES` for product UI copy and
  `EDUCATIONAL_CONTENT_RULES` for public content (which allow accurate
  educational use and flag unsupported product claims / invented social proof).
  Regex checks are a safety net, not proof of scientific accuracy.
- SEO: canonical production URLs under `https://sapiensmetric.eu`, reciprocal
  EN/LT `hreflang` (`x-default` → English), unique titles/descriptions, Open
  Graph with absolute production image URLs, a generated `sitemap.xml` limited
  to public pages/articles, `robots.txt` that allows crawling (so `noindex` is
  readable; not a substitute for it), `noindex, nofollow` on auth/account/admin,
  and a static 404. Localhost/preview URLs are kept out of production metadata.
- Analytics boundary: **no** GA4, GTM, advertising, or tracking in T-013. The
  T-014 plan is: Search Console domain verification and sitemap submission; a
  single GTM implementation driving GA4 (no duplicate tracking); analytics
  loaded only after consent, with rejection and withdrawal; cookie settings
  matching the actually deployed services; and exclusion of credentials, email
  addresses, tokens, admin data, and assessment answers from analytics. A
  nonfunctional consent banner is not added.
- Staging/preview indexing is prevented by `noindex` metadata (and, in
  deployment, platform-level controls); hiding navigation is never treated as
  access control.
- Date: 2026-09-26.
- Status: decided. Authorises only the explicitly scoped T-013 work.

### D-026 — Release decisions: operator, contact, hosting, and first release scope
- Public website origin: **https://sapiensmetric.eu**.
- Website operator: **Marijus Šmiginas** (name only; no business registration
  details, postal address, or legal status are asserted or published).
- Public contact: **info@sapiensmetric.eu** (confirmed monitored mailbox),
  published as a `mailto:` link on Contact/Privacy and the footer.
- Transactional email sender (`SMTP_FROM`) remains **website@sapiensmetric.eu**;
  it is not the public contact address.
- Current hosting: **vHost**. The provider has announced a migration to
  **Bacloud**; no assumption is made about a different control panel or server
  configuration.
- Future API origin: **https://api.sapiensmetric.eu** — planned, and NOT
  deployed or activated in this release.
- First release scope: **public informational pages and articles only**. Auth,
  account, and admin routes and the assessment itself are not part of the public
  release (they remain in the full application build).
- GA4/GTM and consent are deferred to a later task; Search Console preparation
  belongs to T-014. No analytics or consent scripts are added.
- Date: 2026-09-26.
- Status: decided. Authorises the T-013 finalisation and the T-014 release
  preparation.

## Open decisions

> T-001 note (2026-09-09): the discovery baseline (`docs/measurement-model.md`,
> `docs/item-format-inventory.md`, `docs/claims-ladder.md`,
> `docs/validation-norming-gap.md`, `docs/research-open-questions.md`,
> `docs/research-sources.md`) did not resolve any of O-001–O-006. All remain
> open pending the evidence and decisions they require.

### O-001 — Test runner
- Resolved by **D-011** (Vitest, 2026-09-09).

### O-002 — Item/content sourcing policy
- Exact provenance and licensing criteria for original vs. legally reusable
  items, and how provenance is stored.

### O-003 — Norming & validation roadmap
- Scope, budget, and sequencing of representative norming and validity studies.

### O-004 — Organisational-use claims
- The specific evidence threshold required before any organisational-use or
  screening claim is allowed.

### O-005 — Repository/package naming
- Resolved by **D-012** (@sapiensmetric/{web,api,contracts,assessment},
  2026-09-09).

### O-006 — Data protection & governance
- Data-protection, consent, retention, access-control, and organisational-use
  governance.
- Requires a later dedicated legal/privacy review. No compliance claim is
  permitted now.

### O-007 — Copyright/IP provenance review
- Scope, timing, and responsible expert for reviewing the item provenance
  policy (`docs/item-provenance-policy-proposal.md`) and any use of
  third-party material.
- This is a copyright/IP review decision, distinct from the data-protection
  governance decision (O-006).
- No IP review has occurred and no legal clearance is claimed; the policy is
  an internal risk-control proposal until a responsible expert reviews it.
