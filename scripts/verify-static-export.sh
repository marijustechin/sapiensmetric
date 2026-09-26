#!/usr/bin/env bash
#
# verify-static-export.sh — static-export route invariant checks.
#
# Production is plain shared static hosting (no Next server, middleware, proxy,
# or rewrite rules). Every public localized route must therefore exist as a real
# `<route>/index.html` directory entry so that a direct request or refresh to a
# clean URL resolves without hosting configuration.
#
# This script is dependency-free (bash, find, grep, test). It verifies the
# build output in `apps/web/out` and must run AFTER `pnpm build`.
#
# Invariants checked:
#   1. Every expected public route has a non-empty `<route>/index.html`.
#   2. Root `/` exists as `index.html`, renders the accessible centred loading
#      state, has no meta refresh, and provides a JS-disabled English fallback.
#   3. Each localized page declares the matching `<html lang="lt">`/`"en">`.
#   4. The previous flat deep-route `.html` format (e.g. `lt/auth/login.html`,
#      `lt.html`) is absent; no page inside a locale is served as a flat file.
#
# Exit code 0 = all invariants hold; non-zero = at least one failed.

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/apps/web/out"

failures=0
passes=0

note_pass() { passes=$((passes + 1)); }
note_fail() {
  failures=$((failures + 1))
  printf 'FAIL: %s\n' "$1"
}

if [ ! -d "$OUT_DIR" ]; then
  printf 'FAIL: static export directory is missing: %s (run `pnpm build` first)\n' "$OUT_DIR"
  printf '\nverify-static-export.sh: 0 passed, 1 failed\n'
  exit 1
fi

# Expected public routes, relative to the export root, without a trailing slash.
# The empty entry is the root route `/` (a default-locale redirect).
expected_routes=(
  ""
  "lt"
  "en"
  "lt/auth/register" "en/auth/register"
  "lt/auth/login" "en/auth/login"
  "lt/auth/verify-email" "en/auth/verify-email"
  "lt/auth/forgot-password" "en/auth/forgot-password"
  "lt/auth/reset-password" "en/auth/reset-password"
  "lt/account" "en/account"
)

# Locale that each localized page's <html lang> must declare. The root `/`
# redirect page declares `en` (see app/(root)/layout.tsx).
expected_lang_for() {
  case "$1" in
    lt|lt/*) printf 'lt' ;;
    en|en/*) printf 'en' ;;
    "") printf 'en' ;;
    *) printf '' ;;
  esac
}

for route in "${expected_routes[@]}"; do
  if [ -n "$route" ]; then
    page="$OUT_DIR/$route/index.html"
    label="/$route/"
  else
    page="$OUT_DIR/index.html"
    label="/"
  fi

  if [ ! -f "$page" ]; then
    note_fail "missing static page: ${page#"$OUT_DIR"/} (expected for $label)"
    continue
  fi
  if [ ! -s "$page" ]; then
    note_fail "empty static page: ${page#"$OUT_DIR"/}"
    continue
  fi
  if ! grep -q '<html' "$page"; then
    note_fail "static page has no <html> element: ${page#"$OUT_DIR"/}"
    continue
  fi

  want_lang="$(expected_lang_for "$route")"
  if [ -n "$want_lang" ]; then
    if grep -q "<html lang=\"$want_lang\"" "$page"; then
      note_pass
    else
      note_fail "static page ${page#"$OUT_DIR"/} does not declare <html lang=\"$want_lang\">"
    fi
  else
    note_pass
  fi
done

# The previous flat deep-route format must not return. Any `.html` file inside a
# locale directory other than an `index.html` is a regression, and the old
# `lt.html`/`en.html` locale-home files must not exist either.
stray_flat="$(
  find "$OUT_DIR/lt" "$OUT_DIR/en" -type f -name '*.html' ! -name 'index.html' 2>/dev/null
)"
if [ -n "$stray_flat" ]; then
  while IFS= read -r f; do
    [ -n "$f" ] && note_fail "regressed flat route file (expected directory/index.html): ${f#"$OUT_DIR"/}"
  done <<EOF
$stray_flat
EOF
else
  note_pass
fi

for flat in "$OUT_DIR/lt.html" "$OUT_DIR/en.html"; do
  if [ -e "$flat" ]; then
    note_fail "regressed flat locale file: ${flat#"$OUT_DIR"/}"
  else
    note_pass
  fi
done

# --- Branding assets (approved WebP interface, used as supplied) ---------
# The assets must reach the export from their stable `/branding/...` paths, the
# supplied favicon must be registered in the generated HTML, and the light-shell
# brand mark (dark variant) must be referenced.

branding_favicon="$OUT_DIR/branding/sapiens-metric-logo-favicon.webp"
branding_dark="$OUT_DIR/branding/sapiens-metric-logo-dark.webp"

for asset in "$branding_favicon" "$branding_dark"; do
  if [ -f "$asset" ]; then
    note_pass
  else
    note_fail "branding asset missing from export: branding/${asset##*/}"
  fi
done

for page in "$OUT_DIR/index.html" "$OUT_DIR/lt/index.html" "$OUT_DIR/en/index.html"; do
  if [ -f "$page" ] && grep -q 'sapiens-metric-logo-favicon.webp' "$page"; then
    note_pass
  else
    note_fail "supplied favicon not referenced in ${page#"$OUT_DIR"/}"
  fi
done

if [ -f "$OUT_DIR/lt/index.html" ] && grep -q 'sapiens-metric-logo-dark.webp' "$OUT_DIR/lt/index.html"; then
  note_pass
else
  note_fail "shell brand mark (dark variant) not referenced in lt/index.html"
fi

# --- Root route: preference-based redirect, never an interactive chooser ----
# `/` renders a centred loading state; the redirect is resolved client-side from
# the remembered locale preference (localStorage). A meta refresh must NOT be
# present, since it would always win with `/en/` and defeat a remembered `lt`.
# With JavaScript disabled a documented English fallback link remains.

root_page="$OUT_DIR/index.html"

if [ -f "$root_page" ] &&
  grep -qF 'role="status"' "$root_page" &&
  grep -qF 'aria-busy="true"' "$root_page" &&
  grep -qF 'animate-spin' "$root_page"; then
  note_pass
else
  note_fail "root index.html does not render the accessible centred loading state"
fi

if [ -f "$root_page" ] && grep -qiE 'http-equiv="refresh"' "$root_page"; then
  note_fail "root index.html still contains a meta refresh (would defeat a remembered lt preference)"
else
  note_pass
fi

if [ -f "$root_page" ] &&
  grep -qF '<noscript>' "$root_page" &&
  grep -qF 'href="/en/"' "$root_page"; then
  note_pass
else
  note_fail "root index.html lacks the JavaScript-disabled English fallback link to /en/"
fi

if [ -f "$root_page" ] && grep -qiE 'Pasirinkite kalb|Choose a language|Redirecting' "$root_page"; then
  note_fail "root index.html still presents chooser/placeholder copy"
else
  note_pass
fi

printf '\nverify-static-export.sh: %d passed, %d failed\n' "$passes" "$failures"
if [ "$failures" -eq 0 ]; then
  printf 'All static-export route invariants hold.\n'
  exit 0
else
  printf 'Static-export route invariant check failed.\n'
  exit 1
fi
