#!/usr/bin/env bash
#
# verify.sh — Documentation-harness invariant checks for Sapiens Metric.
#
# Verifies only the documentation-first harness. It does NOT require Node or
# any external dependency; it is a Bash script using common shell utilities
# (bash, grep, sed, test). It is read-only: it never writes repository state
# and never reads `.env`.
#
# Invariants checked:
#   1. Core docs (including docs/email-verification.md), the six T-001
#      discovery documents, and the four T-002 documents exist.
#   2. The T-001, T-002, T-003, T-004, T-005, and T-006 task archives exist
#      (T-007..T-010 are asserted in invariant 3).
#   3. The archived T-006..T-010 records contain their exact titles and final
#      approved statuses; the archived T-006 record contains the required
#      definition sections, the six exact browser routes, and the access-gate
#      markers; tasks/current.md declares that no task is active.
#   4. docs/decisions.md contains D-016 (heading, and section-scoped date /
#      O-006 note / verification access gate / review-correction markers),
#      D-017 (conventional registration), D-018 (Google OIDC), and D-019
#      (next-intl UI internationalisation).
#   5. The completed T-006 outputs exist (mailer module, action-token service,
#      CreateEmailActionTokens migration, six LT/EN pages, privacy document).
#   6. The completed T-005 outputs exist.
#   7. The T-004 outputs (compose.yaml, .env.example, docs/local-development.md)
#      exist.
#   8. .gitignore contains an exact .env ignore rule.
#   9. The T-003 implementation source outputs and pnpm-lock.yaml exist.
#  10. Local markdown references (./paths and relative paths) do not point to
#      missing files, where reasonably checkable.
#  11. The T-008 authentication frontend outputs exist.
#  12. The T-007 Google sign-in outputs exist.
#  13. The T-009 next-intl i18n outputs exist (config, catalogues, consolidated
#      locale routes, pure locale helpers and their tests).
#  14. The T-010 corrective outputs exist (trailing-slash static-export config,
#      the static-export invariant script, the claims guard, the aligned local
#      profile, and the env-file isolation behaviour); the approved branding
#      WebP assets exist and are referenced from their stable paths; the root
#      route is a static-export default-locale redirect, not a chooser; and
#      D-020, D-021, and D-022 are recorded. The static-export route structure,
#      the exported branding assets, and the exported root redirect are verified
#      separately by scripts/verify-static-export.sh after a build.
#
# Exit code 0 = all invariants hold; non-zero = at least one failed.

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

failures=0
passes=0

note_pass() { passes=$((passes + 1)); }
note_fail() {
  failures=$((failures + 1))
  printf 'FAIL: %s\n' "$1"
}

# --- Invariant 1: core docs, T-001 and T-002 documents exist ------------

required_files=(
  AGENTS.md
  README.md
  TODO.md
  docs/product-brief.md
  docs/assessment-principles.md
  docs/architecture.md
  docs/testing.md
  docs/decisions.md
  docs/measurement-model.md
  docs/item-format-inventory.md
  docs/claims-ladder.md
  docs/validation-norming-gap.md
  docs/research-open-questions.md
  docs/research-sources.md
  docs/initial-instrument-options.md
  docs/initial-instrument-decision-brief.md
  docs/item-provenance-policy-proposal.md
  docs/t002-research-sources.md
  docs/authentication.md
  docs/email-verification.md
  tasks/current.md
  tasks/done/.gitkeep
  scripts/verify.sh
)

for f in "${required_files[@]}"; do
  if [ -f "$f" ]; then
    note_pass
  else
    note_fail "required file missing: $f"
  fi
done

# --- Invariant 2: task archives exist -----------------------------------

archives=(
  tasks/done/2026-09-09-product-and-psychometric-discovery-baseline.md
  tasks/done/2026-09-09-initial-instrument-scope-and-item-provenance-decision-proposal.md
  tasks/done/2026-09-09-application-foundation-scaffold.md
  tasks/done/2026-09-09-local-mysql-development-environment.md
  tasks/done/2026-09-09-typeorm-persistence-and-credentials-authentication-core.md
  tasks/done/2026-09-21-email-verification-and-password-reset-delivery.md
)

for a in "${archives[@]}"; do
  if [ -f "$a" ]; then
    note_pass
  else
    note_fail "task archive missing: $a"
  fi
done

