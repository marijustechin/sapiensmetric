# GTM container — GTM-WRBRTKRT (consent-controlled GA4)

Reproducible configuration for the SapiensMetric public website's GA4
(`G-0CR4C3KPH3`) through Google Tag Manager (`GTM-WRBRTKRT`). GTM is the single
GA4 installation path; there is no separate `gtag.js`.

> Preparing this configuration does **not** activate collection. The owner
> imports, previews, and publishes the container separately, then deploys the
> frontend that loads GTM only after consent.

## Files

- `container-GTM-WRBRTKRT.json` — container file in the **GTM UI import/export
  format**; locally validated (see "Import format and local validation"). The GTM
  importer still has to accept it — that can only be confirmed by an
  owner-operated import + Preview.
- This README — authoritative setup and settings.
- `scripts/verify-gtm-container.mjs` (`pnpm verify:gtm`) — local format validator.

## Import format and local validation

An earlier revision was rejected by the GTM UI with:

> Error deserializing enum type [Type]. Unrecognized value [template].

Cause: the file used **REST API-style lowercase enums** (`template`, `list`,
`map`, `integer`, `equals`) which are **not** importable. The GTM UI export
format uses **UPPERCASE enum values** for `Parameter.type` and condition types,
while tag/variable **template identifiers stay lowercase**. Do not "fix" this by
uppercasing every `type`.

Confirmed against genuine GTM exports (Google
`google-marketing-solutions/ga4-ecom-attributor`, `dataLayer-shopify`, `gtm4wp`,
`OneUptime`, `Bounteous-Inc/utmz-replicator`):

- Parameter `type`: `TEMPLATE`, `LIST`, `MAP`, `INTEGER`, `BOOLEAN`
  (nested `map`/`list` rows too).
- Custom-event filter `type`: `EQUALS` (also `CONTAINS`, `MATCH_REGEX`, …).
- `consentSettings.consentStatus`: `NEEDED`; `consentType` is a `LIST` of
  `TEMPLATE` values.
- Tag `type` stays lowercase: `googtag`, `gaawe`; Data Layer variable `type` is
  `v`; built-in variable `type` is uppercase (`EVENT`, `PAGE_URL`, …).

`pnpm verify:gtm` re-checks all of the above and fails if a lowercase enum
reappears. **This is local validation only** — it does not prove the importer
accepts the file. Successful import/Preview must be observed in the GTM UI before
any claim of activation (none has been made).

## Tag template (current)

The GA4 configuration uses the **Google tag** template (`googtag`, Tag ID =
`G-0CR4C3KPH3`), not the legacy "GA4 Configuration" (`gaawc`). The page view uses
the **GA4 Event** template (`gaawe`). If the import labels the Google tag
differently or rejects a field, recreate the item manually from the tables below.

## Required items

Tags:

| Tag | Template (`type`) | Fires on | Key settings |
| --- | --- | --- | --- |
| Google tag - GA4 | Google tag (`googtag`) | `CE - gtm.js (container init)` | Tag ID `G-0CR4C3KPH3`; config settings: `send_page_view=false`, `page_location={{DL - page_location}}`, `page_referrer={{DL - page_referrer}}`; Consent: requires `analytics_storage` |
| GA4 - Page View | GA4 Event (`gaawe`) | `CE - spa_page_view` | Event `page_view`; params `page_location`, `page_path`, `page_title`, `page_referrer` (Data Layer variables); Consent: requires `analytics_storage` |

Triggers:

| Trigger | Type | Condition |
| --- | --- | --- |
| CE - gtm.js (container init) | Custom Event | `{{_event}}` equals `gtm.js` |
| CE - spa_page_view | Custom Event | `{{_event}}` equals `spa_page_view` |

Variables (Data Layer, version 2):

| Variable | Data Layer name |
| --- | --- |
| DL - page_path | `page_path` |
| DL - page_location | `page_location` |
| DL - page_title | `page_title` |
| DL - page_referrer | `page_referrer` |

## URL sanitisation at Google-tag configuration level

Sanitisation does not rely on the custom event alone. Before GTM is injected, the
frontend pushes a sanitised page context and the Google tag sets
`page_location`/`page_referrer` from it, so automatically collected context cannot
fall back to unsanitised URLs:

- `page_location` = origin + path only (no query string, no fragment).
- `page_referrer` = same-origin `origin + path` only; cross-origin referrers are
  omitted entirely (empty).
- `send_page_view=false` on the Google tag prevents an automatic page view; the
  single page view comes from the `spa_page_view` event, which carries the same
  sanitised values.
