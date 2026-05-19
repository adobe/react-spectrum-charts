#!/bin/bash
# epic-tsc.sh — Run TypeScript check (no emit) from a worktree
# Usage: ./scripts/epic-tsc.sh /tmp/epic-AN-450439/AN-450444
set -e
WORKTREE="${1:-.}"
cd "$WORKTREE"
yarn tsc --noEmit