# --- Invariant 3: T-006..T-010 archived; no active task -----------------
# The archived records' exact headings and final statuses are asserted
# literally; tasks/current.md must declare that no task is active.

t006_archive='tasks/done/2026-09-21-email-verification-and-password-reset-delivery.md'
t006_heading='# T-006 — Email verification and password-reset delivery through generic SMTP (archived)'
t006_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t006_heading" "$t006_archive"; then
  note_pass
else
  note_fail "T-006 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t006_status" "$t006_archive"; then
  note_pass
else
  note_fail "T-006 archive does not contain the final approved status"
fi

t008_archive='tasks/done/2026-09-21-classical-authentication-frontend.md'
t008_heading='# T-008 — Classical authentication frontend (LT/EN browser journey) (archived)'
t008_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t008_heading" "$t008_archive"; then
  note_pass
else
  note_fail "T-008 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t008_status" "$t008_archive"; then
  note_pass
else
  note_fail "T-008 archive does not contain the final approved status"
fi

t007_archive='tasks/done/2026-09-21-google-oauth-sign-in.md'
t007_heading='# T-007 — Google OAuth 2.0 / OpenID Connect sign-in (archived)'
t007_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t007_heading" "$t007_archive"; then
  note_pass
else
  note_fail "T-007 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t007_status" "$t007_archive"; then
  note_pass
else
  note_fail "T-007 archive does not contain the final approved status"
fi

t009_archive='tasks/done/2026-09-21-next-intl-bilingual-frontend-refactor.md'
t009_heading='# T-009 — next-intl bilingual frontend refactor (LT/EN UI) (archived)'
t009_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t009_heading" "$t009_archive"; then
  note_pass
else
  note_fail "T-009 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t009_status" "$t009_archive"; then
  note_pass
else
  note_fail "T-009 archive does not contain the final approved status"
fi

t010_archive='tasks/done/2026-09-26-static-export-routes-config-isolation-claims-guard.md'
t010_heading='# T-010 — Static-export directory routes, config/test isolation, and claims guard (archived)'
t010_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t010_heading" "$t010_archive"; then
  note_pass
else
  note_fail "T-010 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t010_status" "$t010_archive"; then
  note_pass
else
  note_fail "T-010 archive does not contain the final approved status"
fi

if grep -qF 'No task is active' tasks/current.md; then
  note_pass
else
  note_fail "tasks/current.md does not declare that no task is active"
fi

t007_sections=(
  '## Objective'
  '## Route / API matrix'
  '## Database change'
  '## Required account behaviour'
  '## Security requirements'
  '## Acceptance criteria'
  '## Reading order'
)

for section in "${t007_sections[@]}"; do
  if grep -qF "$section" "$t007_archive"; then
    note_pass
  else
    note_fail "T-007 task definition missing section: $section"
  fi
done

t008_sections=(
  '## Objective'
  '## Binding context and constraints'
  '## Exact route matrix'
  '## Bootstrap rules'
  '## Registration flow decision (D-017)'
  '## Required outputs'
  '## Non-goals'
  '## Acceptance criteria'
  '## Reading order'
)

for section in "${t008_sections[@]}"; do
  if grep -qF "$section" "$t008_archive"; then
    note_pass
  else
    note_fail "T-008 task definition missing section: $section"
  fi
done

t006_sections=(
  '## Objective'
  '## Token lifecycle'
  '## Endpoints'
  '## Verification access gate'
  '## Browser flow'
  '## Public configuration'
  '## Privacy boundary'
  '## SMTP safety rules'
  '## Future outputs'
  '## Non-goals'
  '## Acceptance criteria'
  '## Reading order'
  '## Browser flow decision'
  '## Completion report'
)

for section in "${t006_sections[@]}"; do
  if grep -qF "$section" "$t006_archive"; then
    note_pass
  else
    note_fail "T-006 task definition missing section: $section"
  fi
done

# The six exact browser-flow routes must be recorded.
t006_routes=(
  '/lt/auth/verify-email'
  '/en/auth/verify-email'
  '/lt/auth/forgot-password'
  '/en/auth/forgot-password'
  '/lt/auth/reset-password'
  '/en/auth/reset-password'
)

for route in "${t006_routes[@]}"; do
  if grep -qF -- "$route" "$t006_archive"; then
    note_pass
  else
    note_fail "T-006 task definition missing selected browser route: $route"
  fi