- GA4 **Enhanced Measurement** page views/history must be **off** (below) so no
  automatic event can emit an unsanitised URL.

## How it coordinates with the frontend

- The frontend injects `gtm.js` **only after** explicit analytics consent, on the
  production host and eligible public routes, pushing in this order: consent
  default (advertising denied) → consent update (`analytics_storage` granted) →
  sanitised page context → `gtm.js` → one `spa_page_view`. Consent is therefore
  established before the Google tag fires.
- Before consent there are no tag-manager/analytics requests and no analytics
  cookies. Withdrawal persists rejection, removes analytics cookies where
  accessible, and reloads (interrupting any in-flight GTM load).
- Advertising consent stays denied; do not add advertising, remarketing, Google
  Signals, or user-provided-data tags.

### Consent command format (must be a gtag Arguments object)

GTM only processes Consent Mode commands when the dataLayer message is an
**Arguments object** — the shape produced by the standard helper
`function gtag(){ dataLayer.push(arguments); }`. GTM's dataLayer dispatch checks
`Array.isArray(message)` first, so a plain Array such as
`['consent','default',{...}]` is routed to the Array/global-method branch and the
`consent` command is **silently dropped**; Consent Mode then stays "not
configured" (`google_tag_data.ics.usedDefault === false`) and tags that require
consent are not gated. The frontend therefore uses `createGtagLayerPush`
(`apps/web/shared/lib/analytics.ts`); do not replace it with a plain array.

Checked against the real runtime: `scripts/verify-consent-gtm-runtime.mjs`
(`pnpm verify:consent-runtime`) loads the deployed container runtime and asserts
`ics.usedDefault === true` for the Arguments shape and `=== false` for a plain
Array. This is a **frontend** requirement — the GTM container's consent settings
(`analytics_storage` required; advertising denied) are unchanged.

## GA4 Enhanced Measurement (actual state, owner-confirmed 2026-09-28)

The owner **disabled and saved** Enhanced Measurement **"Page changes based on
browser history events"**. **Do not record all Enhanced Measurement as disabled:**
the other options remained **enabled** at that time.

The remaining Enhanced Measurement options and the **Google Signals / advertising
personalisation** settings have **not** been confirmed and remain **pending** a
dedicated review. In the current build, an unsanitised automatic `page_view` is
prevented by the Google tag's `send_page_view=false` together with the disabled
history-based page changes; the production check below observed exactly one
sanitised `page_view` per transition.

## Publication and production verification (owner-confirmed 2026-09-28)

- The container **GTM-WRBRTKRT** was **published** with version name
  **"GA4 – consent-gated public site"**. The **numerical version ID was not
  supplied** and is not asserted here.
- Real **Tag Assistant** at `spa_page_view` showed **all four defaults denied**,
  then `analytics_storage` **granted** while `ad_storage`, `ad_user_data`, and
  `ad_personalization` remained **denied**.
- After publication the owner tested **outside Preview in an incognito window**;
  GA4 **Realtime** received EN/LT page and article views.
- Realtime also displayed both `/en/assessment-guide` and
  `/en/assessment-guide/`. **The cause is not established.** A controlled
  production check of the **current** deployment (below) did **not** reproduce a
  duplicate row; per-request payloads were consistently the slash-less form.

### Controlled production collection check (current behaviour)

Run outside Preview in a fresh browser profile on the deployed artifact
`64c4941cba87d08c`: accept analytics → Articles → open an article → switch locale
→ reload. The actual `region1.google-analytics.com/g/collect` payloads were:

| Transition | `page_view` events | measurement ID | `page_location` (dl) |
| --- | --- | --- | --- |
| Accept (`/en/`) | 1 | `G-0CR4C3KPH3` | `https://sapiensmetric.eu/en` |
| → Articles | 1 | `G-0CR4C3KPH3` | `https://sapiensmetric.eu/en/articles` |
| → article | 1 | `G-0CR4C3KPH3` | `https://sapiensmetric.eu/en/articles/why-percentage-correct-is-not-a-percentile` |
| → locale LT | 1 | `G-0CR4C3KPH3` | `https://sapiensmetric.eu/lt/articles/why-percentage-correct-is-not-a-percentile` |
| reload | 1 | `G-0CR4C3KPH3` | `https://sapiensmetric.eu/lt/articles/why-percentage-correct-is-not-a-percentile` |

