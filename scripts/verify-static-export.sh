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
#   5. The generated CSS contains the representative utilities used by the FSD
#      layers (including `sr-only` and `animate-spin`) and the root/locale pages
#      link a CSS asset, so a Tailwind content-glob regression cannot pass
#      silently.
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
  "lt/admin" "en/admin"
  "lt/assessment-guide" "en/assessment-guide"
  "lt/understanding-results" "en/understanding-results"
  "lt/about" "en/about"
  "lt/contact" "en/contact"
  "lt/privacy" "en/privacy"
  "lt/articles" "en/articles"
  "lt/articles/how-ability-tests-differ-from-knowledge-tests" "en/articles/how-ability-tests-differ-from-knowledge-tests"
  "lt/articles/what-an-online-iq-test-can-tell-you" "en/articles/what-an-online-iq-test-can-tell-you"
  "lt/articles/why-percentage-correct-is-not-a-percentile" "en/articles/why-percentage-correct-is-not-a-percentile"
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

if [ -f "$root_page" ] && grep -qiE 'Choose a language|Redirecting' "$root_page"; then
  note_fail "root index.html still presents chooser/placeholder copy"
else
  note_pass
fi

# --- Generated CSS: Tailwind must cover every FSD source layer ------------
# Class names in TSX are not enough: the utilities must be present in the
# emitted CSS. The representative utilities below are only used by the moved
# logo (shared/ui), navigation (widgets), loading screen (shared/ui), an app
# page heading, and a features component, so a missing Tailwind content glob
# (the post-FSD-move regression) fails here. `sr-only` and `animate-spin` are
# included explicitly.

css_dir="$OUT_DIR/_next/static"
css_files="$(find "$css_dir" -type f -name '*.css' 2>/dev/null | sort)"

if [ -z "$css_files" ]; then
  note_fail "no generated CSS found under _next/static (Tailwind build?)"
else
  css_utilities=(
    sr-only
    animate-spin
    h-8
    w-8
    justify-center
    rounded-full
    border-t-gray-700
    font-mono
    flex-wrap
    px-8
    py-3
    ml-auto
    border-b
    border-gray-200
    text-2xl
    border-purple-300
  )

  for class in "${css_utilities[@]}"; do
    found=0
    while IFS= read -r file; do
      [ -n "$file" ] || continue
      if grep -qE "\\.${class}[{,]" "$file"; then
        found=1
        break
      fi
    done <<EOF
$css_files
EOF
    if [ "$found" -eq 1 ]; then
      note_pass
    else
      note_fail "generated CSS is missing .${class} (check tailwind.config.ts content globs)"
    fi
  done

  for page in index.html lt/index.html en/index.html; do
    if [ -f "$OUT_DIR/$page" ] && grep -qE '/_next/static/[^"]+\.css' "$OUT_DIR/$page"; then
      note_pass
    else
      note_fail "no CSS asset referenced in $page"
    fi
  done
fi

# --- T-013: public site, SEO metadata, sitemap/robots, noindex ------------

# Production URLs only in public metadata.
if grep -q 'https://sapiensmetric.eu/en/' "$OUT_DIR/en/index.html" &&
  grep -q 'rel="canonical"' "$OUT_DIR/en/index.html" &&
  grep -q 'hrefLang="lt"' "$OUT_DIR/en/index.html" &&
  grep -q 'rel="canonical"' "$OUT_DIR/lt/index.html"; then
  note_pass
else
  note_fail "public pages are missing canonical/hreflang production metadata"
fi

if grep -rql 'localhost' "$OUT_DIR/en/index.html" "$OUT_DIR/en/assessment-guide/index.html" 2>/dev/null; then
  note_fail "public metadata contains a localhost URL"
else
  note_pass
fi

# The availability statement is visible on the public home pages.
if grep -qi 'not available yet' "$OUT_DIR/en/index.html" &&
  grep -qi 'neprieinami' "$OUT_DIR/lt/index.html"; then
  note_pass
else
  note_fail "public home pages do not state that assessments are not available"
fi

