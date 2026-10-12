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
#     root-only file instead of printing it.
#
# Two-phase proxy rollout (the api HTTPS block needs the certificate first):
#   1) render the config WITHOUT the api HTTPS block, `nginx -t`, reload;
#   2) issue the certificate via the EXISTING certbot container/webroot;
#   3) install the full config, `nginx -t`, reload; refresh the release template.
#
# Usage:
#   sudo bash install-closed-review.sh <staging-dir> [--dry-run]
#   <staging-dir> must contain: compose.yaml, images.env, hostenv, proxy/nginx.conf
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
die()  { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
run()  { if [ "$DRY_RUN" -eq 1 ]; then printf '  [dry-run] %s\n' "$*"; else "$@"; fi; }

# --------------------------------------------------------------------------
step "Preconditions"
[ "$(id -u)" -eq 0 ] || die "must run as root (use sudo)."
command -v docker >/dev/null 2>&1 || die "docker is not available on the host."
docker compose version >/dev/null 2>&1 || die "docker compose plugin is not available."
[ "$(uname -m)" = "aarch64" ] || log "WARNING: host arch is $(uname -m), expected aarch64."
for f in compose.yaml images.env hostenv proxy/nginx.conf; do
  [ -f "$STAGING/$f" ] || die "staging dir is missing $f"
done
log "staging: $STAGING"
log "owner email: $OWNER_EMAIL"

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
[ "$SMTP_FROM" = "$EXPECTED_SMTP_FROM" ] || log "WARNING: SMTP_FROM is '$SMTP_FROM' (expected the existing sender '$EXPECTED_SMTP_FROM')."
log "configuration values are present and internally consistent."

step "Stage the project files"
run install -d -m 0750 -o root -g root "$PROJECT_DIR"
run install -m 0600 "$STAGING/compose.yaml" "$PROJECT_DIR/compose.yaml"
run install -m 0600 "$STAGING/images.env" "$PROJECT_DIR/images.env"
run install -m 0600 "$STAGING/hostenv" "$PROJECT_DIR/hostenv"
if [ "$DRY_RUN" -eq 0 ]; then
  docker compose --project-directory "$PROJECT_DIR" \
    --env-file "$PROJECT_DIR/images.env" --env-file "$PROJECT_DIR/hostenv" \
    -f "$PROJECT_DIR/compose.yaml" config -q \
    || die "rendered compose configuration is invalid."
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
step "Proxy routing (two-phase, additive; Sokoladas preserved)"
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
log "running release: $RELEASE"

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

# Phase 1: HTTP ACME + redirect only (validates without the api certificate).
if [ "$DRY_RUN" -eq 0 ]; then
  http_only_conf > "$RUNNING_CONF"
  docker exec "$PROXY" nginx -t || { cp -a "$BACKUP_CONF" "$RUNNING_CONF"; die "nginx -t failed on the HTTP-only phase; restored the backup."; }
  docker exec "$PROXY" nginx -s reload
fi
log "phase 1 (HTTP ACME) applied."

# Certificate issuance through the existing certbot container/webroot.
if [ "$DRY_RUN" -eq 0 ]; then
  docker exec "$CERTBOT" certbot certonly --webroot -w /var/www/acme \
    -d "$TLS_HOST" --non-interactive --agree-tos -m "$OWNER_EMAIL" --keep-until-expiring \
    || die "certificate issuance for $TLS_HOST failed (HTTP ACME reachable? DNS correct?)."
  docker exec "$PROXY" test -f "/etc/letsencrypt/live/$TLS_HOST/fullchain.pem" \
    || die "certificate file not present after issuance."
fi
log "certificate for $TLS_HOST issued."

# Phase 2: full config with the HTTPS server block.
if [ "$DRY_RUN" -eq 0 ]; then
  cp "$STAGING/proxy/nginx.conf" "$RUNNING_CONF"
  docker exec "$PROXY" nginx -t || { cp -a "$BACKUP_CONF" "$RUNNING_CONF"; docker exec "$PROXY" nginx -s reload || true; die "nginx -t failed on the full config; restored and reloaded the backup."; }
  docker exec "$PROXY" nginx -s reload
  [ -f "$TEMPLATE_CONF" ] && { cp -a "$TEMPLATE_CONF" "$BACKUP_DIR/nginx.conf.$STAMP.template"; cp "$STAGING/proxy/nginx.conf" "$TEMPLATE_CONF"; log "release template refreshed."; }
fi
log "phase 2 (full config) applied."

step "Sokoladas recheck"
if [ "$DRY_RUN" -eq 0 ]; then
  for url in https://sokoladas.eu/ https://sokoladas.eu/health/ready; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url" || echo 000)
    log "$code  $url"
  done
  log "certificate: $(echo | openssl s_client -connect sokoladas.eu:443 -servername sokoladas.eu 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || echo 'sokoladas.eu')"
fi

# --------------------------------------------------------------------------
step "Database and API"
compose() {
  docker compose --project-directory "$PROJECT_DIR" \
    --env-file "$PROJECT_DIR/images.env" --env-file "$PROJECT_DIR/hostenv" \
    -f "$PROJECT_DIR/compose.yaml" "$@"
}
run compose up -d db
if [ "$DRY_RUN" -eq 0 ]; then
  for _ in $(seq 1 60); do
    compose ps db --format '{{.Health}}' | grep -qx healthy && break
    sleep 2
  done
fi
run compose run --rm migrate
run compose up -d api
if [ "$DRY_RUN" -eq 0 ]; then
  ok=0
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$TLS_HOST/health/ready" || echo 000)
    [ "$code" = "200" ] && { ok=1; break; }
    sleep 3
  done
  [ "$ok" = "1" ] || die "API did not become ready at https://$TLS_HOST/health/ready."
fi
log "API is up and ready."

# --------------------------------------------------------------------------
step "Provision the owner account (credential never printed)"
if [ "$DRY_RUN" -eq 0 ]; then
  compose run --rm --user 0:0 provision \
    --email "$OWNER_EMAIL" --apply --password-out /run/sm-out/owner-initial-password
  chmod 0400 "$INITIAL_DIR/owner-initial-password"
  chown 0:0 "$INITIAL_DIR/owner-initial-password"
fi
log "owner account provisioned; initial credential at $INITIAL_DIR/owner-initial-password"

# --------------------------------------------------------------------------
step "Verify closed-access enforcement"
if [ "$DRY_RUN" -eq 0 ]; then
  reg=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -X POST "https://$TLS_HOST/auth/register" \
    -H 'content-type: application/json' -d '{"email":"probe@example.org","password":"a-very-long-probe-password"}')
  log "POST /auth/register -> $reg (expected 403)"
  [ "$reg" = "403" ] || log "WARNING: registration did not return 403; check REGISTRATION_ENABLED."
  cap=$(curl -s --max-time 20 "https://$TLS_HOST/auth/capabilities" || true)
  log "GET /auth/capabilities -> $cap"
