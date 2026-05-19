#!/bin/bash
# epic-test.sh — Run tests from a worktree with optional pattern
# Usage: ./scripts/epic-test.sh /tmp/epic-AN-450439/AN-450444 [testPathPattern]
set -e
WORKTREE="${1:-.}"
PATTERN="${2:-}"
cd "$WORKTREE"
if [ -n "$PATTERN" ]; then
  yarn test --testPathPattern="$PATTERN"
else
  yarn test
fi
