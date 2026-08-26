#!/usr/bin/env bash
set -euo pipefail

candidate_ref="${1:-$(git branch --show-current)}"
if [[ "$candidate_ref" != rc/* ]]; then
  echo "Release candidates must use an rc/* branch, not $candidate_ref." >&2
  exit 1
fi

exec /home/jmill/sdj/infra/ops/bin/sdj selfdrivingjazz candidate --ref "$candidate_ref"
