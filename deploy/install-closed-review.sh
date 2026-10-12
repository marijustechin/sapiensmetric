#!/usr/bin/env bash
#
# install-closed-review.sh — privileged installer for the SapiensMetric closed
# production-review environment on the shared Oracle host (T-023).
#
# RUN AS ROOT ON THE HOST (`sudo bash install-closed-review.sh <staging-dir>`).
# It is additive and idempotent:
#   * never touches the Sokoladas database, volumes or compose;
#   * backs up the running proxy config before any change and validates with
#     `nginx -t` before every reload;
#   * generates secrets directly into root-only files (never printed);
#   * provisions the owner account writing a generated initial credential to a
#     root-only file instead of printing it;
#   * removes the staged SMTP secret after a successful install.
#
# Deployment order (each step avoids depending on something not yet created):
#   1) stage + validate + secrets;
#   2) start db → migrate → api FIRST, so the `sapiensmetric-api` upstream
#      resolves on the shared edge network before nginx is reloaded;
#   3) proxy phase 1: HTTP-only (ACME + redirect) — no dependency on the new
#      certificate; validate, reload;
#   4) issue the certificate via the EXISTING certbot container/webroot;
#   5) proxy phase 2: full config (adds the api HTTPS server) — validate, reload,
#      refresh the release template;
#   6) wait for API readiness over HTTPS, provision the owner, verify.
#
# Usage:
#   sudo bash install-closed-review.sh <staging-dir> [--dry-run]
#   <staging-dir> must contain: compose.yaml, images.env, hostenv, proxy/nginx.conf
#   Optional: SMTP_PASSWORD_SOURCE_FILE=<path> (the existing authorised password).
#
# Recovery instructions are printed at the end; a proxy-config backup is written
# under /opt/sokoladas-staging/state/backups/.
set -euo pipefail

STAGING="${1:-}"
DRY_RUN=0
[ "${2:-}" = "--dry-run" ] && DRY_RUN=1
if [ -z "$STAGING" ] || [ ! -d "$STAGING" ]; then
  echo "usage: sudo bash install-closed-review.sh <staging-dir> [--dry-run]" >&2
  exit 2
fi
STAGING="$(cd "$STAGING" && pwd)"

OWNER_EMAIL="${OWNER_EMAIL:-m.smiginas@gmail.com}"
EXPECTED_SMTP_FROM="${EXPECTED_SMTP_FROM:-website@sapiensmetric.eu}"
PROJECT_NAME=sapiensmetric-review
PROJECT_DIR=/opt/sapiensmetric-review
SECRETS_DIR=/etc/sapiensmetric/secrets
INITIAL_DIR=/etc/sapiensmetric/initial-credentials
SOKOLADAS_PROJECT=sokoladas-staging
SOKOLADAS_ROOT=/opt/sokoladas-staging
TLS_HOST=api.sapiensmetric.eu

