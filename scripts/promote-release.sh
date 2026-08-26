#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--approve-production" || -z "${2:-}" ]]; then
  echo "Usage: scripts/promote-release.sh --approve-production <vercel-deployment-url-or-id>" >&2
  exit 1
fi

deployment="$2"
exec npx --yes vercel promote "$deployment" --yes
