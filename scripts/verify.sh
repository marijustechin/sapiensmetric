#!/usr/bin/env bash
#
# verify.sh — Documentation-harness invariant checks for Sapiens Metric.
#
# Verifies only the documentation-first harness. It does NOT require Node or
# any external dependency; it is a Bash script using common shell utilities
# (bash, grep, sed, test).
#
# Invariants checked:
#   1. Core docs, the six T-001 discovery documents, and the four T-002
#      documents exist.
#   2. The T-001, T-002, T-003, T-004, and T-005 task archives exist.
#   3. tasks/current.md states that no task is currently active.
#   4. The completed T-005 outputs exist.
#   5. The T-004 outputs (compose.yaml, .env.example, docs/local-development.md)
#      exist.
#   6. .gitignore contains an exact .env ignore rule.
#   7. The T-003 implementation source outputs and pnpm-lock.yaml exist.
#   8. Local markdown references (./paths and relative paths) do not point to
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
)

for a in "${archives[@]}"; do
  if [ -f "$a" ]; then
    note_pass
  else
    note_fail "task archive missing: $a"
  fi
done

# --- Invariant 3: no task is currently active ---------------------------

if grep -qF 'No task is currently active.' tasks/current.md; then
  note_pass
else
  note_fail "tasks/current.md does not state that no task is currently active"
fi

# --- Invariant 4: T-005 completed outputs exist --------------------------

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

# --- Invariant 5: T-004 outputs exist -----------------------------------

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

# --- Invariant 6: .gitignore has an exact .env ignore rule --------------

if grep -qxF '.env' .gitignore; then
  note_pass
else
  note_fail ".gitignore does not contain an exact '.env' ignore rule"
fi

# --- Invariant 7: T-003 implementation source outputs exist --------------

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

# --- Invariant 8: local markdown references resolve ---------------------

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
