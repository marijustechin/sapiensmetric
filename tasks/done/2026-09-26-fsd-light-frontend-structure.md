# T-011 — FSD light frontend structure (archived)

- **ID:** T-011
- **Archive date:** 2026-09-26
- **Final status:** Approved (human review granted)
- **Type:** Refactor (web frontend layering; behaviour-preserving; no new dependency)
- **Created:** 2026-09-26
- **Approved:** 2026-09-26

---

> T-011 was accepted by human review on 2026-09-26. Marijus confirmed in the
> browser that the post-move visual regression is fixed (logo, navigation
> spacing, and the centred loading spinner render correctly). It is archived; its
> scope, the review follow-ups, and the approved outcome are preserved below.

## Objective

Make the Next.js routes thin and user interactions encapsulated by introducing a
light FSD layering (`app` / `widgets` / `features` / `shared`) with an enforced
import direction, without adopting a heavy architecture framework, path-alias
toolchain, or code generation.

## Required architecture

- `app/` — Next.js routes, layouts, metadata, and route composition only.
- `shared/` — generic UI, branding, i18n infrastructure, API base helpers, and
  low-level utilities.
- `features/` — user interactions (auth, locale preference).
- `widgets/` — composed screen blocks (application shell, auth navigation).
- **No** `entities/` (an `entities/user` slice belongs to the following
  roles/admin task) and **no** `processes/`.
- Framework-required files and public assets stay where Next.js requires them.
- The approved WebP paths and filenames are unchanged (D-021).

## Allowed import direction

`app` (4) -> `widgets` (3) -> `features` (2) -> `shared` (1): a module may import
its own layer or any lower layer, never an upper one.

## Documentation and enforcement

- `docs/fsd-light.md` documents the policy, the allowed import direction, the
  deliberate Next.js/next-intl exceptions, and the before/after mapping.
- `scripts/verify-fsd-boundaries.mjs` (Node built-ins only) enforces the
  direction and the absence of `entities/`/`processes/`; it is part of the
  `pnpm verify` chain (also `pnpm verify:fsd`).
- D-023 records the decision.

## Auth-module ownership (review follow-up)

Authentication-specific modules live in `features/auth`: `auth-api.ts` (endpoint
client), `auth-types.ts`, `auth-navigation.ts` (`returnTo`/login link), and
`google-auth.ts`, alongside the auth components and `register-feedback`. Generic
modules are deliberately retained in `shared`: `shared/api/public-api-base.mjs`
(build-time API base config), `shared/lib/locale-navigation.ts`,
`shared/lib/locale-preference.ts`, and `shared/lib/single-flight.ts` (generic
async primitive with no auth semantics). No auth-named module remains in
`shared`, and no `entities/` or new layer was introduced.

## Styling regression follow-up (review)

A post-move styling regression (logo at intrinsic size, broken navigation
spacing, visible "Loading" text, no spinner) was caused by
`apps/web/tailwind.config.ts` `content` scanning only `./app/**`, so the
utilities used by the moved `shared/`, `features/`, and `widgets/` components
were never generated. Fixed by scanning all four layers (no design change, no
inline-style workaround). `scripts/verify-static-export.sh` now asserts the
generated CSS contains representative utilities from each layer — including
`sr-only` and `animate-spin` — and that the pages link a CSS asset; the check was
proven to fail on the old glob (14 missing utilities).

## Verifier count note (review follow-up)

The `verify.sh` pass-count change (610 -> 427 at the time) was intentional: the
"local markdown references resolve" invariant now excludes `tasks/done/**`,
because completed task archives legitimately reference paths as they existed at
the time and must not be rewritten. No invariant and no output-list entry was
deleted; the T-008/T-009/T-010 output lists were updated to the new paths and an
FSD-light invariant was added. All applicable auth, static-export, locale,
branding, and documentation invariants remained.

## Non-goals

- Any behaviour, routing, API-contract, database, migration, SMTP, OAuth, or
  public-API-configuration change.
- `entities/`, `processes/`, a path-alias toolchain, or an architecture
  framework.
- Renaming or moving the approved branding WebP assets.
- Any assessment/scoring work.

## Acceptance criteria

- `apps/web/{app,widgets,features,shared}` exist with the documented
  responsibilities; no `entities/` or `processes/`.
- The boundary check passes and fails on an upward import.
- Routing, static export (directory-style `<route>/index.html`), locale
  persistence, auth behaviour, and public API configuration are unchanged.
- All existing tests pass; the suite, build, static-export check, boundary check,
  and repository harness pass.

---

## Approved-outcome summary

T-011 re-layered `apps/web` into a light FSD structure (`app` routes only;
`widgets` for the shell and auth navigation; `features` for auth and locale
preference; `shared` for generic UI, branding, i18n infrastructure, the API base
helper, and low-level utilities). The import direction is enforced by
`scripts/verify-fsd-boundaries.mjs` (D-023), and a generated-CSS check guards the
Tailwind content globs. The refactor is behaviour-preserving: routing, static
export, locale persistence, auth behaviour, public API configuration, and all
tests are unchanged, with no API or database change and no new dependency.

Acceptance verification (2026-09-26): `pnpm verify` passed — lint, typecheck,
`pnpm test` (152 tests), the FSD boundary check, `pnpm build`,
`verify-static-export.sh` (46 checks), and `verify.sh` (432 checks). Human review
confirmed the browser visual regression is fixed.
