#!/usr/bin/env bash
#
# build-public-release.sh — reproducible frontend-only public release (T-014).
#
# Builds the static web export and assembles a dedicated deployment directory
# containing ONLY the public website: the root remembered-language entry, the
# EN/LT public pages and articles, branding, shared static assets, 404.html,
# robots.txt, and sitemap.xml. The auth/account/admin route directories are
# excluded deterministically (by route, not by fragile filename matching).
#
# Requires no API, DB, SMTP, or OAuth secrets. Run with `pnpm build:public`.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
OUT_DIR="$WEB_DIR/out"
ARTIFACT="$ROOT_DIR/dist/public-site"

echo "==> Building the static web export"
pnpm --filter @sapiensmetric/web build

if [ ! -d "$OUT_DIR" ]; then
  echo "ERROR: static export not found at $OUT_DIR" >&2
  exit 1
fi

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

EXCLUDED_ROUTES=(auth account admin)
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
echo "    Excluded: /lt|/en/{auth,account,admin}"