# sitemap.xml: production URLs, public pages only.
if [ -f "$OUT_DIR/sitemap.xml" ] &&
  grep -q 'https://sapiensmetric.eu/en/' "$OUT_DIR/sitemap.xml" &&
  grep -q 'https://sapiensmetric.eu/lt/' "$OUT_DIR/sitemap.xml" &&
  grep -q 'https://sapiensmetric.eu/en/privacy/' "$OUT_DIR/sitemap.xml" &&
  grep -q 'https://sapiensmetric.eu/en/articles/' "$OUT_DIR/sitemap.xml"; then
  note_pass
else
  note_fail "sitemap.xml is missing expected production URLs"
fi

if [ -f "$OUT_DIR/sitemap.xml" ] &&
  grep -Eq '/(auth|account|admin)/' "$OUT_DIR/sitemap.xml"; then
  note_fail "sitemap.xml includes a non-public auth/account/admin route"
else
  note_pass
fi

if [ -f "$OUT_DIR/robots.txt" ] &&
  grep -q 'Sitemap: https://sapiensmetric.eu/sitemap.xml' "$OUT_DIR/robots.txt"; then
  note_pass
else
  note_fail "robots.txt is missing the production sitemap reference"
fi

# noindex on auth/account/admin (both locales).
for page in \
  "en/auth/login/index.html" "lt/auth/login/index.html" \
  "en/account/index.html" "lt/account/index.html" \
  "en/admin/index.html" "lt/admin/index.html"; do
  if [ -f "$OUT_DIR/$page" ] &&
    grep -qi 'name="robots"[^>]*noindex' "$OUT_DIR/$page"; then
    note_pass
  else
    note_fail "missing noindex robots metadata in $page"
  fi
done

if [ -f "$OUT_DIR/404.html" ] && grep -q 'Page not found' "$OUT_DIR/404.html"; then
  note_pass
else
  note_fail "custom static 404 page is missing"
fi

# Locale preservation in exported links (T-013 follow-up). Checking that the
# translated destination pages exist is not enough: the anchor hrefs on each
# locale's pages must stay in that locale.
lt_cross="$(
  grep -rhoE --include='*.html' 'href="/en/(assessment-guide|understanding-results|about|contact|privacy|articles)[^"]*"' "$OUT_DIR/lt" 2>/dev/null | sort -u
)"
if [ -n "$lt_cross" ]; then
  while IFS= read -r line; do
    [ -n "$line" ] && note_fail "LT page links to an EN public route: $line"
  done <<EOF
$lt_cross
EOF
else
  note_pass
fi

en_cross="$(
  grep -rhoE --include='*.html' 'href="/lt/(assessment-guide|understanding-results|about|contact|privacy|articles)[^"]*"' "$OUT_DIR/en" 2>/dev/null | sort -u
)"
if [ -n "$en_cross" ]; then
  while IFS= read -r line; do
    [ -n "$line" ] && note_fail "EN page links to an LT public route: $line"
  done <<EOF
$en_cross
EOF
else
  note_pass
fi

if grep -q 'href="/lt/articles/why-percentage-correct-is-not-a-percentile/"' "$OUT_DIR/lt/articles/index.html" &&
  grep -q 'href="/en/articles/why-percentage-correct-is-not-a-percentile/"' "$OUT_DIR/en/articles/index.html" &&
  grep -q 'href="/lt/articles/why-percentage-correct-is-not-a-percentile/"' "$OUT_DIR/lt/index.html" &&
  grep -q 'href="/lt/assessment-guide/"' "$OUT_DIR/lt/articles/why-percentage-correct-is-not-a-percentile/index.html"; then
  note_pass
else
  note_fail "article links do not preserve the current locale in the export"
fi

# Confirmed public contact address (T-013 update): published as a mailto link
# on the Contact/Privacy pages and in the footer, with no leftover placeholder.
for page in \
  "en/contact/index.html" "lt/contact/index.html" \
  "en/privacy/index.html" "lt/privacy/index.html" \
  "en/index.html" "lt/index.html"; do
  if [ -f "$OUT_DIR/$page" ] && grep -q 'href="mailto:info@sapiensmetric.eu"' "$OUT_DIR/$page"; then
    note_pass
  else
    note_fail "missing confirmed public mailto link in $page"
  fi
done

if grep -r --include='*.html' -qiE 'pending confirmation|has not been confirmed|nepatvirtintas skelbimui' "$OUT_DIR/en/contact" "$OUT_DIR/lt/contact" 2>/dev/null; then
  note_fail "contact page still contains the unconfirmed-contact placeholder"
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
