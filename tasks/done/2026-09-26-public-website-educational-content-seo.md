# T-013 — Public website, educational content, and SEO foundation (archived)

- **ID:** T-013
- **Archive date:** 2026-09-26
- **Final status:** Approved (human review granted)
- **Type:** Feature (public web content, FSD widgets, SEO; no new dependency)
- **Created:** 2026-09-26
- **Approved:** 2026-09-26

---

> T-013 was accepted by human review on 2026-09-26, including the locale-link
> follow-up and the confirmed public contact update. The original scope, the
> follow-ups, verification evidence, and the unresolved publication inputs are
> preserved below.

## Objective and positioning

Build a useful bilingual public website with original educational content about
assessments before any assessment is released, presenting SapiensMetric as a
developing assessment project and stating on every public page that assessments
are **not available yet**. No tests, scores, norms, validation, credentials,
customers, testimonials, partnerships, team members, or launch dates are
invented. Educational discussion of IQ and percentiles is allowed when accurate
and separated from product claims.

## Pages (EN + LT)

Home, Assessment guide, Understanding results, About, Contact, Privacy, an
**Articles index** (`/{locale}/articles/`), and three articles
(`how-ability-tests-differ-from-knowledge-tests`,
`what-an-online-iq-test-can-tell-you`,
`why-percentage-correct-is-not-a-percentile`). Content is repository-managed
typed data in `apps/web/shared/content/*` (no CMS), rendered by
`shared/ui/content-page.tsx`; see `docs/content.md`.

## Contact and privacy

A monitored public contact address was initially not confirmed and recorded as a
pre-publication input. The owner later confirmed **info@sapiensmetric.eu**
(D-026); it is defined once (`PUBLIC_CONTACT_EMAIL` in
`shared/content/site.ts`) and published as a `mailto:` link on the EN/LT
Contact/Privacy pages and the footer, replacing the placeholder. Privacy
describes only implemented behaviour (no analytics/tracking; public browsing
needs no account; language preference is local; account features store what they
require). No contact-form backend.

## Claims guard

`shared/lib/claims-rules.ts` separates strict `PRODUCT_COPY_RULES` (message
catalogues) from `EDUCATIONAL_CONTENT_RULES` (public content), which allow
accurate educational IQ/percentile discussion and flag only unsupported product
claims or invented social proof. `content-claims-guard.test.ts` has an
allowed/disallowed matrix and scans the shipped content. Regex checks are a
safety net, not proof of scientific accuracy.

## SEO and structure

Unique title/description; canonical production URLs under
`https://sapiensmetric.eu`; self-referencing canonicals and reciprocal EN/LT
`hreflang` (`x-default` → English); locale switching to the equivalent page;
Open Graph with absolute production image URLs (no localhost);
`app/sitemap.ts` (public pages/articles only, truthful `lastModified`);
`app/robots.ts` (allows crawling so `noindex` is readable, not a substitute);
`noindex, nofollow` on auth/account/admin; a custom static 404. Public pages work
without the API; `/en/` and `/lt/` are independently discoverable.

## Follow-up: locale preservation in article links

**Cause:** next-intl resolves the locale for server-rendered links from the
request context; without a proxy/middleware the request locale is not derived
from the URL, so it fell back to the default (English) and `/lt/` pages linked to
`/en/articles/{slug}/`. (This is a locale-resolution issue, not an inherent
property of static export.)

**Fix:** server-rendered public links use `shared/lib/locale-links.ts`
(`localeHref(locale, path)`) with `next/link`; the route `locale` param is
threaded through the site shell to header/footer. Client components keep the
next-intl router for the language switch. Shared slugs, English default, and
remembered-language behaviour are preserved. Covered by
`shared/lib/locale-links.test.ts` and exported-HTML cross-locale anchor checks.

## Analytics boundary

No GA4, GTM, advertising, or tracking is loaded. The T-014 plan (Search Console,
single GTM→GA4 with consent, cookie settings, exclusions) is recorded in D-025
and `docs/publication-checklist.md`. No nonfunctional consent banner was added.

## Verification (at finalisation)

`pnpm verify` passed (lint, typecheck, tests, FSD boundary, build,
`verify-static-export.sh`, `verify.sh`); web tests 65. Export checks:
`verify-static-export.sh` covered public EN/LT routes, canonical/hreflang
production metadata (no localhost), `noindex`, sitemap/robots, the static 404,
the availability statement, no cross-locale public anchors, and the confirmed
contact `mailto`.

## Unresolved publication inputs (preserved)

- Operator legal/registration details (the operator **name** is recorded in
  D-026; no registration details, address, or legal status are asserted).
- Retention/consent specifics for account data.
- Hosting/HTTPS configuration and the public release scope for auth/API/admin
  (addressed by T-014).

---

## Approved-outcome summary

T-013 delivered a bilingual public website (Home, Assessment guide, Understanding
results, About, Contact, Privacy, an Articles index, and three articles) with
original educational content, a separated claims guard, SEO metadata
(canonical/hreflang/OpenGraph), a generated sitemap/robots, `noindex` on
non-public routes, a static 404, and no analytics. It also fixed the
article-link locale bug (locale-resolved hrefs) and published the confirmed
public contact **info@sapiensmetric.eu**. Human review accepted the task.
