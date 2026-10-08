# Deployment records

This directory holds durable records of frontend deployments, written by the
`Deploy public frontend` workflow (`.github/workflows/deploy.yml`) after a
successful production deployment. Each file is named
`<UTC timestamp>-<source commit>.md` and records the source commit, workflow run
URL, content-based artifact id, operation id, destination, the encrypted-baseline
artifact reference, and the rollback command.

- The deploy workflow ignores changes under `docs/deployments/**`, and the record
  commit uses `[skip ci]`, so a record never triggers another deployment.
- These records are **discoverable history**, not the source of truth for the
  current release: the live state is in `../publication-status.md`.
- Do not edit or delete historical records to match later state; add a new record.

CI-written records are best-effort (`continue-on-error`): if the record commit
cannot be pushed (for example a concurrent push), the run summary still carries
the same information. This `continue-on-error` applies **only** to this
supplementary record — never to backup persistence. The encrypted pre-deployment
baseline is captured, uploaded, downloaded, decrypted and validated by mandatory
steps, and any baseline failure stops the deployment before a single production
PUT. See `../release-hosting.md` and `../deployment-webdav.md`.
