#!/usr/bin/env bash
#
# verify-closed-release.sh — invariants for the closed review frontend release
# (T-023). Read-only: it validates an already-built `dist/closed-site`.
#
# It asserts that the closed artifact:
#   - contains the public pages AND the private application shells;
#   - marks every private shell `noindex` (robots);
#   - keeps private routes and the root remembered-language redirect OUT of the
#     sitemap;
#   - contains no answer-key/scoring material.
#
# It does NOT deploy anything.
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REL="$ROOT_DIR/dist/closed-site"
failures=0
passes=0
note_pass() { passes=$((passes + 1)); }
note_fail() { failures=$((failures + 1)); printf 'FAIL: %s\n' "$1"; }

if [ ! -d "$REL" ]; then
  echo "ERROR: closed release not found at $REL (run pnpm build:closed)" >&2
  exit 1
fi

PRIVATE_ROUTES=(auth/login auth/register auth/forgot-password auth/verify-email auth/reset-password account admin assessment)
PUBLIC_PAGES=("" assessment-guide understanding-results about contact privacy articles)

for locale in lt en; do
  for page in "${PUBLIC_PAGES[@]}"; do
    if [ -f "$REL/$locale/${page:+$page/}index.html" ]; then note_pass; else
      note_fail "closed release missing public page $locale/${page:-<home>}/"
    fi
  done
  for route in "${PRIVATE_ROUTES[@]}"; do
    file="$REL/$locale/$route/index.html"
    if [ -f "$file" ]; then note_pass; else
      note_fail "closed release missing private shell $locale/$route/"
      continue
    fi
    if grep -qiE '<meta[^>]+name="robots"[^>]+noindex' "$file"; then note_pass; else
      note_fail "private shell $locale/$route/ is not noindex"
    fi
  done
done

SITEMAP_FILES=("$REL/sitemap.xml" "$REL/page-sitemap.xml" "$REL/article-sitemap.xml")
# The sitemap must never advertise private routes or the root redirect.
if grep -Eq '/(auth|account|admin|assessment)(/|")' "${SITEMAP_FILES[@]}" 2>/dev/null; then
  note_fail "sitemap lists a private route"
else
  note_pass
fi
if grep -q '<loc>https://sapiensmetric.eu/</loc>' "${SITEMAP_FILES[@]}" 2>/dev/null; then
  note_fail "sitemap must not list the root remembered-language redirect"
else
  note_pass
fi
# The entry point must reference both child sitemaps (Yoast-style index).
if grep -q 'page-sitemap.xml' "$REL/sitemap.xml" && grep -q 'article-sitemap.xml' "$REL/sitemap.xml"; then
  note_pass
else
  note_fail "sitemap.xml does not reference the page/article child sitemaps"
fi

# No answer keys / scoring package may reach the closed web artifact.
if grep -rq --exclude-dir=_next -E 'correctOptionId|correctOptionIds|acceptedValue|absoluteTolerance|@sapiensmetric/assessment' "$REL" 2>/dev/null; then
  note_fail "closed artifact references keyed form/answer-key/scoring material"
else
  note_pass
fi

printf '\nverify-closed-release.sh: %d passed, %d failed\n' "$passes" "$failures"
if [ "$failures" -eq 0 ]; then
  echo "All closed-release invariants hold."
  exit 0
fi
echo "Closed-release invariant check failed." >&2
exit 1
