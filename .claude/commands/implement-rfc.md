# Implementing an RFC's Scope

Use this skill when implementing the issues in an accepted RFC's scope for one stage (e.g.
everything marked `alpha` in `rfcs/s2-donut-alpha.md`) as a sequence of stacked PRs. For a
single issue, use `implement-new-prop.md` / `implement-new-chart-mark.md` /
`implement-new-child-component.md` / `implement-bug-fix.md` directly. This skill is the layer
above those: it sequences them, keeps them on a shared branch stack, and applies the
design-token and S1-reuse checks across the whole batch.

Read `planning/README.md` first for the RFC and stage process.

---

## Step 1 — Confirm the RFC is accepted

Read the RFC. Its status must be `Accepted` and it must be merged. Don't build against a
draft: review comments can change the design, and building early risks working from a stale
version. If it's still a draft, stop and tell the user.

Collect the scope issues for the stage being built, from the RFC's Scope table or the parent
issue's sub-issues:

```bash
gh issue view <parent-issue> --repo adobe/react-spectrum-charts
gh issue list --repo adobe/react-spectrum-charts --milestone "<Component> <stage>" --state open
```

## Step 2 — Order the issues and confirm with the user

Don't implement issues in listing order by default. Read each issue's implementation plan
and the RFC's design:

- If issue B reuses a utility that issue A introduces, A must be implemented, and its utility
  merged and working, before B starts.
- Group issues with no such dependency into independent clusters. Within a cluster, use
  whatever order is simplest, but respect dependencies across clusters.
- **Present the proposed order to the user and get explicit confirmation before starting any
  implementation.** Build order is a real decision with tradeoffs; don't decide it alone.

If, mid-implementation, an issue you're building on turns out to be broken, incomplete, or
paused, it's fine to defer it and reorder the rest. Say so explicitly to the user and update
the affected issues so none of them claims a reuse that didn't happen.

## Step 3 — Per-issue implementation loop

For each issue in the confirmed order:

### 3a. Branch stacked on the previous issue's branch, not on `main`

```bash
git checkout -b feat/<this-issue-slug> feat/<previous-issue-slug-in-stack>
```

The first issue in the cluster branches from `main`. Every later issue branches from the
*previous issue's branch*, not from `main`. This is what makes the PR chain a stack: each PR's
diff shows only its own changes, reviewable independently, even though the branches depend
on each other.

### 3b. Read the issue and the RFC (Step 0 pattern)

Follow the matched `implement-*` skill's own Step 0: read the issue and the RFC section it
implements, and treat them as the requirements instead of rediscovering them.

### 3c. Check the chart type's S2 design-token skill *before* Figma-measuring or guessing any value

Look for `llm/skills/s2-<chartType>/<chartType>-chart-tokens/SKILL.md` (e.g.
`llm/skills/s2-donut/donut-chart-tokens/SKILL.md`). If it exists, it is the authoritative
source for every color/size/typography/spacing token this chart type uses — read it before
opening Figma or inventing a plausible-looking value. If the RFC or issue quotes values,
re-verify them against the skill file rather than trusting they were transcribed correctly,
especially any value marked "derived" (computed, not individually measured).

If no such skill file exists yet for this chart type, that's a signal to build one (via
whatever Figma-token-gathering process produced the Donut one) before writing RFCs that
depend on precise values, rather than guessing per issue.

### 3d. Check what already exists in S1 before building new logic

Before implementing a new mark, prop, or behavior in `vega-spec-builder-s2` /
`react-spectrum-charts-s2`, read the equivalent file in `vega-spec-builder` /
`react-spectrum-charts` (per CLAUDE.md's Type System table: `<mark>SpecBuilder.ts`,
`<mark>Utils.ts`, the component file). If S1 already solves the same problem, port its
approach rather than re-deriving it from scratch — it's already been through review and
production use.

This is a starting assumption, not a rule to apply blindly. Check the RFC's S1/S2 parity
note first:

- If the work is S2-only by design (e.g. a mark that never existed in S1), still *read* S1
  for a reusable pattern, but don't change S1 files. Confirm with the user if the scope is
  ambiguous; don't assume parity is wanted just because a similar S1 mark exists.
- If the RFC or issue says S1 needs the mirrored change, do it as part of the same PR, not as a
  follow-up.

### 3e. Implement, following the matched `implement-*` skill exactly

Use `implement-new-prop.md` / `implement-new-chart-mark.md` /
`implement-new-child-component.md` / `implement-bug-fix.md` depending on the change type, per
CLAUDE.md's classification step.

### 3f. Test and verify

Follow CLAUDE.md's Test Completeness Checklist, then visually verify in Storybook. For any
feature involving responsive sizing or layout at container boundaries, test the *exact*
size/value reported or specified, not just a sweep of round numbers — an automated sweep at
fixed increments can show a clean result while still missing a bug that only appears at a
narrow combination of content length, size tier, and container width in between sample
points. Live/manual interaction testing (dragging a size control through its full range, not
just checking preset breakpoints) surfaces bugs that fixed-size snapshots miss.

### 3g. Reconcile the issue

If the implementation diverged from the issue's plan (a different file, a cross-cutting
concern that turned out to apply, an approach tried and reverted), update the issue body so
it's accurate and add a comment explaining what changed. If the change departs from the
RFC's design, stop and tell the user: that may need a follow-up RFC.

### 3h. Push, open the PR against the previous branch in the stack, and link it into the GitHub stack immediately

```bash
git push -u origin feat/<this-issue-slug>
gh pr create --base feat/<previous-issue-slug-in-stack> --title "..." --body "Closes #<issue> ..."
```

Then immediately add the PR to the tracked GitHub stack — don't defer this to the end of the
cluster, or it's easy to forget the last PR. Re-run the link command with
every PR in the stack, bottom to top, each time — it's idempotent and safe to repeat:

```bash
gh stack link <bottom-pr-number> <pr2> <pr3> ... <this-pr-number>
```

**If `origin` uses a custom SSH host alias** (e.g. `personal.github.com` routed to real
GitHub via `~/.ssh/config`) rather than literally `github.com`, `gh stack link`/`view` will
fail to resolve the repository even though plain `gh pr create`/`view`/`comment` work fine.
Prefix the command with `GH_REPO=<owner>/<repo>`:

```bash
GH_REPO=adobe/react-spectrum-charts gh stack link 888 889 891 894 895 897 900 901
```

### 3i. Move to the next issue in the confirmed order

Branch the next issue off the one you just opened a PR for, and repeat from 3b.

---

## Step 4 — Report progress against the confirmed order

After each issue (or at natural checkpoints), report which issues are done, which PR each
landed in, and confirm the next issue in the order still makes sense. A discovery partway
through (Step 2's deferral case) may have changed it.

When every issue for the stage has merged, tell the user the stage is ready to ship. When
the RFC's whole scope has shipped, its status changes to `Implemented`.
