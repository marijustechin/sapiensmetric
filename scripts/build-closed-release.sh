#!/usr/bin/env bash
#
# build-closed-release.sh — closed production-review frontend release (T-023).
#
# Builds the static web export and assembles a deployment directory that contains
# the public website AND the private application shells (login, register, account,
# admin, assessment) for direct access in the closed review environment. Unlike
# the public release, the private routes are intentionally INCLUDED here.
#
# This profile must stay INACTIVE until the production API readiness and the
# closed-access enforcement are verified (see docs/closed-review-deployment.md).
# It never deletes remote files: the WebDAV deploy tool only overwrites/adds.
#
# Run with `pnpm build:closed` (or `--no-build` to reuse `apps/web/out`).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
OUT_DIR="$WEB_DIR/out"
ARTIFACT="$ROOT_DIR/dist/closed-site"
BUILD_EXPORT=1
if [ "${1:-}" = "--no-build" ]; then
  BUILD_EXPORT=0
fi

if [ "$BUILD_EXPORT" -eq 1 ]; then
  echo "==> Building the static web export"
  pnpm --filter @sapiensmetric/web build
else
  echo "==> Reusing the existing static web export"
fi

if [ ! -d "$OUT_DIR" ]; then
  echo "ERROR: static export not found at $OUT_DIR" >&2
  exit 1
fi

# Hosting-controlled files must never be uploaded (they are owner-managed).
for reserved in .htaccess .well-known; do
  if [ -e "$OUT_DIR/$reserved" ]; then
    echo "ERROR: $OUT_DIR/$reserved must not be part of the web export (hosting-controlled)" >&2
    exit 1
  fi
done

echo "==> Assembling $ARTIFACT"
rm -rf "$ARTIFACT"
mkdir -p "$ARTIFACT"

shopt -s dotglob nullglob
for entry in "$OUT_DIR"/*; do
  cp -R "$entry" "$ARTIFACT/$(basename "$entry")"
done
shopt -u dotglob

echo "==> Checking the closed release contents"
failures=0
required=(index.html 404.html robots.txt sitemap.xml page-sitemap.xml article-sitemap.xml _next branding)
for item in "${required[@]}"; do
  if [ ! -e "$ARTIFACT/$item" ]; then
    echo "FAIL: closed release is missing $item" >&2
    failures=$((failures + 1))
  fi
done

PRIVATE_ROUTES=(auth/login auth/register auth/forgot-password auth/verify-email auth/reset-password account admin assessment)
PUBLIC_PAGES=("" assessment-guide understanding-results about contact privacy articles)
for locale in lt en; do
  for page in "${PUBLIC_PAGES[@]}"; do
    if [ ! -f "$ARTIFACT/$locale/${page:+$page/}index.html" ]; then
      echo "FAIL: closed release is missing public page $locale/${page:-<home>}/" >&2
      failures=$((failures + 1))
    fi
  done
  for route in "${PRIVATE_ROUTES[@]}"; do
    if [ ! -f "$ARTIFACT/$locale/$route/index.html" ]; then
      echo "FAIL: closed release is missing private shell $locale/$route/" >&2
      failures=$((failures + 1))
    fi
  done
done

if [ "$failures" -ne 0 ]; then
  echo "Closed release build failed." >&2
  exit 1
fi

echo "==> Closed review release ready: $ARTIFACT"
echo "    Included: public pages + /{lt,en}/{auth/*,account,admin,assessment} shells"
echo "    NOTE: private shells are noindex; keep this profile inactive until verified."
