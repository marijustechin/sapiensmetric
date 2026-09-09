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
