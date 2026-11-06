---
name: summarizing-bugs
description: Produces a quick status scan of open bug issues, optionally narrowed to one component and/or S2. Use when asked for a bug summary or the state of open bugs.
---

# Bug Issue Summary

Use when asked for a quick status scan of open bugs. If the request names a component
(e.g. "line bugs") and/or `s2`, narrow to it.

## Step 1 — List open bugs

```bash
gh issue list --repo adobe/react-spectrum-charts --state open --label bug --limit 200 \
  --json number,title,labels,updatedAt
```

To narrow by component, add `--label rsc:<Component>` (e.g. `rsc:Line`; match the
capitalization of the existing labels). Add `--label s2` for S2 only.

Sort by issue number ascending so a follow-up like "issue 3" can be resolved by re-running
the same command.

## Step 2 — Read bodies only if needed

Titles and labels are enough for most summaries. Run `gh issue view <number>` only when the
title leaves the bug's state genuinely unclear.

## Step 3 — Report

Group by component label (issues with none go under "Other"). One line per issue:

```
**#<number>** <title> (<s2 if labeled>) — one clause on the symptom and, if known, how
settled the root cause is.
```

Keep it a scan. If nothing matches, say so. End with a one-line total, e.g. "7 open bugs
across Line, Donut, and Legend."
