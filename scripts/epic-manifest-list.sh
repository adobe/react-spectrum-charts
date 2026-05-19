#!/bin/bash
# epic-manifest-list.sh — List tasks from an epic manifest with key fields
# Usage: ./scripts/epic-manifest-list.sh <epic-key>
# Example: ./scripts/epic-manifest-list.sh AN-450439
set -e
EPIC="${1:?Usage: epic-manifest-list.sh <epic-key>}"
MANIFEST="planning/${EPIC}/manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "Manifest not found: $MANIFEST" >&2
  exit 1
fi

jq -r '.tasks[] | "\(.id)  batch=\(.batch)  sub=\(.subBatch)  type=\(.type)  \(.title | .[0:60])"' "$MANIFEST"
