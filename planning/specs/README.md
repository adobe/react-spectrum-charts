# Chart Feature & Bug Spec System

A spec is a JSON artifact that captures either a not-yet-built feature or a known bug in
existing behavior — before code is written or fixed. It's reviewed as a PR like any other
change, then used as the source of truth when the work is actually implemented. The `kind`
field (`"feature"` or `"bug"`) determines which other fields are required — see
[Kinds](#kinds-feature-vs-bug) below.

## Directory layout

```
planning/specs/
  schema.json                              # JSON Schema (draft-07) every spec validates against
  README.md                                # this file
  bar/<slug>.json                          # kind: "feature", not yet implemented
  bar/implemented/<slug>.json              # kind: "feature", status: "implemented"
  bar/issues/<slug>.json                   # kind: "bug", open
  bar/issues/implemented/<slug>.json       # kind: "bug", status: "implemented" (fixed)
  line/<slug>.json
  line/implemented/<slug>.json
  line/issues/<slug>.json
  line/issues/implemented/<slug>.json
  donut/<slug>.json
  donut/implemented/<slug>.json
  donut/issues/<slug>.json
  donut/issues/implemented/<slug>.json
  ...
```

One spec per feature or bug, filed under the directory matching its `chartType`. Chart-level
(non-mark-specific) work goes under `chart/`. Bugs always live in the `issues/` subdirectory
of their chart type; features live directly under the chart type directory. Within either of
those, an `implemented/` subdirectory separates finished work from what's still outstanding
— see [Status lifecycle](#status-lifecycle) for when a spec moves there.

## Kinds: feature vs bug

- **`kind: "feature"`** — a capability that doesn't exist yet. Requires `requirements` and
  `edgeCases`. Produced by the `generate-chart-spec` skill
  (`.claude/commands/generate-chart-spec.md`) and filed at
  `planning/specs/<chartType>/<slug>.json` (moves to
  `planning/specs/<chartType>/implemented/<slug>.json` once built).
- **`kind: "bug"`** — a defect in existing behavior. Requires `symptom` and `rootCause`
  instead (an optional `comparison` field can capture working-vs-buggy behavior
  side-by-side). Produced by the `file-issue` skill (`.claude/commands/file-issue.md`) and
  filed at `planning/specs/<chartType>/issues/<slug>.json` (moves to
  `planning/specs/<chartType>/issues/implemented/<slug>.json` once fixed).

Both kinds share `complexity`, `variant`, `crossCutting`, and `implementationPlan` — the
rubric and flags below apply the same way to a bug fix as to a feature. For a bug,
`implementationPlan` entries describe each file's role and a proposed fix *direction*, not a
committed change, since the fix hasn't been written yet.

## `variant`

Every spec declares which package variant its `implementationPlan` is scoped to:

- `"s1"` — `vega-spec-builder` / `react-spectrum-charts`
- `"s2"` — `vega-spec-builder-s2` / `react-spectrum-charts-s2`
- `"both"` — the plan already covers matching files in each package from the outset (a
  chart-level feature built for both from day one, or a bug confirmed to reproduce
  identically in both)

`variant` is not the same thing as `crossCutting.requiresS1S2Parity`. `variant` says where
*this* spec's plan lives; `requiresS1S2Parity: true` flags that the *other* variant — the
one not named in `variant` — also needs matching work, whether that's a straight port
(feature) or a check for the same symptom (bug). For example, `variant: "s2"` with
`requiresS1S2Parity: true` on a bug spec means: fix it in S2 per this plan, and go check
whether S1 has the same bug — don't assume it does or doesn't.

## The three phases (features)

1. **Gather** — explore the design and code (Figma, a Jira ticket, existing similar marks)
   to collect design tokens and requirements. This phase is intentionally informal — notes,
   a ticket, a Figma link, whatever's useful. There's no fixed artifact for this phase.
2. **Spec** — feed what you gathered to the `generate-chart-spec` skill
   (`.claude/commands/generate-chart-spec.md`), which explores the relevant mark's code and
   writes `planning/specs/<chartType>/<slug>.json`. Submit it as a PR for review.
3. **Implement** — once merged, `implement-new-prop` / `implement-new-chart-mark` /
   `implement-new-child-component` read the spec first and treat its
   `requirements`/`edgeCases`/`implementationPlan` as authoritative instead of rediscovering
   them from scratch.

## The two phases (bugs)

1. **File** — when a bug is identified but won't be fixed immediately, use the `file-issue`
   skill (`.claude/commands/file-issue.md`). It investigates the root cause and writes
   `planning/specs/<chartType>/issues/<slug>.json`. Submit it as a PR for review like any
   other spec.
2. **Fix** — `implement-bug-fix` checks for a matching spec first and treats its
   `symptom`/`rootCause`/`crossCutting`/`implementationPlan` as authoritative starting
   context instead of rediscovering them from scratch — though root cause should still be
   re-verified against current code, since it may have drifted since filing.

## Writing `rootCause` (keeping it from bloating)

`rootCause` states the current, accurate technical explanation of the defect — what's wrong
in the code and why, with file:line references. It is not an investigation log. Specifically:

- **No narrative labels.** Don't write `FIXED:`, `CORRECTED:`, or "two additional gaps found
  during verification" inside `rootCause`. The spec's `status` and its directory
  (`issues/` vs. `issues/implemented/`) already say whether it's fixed; a fix PR's diff and
  description already say what changed and when a prior belief was wrong. `rootCause` should
  just state what's true now, not the history of how that understanding was reached.
- **Per-file "what changed" goes in `implementationPlan`,** not `rootCause` — each entry's
  `change` field is exactly the place for "added X to Y."
- **Per-aspect expected-vs-actual goes in `comparison`,** not prose in `rootCause` — that's
  what the structured field exists for.
- **A related-but-distinct defect discovered mid-investigation gets its own spec** (`kind:
  "bug"`), cross-linked via `relatedIssues`, not a paragraph re-explaining it inline. If the
  investigation turns up something outside this bug's own symptom, that's a new spec, not
  supporting evidence to pile into this one.
- **Target length: a tight paragraph per distinct defect actually fixed under this spec.** If
  it's sprawling into multiple paragraphs of narrative, something belongs in
  `implementationPlan`, `comparison`, or a separate spec instead.

## Complexity rubric

Scored 1-2 / 3 / 5, like story points, in the `complexity.score` field:

- **1-2 (Simple):** plain value prop, passes through `*Options` unchanged, no new
  encode/scale/signal logic. Touches the type file + one encode site + story.
- **3 (Moderate):** new field needs logic in *one* of `addData` / `addSignals` /
  `setScales` / `addMarks` for an existing mark (new signal, conditional encode, new
  transform).
- **5 (Complex):** new mark type, new child component, or a change spanning multiple of
  data/signals/scales/marks — includes new interaction behavior (hover/selection) or S1/S2
  parity work across packages.

The same rubric applies to bugs: score by how much of the codebase the *fix* is expected to
touch, not how hard the bug was to find. A one-line missing-encode fix is a 1-2 even if the
investigation took a while; an unconfirmed root cause spanning layout/autosize or multiple
packages is a 5.

## Edge case checklist

Not exhaustive, but check each of these against the feature before leaving `edgeCases`
sparse: empty/null data, a single data point, many series (color scale overflow),
long/truncated labels, narrow/responsive breakpoints, light vs dark background, S1 vs S2
parity, accessibility (keyboard/screen reader), and interaction conflicts (hover/selection
state colliding with the new feature). Bugs don't require `edgeCases`, but fill it in
when the fix has clear edge-case implications worth flagging for the implementer.

## `crossCutting` flags

These six flags call out subsystems that a feature can silently need to hook into — each
has caused real bugs in this codebase when missed, so they're required booleans, not prose
that's easy to skip:

| Flag | What it means | How to tell |
|---|---|---|
| `touchesHoverAnimation` | Feature interacts with the mouse-hover animation system (`isAnimate` gate, `hoverAnimationUtils.ts`, `usermeta.animatedMark`). | Does hovering a series/point need to animate this feature's appearance, or does this feature need to suppress/participate in existing hover animation? |
| `touchesControlledHighlight` | Feature interacts with externally-controlled highlighting (`CONTROLLED_HIGHLIGHTED_TABLE`/`CONTROLLED_HIGHLIGHTED_SERIES`), driven by props/state rather than mouse position. | Does the feature need to respect or trigger highlight state set from outside the chart (not mouse-driven)? |
| `touchesLegendInteraction` | Feature interacts with legend hover/click driving mark opacity/highlight (`legendHighlightSignals`). | Does hovering or clicking the legend need to affect this feature, or vice versa? |
| `touchesTooltipOrPopover` | Feature interacts with the interactive-mark system (`isInteractive`, voronoi hover overlay, `interactiveMarkName`, `COMPONENT_NAME` popover matching). | Does the feature need its own tooltip/popover, or change what an existing one shows? |
| `requiresNewSignalOrScale` | Feature needs a new Vega signal (with a symmetric set/clear) or a new/extended facet scale (color/lineType/opacity). | Does the feature need new reactive state, or a new value on an existing color/lineType/opacity domain? |
| `requiresS1S2Parity` | The corresponding `vega-spec-builder` (s1) file needs the mirrored change. | Does this touch a file that has a sibling in both `vega-spec-builder` and `vega-spec-builder-s2`? |

If any flag is `true`, explain in `crossCutting.notes` — a bare `true` isn't enough context
for a reviewer or implementer.

## Status lifecycle

`status` has three values: `approved` (default — a spec only exists in `main` once its PR
is reviewed and merged, so draft/in-review are represented by the PR itself, not this
field), `implemented` (once the feature/fix PR lands), and `needs-revision` (if the spec is
later found stale or wrong — fix it via a normal PR editing the JSON, reviewed the same
way). For `kind: "bug"`, read `approved` as "filed and open" and `implemented` as "fixed" —
this replaces the old `Status: Open` field used in the markdown issue docs this system
superseded.

**Moving to `implemented` also means moving the file.** `approved` and `needs-revision`
specs live directly in `planning/specs/<chartType>/` (features) or
`planning/specs/<chartType>/issues/` (bugs). The moment a spec's `status` is set to
`implemented` — as part of the same PR that lands the feature/fix — relocate the file into
that directory's `implemented/` subfolder (`git mv`, not a copy). This keeps the
non-`implemented/` directories showing only outstanding work at a glance, without having to
open every file to check `status`. The `implement-new-*` / `implement-bug-fix` skills do
this move as part of their completion steps; when checking for an existing spec at Step 0,
check both the base directory and its `implemented/` subfolder, since a spec already marked
`implemented` can still be useful context (e.g. for a regression).

## Schema

See `schema.json` for the full field-level contract (required fields, enums, shapes).
