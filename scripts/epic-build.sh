#!/bin/bash
# epic-build.sh — Build S2 packages from a worktree
# Usage: ./scripts/epic-build.sh /tmp/epic-AN-450439/AN-450444
set -e
WORKTREE="${1:-.}"
cd "$WORKTREE"
yarn build:s2
