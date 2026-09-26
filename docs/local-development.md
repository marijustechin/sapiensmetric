# Local development — MySQL 8.0.46 via Docker Compose

Local, non-production MySQL development environment. It matches the observed
vHosts major/minor version (MySQL 8.0.46) but is entirely local; it does not
connect to, alter, or validate vHosts.

## Prerequisites

- Docker and Docker Compose.

## Setup

```bash
cp .env.example .env   # then edit values; never commit .env
docker compose up -d   # start the db container
```

The database binds to `127.0.0.1:3307` only. It uses `utf8mb4` and collation
`utf8mb4_0900_ai_ci`, and creates a non-root application user and database
from `.env`.

## Unified local port profile

`.env.example` defines one local profile; use it as the single source of truth:

| Service | Local URL | Source |
| --- | --- | --- |
| Web (`pnpm --filter @sapiensmetric/web dev`) | `http://localhost:3333` | web `dev` script (`next dev -p 3333`) |
| API (Nest listener) | `http://localhost:3334` | `API_PORT` |
| MySQL (Docker Compose) | `127.0.0.1:3307` | `DB_PORT` |

Derived values (must stay consistent with the profile):

- `CORS_ORIGIN` = `PUBLIC_APP_URL` = the web origin (`http://localhost:3333`).
  The API rejects a mismatch after canonicalisation, and web content is
  served/built at this origin.
- `NEXT_PUBLIC_API_BASE_URL` = the API origin (`http://localhost:3334`); the
  static web build fails closed if it is missing or invalid.
- `GOOGLE_REDIRECT_URI` (optional) = `http://localhost:3334/auth/google/callback`
  — the callback is served by the API listener, so it uses the API port.

The web dev server is pinned to `3333` by the web package `dev` script, so
`pnpm --filter @sapiensmetric/web dev` needs no extra CLI argument. The API port
is deliberately `3334`, not `3333`, so it does not collide with the web dev
server. Production may sit behind a reverse proxy, so the public API URL port
need not equal `API_PORT`.

## Common commands

```bash
docker compose up -d          # start
docker compose ps             # status (wait until the db service is "healthy")
docker compose logs -f db     # follow logs
docker compose exec db sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'   # SQL shell (app user)
docker compose stop           # stop (keeps data)
docker compose start          # start again (keeps data)
```

## Destructive reset (separate, do not run casually)

```bash
docker compose down -v        # DESTRUCTIVE: removes the container AND the
                              # named volume (all local data). Requires
                              # explicit separate authorisation.
```

## Verification

```bash
docker compose config --quiet        # validate compose file
docker compose up -d                 # start
docker compose ps                    # confirm healthy
docker compose exec db sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT VERSION(); SHOW VARIABLES LIKE \"character_set_server\"; SHOW VARIABLES LIKE \"collation_server\";" "$MYSQL_DATABASE"'
```
