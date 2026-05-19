#!/bin/bash
# epic-storybook.sh — Start Storybook S2 on a given port from a worktree
# Usage: ./scripts/epic-storybook.sh /tmp/epic-AN-450439/AN-450444 6011
WORKTREE="${1:-.}"
PORT="${2:-6010}"
cd "$WORKTREE"
yarn storybook:s2 --port "$PORT" --ci
