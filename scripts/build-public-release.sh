#!/usr/bin/env bash
#
# build-public-release.sh — repeatable frontend-only public release (T-014).
# ("Repeatable" = the documented procedure deterministically produces the release
# from the current export; byte-identical independent builds are NOT claimed —
# see docs/deployment-webdav.md "Reproducibility terminology".)
#
# Builds the static web export and assembles a dedicated deployment directory
# containing ONLY the public website: the root remembered-language entry, the
# EN/LT public pages and articles, branding, shared static assets, 404.html,
# robots.txt, and sitemap.xml. The auth/account/admin/assessment route
# directories are excluded deterministically (by route, not by fragile filename
# matching).
#
# Requires no API, DB, SMTP, or OAuth secrets. Run with `pnpm build:public`.
#
# `--no-build` reuses an existing `apps/web/out` (used by `pnpm verify`, which
# already builds the web export once) so the release is assembled from the exact
# same build that `verify-static-export.sh` checks, with no duplicate build.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
OUT_DIR="$WEB_DIR/out"
ARTIFACT="$ROOT_DIR/dist/public-site"
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

# Never place hosting-controlled files in the release artifact: the WebDAV
# deployment must preserve the remote `.htaccess` and `.well-known/**` (there is
# no mirror/delete, but an uploaded copy would overwrite them). Fail loudly rather
# than silently shipping them.
for reserved in .htaccess .well-known; do
  if [ -e "$OUT_DIR/$reserved" ]; then
    echo "ERROR: $OUT_DIR/$reserved must not be part of the web export (hosting-controlled)" >&2
    exit 1
  fi
done

echo "==> Assembling $ARTIFACT"
rm -rf "$ARTIFACT"
mkdir -p "$ARTIFACT"

# Root-level entries (shared assets, 404, robots, sitemap, remembered-language
# entry). Locale directories are copied separately so they can be pruned.
shopt -s dotglob nullglob
for entry in "$OUT_DIR"/*; do
  base="$(basename "$entry")"
  case "$base" in
    lt|en) continue ;;
  esac
  cp -R "$entry" "$ARTIFACT/$base"
done
shopt -u dotglob

EXCLUDED_ROUTES=(auth account admin assessment)
for locale in lt en; do
  cp -R "$OUT_DIR/$locale" "$ARTIFACT/$locale"
  for route in "${EXCLUDED_ROUTES[@]}"; do
    rm -rf "$ARTIFACT/$locale/$route"
  done
done

echo "==> Checking the release contents"
failures=0
required=(index.html 404.html robots.txt sitemap.xml _next branding)
for item in "${required[@]}"; do
  if [ ! -e "$ARTIFACT/$item" ]; then
    echo "FAIL: release is missing $item" >&2
    failures=$((failures + 1))
  fi
done

# Hosting-controlled files must never be in the release artifact.
for reserved in .htaccess .well-known; do
  if [ -e "$ARTIFACT/$reserved" ]; then
    echo "FAIL: release must not contain hosting-controlled $reserved" >&2
    failures=$((failures + 1))
  fi
done

# T-018: the supplied page/device icon set + manifest must reach the release.
required_icons=(
  branding/favicon.ico
  branding/favicon-16x16.png
  branding/favicon-32x32.png
  branding/apple-touch-icon.png
  branding/android-chrome-192x192.png
  branding/android-chrome-512x512.png
  branding/site.webmanifest
)
for item in "${required_icons[@]}"; do
  if [ ! -e "$ARTIFACT/$item" ]; then
    echo "FAIL: release is missing $item" >&2
    failures=$((failures + 1))
  fi
done

for locale in lt en; do
  for route in "${EXCLUDED_ROUTES[@]}"; do
    if [ -e "$ARTIFACT/$locale/$route" ]; then
      echo "FAIL: excluded application route present: $locale/$route" >&2
      failures=$((failures + 1))
    fi
  done
  for page in "" assessment-guide understanding-results about contact privacy articles; do
    if [ ! -f "$ARTIFACT/$locale/${page:+$page/}index.html" ]; then
      echo "FAIL: missing public page $locale/${page:-<home>}/" >&2
      failures=$((failures + 1))
    fi
  done
done

if [ "$failures" -ne 0 ]; then
  echo "Public release build failed." >&2
  exit 1
fi

echo "==> Public release ready: $ARTIFACT"
echo "    Included: ${ARTIFACT}/index.html (remembered-language entry), /lt, /en (public pages + articles), _next, branding, 404.html, robots.txt, sitemap.xml"
echo "    Excluded: /lt|/en/{auth,account,admin,assessment}"
