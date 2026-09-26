# Public content authoring (T-013)

How to add or edit public site content. Content is repository-managed typed data
— no CMS, no database.

## Where content lives

- `apps/web/shared/content/site.ts` — site identity, navigation labels, shared
  strings, availability note, pre-publication inputs, and the reused sources.
- `apps/web/shared/content/pages.ts` — the six public pages (Home, Assessment
  guide, Understanding results, About, Contact, Privacy), English and Lithuanian.
- `apps/web/shared/content/articles.ts` — the articles, English and Lithuanian.
- `apps/web/shared/content/seo.ts` — metadata builder (canonical/hreflang/OG).
- `apps/web/app/[locale]/(site)/**` — thin route files that render content via
  `shared/ui/content-page.tsx`.

## Adding or editing an article

1. Add an entry to both `EN` and `LT` arrays in `articles.ts`. Required fields:
   `path`, `slug`, `title`, `description`, `h1`, `intro`, `blocks`, `updated`,
   and `sources` where factual statements rely on a source.
2. Use the **same `slug`** in both locales (the URL is `/{locale}/articles/{slug}/`).
   Author the Lithuanian text naturally; do not machine-translate.
3. Reference sources by id from `SOURCES` in `site.ts` (see
   `docs/research-sources.md`). Verify that each source actually supports the
   statement. Never copy source passages, items, or scoring rules.
4. Update `updated` to the review date (ISO `YYYY-MM-DD`).
5. Run `pnpm verify`. The **Articles index** (`/{locale}/articles/`), the
   sitemap, hreflang, and export checks update automatically from the content
   registry; the claims guard scans the content. The primary-navigation
   "Articles" entry is static and already links to the index.

Article pages are separate routes (`/{locale}/articles/{slug}/`) and each shows
its title, summary, review date, sources, and related links (the guide and the
other articles). The index lists every article with its summary and date.

## Editing a page

Edit `pages.ts` for the relevant key in both locales. Home/guide/results/about
carry `availabilityNote: true` so the "assessments not available yet" statement
is shown. Contact and Privacy describe only implemented behaviour.

## Locale-safe links (important)

Without a proxy/middleware, next-intl's **server-rendered** locale resolution
does not derive the locale from the URL and falls back to the default (English).
Any server component that links to a public page must therefore use
`localeHref(locale, path)` from `shared/lib/locale-links.ts` with `next/link`
(e.g.
`localeHref(locale, 'articles/' + slug)` → `/lt/articles/<slug>/`). The site
shell passes the route `locale` param to the header/footer. Client components
may keep the next-intl `i18n/navigation` convention. `verify-static-export.sh`
fails on any cross-locale public anchor in the exported HTML.

## Claims boundaries

- Educational discussion of IQ and percentiles is allowed when accurate.
- Never claim that SapiensMetric measures intelligence/IQ, is validated, is
  clinically usable, or supports hiring decisions.
- Never invent customers, testimonials, partnerships, team members, or launch
  dates.
- Keep engine checks honest: `shared/lib/claims-rules.ts` is a heuristic safety
  net, not proof of scientific accuracy. Human review is required.

## Preview and staging

- Preview builds carry `noindex` on non-public routes. Do not add localhost or
  preview URLs to canonical/OG metadata — canonicals are always
  `https://sapiensmetric.eu`.
- Staging indexing is prevented by `noindex` metadata (D-025); this is not
  access control.

## Pre-publication inputs

Recorded (with the Contact/Privacy pages) until confirmed: monitored public
contact address, operator identity/legal details, retention/consent specifics,
hosting/HTTPS configuration, public release scope for auth/API/admin, and
analytics IDs/consent (T-014). Never invent these.
