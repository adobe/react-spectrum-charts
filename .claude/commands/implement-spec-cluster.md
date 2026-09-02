# Implementing a Cluster of Chart Specs

Use this skill when implementing a *batch* of related, approved feature/bug specs for one
chart type (e.g. every spec under `planning/specs/<chartType>/` generated in one
`generate-chart-spec` pass) as a sequence of stacked PRs, rather than one spec in isolation.
For implementing a single already-approved spec, use `implement-new-prop.md` /
`implement-new-chart-mark.md` / `implement-new-child-component.md` / `implement-bug-fix.md`
directly — this skill is the layer above those: it sequences them, keeps them on a shared
branch stack, and manages the design-token/S1-reuse checks that apply across the whole batch.

Read `planning/specs/README.md` first for the spec format itself. This skill assumes the
specs already exist and are either `approved` or about to be submitted as a batch — see Step
1 if they haven't been submitted yet.

---

## Step 1 — Get the spec batch reviewed before implementing anything

If the specs for this chart type were just generated (via `generate-chart-spec`) and haven't
been merged yet, submit **all of them together as one "parent" PR** first — a batch of spec
JSON files only, no implementation code. This mirrors the pattern used for the initial S2
Donut spec batch (PR #886, "feat: s2 donut feature specs"): reviewers sign off on the full
set of requirements, edge cases, and complexity scores up front, before any code is written
against them. Do not start implementing a spec whose batch PR hasn't merged — a review
comment on one spec can change `crossCutting` flags or requirements on a sibling spec in the
same batch, and implementing early risks building against a stale version.

Wait for that PR to merge before proceeding to Step 2.

## Step 2 — Cluster the specs and confirm build order with the user

Don't implement specs in file-listing order by default. Read every spec's
`implementationPlan` and `relatedIssues`:

- If spec B's `implementationPlan` describes reusing a utility that spec A's plan
  introduces (e.g. "reuses donut-direct-labels-collision's cascade algorithm"), A must be
  implemented — and its utility actually merged and working — before B starts.
- Group specs that share no such dependency into independent clusters; specs within a
  cluster can be ordered by whatever's simplest to sequence, but cross-cluster dependencies
  must be respected.
- **Present the proposed cluster order to the user and get explicit confirmation before
  starting any implementation.** Build order is a real decision with tradeoffs (e.g.
  whether a smaller foundational fix should land before a larger feature that assumes it
  exists) — don't decide it unilaterally.

If, mid-implementation, a spec you're building on top of turns out to be broken, incomplete,
or paused (e.g. a real bug surfaces in its cascade algorithm that needs separate debugging),
it's fine to defer it and re-order the remaining clusters — but say so explicitly to the
user and update both the deferred spec and any spec whose plan assumed it would be ready
(see `implement-bug-fix.md`/`implement-new-*.md`'s reconciliation step, and don't leave a
dependent spec's `crossCutting.notes` claiming a reuse that never actually happened).

## Step 3 — Per-spec implementation loop

For each spec in the confirmed order:

### 3a. Branch stacked on the previous spec, not on `main`

```bash
git checkout -b feat/<this-spec-slug> feat/<previous-spec-slug-in-stack>
```

The first spec in the cluster branches from `main` (or from wherever the parent spec-batch
PR merged). Every subsequent spec branches from the *previous spec's branch*, not from
`main` — this is what makes the PR chain a stack (each PR's diff shows only its own spec's
changes, reviewable independently, even though the branches are sequentially dependent).

### 3b. Read the spec (Step 0 pattern)

Follow the matched `implement-*` skill's own Step 0: read the approved spec at
`planning/specs/<chartType>/<slug>.json` (or `.../issues/<slug>.json` for a bug) and treat
`requirements`, `edgeCases`, `crossCutting`, and `implementationPlan` as authoritative
instead of rediscovering them.

### 3c. Check the chart type's S2 design-token skill *before* Figma-measuring or guessing any value

Look for `llm/skills/s2-<chartType>/<chartType>-chart-tokens/SKILL.md` (e.g.
`llm/skills/s2-donut/donut-chart-tokens/SKILL.md`). If it exists, it is the authoritative
source for every color/size/typography/spacing token this chart type uses — read it before
opening Figma or inventing a plausible-looking value. A spec's `designTokens` field should
already cite these, but re-verify against the skill file directly rather than trusting the
spec transcribed it correctly, especially for any value marked "derived" (computed, not
individually measured) — those are the most likely to have drifted or been guessed.

If no such skill file exists yet for this chart type, that's a signal to build one (via
whatever Figma-token-gathering process produced the Donut one) before writing specs that
depend on precise values, rather than ad hoc guessing per-spec.

### 3d. Check what already exists in S1 before building new logic

Before implementing a new mark, prop, or behavior in `vega-spec-builder-s2` /
`react-spectrum-charts-s2`, read the equivalent file in `vega-spec-builder` /
`react-spectrum-charts` (per CLAUDE.md's Type System table: `<mark>SpecBuilder.ts`,
`<mark>Utils.ts`, the component file). If S1 already solves the same problem, port its
approach rather than re-deriving it from scratch — it's already been through review and
production use.

This is a starting assumption, not a rule to apply blindly — confirm against the spec's own
`variant` and `crossCutting.requiresS1S2Parity` fields first:

- `variant: "s2"` with `requiresS1S2Parity: false` typically means this chart type/feature
  is s2-only by design (e.g. a mark that never existed in S1 at all, or an explicit decision
  that S1 won't receive this feature) — in that case, still *read* S1 for a reusable pattern
  if a similar mark exists there, but don't propose changing S1 files. Confirm this scope
  with the user before touching S1 if it's ambiguous; don't assume s1/s2 parity is wanted
  just because a similar S1 mark exists.
- `requiresS1S2Parity: true` (or `variant: "both"`) means the S1 file needs the mirrored
  change as part of this same spec's implementation, not a follow-up.

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

### 3g. Reconcile the spec

Follow `planning/specs/README.md`'s "Reconcile the whole spec before marking implemented" —
re-derive every `crossCutting` flag against the final diff, add any file that changed but
isn't in `implementationPlan`, and mark corrected/added entries explicitly (`CORRECTED PATH`,
`ADDED (not in original plan)`, etc.) rather than silently rewriting the plan as if it had
been right from the start. If a fix was attempted and reverted during implementation (e.g. it
solved one problem but violated a different invariant), document that attempt and the
reasoning for reverting it in `edgeCases`/`crossCutting.notes` — don't just quietly revert
and leave the spec looking like the simpler, unresolved state was never addressed. Then
`git mv` the spec into its `implemented/` subfolder as part of the same commit.

### 3h. Push, open the PR against the previous branch in the stack, and link it into the GitHub stack immediately

```bash
git push -u origin feat/<this-spec-slug>
gh pr create --base feat/<previous-spec-slug-in-stack> --title "..." --body "..."
```

Then immediately add the PR to the tracked GitHub stack — don't defer this to the end of the
cluster, or it's easy to forget the last PR (as happened once: seven PRs were linked, the
eighth was created afterward and left out until pointed out). Re-run the link command with
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

### 3i. Move to the next spec in the confirmed order

Branch the next spec off the one you just opened a PR for, and repeat from 3b.

---

## Step 4 — Report progress against the confirmed cluster order

After each spec (or at natural checkpoints), report which specs are done, which PR each
landed in, and confirm the next spec in the order still makes sense — a mid-cluster
discovery (Step 2's deferral case) may have changed it.
