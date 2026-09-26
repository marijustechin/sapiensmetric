# FSD light — web frontend architecture (T-011)

Status: active policy for `apps/web`. Introduced by T-011; recorded as D-023.

## Purpose

A deliberately **light** Feature-Sliced-Design-style structure for the web app:
enough layering to keep the Next.js routes thin and user interactions
encapsulated, without adopting a heavy architecture framework, path-alias
toolchain, or code-generation. The assessment/scoring package remains separate
and unaffected.

## Layers

| Layer | Owns | Examples |
| --- | --- | --- |
| `shared/` | Generic, reusable, framework-light building blocks: UI primitives, branding, i18n infrastructure, the API base helper (build-time config), low-level pure utilities. | `shared/ui/brand-mark.tsx`, `shared/ui/loading-screen.tsx`, `shared/branding/branding.ts`, `shared/i18n/*`, `shared/api/public-api-base.mjs`, `shared/lib/*` |
| `features/` | User interactions and the logic behind them: auth (forms, provider, API client, types, navigation/`returnTo`, Google helper, button, account view, register feedback), locale preference, and admin actions. | `features/auth/*`, `features/locale-preference/*`, `features/admin/*` |
| `entities/` | Reusable domain models, safe types, and entity-level presentation. | `entities/user/*` |
| `widgets/` | Composed screen blocks that combine features/shared into a meaningful block of UI. | `widgets/app-shell/*`, `widgets/auth-nav/*` |
| `app/` | Next.js App Router routes, layouts, metadata, and route composition only. No business logic, no reusable UI, no direct `fetch`. | `app/(root)/*`, `app/[locale]/*` |

`entities/` was introduced by T-012 (`entities/user`: safe user model and
presentation). `processes/` is intentionally **not** introduced at this scale.

## Allowed import direction

A module may import from its **own layer** or any **lower** layer, never an
upper one:

```
app (5)       ->  app, widgets, features, entities, shared
widgets (4)   ->  widgets, features, entities, shared
features (3)  ->  features, entities, shared
entities (2)  ->  entities, shared
shared (1)    ->  shared only
```

- `shared` must never import `entities`, `features`, `widgets`, or `app`.
- `entities` must never import `features`, `widgets`, or `app` (in particular,
  `entities/user` must not depend on `features/auth`; session ownership stays in
  `features/auth` and is consumed by features/widgets).
- `features` must never import `widgets` or `app`.
- Cross-imports **within** a layer are allowed (e.g. `features/auth` →
  `features/locale-preference` would be allowed; currently there are none).
- Imports of framework packages (`next`, `react`, `next-intl`, `node:*`) and
  non-layer paths (`messages/`, `globals.css`, framework config) are ignored by
  the rule.

Relative imports are used throughout (no `@/` path alias) so the modules remain
runnable under the dependency-free Node test runner.

## Auth-module ownership

Authentication-specific modules live in `features/auth`:

- `features/auth/auth-api.ts` — the typed `/auth/*` endpoint client.
- `features/auth/auth-types.ts` — auth response types (`AuthUser`, `Locale`).
- `features/auth/auth-navigation.ts` — same-origin `returnTo` validation and the
  login link builder.
- `features/auth/google-auth.ts` — the Google start-URL helper.
- plus the auth components and `register-feedback`.

Generic modules are **deliberately retained** in `shared` (no auth semantics, and
reused or unit-tested independently):

- `shared/api/public-api-base.mjs` — generic build-time API base URL
  validation/normalisation (not an endpoint client).
- `shared/lib/locale-navigation.ts` — generic locale/path utilities used by the
  i18n infrastructure and by features/widgets.
- `shared/lib/locale-preference.ts` — generic localStorage preference
  read/write/resolve utility; the interaction component lives in
  `features/locale-preference`.
- `shared/lib/single-flight.ts` — generic async coalescing primitive. It is used
  by the auth bootstrap but carries no auth semantics and is unit-tested on its
  own.

No auth-named module remains in `shared`; all auth endpoints, types, and
workflow logic are owned by `features/auth`.

## Enforcement

`scripts/verify-fsd-boundaries.mjs` (Node built-ins only; no new dependency)
parses every `.ts`/`.tsx` file under `apps/web/{app,widgets,features,shared}`,
resolves relative imports, and fails on any upward import. It also fails if an
`entities/` or `processes/` directory appears. It is part of the `pnpm verify`
chain (`node scripts/verify-fsd-boundaries.mjs`).

**Tailwind content coverage.** `apps/web/tailwind.config.ts` `content` must scan
every class-carrying layer: `./app/**`, `./widgets/**`, `./features/**`,
`./entities/**`, and `./shared/**`. Limiting it to `./app/**` after the moves silently dropped the
utilities used by the moved logo, navigation, and loading components (this was a
real regression, fixed under T-011). Because class names in TSX are not proof
that CSS is emitted, `scripts/verify-static-export.sh` asserts the generated CSS
contains representative utilities from each layer (including `sr-only` and
`animate-spin`) and that the pages link a CSS asset. When a layer is added or a
new Tailwind-managed source directory appears, add it to the content globs and
to the representative list.

## Deliberate exceptions (Next.js and next-intl)

These files cannot move without breaking the framework and remain where Next.js
or next-intl requires them:

- `app/` stays at `apps/web/app` (Next.js App Router root). It holds routes,
  `layout.tsx`/`page.tsx`, metadata, and route composition. `app/(root)` and
  `app/[locale]` are two root layouts (there is no `app/layout.tsx`), which is
  why the localized `<html lang>` can follow the active locale.
- `app/globals.css` stays under `app/` because both root layouts import it.
- `messages/` stays at `apps/web/messages` (next-intl catalogue data referenced
  by `shared/i18n/request.ts` and the catalogue tests).
- `public/` stays at `apps/web/public` (Next.js requirement). The approved
  branding WebP assets keep their stable `/branding/...` paths and exact
  filenames (D-021).
- Framework config (`next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`,
  `tailwind.config.ts`, `next-env.d.ts`, `package.json`) stays at the web root.

Because `app/` is a root-level framework directory, the i18n configuration was
moved to `shared/i18n` (infrastructure) and `next.config.mjs` wires
`./shared/i18n/request.ts`; this is the one place where a framework-required
file references a layer, which the boundary rule permits (`app`-level config is
outside the layer check).

## Mapping from the pre-T-011 layout

| Before | After |
| --- | --- |
| `app/_components/*` | `features/*` (interactions) and `widgets/*` (shell/nav) and `shared/ui/*` (mark/loading) |
| `lib/auth-api.ts` | `features/auth/auth-api.ts` (auth-specific endpoints) |
| `lib/auth-types.ts`, `lib/auth-navigation.ts`, `lib/google-auth.ts` | `features/auth/*` (auth-specific types/workflow) |
| `lib/public-api-base.mjs` | `shared/api/public-api-base.mjs` (generic config) |
| `lib/locale-navigation.ts`, `lib/locale-preference.ts`, `lib/single-flight.ts` | `shared/lib/*` (generic utilities) |
| `lib/branding.ts` | `shared/branding/branding.ts` |
| `lib/register-feedback.ts` | `features/auth/register-feedback.ts` |
| `i18n/*` | `shared/i18n/*` |
| `app/(root)/page.tsx` redirect logic | `features/locale-preference/root-redirect.tsx` (+ `shared/ui/loading-screen.tsx`) |

`app/` was left with routes, layouts, metadata, and composition only.
