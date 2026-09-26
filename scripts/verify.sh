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
#   3. The archived T-006..T-011 records contain their exact titles and final
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
#      route is a remembered-language redirect, not a chooser; and D-020,
#      D-021, and D-022 are recorded. The static-export route structure, the
#      exported branding assets, and the exported root redirect are verified
#      separately by scripts/verify-static-export.sh after a build.
#  15. The FSD light structure exists (docs/fsd-light.md, the boundary check
#      script, the app/widgets/features/entities/shared layers, and no
#      processes), D-023 is recorded, and the boundary check runs in pnpm verify.
#  16. The T-012 roles/admin outputs exist (contracts, migration, the admin
#      module, the bootstrap CLI, entities/user, the admin feature/widget/route)
#      and D-024 is recorded.
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

# --- Invariant 3: T-006..T-013 archived; no active task -----------------
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

t011_archive='tasks/done/2026-09-26-fsd-light-frontend-structure.md'
t011_heading='# T-011 — FSD light frontend structure (archived)'
t011_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t011_heading" "$t011_archive"; then
  note_pass
else
  note_fail "T-011 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t011_status" "$t011_archive"; then
  note_pass
else
  note_fail "T-011 archive does not contain the final approved status"
fi

t012_archive='tasks/done/2026-09-26-user-roles-and-admin-dashboard.md'
t012_heading='# T-012 — User roles and admin dashboard (archived)'
t012_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t012_heading" "$t012_archive"; then
  note_pass
else
  note_fail "T-012 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t012_status" "$t012_archive"; then
  note_pass
else
  note_fail "T-012 archive does not contain the final approved status"
fi

t013_archive='tasks/done/2026-09-26-public-website-educational-content-seo.md'
t013_heading='# T-013 — Public website, educational content, and SEO foundation (archived)'
t013_status='- **Final status:** Approved (human review granted)'

if grep -qxF -- "$t013_heading" "$t013_archive"; then
  note_pass
else
  note_fail "T-013 archive does not contain the exact archived heading"
fi

if grep -qxF -- "$t013_status" "$t013_archive"; then
  note_pass
else
  note_fail "T-013 archive does not contain the final approved status"
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
  "apps/web/app/[locale]/(app)/auth/verify-email/page.tsx"
  "apps/web/app/[locale]/(app)/auth/forgot-password/page.tsx"
  "apps/web/app/[locale]/(app)/auth/reset-password/page.tsx"
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
# resolve under known top-level dirs with an extension. Historical task records
# under `tasks/done/` are excluded: they may reference paths as they existed at
# the time and must not be rewritten to track later refactors.
candidates="$(
  grep -hroE '(\.{0,2}/)?[A-Za-z0-9._/-]+\.(md|sh|ts|tsx|json|yml|yaml|txt|gitkeep)' \
    --include='*.md' \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=out \
    --exclude-dir=coverage \
    --exclude-dir=done \
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
  apps/web/features/auth/auth-types.ts
  apps/web/features/auth/auth-api.ts
  apps/web/features/auth/auth-navigation.ts
  apps/web/features/auth/auth-navigation.test.ts
  apps/web/features/auth/register-feedback.ts
  apps/web/features/auth/register-feedback.test.ts
  apps/web/features/auth/auth-provider.tsx
  apps/web/widgets/auth-nav/auth-nav.tsx
  apps/web/features/auth/auth-forms.tsx
  apps/web/features/auth/account-view.tsx
  "apps/web/app/(root)/layout.tsx"
  "apps/web/app/(root)/page.tsx"
  "apps/web/app/[locale]/layout.tsx"
  "apps/web/app/[locale]/(site)/page.tsx"
  "apps/web/app/[locale]/(app)/auth/login/page.tsx"
  "apps/web/app/[locale]/(app)/auth/register/page.tsx"
  "apps/web/app/[locale]/(app)/account/page.tsx"
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
  apps/web/features/auth/google-auth.ts
  apps/web/features/auth/google-auth.test.ts
  apps/web/shared/lib/single-flight.ts
  apps/web/shared/lib/single-flight.test.ts
  apps/web/features/auth/google-sign-in-button.tsx
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
  apps/web/shared/i18n/routing.ts
  apps/web/shared/i18n/request.ts
  apps/web/shared/i18n/navigation.ts
  apps/web/messages/lt.json
  apps/web/messages/en.json
  apps/web/shared/lib/locale-navigation.ts
  apps/web/shared/lib/locale-navigation.test.ts
  apps/web/shared/i18n/messages.test.ts
  "apps/web/app/[locale]/layout.tsx"
  "apps/web/app/[locale]/(site)/page.tsx"
  "apps/web/app/[locale]/(app)/account/page.tsx"
  "apps/web/app/[locale]/(app)/auth/login/page.tsx"
  "apps/web/app/[locale]/(app)/auth/register/page.tsx"
  "apps/web/app/[locale]/(app)/auth/verify-email/page.tsx"
  "apps/web/app/[locale]/(app)/auth/forgot-password/page.tsx"
  "apps/web/app/[locale]/(app)/auth/reset-password/page.tsx"
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
  apps/web/shared/lib/claims-guard.test.ts
  apps/web/shared/lib/locale-navigation.ts
  apps/web/shared/lib/locale-navigation.test.ts
  apps/web/shared/branding/branding.ts
  apps/web/shared/lib/locale-preference.ts
  apps/web/shared/lib/locale-preference.test.ts
  apps/web/shared/ui/brand-mark.tsx
  apps/web/shared/ui/loading-screen.tsx
  apps/web/features/locale-preference/locale-preference-sync.tsx
  apps/web/features/locale-preference/root-redirect.tsx
  apps/web/widgets/app-shell/app-shell.tsx
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
  if grep -qF "$marker" apps/web/shared/branding/branding.ts; then
    note_pass
  else
    note_fail "apps/web/shared/branding/branding.ts is missing the stable asset path: $marker"
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

