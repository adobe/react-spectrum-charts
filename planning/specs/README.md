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

Scored 1 / 2 / 3 / 5, like story points, in the `complexity.score` field. **Remaining
research burden is the primary axis, implementation size is secondary** — the score reflects
what's left to figure out and build *as of the current state of this spec*, not how hard the
original investigation was historically:

- **1 (No research, basic implementation):** the approach is fully known and the change
  itself is trivial — a literal constant/value tweak, a single encode line, a plain
  passthrough prop. Nothing left to investigate, nothing nontrivial to coordinate.
- **2 (No research, more than basic implementation):** the approach is fully known — no
  open questions, no unconfirmed root cause — but the change touches a few coordinated
  call sites or files, possibly including both s1 and s2, or a verification story that
  follows an existing story as a template. Still mechanical and low-risk, just more than a
  one-liner. **This is where most "spans multiple files" or "s1 + s2" fixes belong**, as
  long as every site is the *same already-precedented edit* applied again — e.g. copying a
  sibling mark's existing opacity-encode call to a new mark, or making the identical change
  in each package.
- **3 (Minimal research, real implementation complexity):** some investigation or
  verification is still genuinely left to do (a small unresolved question whose answer
  could change the shape of the fix, not just confirm a strong existing hypothesis) *and*
  at least one site requires actual new logic or a design decision — not just repeating a
  pattern that already exists elsewhere in the same file.
- **5 (Significant research *and* implementation complexity):** both axes are heavy at
  once — substantial unknowns still to resolve (unconfirmed root cause, an open design
  question that could change the shape of the fix) combined with an implementation where
  multiple sites each require *different*, non-precedented reasoning (new mark type, new
  child component, genuinely new interaction behavior) — not the same known fix copied to
  more places.

**Breadth is not depth.** The number of files, call sites, or packages a fix touches does
not by itself raise the score. Ask, per site: does this edit require a new design decision,
or is it the same already-working pattern (already visible elsewhere in the codebase) copied
to one more place? A fix that touches four files across s1 and s2 but does the identical,
already-precedented thing at each one is a 2, not a 5 — "S1/S2 parity work across packages"
only earns a 5 when the packages' implementations genuinely diverge and each needs separate
reasoning, not when it's one pattern applied twice.

**Score at spec-lock-in time, not at first-report time.** A bug that took a long
investigation to root-cause is not automatically a 5 — once that investigation is captured
in `rootCause` and the fix approach is fully decided, remaining research is zero and the
score should reflect only what's left: usually a 1 or 2. Re-score whenever a spec's design
changes (e.g. after choosing a simpler implementation approach during review) rather than
leaving the original estimate in place.

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

## Reconcile the whole spec before marking `implemented`

Specs get edited incrementally as implementation progresses — a mid-implementation discovery
(a second file that also needed fixing, a flag that turns out to be true after all) tends to
get patched into whichever field prompted it (`rootCause`, `comparison`) without revisiting
the others. That's how a spec ends up internally inconsistent: e.g. `rootCause` describing a
fix to `legendHighlightUtils.ts` while `crossCutting.touchesLegendInteraction` still says
`false` and `implementationPlan` never lists that file, because the flag and the plan were
set once during initial filing and never revisited after the later discovery changed the
facts. This is especially easy to miss across multiple turns or when work is split across
agents — each edit looks locally correct without a final pass over the whole document.

Before setting `status: "implemented"`, treat this as a mandatory close-out step, not a
courtesy check:

- Run `git status`/`git diff --stat` against the base branch and confirm every changed file
  appears in `implementationPlan`. Add any that don't — including files you only fixed as a
  side effect of the main change.
- Re-derive every `crossCutting` flag against the *final* diff, not the state of the
  investigation when the spec was first filed or when `rootCause` was last edited. A flag
  that was correctly `false` at filing time can become `true` after a mid-implementation
  discovery, or vice versa.
- Treat any edit to one narrative field (`rootCause`, `summary`, `comparison`) as a trigger to
  re-check every other field in the same spec, not just the one you're touching — they
  describe the same underlying set of facts, so a change to what happened should prompt
  checking whether it changed what you'd say elsewhere too.

## Stamping `lastUpdated`

Every spec has a `lastUpdated` field (`YYYY-MM-DD`). Whenever you create or modify a spec —
filing it, editing any field during implementation, the reconciliation pass above, anything —
update `lastUpdated` to the current date.

**Get that date by running `date +%Y-%m-%d` in a shell, not from your own sense of "today."**
A model's internal notion of the current date can be stale, wrong, or simply absent depending
on the environment, and this field exists specifically so a spec's staleness can be trusted —
a wrong date defeats the purpose. Never hand-write a date into `lastUpdated` without having
just run the command and used its literal output.

This is what makes staleness checkable at all: a spec with an old `lastUpdated` next to a
codebase that's since moved on is a signal to re-verify `rootCause`/`implementationPlan`
before trusting them (see the Step 0 guidance in each `implement-*` skill).

## Schema

See `schema.json` for the full field-level contract (required fields, enums, shapes).