done

# The verification access-gate decision and its required test coverage.
t006_gate_markers=(
  'Email verification is an access gate, not an informational flag'
  'no access token and no refresh cookie are issued'
  'Auth tests cover unverified login rejection'
  'existing sessions do not bypass the gate'
)

for marker in "${t006_gate_markers[@]}"; do
  if grep -qF "$marker" "$t006_archive"; then
    note_pass
  else
    note_fail "T-006 task definition missing access-gate marker: $marker"
  fi
done

# Human-review corrections recorded in the task definition.
t006_review_markers=(
  'fails the static web build'
  'exact HTTP(S) origins'
  'must be equal after canonicalisation'
  'API_PORT'
  'reverse proxy'
  'current human configuration uses 3334'
  'rejects userinfo, query strings, and fragments'
  'STARTTLS'
  '5 password-reset confirmation calls per hour per IP'
  '10,000 distinct keys'
  'POST /auth/logout rejects an absent or mismatched Origin'
)

for marker in "${t006_review_markers[@]}"; do
  if grep -qF "$marker" "$t006_archive"; then
    note_pass
  else
    note_fail "T-006 task definition missing review marker: $marker"
  fi
done

# --- Invariant 4: D-016 is recorded in docs/decisions.md ------------------

d016_heading='### D-016 — Email action tokens, generic SMTP, and minimal LT/EN browser flow'

if grep -qxF -- "$d016_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-016 heading"
fi

# Scope the date/O-006/gate assertions to the D-016 section itself (from its
# heading up to the next section heading).
d016_section="$(
  awk '
    /^### D-016 / { in_section = 1 }
    in_section && /^##/ && $0 !~ /^### D-016 / { in_section = 0 }
    in_section { print }
  ' docs/decisions.md
)"

if printf '%s\n' "$d016_section" | grep -qF 'Date: 2026-09-18'; then
  note_pass
else
  note_fail "D-016 section does not contain its date (2026-09-18)"
fi

if printf '%s\n' "$d016_section" | grep -qF 'does not resolve O-006'; then
  note_pass
else
  note_fail "D-016 section does not record that it leaves O-006 unresolved"
fi

if printf '%s\n' "$d016_section" | grep -qF 'Email verification is an access gate'; then
  note_pass
else
  note_fail "D-016 section does not record the verification access gate"
fi

# Human-review corrections recorded in D-016.
d016_review_markers=(
  'fails the static web build'
  'exact HTTP(S) origins'
  'must be equal after canonicalisation'
  'API_PORT'
  'reverse proxy'
  'current human configuration uses 3334'
  'rejects userinfo, query strings, and fragments'
  'STARTTLS'
  '5 password-reset confirmation calls per hour per IP'
  '10,000 distinct keys'
  'POST /auth/logout rejects an absent or mismatched Origin'
)

for marker in "${d016_review_markers[@]}"; do
  if printf '%s\n' "$d016_section" | grep -qF "$marker"; then
    note_pass
  else
    note_fail "D-016 section missing review marker: $marker"
  fi
done

# --- Invariant 4b: D-017 (conventional registration) is recorded ----------

d017_heading='### D-017 — Conventional registration UX (verification on registration, explicit duplicate)'

if grep -qxF -- "$d017_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-017 heading"
fi

d017_markers=(
  'EMAIL_ALREADY_REGISTERED'
  'VERIFICATION_EMAIL_DELIVERY_FAILED'
  'account-enumeration resistance for conventional UX'
)

for marker in "${d017_markers[@]}"; do
  if grep -qF "$marker" docs/decisions.md; then
    note_pass
  else
    note_fail "docs/decisions.md D-017 missing marker: $marker"
  fi
done

# --- Invariant 4c: D-018 (Google OIDC) is recorded ------------------------

d018_heading='### D-018 — Google OpenID Connect sign-in'

if grep -qxF -- "$d018_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-018 heading"
fi

d018_markers=(
  'PKCE'
  'immutable OIDC `sub`'
  'HKDF-SHA256-derived key'
  'GOOGLE_OAUTH_UNAVAILABLE'
)

for marker in "${d018_markers[@]}"; do
  if grep -qF "$marker" docs/decisions.md; then
    note_pass
  else
    note_fail "docs/decisions.md D-018 missing marker: $marker"
  fi
done

