#!/bin/bash
# epic-install.sh — Install dependencies in the orchestrator worktree (run once before dispatching agents)
# Usage: ./scripts/epic-install.sh
set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"
echo "Installing dependencies in $PROJECT_ROOT..."
yarn install --frozen-lockfile --ignore-engines
echo "Done. Epic worktrees can now symlink from $PROJECT_ROOT/node_modules via epic-setup.sh."
