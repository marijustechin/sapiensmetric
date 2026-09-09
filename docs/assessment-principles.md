# Assessment principles — Sapiens Metric

## The serious-assessment principle

Sapiens Metric currently reports performance on specified, versioned tasks
through structured items with explicit, reproducible scoring rules. Every item
has a defined correct answer or scoring rubric, and every score is derivable
from those rules. Today results are presented as task-performance scores. A
future goal is that reliability and validity evidence may eventually support
interpreting those scores as cognitive-ability or knowledge constructs for a
specific intended use; until then no score is labelled an ability or knowledge
estimate, and every report explains what the number does and does not mean.

## Scientific and ethical boundaries

- **No IQ claims.** We do not produce or imply an IQ score. Psychometric
  validity and representative norming do not yet exist for this instrument.
- **No clinical diagnosis.** We are not a diagnostic tool and make no medical
  or psychological claims.
- **No hiring recommendations.** The product must not recommend employment
  decisions until it has been validated for that purpose.
- **No scientific-validation claims.** We describe the platform as
  "exploratory" or "pre-validation" until evidence justifies stronger language.
- **No proprietary content.** We do not copy or reconstruct items from
  protected instruments (Raven, Mensa, WAIS, etc.). All items are original or
  from legally usable sources, with provenance recorded.

## Language-neutral vs. localised content

Test content is handled in three categories:

1. **Language-neutral items** — items that do not depend on a specific language
   (e.g. geometric/numerical/visual patterns). One canonical item, shared
   across both Lithuanian and English presentations.
2. **Lithuanian items** — items authored for Lithuanian speakers, tagged `lt`.
3. **English items** — items authored for English speakers, tagged `en`.

Items carry an explicit language scope tag. Localisation is not free-text
translation of an item that changes its psychometric meaning; a localised
variant is a distinct, versioned item that references its source item
(S-002).

## Versioning requirements

Every versionable artefact carries a monotonically increasing version:

- **Tests** — a test is a versioned collection of item references plus timing
  and scoring configuration.
- **Items** — each item and each localised variant has its own version.
- **Scoring rules** — the algorithm/weights that map responses to scores are
  versioned independently of items.
- **Results** — a stored result records the exact versions of the test, items,
  and scoring rules used to produce it, so any historical score is
  reproducible.

Rule: changing an item, its scoring, or its language variant creates a new
version; it never silently mutates an old one.

## Norming and validation (deferred)

Representative norming, reliability, and validity studies are planned but not
started. Until then all claims remain bounded by the boundaries above.
