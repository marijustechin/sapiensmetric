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
#   2. The T-001, T-002, T-003, T-004, T-005, and T-006 task archives exist.
#   3. tasks/current.md declares that no task is active, and the archived T-006
#      record contains the exact title, the final approved status, the required
#      definition sections, the six exact browser routes, and the access-gate
#      markers.
#   4. docs/decisions.md contains D-016 (heading, and section-scoped date /
#      O-006 note / verification access gate / review-correction markers).
#   5. The completed T-006 outputs exist (mailer module, action-token service,
#      CreateEmailActionTokens migration, six LT/EN pages, privacy document).
#   6. The completed T-005 outputs exist.
#   7. The T-004 outputs (compose.yaml, .env.example, docs/local-development.md)
#      exist.
#   8. .gitignore contains an exact .env ignore rule.
#   9. The T-003 implementation source outputs and pnpm-lock.yaml exist.
#  10. Local markdown references (./paths and relative paths) do not point to
#      missing files, where reasonably checkable.
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

# --- Invariant 3: T-006 is approved and archived; no active task ---------
# The archived record's exact heading and final status are asserted literally,
# and tasks/current.md must declare that no task is active.

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

if grep -qxF -- '# No active task' tasks/current.md; then
  note_pass
else
  note_fail "tasks/current.md does not declare '# No active task'"
fi

if grep -qF 'No task is currently active' tasks/current.md; then
  note_pass
else
  note_fail "tasks/current.md does not state that no task is currently active"
fi

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
  apps/web/app/lt/auth/verify-email/page.tsx
  apps/web/app/en/auth/verify-email/page.tsx
  apps/web/app/lt/auth/forgot-password/page.tsx
  apps/web/app/en/auth/forgot-password/page.tsx
  apps/web/app/lt/auth/reset-password/page.tsx
  apps/web/app/en/auth/reset-password/page.tsx
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
  apps/web/app/page.tsx
  apps/web/app/layout.tsx
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

# --- Summary -----------------------------------------------------------

printf '\nverify.sh: %d passed, %d failed\n' "$passes" "$failures"
if [ "$failures" -eq 0 ]; then
  printf 'All harness invariants hold.\n'
  exit 0
else
  printf 'Harness invariant check failed.\n'
  exit 1
fi
