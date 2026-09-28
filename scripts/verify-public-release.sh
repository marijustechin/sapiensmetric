#!/usr/bin/env bash
#
# verify-public-release.sh — checks the assembled public release directory
# (`dist/public-site`, built by `pnpm build:public`). Dependency-free.
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REL="$ROOT_DIR/dist/public-site"
failures=0
passes=0
note_pass() { passes=$((passes + 1)); }
note_fail() { failures=$((failures + 1)); printf 'FAIL: %s\n' "$1"; }
check() { if eval "$2"; then note_pass; else note_fail "$1"; fi; }

if [ ! -d "$REL" ]; then
  printf 'FAIL: public release directory missing: %s (run `pnpm build:public`)\n' "$REL"
  exit 1
fi

for item in index.html 404.html robots.txt sitemap.xml _next branding; do
  check "required release item missing: $item" "[ -e '$REL/$item' ]"
done

routes=(assessment-guide understanding-results about contact privacy articles)
for locale in lt en; do
  check "missing $locale home" "[ -f '$REL/$locale/index.html' ]"
  for route in "${routes[@]}"; do
    check "missing public page $locale/$route/" "[ -f '$REL/$locale/$route/index.html' ]"
  done
  for slug in how-ability-tests-differ-from-knowledge-tests what-an-online-iq-test-can-tell-you why-percentage-correct-is-not-a-percentile; do
    check "missing article $locale/articles/$slug/" "[ -f '$REL/$locale/articles/$slug/index.html' ]"
  done
  for excluded in auth account admin; do
    check "excluded application route present: $locale/$excluded" "[ ! -e '$REL/$locale/$excluded' ]"
  done
done

# No exported HTML may live under an app route path.
if find "$REL" -path '*/auth/*' -name '*.html' -o -path '*/account/*' -name '*.html' -o -path '*/admin/*' -name '*.html' 2>/dev/null | grep -q .; then
  note_fail "application route HTML present in the release"
else
  note_pass
fi

# Metadata and production URLs.
check "canonical/hreflang missing on lt home" "grep -q 'rel=\"canonical\"' '$REL/lt/index.html' && grep -q 'hrefLang=\"en\"' '$REL/lt/index.html'"
check "production canonical missing" "grep -q 'https://sapiensmetric.eu/lt/' '$REL/lt/index.html'"
if grep -rq --include='*.html' 'localhost' "$REL" 2>/dev/null; then
  note_fail "release HTML contains a localhost URL"
else
  note_pass
fi

# sitemap/robots.
check "sitemap missing production LT URL" "grep -q 'https://sapiensmetric.eu/lt/' '$REL/sitemap.xml'"
if grep -Eq '/(auth|account|admin)/' "$REL/sitemap.xml"; then
  note_fail "sitemap lists a non-public route"
else
  note_pass
fi
check "robots.txt missing sitemap" "grep -q 'Sitemap: https://sapiensmetric.eu/sitemap.xml' '$REL/robots.txt'"
check "custom 404 missing" "grep -q 'Page not found' '$REL/404.html'"

# Confirmed contact + locale-preserving links.
check "public contact mailto missing" "grep -q 'href=\"mailto:info@sapiensmetric.eu\"' '$REL/lt/contact/index.html' && grep -q 'href=\"mailto:info@sapiensmetric.eu\"' '$REL/lt/index.html'"
if grep -rhoE --include='*.html' 'href="/en/(assessment-guide|understanding-results|about|contact|privacy|articles)[^"]*"' "$REL/lt" 2>/dev/null | grep -q .; then
  note_fail "LT release pages link to EN public routes"
else
  note_pass
fi
if grep -rhoE --include='*.html' 'href="/lt/(assessment-guide|understanding-results|about|contact|privacy|articles)[^"]*"' "$REL/en" 2>/dev/null | grep -q .; then
  note_fail "EN release pages link to LT public routes"
else
  note_pass
fi

# Public HTML must not reference application API endpoints.
if grep -rhoE --include='*.html' '/auth/(refresh|login|me|google)' "$REL" 2>/dev/null | grep -q .; then
  note_fail "public release HTML references application API endpoints"
else
  note_pass
fi

# Consent boundary: no GTM/GA4 references in the initial HTML (no pre-consent
# requests), no unconditional noscript iframe, and the consent UI is present.
if grep -r --include='*.html' -qiE 'https://www\.googletagmanager\.com|https://www\.google-analytics\.com|googletagmanager\.com/gtm\.js|gtag\(' "$REL" 2>/dev/null; then
  note_fail "release HTML references or preloads GTM/GA4 before consent"
else
  note_pass
fi
if grep -r --include='*.html' -qiE '<noscript[^>]*>[^<]*<iframe[^>]*googletagmanager' "$REL" 2>/dev/null; then
  note_fail "release HTML contains the unconditional GTM noscript iframe"
else
  note_pass
fi
check "consent UI missing in release (EN)" "grep -q 'Accept analytics' '$REL/en/index.html'"
check "consent UI missing in release (LT)" "grep -q 'Sutikti su analitika' '$REL/lt/index.html'"

printf '\nverify-public-release.sh: %d passed, %d failed\n' "$passes" "$failures"
if [ "$failures" -eq 0 ]; then
  printf 'All public-release invariants hold.\n'
  exit 0
else
  printf 'Public-release verification failed.\n'
  exit 1
fi
