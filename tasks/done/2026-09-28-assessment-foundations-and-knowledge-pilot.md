# T-015 — Assessment foundations and first knowledge-pilot specification (archived)

- **ID:** T-015
- **Type:** Research / content design / documentation (no runtime, DB, API, or UI)
- **Created:** 2026-09-28
- **Archive date:** 2026-09-28
- **Final status:** Approved (human review granted)
- **Approved:** 2026-09-28
- **Baseline:** T-014 finalised at commit `ab8c5eb`; no active task before this one.

---

> T-015 prepared a reviewable assessment methodology and a concrete first
> **knowledge-pilot** specification. It was a documentation task — no assessment
> runtime, database migration, endpoint, or UI was implemented. The owner approved
> the decisions recorded below on 2026-09-28. Open decisions (O-002, O-003, O-006,
> O-007) remain open, the T-002 proposals remain proposals, and T-015 extends no
> claim above Tier 0.

## Accepted outcome

The owner accepted T-015 and approved: **astronomy** as the first knowledge pilot;
an **adults-only (18+)** initial audience; a **25-item proposed form** (final item
composition subject to content review); **documented provenance, sources, and
independent content/language review before publication** (approving the policy is
not item review); **post-submission answers, explanations, and sources**; a
**clearly labelled learning repeat** when insufficient unseen items remain,
distinct from a fresh assessment and not presented as independent improvement; and
**descriptive raw results only** within the existing claims boundaries.

## Owner-approved content-selection principle (2026-09-28)

> "We include a question because understanding its subject helps a person make
> sense of the world—and we can explain why it matters."

This principle (cultural understanding, historical perspective, scientific
understanding, informed judgment; relevance **not** reduced to practical or
employment utility) drives the "Why this matters" rationale attached to every
objective and item.

**Audience framing:** initial target audience **European**, EN (default)/LT
delivery; broader purpose a **defensible foundation of general literacy for
contemporary global life**; **geography guides presentation and context, not
inclusion**. **Not claimed:** a universal curriculum, a population-wide knowledge
standard, or secondary-school qualification equivalence.

## Delivered documents

- `docs/assessment-foundations.md` — entry point: product direction, the approved
  content principle and audience, knowledge-vs-ability separation, learning/
  feedback/exposure/retake policy, the future assessment contract, the evidence
  required for future ability scores, the approved decisions, remaining
  prerequisites, and the proposed next task.
- `docs/knowledge-pilot-spec.md` — the approved astronomy pilot: audience,
  language assumptions, objectives with "Why this matters", the 25-item blueprint,
  scoring (submitted vs unfinished), feedback, the user journey, example Tier 0
  result wording, and release prerequisites.
- `docs/pilot-item-samples.md` — **8 original bilingual review drafts** (EN/LT)
  with objective, "Why this matters", type, key, explanation, distractor
  rationale, source, provenance/rights, uncalibrated difficulty, concerns, and
  `draft — not reviewed` status. Stored in `docs/` (outside public content, public
  assets, and the static export).
- `docs/assessment-sources.md` — T-015 source register (S-008…S-013) with claims
  and limitations.

## Corrections applied before acceptance

- Recorded the owner-approved principle and European audience framing.
- Added a "Why this matters" rationale to every objective and item.
- Fixed the blueprint to a consistent **25-item** form (5 per objective), with
  form length, score denominator, and every example reconciled (the example is
  **17 correct of 25**; objective denominators total **25**, not 17).
- Distinguished **unfinished attempts** (progress + incomplete, no comparable
  score) from **submitted attempts** (full-form denominator; skipped = 0, reported
  separately); no scoring over the answered set.
- Rewrote the Moon item to "**visible illuminated portion**" (EN/LT).
- Resolved the feedback/exposure contradiction with one coherent policy; removed
  the unresolved "repeat or withhold" alternative in favour of a labelled
  **learning repeat**.
- Removed "Strongest here" wording; the example now states counts descriptively
  and warns that a one-item difference in a five-item section is not a stable
  strength or weakness.
- **De-duplicated AST-A4-004/AST-A4-005:** AST-A4-004 now tests the
  planet/**satellite** distinction (why the Moon is not a planet); AST-A4-005
  keeps the planet/**dwarf-planet** reasoning (why Pluto is a dwarf planet). They
  share no answer cue.

## Review limitations (preserved)

- Draft items are **AI-drafted and AI-edited**; this is **not** independent
  subject-matter or language review.
- **No independent review has been completed, and no reviewer is assigned.**
  Independent astronomy content review and independent EN/LT language review are
  **pending prerequisites** before publication.
- No item is calibrated, validated, or approved for use; no validity, reliability,
  norming, equivalence, mastery, ability, or IQ claim is made.

## Remaining prerequisites for publishing the pilot

- Assign and complete an **independent subject-matter reviewer** (astronomy).
- Assign and complete **independent EN/LT language reviewer(s)**.
- Make the **two-role item review trail** operational (author + independent
  reviewer) and approve the item provenance policy before authoring at scale.
- **O-006** data-protection/governance; **O-007** IP review; **O-003** validation/
  norming plan for anything beyond Tier 0.
- **API deployment** for live registered assessments (not scoped here).

## Proposed next task (not started or authorised)

The pure **versioned scoring core** in `@sapiensmetric/assessment`: versioned types
for items/forms/scoring rules and a deterministic scorer for single-answer,
ordering, multiple-select, and numeric items, with unit tests (no UI/DB/network).
See `docs/assessment-foundations.md` §7. It is a proposal only; it is **not**
started or authorised, and it is gated on the prerequisites above.

## Preserved follow-ups (unchanged by T-015)

Publication/analytics follow-ups remain tracked in `docs/publication-status.md`
and `docs/publication-checklist.md`: GA4 settings review, Search Console sitemap
ingestion (not confirmed), the Realtime `/en/assessment-guide` vs
`/en/assessment-guide/` duplicate (cause not established), and GA4 report-level
verification. The deployed frontend artifact remains `64c4941cba87d08c`
(operation `mulkgfk6-0768754a1976`).

## Non-goals (as scoped)

- Implementing assessment runtime, database migrations, endpoints, or UI.
- Deployment, Google-account changes, or publishing the API.
- Resolving O-002/O-003/O-006/O-007 or approving the T-002 proposals.
- Any claim above Tier 0; any IQ/percentile/pass/mastery wording.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md`
3. `docs/assessment-foundations.md`
4. `docs/knowledge-pilot-spec.md`
5. `docs/pilot-item-samples.md`
6. `docs/assessment-sources.md`
7. `docs/decisions.md` (D-006/D-007/D-008; O-002/O-003/O-006/O-007)