if grep -qF 'role="status"' "apps/web/shared/ui/loading-screen.tsx" &&
  grep -qF 'animate-spin' "apps/web/shared/ui/loading-screen.tsx"; then
  note_pass
else
  note_fail "the shared loading screen is not a centred accessible spinner"
fi

if grep -qF 'resolveRootTargetFromStorage' "apps/web/features/locale-preference/root-redirect.tsx" &&
  grep -qF 'location.replace' "apps/web/features/locale-preference/root-redirect.tsx"; then
  note_pass
else
  note_fail "the root redirect feature does not resolve the preference and replace the location"
fi

if grep -qiE 'http-equiv|httpEquiv' "apps/web/features/locale-preference/root-redirect.tsx"; then
  note_fail "the root redirect still uses a meta refresh (it would defeat a remembered lt preference)"
else
  note_pass
fi

if grep -qiE 'Pasirinkite kalb|Choose a language|Redirecting' "apps/web/features/locale-preference/root-redirect.tsx"; then
  note_fail "the root redirect still presents chooser/placeholder copy"
else
  note_pass
fi

if grep -qF 'LocalePreferenceSync' "apps/web/app/[locale]/layout.tsx"; then
  note_pass
else
  note_fail "the locale layout does not persist the locale preference on entry"
fi

# --- Invariant 15: FSD light structure and boundaries (T-011/T-012) ------

if [ -f docs/fsd-light.md ]; then
  note_pass
else
  note_fail "docs/fsd-light.md is missing"
fi

if [ -f scripts/verify-fsd-boundaries.mjs ]; then
  note_pass
else
  note_fail "scripts/verify-fsd-boundaries.mjs is missing"
fi

for layer in entities shared features widgets; do
  if [ -d "apps/web/$layer" ]; then
    note_pass
  else
    note_fail "apps/web/$layer/ is missing (FSD light layer)"
  fi
done

for forbidden in processes; do
  if [ -e "apps/web/$forbidden" ]; then
    note_fail "apps/web/$forbidden/ must not exist (FSD light has no such layer)"
  else
    note_pass
  fi
done

d023_heading='### D-023 — FSD light web frontend structure'

if grep -qxF -- "$d023_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-023 heading"
fi

if grep -qF 'verify-fsd-boundaries' package.json; then
  note_pass
else
  note_fail "package.json does not run the FSD boundary check in the verify chain"
fi

# --- Invariant 16: T-012 roles/admin outputs and D-024 ------------------