# --- Invariant 4d: D-019 (next-intl UI i18n) is recorded ------------------

d019_heading='### D-019 — UI internationalisation with next-intl'

if grep -qxF -- "$d019_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-019 heading"
fi

d019_markers=(
  'next-intl'
  'messages/lt.json'
  'API/database assessment-item model'
  'Russian'
)

for marker in "${d019_markers[@]}"; do
  if grep -qF "$marker" docs/decisions.md; then
    note_pass
  else
    note_fail "docs/decisions.md D-019 missing marker: $marker"
  fi
done

# --- Invariant 5: completed T-006 outputs exist ---------------------------

t006_outputs=(
  apps/api/src/modules/mailer
  apps/api/src/modules/mailer/transport.ts
  apps/api/src/modules/mailer/nodemailer-transport.ts
  apps/api/src/modules/mailer/mailer.service.ts
  apps/api/src/modules/mailer/mailer.module.ts
  apps/api/src/modules/auth/action-token.service.ts
  apps/api/src/modules/auth/action-tokens
  apps/api/src/modules/auth/action-tokens/email-action-token.entity.ts
  apps/api/src/modules/auth/action-tokens/action-token.store.ts
  apps/api/src/modules/auth/ip-rate-limiter.ts
  apps/api/src/database/cleanup-action-tokens.ts
  apps/api/src/smtp-smoke.ts
  docs/email-verification.md
  "apps/web/app/[locale]/auth/verify-email/page.tsx"
  "apps/web/app/[locale]/auth/forgot-password/page.tsx"
  "apps/web/app/[locale]/auth/reset-password/page.tsx"
)

for out in "${t006_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-006 output missing: $out"
  fi
done

if compgen -G 'apps/api/src/database/migrations/*CreateEmailActionTokens*' >/dev/null 2>&1; then
  note_pass
else
  note_fail "T-006 migration *CreateEmailActionTokens* is missing"
fi

# --- Invariant 6: T-005 completed outputs exist --------------------------

t005_outputs=(
  apps/api/src/config
  apps/api/src/database
  apps/api/src/database/migrations
  apps/api/src/modules/users
  apps/api/src/modules/auth
  apps/api/src/modules/auth/sessions
  packages/contracts/src/auth.ts
  packages/contracts/src/auth.spec.ts
  packages/contracts/src/index.ts
  docs/authentication.md
)

for out in "${t005_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-005 output missing: $out"
  fi
done

# --- Invariant 7: T-004 outputs exist -----------------------------------

t004_outputs=(
  compose.yaml
  .env.example
  docs/local-development.md
)

for out in "${t004_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-004 output missing: $out"
  fi
done

# --- Invariant 8: .gitignore has an exact .env ignore rule --------------

if grep -qxF '.env' .gitignore; then
  note_pass
else
  note_fail ".gitignore does not contain an exact '.env' ignore rule"
fi

# --- Invariant 9: T-003 implementation source outputs exist --------------

t003_outputs=(
  pnpm-workspace.yaml
  package.json
  pnpm-lock.yaml
  apps/web/package.json
  apps/web/next.config.mjs
  "apps/web/app/(root)/page.tsx"
  "apps/web/app/[locale]/layout.tsx"
  apps/api/package.json
  apps/api/src/main.ts
  apps/api/src/app.module.ts
  apps/api/src/health.controller.ts
  apps/api/src/health.controller.spec.ts
  packages/contracts/package.json
  packages/contracts/src/health.ts
  packages/assessment/package.json
  packages/assessment/src/index.ts
)

for out in "${t003_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-003 implementation output missing: $out"
  fi
done

# --- Invariant 10: local markdown references resolve ---------------------

# Collect every bare path-like token that looks like a local reference to a
# file inside the repo (relative "path/file.ext" or "./path/file.ext"), then
# check each candidate exists. We intentionally do not require directories
# that are described as "planned"/future to exist, so we only check tokens that
# resolve under known top-level dirs with an extension.
candidates="$(
  grep -hroE '(\.{0,2}/)?[A-Za-z0-9._/-]+\.(md|sh|ts|tsx|json|yml|yaml|txt|gitkeep)' \
    --include='*.md' \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=out \
    --exclude-dir=coverage \
    . 2>/dev/null \
  | sed -E 's/^\(//; s/[),:;]*$//'
)"

