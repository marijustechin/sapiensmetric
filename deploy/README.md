# SapiensMetric closed-review deployment (T-023)

Exact, root-executed operations to install the SapiensMetric closed production
review on the shared Oracle host (`79.76.117.246`, `sokoladas-demo`) **alongside**
Sokoladas. Repository preparation is complete; the live install requires root —
see `docs/closed-review-deployment.md` for the access requirement and the
Sokoladas-protection sequence.

> **Ordering rule:** do not activate the closed frontend profile
> (`.github/workflows/deploy-closed.yml`) until the API is up and the owner
> access/eligibility are verified.

## Quick path — the exact commands the owner runs

The reviewed bundle has been staged on the host (non-privileged SSH) under
`/home/marijus/sapiensmetric-install/<source-sha>/`. The owner runs, from their
workstation:

```sh
ssh -i ~/.ssh/id_ed25519_oracle marijus@79.76.117.246
```

Then, on the host:

```sh
cd /home/marijus/sapiensmetric-install/<source-sha>
sudo SMTP_PASSWORD_SOURCE_FILE="$PWD/smtp_password" \
  bash install-closed-review.sh "$PWD" --dry-run
sudo SMTP_PASSWORD_SOURCE_FILE="$PWD/smtp_password" \
  bash install-closed-review.sh "$PWD"
```

(Replace `<source-sha>` with the directory name shown by `ls`.) The installer is
idempotent and never prints secrets; it removes the staged `smtp_password` after a
successful install. After signing in, read and delete the initial credential:

```sh
sudo cat /etc/sapiensmetric/initial-credentials/owner-initial-password
sudo rm  /etc/sapiensmetric/initial-credentials/owner-initial-password
```

Alternatively, prepare `deploy/images.env`, `deploy/hostenv` and
`deploy/smtp_password` locally and run `bash deploy/run-install.sh` (same
installer, staged over SSH; no passwordless sudo/Docker added).

## What the installer does

1. Validates the configuration (immutable `@sha256:` image pins, required host
   variables, `CORS_ORIGIN == PUBLIC_APP_URL`, rendered `docker compose config`).
2. Stages `compose.yaml`, `images.env`, `hostenv` to `/opt/sapiensmetric-review`.
3. Generates secrets into root-only files (idempotent; the SMTP password is
   installed from the file you provide, never echoed).
4. Rolls out the proxy routing in **two phases**: an HTTP-ACME-only config
   (`nginx -t` then reload), certificate issuance via the existing certbot
   container, then the full config (`nginx -t` then reload). The running
   `nginx.conf` is backed up to `/opt/sokoladas-staging/state/backups/` before any
   change, and the Sokoladas release template is refreshed.
5. Starts the SapiensMetric `db`, runs `migrate` (explicit), starts `api`, and
   waits for `https://api.sapiensmetric.eu/health/ready` = `200`.
6. Provisions the owner account (`--password-out`), then checks that
   `POST /auth/register` returns `403`.
7. Prints recovery/rollback commands.

## Recovery

The `/opt/sapiensmetric-review` directory is `root:root 0750`, so a non-root user
cannot `cd` into it. Always use absolute paths / `--project-directory` (never a
plain `cd`):

```sh
# Restore the Sokoladas proxy to its pre-install state:
sudo cp -a /opt/sokoladas-staging/state/backups/nginx.conf.<stamp> \
           /opt/sokoladas-staging/releases/<releaseId>/proxy/nginx.conf
docker exec <proxy> nginx -t && docker exec <proxy> nginx -s reload

# Stop the SapiensMetric project WITHOUT deleting data:
docker compose -p sapiensmetric-review --project-directory /opt/sapiensmetric-review down

# Roll back the API image only (the database schema is forward-only):
#   edit /opt/sapiensmetric-review/images.env to the previous API_IMAGE digest, then
docker compose -p sapiensmetric-review --project-directory /opt/sapiensmetric-review up -d --force-recreate api
```

## Manual (equivalent) steps

The same operations, if you prefer to run them by hand, are described in
`docs/closed-review-deployment.md` §4–§6; the installer implements exactly that
sequence.

## Backups

See the backup/rollback section in `docs/closed-review-deployment.md` §7. The
installer performs **no** database dump; take one with the documented command and
keep it off-host. A durable scheduled off-host destination for SapiensMetric is
still a follow-up.
