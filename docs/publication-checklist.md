# Publication-input checklist (T-013)

Inputs that must be resolved by a human before the public site is treated as
published. Nothing here is invented in the codebase.

## Content and legal
- [x] Public contact address `info@sapiensmetric.eu` (owner-confirmed mailbox;
      published as a `mailto:` link on the Contact and Privacy pages and in the
      public footer). Transactional email separately uses `SMTP_FROM`
      (`website@sapiensmetric.eu`); SMTP configuration is unchanged.
- [ ] Operator identity and legal/registration details (About/Privacy).
- [ ] Retention, consent, and access-control specifics for account data.
- [ ] Review of the Privacy page against the actually deployed behaviour.

## Hosting and transport
- [ ] Production hosting for the static export with directory-style routes.
- [ ] HTTPS certificate and canonical-origin enforcement (`https://sapiensmetric.eu`).
- [ ] Confirm staging/preview builds carry `noindex` (D-025) and are not publicly
      indexable.
- [ ] Confirm no localhost/preview URL is present in production metadata.

## Public release scope (auth/API/admin)
- [ ] Decide the public scope of auth, account, admin, and the API; direct routes
      remain reachable regardless of navigation visibility.
- [ ] Confirm API authorisation (unchanged) is the control, not hidden links.

## Analytics and consent (T-014)
- [ ] Search Console domain verification and sitemap submission.
- [ ] GA4 delivered through a single GTM container (no duplicate tracking).
- [ ] Analytics loaded only after consent, with rejection and withdrawal paths.
- [ ] Cookie settings matching the actually deployed services.
- [ ] Exclusion of credentials, email addresses, tokens, admin data, and
      assessment answers from analytics.
- [ ] No nonfunctional consent banner or Cookie settings control is published.

## SEO
- [ ] Confirm canonicals/hreflang and sitemap after the production domain is live.
- [ ] Confirm only public pages are listed in `sitemap.xml`.