log()  { printf '  %s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }
warn() { printf '  WARNING: %s\n' "$*" >&2; }
die()  { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
run()  { if [ "$DRY_RUN" -eq 1 ]; then printf '  [dry-run] %s\n' "$*"; else "$@"; fi; }

compose() {
  docker compose --project-directory "$PROJECT_DIR" \
    --env-file "$PROJECT_DIR/images.env" --env-file "$PROJECT_DIR/hostenv" \
    -f "$PROJECT_DIR/compose.yaml" "$@"
}

# --------------------------------------------------------------------------
step "Preconditions"
[ "$(id -u)" -eq 0 ] || die "must run as root (use sudo)."
command -v docker >/dev/null 2>&1 || die "docker is not available on the host."
docker compose version >/dev/null 2>&1 || die "docker compose plugin is not available."
[ "$(uname -m)" = "aarch64" ] || warn "host arch is $(uname -m), expected aarch64."
for f in compose.yaml images.env hostenv proxy/nginx.conf; do
  [ -f "$STAGING/$f" ] || die "staging dir is missing $f"
done
log "staging: $STAGING"
log "owner email: $OWNER_EMAIL"
if [ "$DRY_RUN" -eq 0 ] && [ -f "$STAGING/SOURCE_COMMIT" ]; then
  log "source commit: $(cat "$STAGING/SOURCE_COMMIT")"
fi

# --------------------------------------------------------------------------
step "Validate configuration"
grep -Eq '^API_IMAGE=ghcr\.io/.+@sha256:[0-9a-f]{64}$' "$STAGING/images.env" \
  || die "images.env API_IMAGE must be 'ghcr.io/<repo>@sha256:<64 hex>'."
grep -Eq '^MYSQL_IMAGE=mysql:8\.0\.46@sha256:[0-9a-f]{64}$' "$STAGING/images.env" \
  || die "images.env MYSQL_IMAGE must be 'mysql:8.0.46@sha256:<64 hex>' (the project's supported version)."

# shellcheck disable=SC1090
set -a; . "$STAGING/hostenv"; set +a
for v in MYSQL_DATABASE MYSQL_USER CORS_ORIGIN PUBLIC_APP_URL SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_FROM; do
  eval "value=\${$v:-}"
  [ -n "$value" ] || die "hostenv is missing $v"
done
case "$SMTP_SECURE" in true|false) ;; *) die "SMTP_SECURE must be true or false" ;; esac
[ "$CORS_ORIGIN" = "$PUBLIC_APP_URL" ] || die "CORS_ORIGIN and PUBLIC_APP_URL must be equal (they are validated as one origin)."
[ "$SMTP_FROM" = "$EXPECTED_SMTP_FROM" ] || warn "SMTP_FROM is '$SMTP_FROM' (expected the existing sender '$EXPECTED_SMTP_FROM')."
log "configuration values are present and internally consistent."

step "Stage the project files"
run install -d -m 0750 -o root -g root "$PROJECT_DIR"
run install -m 0600 "$STAGING/compose.yaml" "$PROJECT_DIR/compose.yaml"
run install -m 0600 "$STAGING/images.env" "$PROJECT_DIR/images.env"
run install -m 0600 "$STAGING/hostenv" "$PROJECT_DIR/hostenv"
if [ "$DRY_RUN" -eq 0 ]; then
  compose config -q || die "rendered compose configuration is invalid."
fi
log "compose configuration renders."

# --------------------------------------------------------------------------
step "Provision secrets (idempotent; values are never printed)"
run install -d -m 0700 -o root -g root /etc/sapiensmetric "$SECRETS_DIR"
gen_secret() {
  local file="$1"
  if [ -s "$file" ]; then
    log "kept existing $(basename "$file")"
  elif [ "$DRY_RUN" -eq 1 ]; then
    log "[dry-run] would generate $(basename "$file")"
  else
    ( umask 077; openssl rand -base64 36 | tr -d '\n' > "$file" )
    log "generated $(basename "$file")"
  fi
}
gen_secret "$SECRETS_DIR/mysql_root_password"
gen_secret "$SECRETS_DIR/mysql_password"
gen_secret "$SECRETS_DIR/jwt_secret"
if [ -s "$SECRETS_DIR/smtp_password" ]; then
  log "kept existing smtp_password"
elif [ -n "${SMTP_PASSWORD_SOURCE_FILE:-}" ] && [ -s "${SMTP_PASSWORD_SOURCE_FILE}" ]; then
  run install -m 0600 "$SMTP_PASSWORD_SOURCE_FILE" "$SECRETS_DIR/smtp_password"
  log "installed smtp_password from SMTP_PASSWORD_SOURCE_FILE"
else
  die "no smtp_password file. Copy the EXISTING authorised SapiensMetric SMTP password to $SECRETS_DIR/smtp_password (see deploy/secrets/README.md) and re-run. (Values are never printed.)"
