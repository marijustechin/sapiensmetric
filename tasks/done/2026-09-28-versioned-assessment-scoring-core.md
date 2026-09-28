# T-016 — Versioned assessment scoring core (archived)

- **ID:** T-016
- **Type:** Implementation (pure TypeScript package; no UI/API/DB/deployment)
- **Created:** 2026-09-28
- **Archive date:** 2026-09-28
- **Final status:** Approved (human review granted)
- **Approved:** 2026-09-28
- **Baseline:** T-015 archived at commit `021760b`; no active task before this one.

---

> T-016 implemented a small, deterministic **versioned scoring core** in
> `@sapiensmetric/assessment`, with tests and continuity documentation. It was the
> proposed next slice from `docs/assessment-foundations.md` §7. No UI, API
> endpoints, database migrations, deployment, or external-account changes were
> made. Draft astronomy items remain **unreviewed** and are not used by the engine.

## Accepted outcome

The owner accepted T-016 on 2026-09-28. The package provides a pure, deterministic
scorer for one submitted attempt against one exact keyed form snapshot, with
explicit validation, a browser-safe projection, and no leakage of answer keys.

## Scope delivered

- Single answer (exact option-ID match), multiple select (exact set,
  order-independent, all-or-nothing), ordering (exact sequence, all-or-nothing),
  and numeric (finite value; explicit accepted value and **inclusive absolute
  tolerance**; unit label).
- Stable IDs for matching; each item worth one point; no weights, partial credit,
  guessing correction, IQ conversion, percentiles, mastery thresholds, adaptive
  selection, or timing.
- Versioned form snapshot input; explicit validation; submitted-versus-unfinished
  boundary; internal keyed data separated from a browser-safe projection.
- No astronomy, item-count, or objective hardcoding in the reusable engine.

## Deliverables

- `packages/assessment/src/types.ts` — versioned item/form/result types.
- `packages/assessment/src/errors.ts` — coded `AssessmentError`.
- `packages/assessment/src/scoring.ts` — validation + deterministic scorer.
- `packages/assessment/src/public-form.ts` — `toPublicForm` (strips answer keys).
- `packages/assessment/src/index.ts` — public API re-exports.
- `packages/assessment/src/scoring.spec.ts`,
  `packages/assessment/src/worked-example.spec.ts` — tests (synthetic fixtures).
- `packages/assessment/package.json`, `tsconfig.build.json` — vitest test script
  and a build that excludes specs.
- `docs/assessment-scoring.md` — API, rules, validation, versions, confidential
  vs browser-safe data, guarantees vs caller responsibilities, next slice.

## Key design choices

- **Exact snapshot, not version strings.** The scorer reads the actual item
  definitions; `scoringRuleVersion` is only checked for support (unsupported →
  rejected, never silently scored with current rules).
- **Full-form denominator.** Missing response entries count as **skipped**;
  `correct + incorrect + skipped === totalItems`; the denominator is never reduced.
- **Submitted only.** `scoreAttempt` throws `ATTEMPT_NOT_SUBMITTED` for anything
  other than `status === 'submitted'`.
- **Fail loudly.** Malformed definitions/responses throw coded errors; no partial
  result, no coercion, no silent duplicate discarding.
- **Confidential separation.** `KeyedFormSnapshot` is internal; `toPublicForm`
  and `ScoringResult` exclude answer keys and full item definitions.
- **Pure and immutable.** No I/O/clock/randomness; inputs are never mutated;
  repeated evaluation is identical.

## Moon-wording follow-up (documentation correction)

The T-015 report said AST-A4-004 implied the Moon "orbits a planet, not the Sun".
Inspection of the **live** document (`docs/pilot-item-samples.md`) found the
problem there too: EN option A read "It orbits a planet (Earth) rather than the
Sun" and the LT option mirrored it. That is misleading — the Earth and the Moon
**together** orbit the Sun; the Moon is Earth's natural satellite and the IAU
definition excludes satellites.

**Correction (AST-A4-004 r2, in the live item document; the historical T-015
archive is untouched):** prompt, options, key, explanation, and sources revised in
EN and LT to state that the Moon is Earth's **natural satellite** and that
satellites are excluded, explicitly noting the Earth–Moon system orbits the Sun
together. Source **S-014** (NASA, "Top Moon Questions") was added to
`docs/assessment-sources.md`. This is an AI-edited wording correction, **not**
independent content or language review; the item remains `draft — not reviewed`.

## Verification (at finalisation)

- `pnpm --filter @sapiensmetric/assessment test` → **38 tests pass** (2 files).
- `pnpm --filter @sapiensmetric/assessment typecheck` → pass.
- `pnpm --filter @sapiensmetric/assessment build` → pass; **no spec files in
  `dist/`**.
- `pnpm lint` → clean.
- `pnpm verify` → **EXIT 0** (`verify.sh` 702/0; `verify-static-export.sh` 93/0).
- The harness asserts T-016 outputs, that the root test chain runs the assessment
  tests, that the build excludes specs, and that the keyed package is **not**
  imported into `apps/web`.

## Remaining prerequisites (inherited; unchanged)

Independent astronomy content review and independent EN/LT language review
(assignment and completion) are **pending**; the two-role item review trail must
be operational before authoring at scale; O-002/O-003/O-006/O-007 and API
deployment remain open. **Scoring tests do not validate assessment content or
psychometric claims.**

## Preserved follow-ups (unchanged)

Publication/analytics follow-ups remain tracked in `docs/publication-status.md`
and `docs/publication-checklist.md`; the deployed frontend artifact remains
`64c4941cba87d08c` (operation `mulkgfk6-0768754a1976`).

## Non-goals (as scoped)

- UI, API endpoints, database migrations, deployment, Google-account changes.
- Drafting or reviewing astronomy items; exposure tracking; retake scheduling;
  practice delivery; item-bank selection; feedback delivery.
- Any claim above Tier 0; any IQ/percentile/mastery wording.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md`
3. `docs/assessment-scoring.md`
4. `docs/assessment-foundations.md`
5. `docs/knowledge-pilot-spec.md`
6. `docs/decisions.md` (O-002/O-003/O-006/O-007)
