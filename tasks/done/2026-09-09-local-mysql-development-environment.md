# T-004 — Local MySQL 8.0.46 development environment with Docker Compose (archived)

- **ID:** T-004
- **Archive date:** 2026-09-09
- **Final status:** Approved (human review granted)

---

## Original task definition

# T-004 — Local MySQL 8.0.46 development environment with Docker Compose

- **ID:** T-004
- **Status:** Ready for human review
- **Type:** Implementation (local development infrastructure)

### Objective

Create a reproducible local MySQL environment that matches the observed
vHosts major/minor version (MySQL 8.0.46). This is local development
infrastructure only; it must not connect to, alter, or validate vHosts.

### Inputs

- `AGENTS.md`, `TODO.md`, `docs/architecture.md`, `docs/testing.md`,
  `README.md`, `.gitignore`.

### Required implementation scope

- Root `compose.yaml` using the Docker Official Image `mysql:8.0.46`.
- One `db` service only; no phpMyAdmin, Redis, API, web container, or other
  services.
- Named persistent volume.
- Bind the database port to `127.0.0.1` only, using host port `3307`.
- `utf8mb4` server character set and an explicit MySQL 8 collation.
- A dedicated non-root local application database user and password.
- A separate MySQL root password.
- No empty-password configuration; neither `.env` nor any real credentials may
  be committed.
- Healthcheck using `mysqladmin`, authenticating as the non-root local database
  user where feasible.
- `.env.example` with non-production local variable names.
- A local `.env` created only for execution and ignored by Git.
- Clear README/docs commands for start, status, logs, SQL shell, stop, and a
  separately labelled destructive reset command.
- Verify the running database with `docker compose config`, `docker compose up
  -d`, `docker compose ps`, and a SQL query proving MySQL version and utf8mb4.

### Required outputs

- `compose.yaml`, `.env.example`, `docs/local-development.md`, `README.md`,
  `.gitignore`.

### Non-goals

- No TypeORM, mysql2, Node-to-MySQL connection, entities, migrations, schema,
  seed data, auth, API code, item data, vHosts access, deployment, commit, or
  push.
- Never run `docker compose down -v` unless an explicit later instruction asks
  for the destructive reset.

### Acceptance criteria

- `docker compose config` validates the compose file.
- `docker compose up -d` starts a single `db` container using `mysql:8.0.46`.
- `docker compose ps` shows the `db` service healthy.
- A SQL query confirms the running server version and utf8mb4 configuration.
- The database port is bound to `127.0.0.1:3307` only.
- The non-root application user can connect to the named local database
  (local-only).
- `.env` is not tracked by Git; no credentials are committed.
- No commit or push.

---

## Completion report

```text
T-004 — Completion report
--------------------------
Status: Approved (human review granted)
Outputs produced:
  compose.yaml
  .env.example
  docs/local-development.md
  README.md (local-database section added)
  .gitignore (.env rule added)
  .env (local only, Git-ignored, values redacted)
Verification run:
  docker compose config --quiet → ok (exit 0)
  docker compose up -d → db started (mysql:8.0.46)
  docker compose ps → db "Up (healthy)", 127.0.0.1:3307->3306
  SQL: VERSION()=8.0.46, character_set_server=utf8mb4,
       collation_server=utf8mb4_0900_ai_ci,
       non-root app user connected to sapiensmetric_dev
  bash -n scripts/verify.sh → syntax OK
  bash scripts/verify.sh → passed
  pnpm verify → passed
  git check-ignore .env → ignored
What was intentionally NOT done:
  No TypeORM, mysql2, Node-to-MySQL connection, entities, migrations, schema,
  seed data, auth, API code, item data, vHosts access, deployment, commit, or
  push. No docker compose down -v.
Blockers / dependencies for the next task:
  None for local dev DB. The healthy container was left running.
```

---

## Approved-outcome summary

T-004 delivered a reproducible local MySQL 8.0.46 environment via Docker
Compose: a single `db` service using `mysql:8.0.46`, `utf8mb4` with collation
`utf8mb4_0900_ai_ci`, a named persistent volume, `127.0.0.1:3307` binding, a
non-root application user plus a separate root password, a `mysqladmin`
healthcheck, and `.env.example`/`.env` separation with `.env` Git-ignored.
Verification confirmed version 8.0.46, utf8mb4, and the non-root app user's
connectivity to the named local database.

## Produced files

- `compose.yaml`
- `.env.example`
- `docs/local-development.md`
- `README.md` (updated)
- `.gitignore` (updated)

## Verification evidence

- `docker compose config --quiet` — valid.
- `docker compose up -d` / `docker compose ps` — single healthy `db` container.
- SQL: version `8.0.46`; `character_set_server=utf8mb4`;
  `collation_server=utf8mb4_0900_ai_ci`; non-root app user connected.
- `bash scripts/verify.sh` and `pnpm verify` — green.

## Confirmation

No TypeORM, Node-to-MySQL connection, authentication, schema, vHosts access,
commit, or push occurred. The local `.env` was never committed and its values
are not recorded here.
