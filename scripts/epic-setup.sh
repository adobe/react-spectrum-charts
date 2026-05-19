#!/bin/bash
# epic-setup.sh — Install dependencies in a worktree (run once per worktree before building)
# Usage: ./scripts/epic-setup.sh /tmp/epic-AN-450439/AN-450444
set -e
WORKTREE="${1:-.}"

cd "$WORKTREE"

# Remove symlink if a previous attempt created one — yarn install needs a real directory
if [ -L node_modules ]; then
  echo "Removing node_modules symlink (replacing with real install)..."
  rm node_modules
fi

# Always run yarn install to ensure workspace cross-links are wired correctly.
# Checking for .bin is not sufficient — a shared node_modules may have .bin entries
# but workspace package symlinks (e.g. @spectrum-charts/vega-spec-builder-s2) may be missing.
echo "Installing dependencies in $WORKTREE..."
yarn install --frozen-lockfile --ignore-engines
echo "Done."
