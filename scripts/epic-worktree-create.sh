#!/bin/bash
# epic-worktree-create.sh — Create and fully configure an isolated worktree for an epic agent
# Usage: ./scripts/epic-worktree-create.sh <epic-key> <task-id> <branch>
# Example: ./scripts/epic-worktree-create.sh AN-450439 AN-450444 epic/AN-450439/AN-450444
set -e

EPIC_KEY="$1"
TASK_ID="$2"
BRANCH="$3"

if [ -z "$EPIC_KEY" ] || [ -z "$TASK_ID" ] || [ -z "$BRANCH" ]; then
  echo "Usage: $0 <epic-key> <task-id> <branch>"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE="/tmp/epic-$EPIC_KEY/$TASK_ID"

# Create worktree
if [ -d "$WORKTREE" ]; then
  echo "Worktree already exists at $WORKTREE"
else
  echo "Creating worktree at $WORKTREE on branch $BRANCH..."
  git worktree add "$WORKTREE" -b "$BRANCH"
fi

# Copy scripts
mkdir -p "$WORKTREE/scripts"
cp "$PROJECT_ROOT/scripts/epic-"*.sh "$WORKTREE/scripts/"
chmod +x "$WORKTREE/scripts/epic-"*.sh

# Symlink node_modules
"$PROJECT_ROOT/scripts/epic-setup.sh" "$WORKTREE"

echo "Worktree ready: $WORKTREE (branch: $BRANCH)"
