#!/bin/bash
# epic-json-query.sh — Run a jq query against a JSON file (read-only)
# Usage: ./scripts/epic-json-query.sh <file> <jq-expression>
# Example: ./scripts/epic-json-query.sh planning/AN-450439/manifest.json '.tasks[] | .id'
set -e
FILE="${1:?Usage: epic-json-query.sh <file> <jq-expression>}"
EXPR="${2:?Usage: epic-json-query.sh <file> <jq-expression>}"
jq -r "$EXPR" "$FILE"