t012_outputs=(
  packages/contracts/src/admin.ts
  apps/api/src/database/migrations/1781440000003-CreateRolesAndAdminAudit.ts
  apps/api/src/database/promote-admin.ts
  apps/api/src/modules/admin/admin-audit.entity.ts
  apps/api/src/modules/admin/admin-store.ts
  apps/api/src/modules/admin/admin.service.ts
  apps/api/src/modules/admin/admin.guard.ts
  apps/api/src/modules/admin/admin.controller.ts
  apps/api/src/modules/admin/admin.module.ts
  apps/api/src/modules/admin/admin.controller.spec.ts
  apps/api/src/modules/admin/admin.integration.spec.ts
  apps/api/src/database/promote-admin.logic.ts
  apps/api/src/database/promote-admin.spec.ts
  apps/web/entities/user/model/types.ts
  apps/web/entities/user/ui/role-badge.tsx
  apps/web/entities/user/ui/status-badge.tsx
  apps/web/entities/user/ui/verified-badge.tsx
  apps/web/features/admin/admin-api.ts
  apps/web/features/admin/admin-screen.tsx
  apps/web/features/admin/admin-filters.ts
  apps/web/features/admin/admin-filters.test.ts
  apps/web/features/admin/admin-access.ts
  apps/web/features/admin/admin-access.test.ts
  apps/web/features/auth/login-links.test.ts
  apps/web/widgets/admin-shell/admin-shell.tsx
  "apps/web/app/[locale]/(app)/admin/page.tsx"
)

for out in "${t012_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-012 output missing: $out"
  fi
done

if grep -qF 'admin:promote' apps/api/package.json; then
  note_pass
else
  note_fail "apps/api/package.json is missing the admin:promote bootstrap command"
fi

if grep -qF './entities/**' apps/web/tailwind.config.ts; then
  note_pass
else
  note_fail "tailwind.config.ts does not scan the entities layer"
fi

d024_heading='### D-024 — User roles, account status, and administration'

if grep -qxF -- "$d024_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-024 heading"
fi

if grep -qF 'admin:promote' docs/local-development.md; then
  note_pass
else
  note_fail "docs/local-development.md does not document the admin:promote command"
fi

# --- Invariant 17: T-013 public site / SEO outputs and D-025 -------------

t013_outputs=(
  apps/web/shared/content/types.ts
  apps/web/shared/content/site.ts
  apps/web/shared/content/pages.ts
  apps/web/shared/content/articles.ts
  apps/web/shared/content/seo.ts
  apps/web/shared/content/index.ts
  apps/web/shared/ui/content-page.tsx
  apps/web/shared/ui/article-list.tsx
  apps/web/shared/lib/claims-rules.ts
  apps/web/shared/lib/content-claims-guard.test.ts
  apps/web/shared/lib/locale-links.ts
  apps/web/shared/lib/locale-links.test.ts
  apps/web/widgets/site-header/site-header.tsx
  apps/web/widgets/site-footer/site-footer.tsx
  apps/web/widgets/site-shell/site-shell.tsx
  "apps/web/app/[locale]/(site)/layout.tsx"
  "apps/web/app/[locale]/(site)/page.tsx"
  "apps/web/app/[locale]/(site)/assessment-guide/page.tsx"
  "apps/web/app/[locale]/(site)/understanding-results/page.tsx"
  "apps/web/app/[locale]/(site)/about/page.tsx"
  "apps/web/app/[locale]/(site)/contact/page.tsx"
  "apps/web/app/[locale]/(site)/privacy/page.tsx"
  "apps/web/app/[locale]/(site)/articles/page.tsx"
  "apps/web/app/[locale]/(site)/articles/[slug]/page.tsx"
  "apps/web/app/[locale]/(app)/layout.tsx"
  "apps/web/app/sitemap.ts"
  "apps/web/app/robots.ts"
  "apps/web/app/not-found.tsx"
  docs/content.md
  docs/publication-checklist.md
)

for out in "${t013_outputs[@]}"; do
  if [ -e "$out" ]; then
    note_pass
  else
    note_fail "T-013 output missing: $out"
  fi
done

d025_heading='### D-025 — Public website, educational content, SEO, and the analytics boundary'

if grep -qxF -- "$d025_heading" docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not contain the exact D-025 heading"
fi

if grep -qF 'T-014' docs/decisions.md && grep -qF 'GTM' docs/decisions.md; then
  note_pass
else
  note_fail "docs/decisions.md does not record the T-014 analytics plan"
fi

if grep -qF 'admin:promote' docs/local-development.md; then
  note_pass
else
  note_fail "docs/local-development.md lost the admin:promote command"
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