fi
if [ "$DRY_RUN" -eq 0 ]; then
  chown 10001:10001 "$SECRETS_DIR/mysql_password" "$SECRETS_DIR/jwt_secret" "$SECRETS_DIR/smtp_password"
  chown 0:0 "$SECRETS_DIR/mysql_root_password"
  chmod 0400 "$SECRETS_DIR"/*
fi
run install -d -m 0700 -o root -g root "$INITIAL_DIR"

# --------------------------------------------------------------------------
step "Start the SapiensMetric database and API (before touching nginx)"
run compose up -d db
if [ "$DRY_RUN" -eq 0 ]; then
  healthy=0
  for _ in $(seq 1 60); do
    [ "$(compose ps db --format '{{.Health}}' 2>/dev/null)" = "healthy" ] && { healthy=1; break; }
    sleep 2
  done
  [ "$healthy" = "1" ] || die "MySQL did not become healthy. Recovery: 'docker compose -p $PROJECT_NAME --project-directory $PROJECT_DIR logs db'."
fi
run compose run --rm migrate
run compose up -d api
log "database, migration and API containers are up."

# --------------------------------------------------------------------------
step "Proxy phase 1 — HTTP ACME + redirect (no certificate dependency)"
PROXY=$(docker ps --filter "label=com.docker.compose.project=$SOKOLADAS_PROJECT" \
  --filter "label=com.docker.compose.service=proxy" --format '{{.Names}}' | head -1)
CERTBOT=$(docker ps --filter "label=com.docker.compose.project=$SOKOLADAS_PROJECT" \
  --filter "label=com.docker.compose.service=certbot" --format '{{.Names}}' | head -1)
[ -n "$PROXY" ] || die "could not find the running Sokoladas proxy container."
[ -n "$CERTBOT" ] || die "could not find the running Sokoladas certbot container."
log "proxy=$PROXY certbot=$CERTBOT"

APPLIED="$SOKOLADAS_ROOT/state/applied.json"
[ -f "$APPLIED" ] || die "cannot read $APPLIED"
RELEASE=$(sed -n 's/.*"releaseId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$APPLIED" | head -1)
[ -n "$RELEASE" ] || die "cannot determine the applied Sokoladas release id."
RUNNING_CONF="$SOKOLADAS_ROOT/releases/$RELEASE/proxy/nginx.conf"
TEMPLATE_CONF="$SOKOLADAS_ROOT/template/proxy/nginx.conf"
[ -f "$RUNNING_CONF" ] || die "cannot find the running proxy config $RUNNING_CONF"
BACKUP_DIR="$SOKOLADAS_ROOT/state/backups"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_CONF="$BACKUP_DIR/nginx.conf.$STAMP"
run install -d -m 0750 -o root -g root "$BACKUP_DIR"
run cp -a "$RUNNING_CONF" "$BACKUP_CONF"
log "proxy config backup: $BACKUP_CONF"

http_only_conf() {
  awk '/# >>> sapiensmetric-review-https >>>/{skip=1} /# <<< sapiensmetric-review-https <<</{skip=0; next} !skip' \
    "$STAGING/proxy/nginx.conf"
}
if [ "$DRY_RUN" -eq 0 ]; then
  http_only_conf > "$RUNNING_CONF"
  docker exec "$PROXY" nginx -t || { cp -a "$BACKUP_CONF" "$RUNNING_CONF"; die "nginx -t failed on the HTTP-only phase; restored the backup and did not reload."; }
  docker exec "$PROXY" nginx -s reload
fi
log "phase 1 applied (HTTP ACME reachable; the api HTTPS block is not yet present)."

# --------------------------------------------------------------------------
step "Certificate issuance (existing certbot container/webroot)"
if [ "$DRY_RUN" -eq 0 ]; then
  docker exec "$CERTBOT" certbot certonly --webroot -w /var/www/acme \
    -d "$TLS_HOST" --non-interactive --agree-tos -m "$OWNER_EMAIL" --keep-until-expiring \
    || die "certificate issuance for $TLS_HOST failed. Recovery: the proxy is still on the HTTP-only config ($BACKUP_CONF is the pre-install copy); check DNS (api.sapiensmetric.eu A 79.76.117.246), TCP 80 reachability and the ACME webroot, then re-run the installer."
  docker exec "$PROXY" test -f "/etc/letsencrypt/live/$TLS_HOST/fullchain.pem" \
    || die "certificate file not present after issuance."
fi
log "certificate for $TLS_HOST issued."

# --------------------------------------------------------------------------
step "Proxy phase 2 — full config (adds the api HTTPS server)"
if [ "$DRY_RUN" -eq 0 ]; then
  cp "$STAGING/proxy/nginx.conf" "$RUNNING_CONF"
  docker exec "$PROXY" nginx -t || { cp -a "$BACKUP_CONF" "$RUNNING_CONF"; docker exec "$PROXY" nginx -s reload || true; die "nginx -t failed on the full config; restored and reloaded the backup."; }
  docker exec "$PROXY" nginx -s reload
  if [ -f "$TEMPLATE_CONF" ]; then
    cp -a "$TEMPLATE_CONF" "$BACKUP_DIR/nginx.conf.$STAMP.template"
    cp "$STAGING/proxy/nginx.conf" "$TEMPLATE_CONF"
    log "release template refreshed (survives a subsequent Sokoladas release)."
  fi
fi
log "phase 2 applied."

# --------------------------------------------------------------------------
step "Wait for API readiness over HTTPS"
if [ "$DRY_RUN" -eq 0 ]; then
  ok=0
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$TLS_HOST/health/ready" || echo 000)
    [ "$code" = "200" ] && { ok=1; break; }
    sleep 3
  done
  [ "$ok" = "1" ] || {
    warn "upstream resolution check (best effort):"
    docker exec "$PROXY" sh -c 'getent hosts sapiensmetric-api || nslookup sapiensmetric-api 127.0.0.11 || true' 2>&1 | sed 's/^/    /' || true
    die "API not ready at https://$TLS_HOST/health/ready. If the upstream did not resolve, the api container must carry the 'sapiensmetric-api' network alias on the shared edge network (deploy/compose.yaml). Recovery: 'docker compose -p $PROJECT_NAME --project-directory $PROJECT_DIR logs api'; the proxy can be reverted with '$BACKUP_CONF'."
  }
fi
log "API ready."

# --------------------------------------------------------------------------
step "Provision the owner account (credential never printed)"
if [ "$DRY_RUN" -eq 0 ]; then
  compose run --rm --user 0:0 provision \
    --email "$OWNER_EMAIL" --apply --password-out /run/sm-out/owner-initial-password
  chmod 0400 "$INITIAL_DIR/owner-initial-password"
  chown 0:0 "$INITIAL_DIR/owner-initial-password"
fi
log "owner account provisioned."

# --------------------------------------------------------------------------
step "Verify closed-access enforcement"
if [ "$DRY_RUN" -eq 0 ]; then
  reg=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -X POST "https://$TLS_HOST/auth/register" \
    -H 'content-type: application/json' -d '{"email":"probe@example.org","password":"a-very-long-probe-password"}')
  log "POST /auth/register -> $reg (expected 403)"
  [ "$reg" = "403" ] || warn "registration did not return 403; check REGISTRATION_ENABLED."
  log "GET /auth/capabilities -> $(curl -s --max-time 20 "https://$TLS_HOST/auth/capabilities" || true)"
fi

step "Sokoladas recheck"
if [ "$DRY_RUN" -eq 0 ]; then
  for url in https://sokoladas.eu/ https://sokoladas.eu/health/ready; do
    log "$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url" || echo 000)  $url"
  done
fi

# --------------------------------------------------------------------------
step "Cleanup"
if [ "$DRY_RUN" -eq 0 ]; then
  rm -f "$STAGING/smtp_password" && log "removed the staged SMTP secret file"
fi

# --------------------------------------------------------------------------
step "Done — recovery and next steps"
cat <<EOF

  Owner account:        $OWNER_EMAIL (admin, verified, review-eligible)
  Initial credential:   $INITIAL_DIR/owner-initial-password (root 0400)
  Secrets:              $SECRETS_DIR (root 0700; api files 10001:10001 0400)

  Recovery by failure point:
    * after HTTP bootstrap / before the certificate:
        sudo cp -a $BACKUP_CONF $RUNNING_CONF
        docker exec $PROXY nginx -t && docker exec $PROXY nginx -s reload
    * certificate issuance:
        the proxy stays on the HTTP-only config; fix DNS/TCP 80 and re-run.
    * migration:
        fix and re-run the migrate step; re-running this installer is idempotent
        (existing secrets are kept; migrations are forward-only).
    * API startup:
        docker compose -p $PROJECT_NAME --project-directory $PROJECT_DIR logs api
    * stop the project WITHOUT deleting data:
        docker compose -p $PROJECT_NAME --project-directory $PROJECT_DIR down
    * roll back the API image only:
        set the previous API_IMAGE digest in $PROJECT_DIR/images.env, then
        docker compose -p $PROJECT_NAME --project-directory $PROJECT_DIR up -d --force-recreate api

  Next (owner): read and delete the initial credential, sign in, change the
  password, then activate the closed frontend profile
  (.github/workflows/deploy-closed.yml, confirm=activate) once authorised.
EOF