fi

# --------------------------------------------------------------------------
step "Done — recovery and next steps"
cat <<EOF

  Owner account:        $OWNER_EMAIL (admin, verified, review-eligible)
  Initial credential:   $INITIAL_DIR/owner-initial-password (root 0400)
                        read it once, then delete it:  sudo rm $INITIAL_DIR/owner-initial-password
  Secrets:              $SECRETS_DIR (root 0700; api files 10001:10001 0400)

  Recovery — Sokoladas proxy (before any project change):
    sudo cp -a $BACKUP_CONF $RUNNING_CONF
    docker exec $PROXY nginx -t && docker exec $PROXY nginx -s reload

  Stop the SapiensMetric project WITHOUT deleting data:
    docker compose -p $PROJECT_NAME --project-directory $PROJECT_DIR down

  Roll back the API image only (database is forward-only):
    edit $PROJECT_DIR/images.env to the previous API_IMAGE digest, then
    docker compose -p $PROJECT_NAME --project-directory $PROJECT_DIR up -d --force-recreate api

  Re-run this installer any time: it is idempotent (existing secrets are kept).

  Next (owner): sign in as $OWNER_EMAIL, change the password, then activate the
  closed frontend profile (.github/workflows/deploy-closed.yml, confirm=activate).
EOF
