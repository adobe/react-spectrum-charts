# Chart Feature Spec System

A spec is a JSON artifact that captures what a chart feature should do — requirements,
design tokens, edge cases, and a loose implementation plan — before code is written. It's
reviewed as a PR like any other change, then used as the source of truth when the feature
is actually implemented.

## Directory layout

```
planning/specs/
  schema.json          # JSON Schema (draft-07) every spec validates against
  README.md            # this file
  bar/<slug>.json
  line/<slug>.json
  donut/<slug>.json
  ...
```

One spec per feature, filed under the directory matching its `chartType`. Chart-level
(non-mark-specific) features go under `chart/`.

## The three phases

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

## Edge case checklist

Not exhaustive, but check each of these against the feature before leaving `edgeCases`
sparse: empty/null data, a single data point, many series (color scale overflow),
long/truncated labels, narrow/responsive breakpoints, light vs dark background, S1 vs S2
parity, accessibility (keyboard/screen reader), and interaction conflicts (hover/selection
state colliding with the new feature).

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
field), `implemented` (once the feature PR lands), and `needs-revision` (if the spec is
later found stale or wrong — fix it via a normal PR editing the JSON, reviewed the same
way).

## Schema

See `schema.json` for the full field-level contract (required fields, enums, shapes).