Exactly **one** `page_view` per transition/reload; a **consistent slash-less**
`page_location`/`page_path` policy; **no query strings or fragments**; correct
measurement ID. This is observed **request-payload** evidence, not a GA4 report
inspection — aggregate Realtime counts were not used to infer duplication. The
historical `/en/assessment-guide/` (trailing slash) row is therefore **not**
produced by the current frontend sequence; its origin remains unestablished.

## Requires confirmation on import

> **Owner-confirmed done (2026-09-28):** the corrected container was imported into
> **SM-Workspace**, both tags were reviewed, and the container was **published**
> (version name "GA4 – consent-gated public site"). This checklist is kept for
> reproducibility and re-import.

The owner must confirm these in the GTM UI after import (or recreate manually):

1. The configuration item is a **Google tag** (`googtag`) with Tag ID
   `G-0CR4C3KPH3`; the config settings `send_page_view=false`, `page_location`,
   `page_referrer` are present.
2. The event tag is a **GA4 Event** (`gaawe`) with event name `page_view` and
   parameters `page_location`, `page_path`, `page_title`, `page_referrer`. This
   file uses the classic `eventParameters` table (`name`/`value` rows). Some
   current GTM exports instead emit the equivalent table as `eventSettingsTable`
   (`parameter`/`parameterValue` rows). If the imported tag shows the parameters
   empty, re-add them manually — or switch the key/row keys to the
   `eventSettingsTable` form. Confirm in Preview; do not assume.
3. Both tags have **Consent Settings → require `analytics_storage`**.
4. The two Custom Event triggers use the built-in `{{_event}}` variable.
5. The four Data Layer variables resolve to the names above.
6. Publishing is done only after a successful **Preview** (see below).

Local format validation (`pnpm verify:gtm`) passing is a necessary but **not
sufficient** condition. Only the GTM UI import result and a Preview confirm the
container.

## Browser test procedure (exercise the production host gate locally)

`localhost` is deliberately **ineligible** (only `sapiensmetric.eu` is), so
Accept cannot load GTM there. To test locally without weakening that rule and
without sending traffic to Google, map the production hostname to your machine
and **block** the Google endpoints:

1. Build/serve the release: `pnpm build:public` then
   `python3 -m http.server 4322` in `dist/public-site/`.
2. Open Chrome with:
   `--host-resolver-rules="MAP sapiensmetric.eu 127.0.0.1"` and visit
   `http://sapiensmetric.eu:4322/en/` (the hostname is now production, so the
   gate is eligible).
3. In DevTools → **Network**, add **Blocked URLs**:
   `*googletagmanager.com*` and `*google-analytics.com*` (no request reaches
   Google).
4. Verify: before consent and after **Reject**, no Google requests and no `_ga`
   cookies; after **Accept**, one attempted `googletagmanager.com/gtm.js` request
   (blocked) and the `dataLayer` order consent → page context → `gtm.js` →
   one `spa_page_view`; footer **Cookie settings → Reject** reloads and stops
   collection.

A headless variant of this procedure was used for the T-014 evidence; it does
**not** validate the real imported container — that requires GTM **Preview**.

## Import and activation sequence

1. Deploy the frontend that contains the consent gate (`pnpm build:public`).
2. Run `pnpm verify:gtm` locally (quick format check before touching GTM).
3. GTM → **Admin → Container Import** → `container-GTM-WRBRTKRT.json` into a new
   workspace; review the "Requires confirmation" items, then **Save** and open
   the imported tags to confirm parameter tables populated.
4. **Preview** on the mapped host, then publish.
5. Re-verify: no requests before consent; one `page_view` after consent and on
   navigation; withdrawal stops collection.

## If the import still fails (needed: a genuine export sample)

Report the exact importer error. If a field is still rejected, export a **minimal
scratch container** from your own GTM (Admin → **Export Container**, choose the
workspace, include everything) that contains exactly the shape you need, and
compare it with this file:

1. One **Google tag** with Tag ID `G-0CR4C3KPH3` and one configuration setting
   (e.g. `send_page_view` = `false`).
2. One **GA4 Event** tag with event name `page_view` and **one** event parameter
   (`page_location` ← `{{DL - page_location}}`), plus a Data Layer variable named
   `DL - page_location`.
3. One **Custom Event** trigger for `spa_page_view` (Custom Event, `{{_event}}`
   equals `spa_page_view`).
4. Consent Settings set to **require `analytics_storage`** on at least one tag.

That single exported container shows the exact `type` casing, nested-table keys,
and consent structure your GTM version emits — enough to reconcile this file
without exporting anything sensitive (it contains no real data).

See `docs/release-hosting.md` and `docs/publication-checklist.md` for deployment
and remaining owner actions.
