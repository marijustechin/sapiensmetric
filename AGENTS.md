# AGENTS.md — Working rules for Sapiens Metric

This file is the entry point for every human or AI contributor working on this
repository. Read it first, every time, before doing anything else.

## What this project is

Sapiens Metric is a **serious cognitive-ability and knowledge-assessment
platform**, not a quiz website. Long-term ambition: a credible, explainable,
validated assessment product that could eventually be suitable for
organisational use. Until psychometric validation and representative norming
exist, the product must **not** claim to produce a real IQ score, clinical
diagnosis, hiring recommendation, or scientifically validated assessment.

See `docs/product-brief.md` and `docs/assessment-principles.md`.

## Mandatory workflow for every future task

1. Read `AGENTS.md` (this file).
2. Read `docs/` files relevant to the task (at minimum the ones the task points
   to under "Required reading order").
3. Read `tasks/current.md` to confirm which task is active and its status.
4. Work on **one task at a time**. Do not start a second task.
5. Do not expand scope silently. If a task is ambiguous, missing a dependency,
   or looks like it needs more work than described, **stop and ask**; do not
   invent requirements or add unrequested features.
6. When a task is complete, stop and hand the result to a human for review.
   Do **not** archive a task or move it to `tasks/done/` until a human has
   reviewed and approved it.
7. Do not commit, push, or open PRs unless explicitly asked.

## Tooling and package rules

- Package manager: **pnpm only**. Never use `npm` or `yarn`.
- Repository layout: pnpm monorepo (see `docs/architecture.md`).
- Assessment/scoring logic must remain an independent, pure TypeScript package
  with no UI, framework, or database dependencies.

## Hard constraints (never violate)

- No copying or reconstruction of proprietary test items or protected
  instruments (Raven, Mensa, WAIS, etc.).
- No claims of IQ scores, clinical diagnosis, hiring recommendations, or
  scientific validation before psychometric validation and norming exist.
- PostgreSQL and Prisma are **out of scope** for this project.

## Bootstrap-phase restrictions

These restrictions apply during the current bootstrap phase only:

- No Redis, no queues, no microservices, no authentication implementation.

Later capabilities (authentication, queues, additional data stores, and any
other capability restricted above) require an explicit recorded decision in
`docs/decisions.md` and an explicitly scoped task before they are added. They
must **not** be added speculatively.
