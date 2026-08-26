#!/usr/bin/env bash
set -euo pipefail

branch="$(git branch --show-current)"
if [[ "$branch" != rc/* ]]; then
  echo "Release candidates must be built from an rc/* branch, not $branch." >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release candidates require a clean working tree." >&2
  exit 1
fi

exec npx --yes vercel deploy --yes "$@"