if [ -n "$candidates" ]; then
  while IFS= read -r ref; do
    # Normalise "./" prefix.
    rel="${ref#./}"
    # Keep only paths under docs/, tasks/, scripts/, packages/ or apps/.
    case "$rel" in
      docs/*|tasks/*|scripts/*|packages/*|apps/*|AGENTS.md|README.md) ;;
      *) continue ;;
    esac
    if [ -e "$rel" ]; then
      note_pass
    else
      note_fail "markdown references missing local file: $ref"
    fi
  done <<EOF
$candidates
EOF
fi

# --- Invariant 11: T-008 authentication frontend outputs exist ----------
# T-009 consolidated the LT/EN route duplication into the `app/[locale]` and
# `app/(root)` structure; the shared lib/components remain.

t008_outputs=(
  apps/api/src/modules/auth/registration.controller.spec.ts
  apps/web/lib/auth-types.ts
  apps/web/lib/auth-api.ts
  apps/web/lib/auth-navigation.ts
  apps/web/lib/auth-navigation.test.ts
  apps/web/lib/register-feedback.ts
  apps/web/lib/register-feedback.test.ts
  apps/web/app/_components/auth-provider.tsx
  apps/web/app/_components/auth-nav.tsx
  apps/web/app/_components/auth-forms.tsx
  apps/web/app/_components/account-view.tsx
  "apps/web/app/(root)/layout.tsx"
  "apps/web/app/(root)/page.tsx"
  apps/web/app/[locale]/layout.tsx
  apps/web/app/[locale]/page.tsx
  apps/web/app/[locale]/auth/login/page.tsx
  apps/web/app/[locale]/auth/register/page.tsx
  apps/web/app/[locale]/account/page.tsx
)

for out in "${t008_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-008 output missing: $out"
  fi
done

# --- Invariant 12: T-007 Google sign-in outputs exist --------------------

t007_outputs=(
  apps/api/src/modules/auth/identities/user-identity.entity.ts
  apps/api/src/modules/auth/identities/identity-store.ts
  apps/api/src/modules/auth/identities/identities.module.ts
  apps/api/src/modules/auth/google/oauth-transaction.service.ts
  apps/api/src/modules/auth/google/return-to.ts
  apps/api/src/modules/auth/google/google-jwks.client.ts
  apps/api/src/modules/auth/google/google-id-token.service.ts
  apps/api/src/modules/auth/google/google-token.client.ts
  apps/api/src/modules/auth/google/google-auth.service.ts
  apps/api/src/modules/auth/google/google-auth.controller.ts
  apps/api/src/modules/auth/google/oauth-transaction.service.spec.ts
  apps/api/src/modules/auth/google/google-auth.controller.spec.ts
  apps/api/src/modules/auth/google/google-id-token.service.spec.ts
  apps/api/src/database/migrations/1781440000002-CreateUserIdentities.ts
  apps/web/lib/google-auth.ts
  apps/web/lib/google-auth.test.ts
  apps/web/lib/single-flight.ts
  apps/web/lib/single-flight.test.ts
  apps/web/app/_components/google-sign-in-button.tsx
)

for out in "${t007_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-007 output missing: $out"
  fi
done

# --- Invariant 13: T-009 next-intl i18n outputs exist --------------------

t009_outputs=(
  apps/web/i18n/routing.ts
  apps/web/i18n/request.ts
  apps/web/i18n/navigation.ts
  apps/web/messages/lt.json
  apps/web/messages/en.json
  apps/web/lib/locale-navigation.ts
  apps/web/lib/locale-navigation.test.ts
  apps/web/lib/messages.test.ts
  "apps/web/app/[locale]/layout.tsx"
  "apps/web/app/[locale]/page.tsx"
  "apps/web/app/[locale]/account/page.tsx"
  "apps/web/app/[locale]/auth/login/page.tsx"
  "apps/web/app/[locale]/auth/register/page.tsx"
  "apps/web/app/[locale]/auth/verify-email/page.tsx"
  "apps/web/app/[locale]/auth/forgot-password/page.tsx"
  "apps/web/app/[locale]/auth/reset-password/page.tsx"
)

for out in "${t009_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-009 output missing: $out"
  fi
done

if grep -qF "next-intl" apps/web/package.json; then
  note_pass
else
  note_fail "apps/web/package.json does not depend on next-intl"
fi

if grep -qF "createNextIntlPlugin" apps/web/next.config.mjs; then
  note_pass
else
  note_fail "next.config.mjs does not wire the next-intl plugin"
fi

# --- Invariant 14: T-010 corrective outputs and D-020 --------------------

t010_outputs=(
  scripts/verify-static-export.sh
  apps/web/lib/claims-guard.test.ts
  apps/web/lib/locale-navigation.ts
  apps/web/lib/locale-navigation.test.ts
  apps/web/lib/branding.ts
  apps/web/lib/locale-preference.ts
  apps/web/lib/locale-preference.test.ts
  apps/web/app/_components/brand-mark.tsx
  apps/web/app/_components/locale-preference-sync.tsx
  "apps/web/app/(root)/page.tsx"
  apps/api/src/config/env.spec.ts
)

for out in "${t010_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-010 output missing: $out"
  fi
done

if grep -qF 'trailingSlash: true' apps/web/next.config.mjs; then
  note_pass
else
  note_fail "apps/web/next.config.mjs does not enable trailingSlash (directory index.html routes)"
fi

if grep -qF 'verify-static-export.sh' package.json; then
  note_pass
else
  note_fail "package.json does not run the static-export invariant script"
fi

d020_heading='### D-020 — Static-export directory routes, local profile, claims guard, and env-file isolation'

if grep -qxF -- "$d020_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-020 heading"
fi

# Approved branding asset interface (stable filenames and public paths).
branding_assets=(
  apps/web/public/branding/sapiens-metric-logo-dark.webp
  apps/web/public/branding/sapiens-metric-logo-light.webp
  apps/web/public/branding/sapiens-metric-logo-middle.webp
  apps/web/public/branding/sapiens-metric-logo-favicon.webp
)

for asset in "${branding_assets[@]}"; do
  if [ -f "$asset" ]; then
    note_pass
  else
    note_fail "approved branding asset missing: $asset"
  fi
done

branding_markers=(
  'sapiens-metric-logo-dark.webp'
  'sapiens-metric-logo-light.webp'
  'sapiens-metric-logo-middle.webp'
  'sapiens-metric-logo-favicon.webp'
)

for marker in "${branding_markers[@]}"; do
  if grep -qF "$marker" apps/web/lib/branding.ts; then
    note_pass
  else
    note_fail "apps/web/lib/branding.ts is missing the stable asset path: $marker"
  fi
done

if grep -qF 'BRANDING.favicon' "apps/web/app/[locale]/layout.tsx" &&
  grep -qF 'BRANDING.favicon' "apps/web/app/(root)/layout.tsx"; then
  note_pass
else
  note_fail "the supplied favicon is not registered in both root layouts"
fi

d021_heading='### D-021 — Branding asset interface (stable WebP filenames and public paths)'

if grep -qxF -- "$d021_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-021 heading"
fi

# Root route is a static-export default-locale redirect, never a chooser (D-022).
d022_heading='### D-022 — Root route: remembered-language redirect (no chooser)'

if grep -qxF -- "$d022_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-022 heading"
fi

if grep -qF 'role="status"' "apps/web/app/(root)/page.tsx" &&
  grep -qF 'animate-spin' "apps/web/app/(root)/page.tsx" &&
  grep -qF 'resolveRootTargetFromStorage' "apps/web/app/(root)/page.tsx"; then
  note_pass
else
  note_fail "the root page is not a centred loading state with a preference-based redirect"
fi

if grep -qiE 'http-equiv|httpEquiv' "apps/web/app/(root)/page.tsx"; then
  note_fail "the root page still uses a meta refresh (it would defeat a remembered lt preference)"
else
  note_pass
fi

if grep -qiE 'Pasirinkite kalb|Choose a language|Redirecting' "apps/web/app/(root)/page.tsx"; then
  note_fail "the root page still presents chooser/placeholder copy"
else
  note_pass
fi

if grep -qF 'LocalePreferenceSync' "apps/web/app/[locale]/layout.tsx"; then
  note_pass
else
  note_fail "the locale layout does not persist the locale preference on entry"
fi

# --- Summary -----------------------------------------------------------

printf '\nverify.sh: %d passed, %d failed\n' "$passes" "$failures"
if [ "$failures" -eq 0 ]; then
  printf 'All harness invariants hold.\n'
  exit 0
else
  printf 'Harness invariant check failed.\n'
  exit 1
fi
