#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--approve-production" || ! "${2:-}" =~ ^[0-9a-f]{12}-[0-9a-f]{8}$ ]]; then
  echo "Usage: scripts/promote-release.sh --approve-production <candidate-id>" >&2
  exit 1
fi

candidate="$2"
exec /home/jmill/sdj/infra/ops/bin/sdj selfdrivingjazz promote \
  --candidate "$candidate" \
  --approve-production
