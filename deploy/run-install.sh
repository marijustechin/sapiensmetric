#!/usr/bin/env bash
#
# run-install.sh — stage the reviewed bundle to the Oracle host and run the
# privileged installer through the OWNER'S existing sudo access (T-023).
#
# Run from your workstation, in this repository:
#
#   bash deploy/run-install.sh              # real install (will prompt for sudo)
#   bash deploy/run-install.sh --dry-run    # validate only; changes nothing
#
# It copies compose.yaml, images.env, hostenv and the reviewed proxy nginx.conf to
# the host, then runs `sudo bash install-closed-review.sh` over an interactive SSH
# session (so the existing sudo password prompt works). It never contains or asks
# for the sudo password, and it does not grant any new sudo/Docker privileges.
#
# Before running, prepare the host-only inputs (once):
#   deploy/images.env  (from images.env.example; real @sha256: digs from CI)
#   deploy/hostenv     (from hostenv.example; non-secret host config)
# and place the EXISTING authorised SMTP password at:
#   deploy/smtp_password   (git-ignored; never printed)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_DIR/deploy"
HOST="${HOST:-marijus@79.76.117.246}"
REMOTE_DIR="/tmp/sapiensmetric-review-install"
DRY_RUN="${1:-}"

[ -f "$DEPLOY_DIR/compose.yaml" ] || { echo "missing deploy/compose.yaml" >&2; exit 1; }
[ -s "$DEPLOY_DIR/images.env" ] || { echo "missing deploy/images.env (copy images.env.example and paste the CI @sha256: digests)" >&2; exit 1; }
[ -s "$DEPLOY_DIR/hostenv" ] || { echo "missing deploy/hostenv (copy hostenv.example and fill it in)" >&2; exit 1; }
[ -s "$DEPLOY_DIR/smtp_password" ] || { echo "missing deploy/smtp_password (the EXISTING authorised SMTP password; git-ignored)" >&2; exit 1; }

# The reviewed proxy routing is infrastructure-owned; read it from the sibling repo.
NGINX_CONF="${NGINX_CONF:-$(dirname "$REPO_DIR")/sokoladas/sm-oracle-infra/deploy/proxy/nginx.conf}"
[ -s "$NGINX_CONF" ] || { echo "missing reviewed proxy config: $NGINX_CONF (set NGINX_CONF=)" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/proxy"
cp "$DEPLOY_DIR/compose.yaml" "$WORK/compose.yaml"
cp "$DEPLOY_DIR/images.env" "$WORK/images.env"
cp "$DEPLOY_DIR/hostenv" "$WORK/hostenv"
cp "$NGINX_CONF" "$WORK/proxy/nginx.conf"
git -C "$REPO_DIR" rev-parse HEAD > "$WORK/SOURCE_COMMIT"
echo "Staging bundle (source $(cat "$WORK/SOURCE_COMMIT")) from $REPO_DIR -> $HOST:$REMOTE_DIR"

tar -C "$WORK" -czf "$WORK/bundle.tgz" .
ssh "$HOST" "rm -rf '$REMOTE_DIR' && mkdir -p '$REMOTE_DIR'"
scp -q "$WORK/bundle.tgz" "$HOST:$REMOTE_DIR/bundle.tgz"
scp -q "$DEPLOY_DIR/smtp_password" "$HOST:$REMOTE_DIR/smtp_password"

REMOTE_ARGS=""
[ "$DRY_RUN" = "--dry-run" ] && REMOTE_ARGS="--dry-run"

# Interactive TTY so the existing sudo prompt works; no password is passed.
ssh -t "$HOST" "
  set -e
  rm -rf '$REMOTE_DIR/staging' && mkdir -p '$REMOTE_DIR/staging'
  tar -C '$REMOTE_DIR/staging' -xzf '$REMOTE_DIR/bundle.tgz'
  chmod 0600 '$REMOTE_DIR/smtp_password'
  sudo SMTP_PASSWORD_SOURCE_FILE='$REMOTE_DIR/smtp_password' \
    bash '$REMOTE_DIR/staging/install-closed-review.sh' '$REMOTE_DIR/staging' $REMOTE_ARGS
"

# Clean up the staged temporary material on success.
if [ "$DRY_RUN" != "--dry-run" ]; then
  ssh "$HOST" "rm -rf '$REMOTE_DIR'"
  echo "Removed the remote staging directory ($REMOTE_DIR)."
fi
