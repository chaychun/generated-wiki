#!/usr/bin/env bash
# PreToolUse hook: block npm/pnpm/yarn/npx — this project uses bun only.
set -euo pipefail

cmd=$(jq -r '.tool_input.command // ""')

if printf '%s' "$cmd" | grep -qE '(^|[^a-zA-Z0-9_-])(npm|pnpm|yarn|npx)([[:space:]]|$)'; then
  echo "Blocked: this project uses bun. Use bun/bunx instead of npm/pnpm/yarn/npx." >&2
  exit 2
fi

exit 0
