<!-- Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Start Date: 2026-10-01
- RFC PR: (leave this empty, to be filled in later)
- Authors: Connor Lamoureux

# S2 unified highlight and selection state

## Summary

Every S2 mark derives its highlight and selection state from a single per-mark state table, built from the same match rules the hover-animation engine already uses. Opacity, stroke width, points, labels and the legend all read that one value. Animation becomes a presentation choice — tween the value or snap to it — rather than a switch between two separate implementations.

## Motivation

Today each S2 mark has two independent implementations of "is this item highlighted?":

| Path       | When                                                            | How                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine     | Line with animations on (default); bar with `animations={true}` | `<mark>_hoverTargetData` evaluates `HoverMatchRule`s → `<mark>_hoverFractionData` → every consumer reads the fraction                                                                                         |
| Rule lists | Animations off, bar by default, all other marks                 | Each encoding hand-writes `test`/`signal` production rules against `<mark>_hoveredItem`, `selectedSeries`, `selectedItem`, `selectedGroup`, `controlledHighlightedTable`, `controlledHighlightedSeries`, etc. |

The rule lists are duplicated per encoding (line stroke opacity and width, static points, highlight point, hover labels, direct labels, legend, bar, bar direct labels, donut, segment labels, venn, scatter, area, annotations). They have drifted from each other and from the engine, producing bugs that only appear with animations off:

- #959 Static points don't dim for `highlightedItem` or popover selection
- #960 The legend doesn't reflect `highlightedItem`
- #961 The `highlightedItem` marker and hover value label never fade
- #962 The legend doesn't dim on line popover selection

Each fix today means editing N rule lists, and each behavior change risks a new divergence. The same input state should produce the same visual state regardless of the `animations` prop.

### Goals

- One source of truth per mark for an item's highlight state: emphasized, neutral, or deemphasized.
- Selection (popover) folded into the same state with one precedence order.
- `animations` on vs off changes tweening only, never the resolved result.
- Legend, labels, points and axis-label hover read the owning mark's state instead of re-deriving it.
- Delete the per-encoding rule lists once all consumers have migrated.

### Non-goals

- S1 (`vega-spec-builder`), which is slated for deprecation.
- Changing React-side signal writes (`useNewChartView`, `clearHoverSignals`, popover handlers). The input signals stay the same; only how marks consume them changes.
- New public props.
- Animating additional properties (e.g. stroke width). The design enables it but doesn't ship it.

## Detailed Design

### Current engine

`vega-spec-builder-s2/src/marks/hoverAnimationUtils.ts`:

- `getHoverTargetData({ name, groupby, rules })` aggregates `table` by the mark's identity fields, adds one formula per `HoverMatchRule` (each returning `1 | 0 | null`), then a `target` field equal to the first non-null rule, else `HOVER_NEUTRAL_TARGET`.
- `getHoverAnimStateData` / `getHoverFractionData` tween each key toward its target, driven by the `<mark>_hoverTargets` signal and the shared animation timer.
- `getHoverSeriesFractionData` takes the max fraction per `rscSeriesId` for the legend.
- `getHoverFractionSignal(name, keyField)` is the per-datum lookup used in encodings; `getDeemphasisRamp` maps it to opacity.
- The legend's `injectLegendHoverIntoData` adds a `legendHoverMatch` rule into every `*_hoverTargetData`, and `getLegendOpacity` reads `userMeta.animatedMarks`.

Precedence is already encoded by rule order: hovered → legend hover → controlled table → controlled series → popover → combo sibling.

### 1. The state table always exists for highlight-capable marks

A mark builds its state data whenever it can be highlighted — today's `usesHoverAnimation` condition without the `animations` gate:

```ts
isInteractive(mark) ||
  highlightedItem !== undefined ||
  highlightedSeries !== undefined ||
  legendHighlightSignals.length > 0;
```

| Data / signal                                   | Animated          | Not animated              |
| ----------------------------------------------- | ----------------- | ------------------------- |
| `<mark>_hoverTargetData`                        | ✓                 | ✓                         |
| `<mark>_hoverFractionData`                      | tween of `target` | `fraction = datum.target` |
| `<mark>_hoverSeriesFractionData`                | ✓                 | ✓                         |
| anim state, timer signals, last-change tracking | ✓                 | —                         |

Data names are identical in both modes, so every consumer is mode-agnostic.

### 2. Split the flags

- `hasHoverState`: the mark has a state table. Gates data, encodings and legend registration.
- `isHoverAnimate`: the state is tweened. Gates only anim-state data, timer signals and last-change tracking.

`userMeta.animatedMarks` is renamed `hoverStateMarks`. It is internal; the React packages don't read it.

### 3. Selection is a rule, not a separate path

Popover selection is already a rule (`popoverMatch`) in the engine — by series for line, by item for bar. The rule-list path additionally handles `selectedGroup` (`UNSAFE_highlightBy`) and `ChartInspect` `highlightBy` groups. These become additional rules over the same aggregate so every selection mode shares one precedence order.

Consumers that must distinguish selected from hovered (bar selection ring, selected stroke color) read a separate `selectedMatch` field from the target data instead of re-testing signals.

### 4. Consumers read the state

| Consumer                                                   | Today                                                | After                                       |
| ---------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| Line stroke opacity                                        | `getLineOpacityRules` (off) / fraction (on)          | fraction                                    |
| Line stroke width                                          | rule list                                            | `target` (`getEmphasisRamp` when animated)  |
| Static, highlight and secondary points; hover value labels | partial rule lists                                   | fraction                                    |
| Line direct labels, trendline, metric range                | `getLineOpacity` with `isHoverAnimate: false` forced | parent mark's fraction, looked up by series |
| Bar opacity, bar direct labels                             | `getMarkOpacity` (off) / fraction (on)               | fraction                                    |
| Legend opacity and stroke                                  | `getOpacityEncoding` rule list / series fraction     | series or group fraction                    |
| Axis label hover                                           | separate signal tests                                | mark's `dimensionHoverMatch`                |
| Donut, segment labels, scatter, area, venn, annotations    | `getMarkOpacity` and similar                         | fraction (later phase)                      |

### 5. Removal

After all marks migrate, delete `getLineOpacityRules`, the rule lists in `getMarkOpacity` and `addHoveredItemOpacityRules`, the legend `getOpacityEncoding` rule list, and `setHoverOpacityForMarks`'s rule injection for non-engine marks.

### Performance

This moves work from per-item encoding expressions into a per-mark dataflow.

| Risk                        | Detail                                                                                                                                                                                         | Mitigation                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Rule re-evaluation          | Rule formulas re-run on every hover/selection change: O(keys × rules). The aggregate depends only on `table` and isn't recomputed. Rule lists today cost O(rendered items × rules) per change. | Line improves (keys = series ≪ points). Bar is roughly neutral (keys ≈ bars).                                |
| Per-datum lookup            | `getHoverFractionSignal` uses `indexof(pluck(data(...)))`, O(keys) per rendered item → O(items × keys). Already shipping for animated line; quadratic for bar and large point/scatter marks.   | Replace with a `lookup` transform onto the mark's source data (or a keyed map) before scatter/donut migrate. |
| `data()` dependency fan-out | Encodings reading `data('x')` re-evaluate when `x` changes.                                                                                                                                    | Same as today's animated path; no new class of dependency.                                                   |
| Timer cost                  | Not added in instant mode.                                                                                                                                                                     | —                                                                                                            |
| Spec size                   | Adds 2–3 data sources per mark; removes long per-encoding rule arrays.                                                                                                                         | Likely net neutral or smaller.                                                                               |

**Benchmark plan:** hover-move frame time (Storybook + Playwright) and `View.runAsync` time (headless, `renderer: 'none'`) for line (10 series × 1k points), bar (200 bars), dodged-and-stacked bar, and scatter (5k points, before scatter migrates). Main vs branch, animations on and off. A migration ships only if p95 doesn't regress beyond noise.

### Testing

- Unit tests for each mark's target rules and for instant vs animated data shape.
- A parity test per mark: build the spec with animations on and off, drive the same signal sequence through a headless Vega `View`, let animations settle, and assert identical resolved opacity and stroke width per item. This is the structural guard against future drift.
- Storybook visual checks of line, bar, legend highlight and popover stories with animations on and off.

### Rollout

1. **Engine + line + bar.** `hasHoverState`, instant fraction data, `hoverStateMarks`. Line stroke, points, hover labels and direct labels, bar and bar direct labels read the fraction; legend reads `hoverStateMarks`. Parity test harness. Resolves #959–#962.
2. **Selection rules.** `selectedGroup`, `highlightBy` groups, `selectedMatch`; bar stroke and selection ring move to `selectedMatch`.
3. **Line sub-marks.** Trendline and metric range read the parent fraction; stroke width reads `target`.
4. **Other marks.** Donut and segment labels, scatter and scatter path, area, venn, annotations. Benchmark scatter before merging.
5. **Delete rule-list paths** and legend rule injection for non-engine marks.

#958 (non-interactive line with `highlightedItem` throws) is independent and can be fixed before or alongside phase 1.

## Documentation

No public API changes. The animation docs should state that `animations={false}` only disables transitions; highlight and selection behavior is identical.

## Drawbacks

- Bar's default (non-animated) path moves from per-item encoding rules to a dataflow, which has a different performance profile and must be benchmarked.
- Large spec-snapshot test churn in phase 1.
- The engine becomes load-bearing for every mark; a bug there affects all of them (offset by the parity tests).

## Backwards Compatibility Analysis

No prop or type changes. Visual behavior changes only where the non-animated path currently diverges from the animated one (#959–#962); those are bug fixes. Internal data and signal names may be added or renamed; consumers relying on generated Vega spec internals could be affected.

## Alternatives

- **Patch each rule list.** Fixes the current bugs but keeps two implementations that will keep drifting.
- **Generate rule lists from the `HoverMatchRule` definitions.** Removes hand-copying but still evaluates per item per encoding, and the legend would still need its own derivation.
- **Make animations always on with a zero duration.** Keeps the timer and anim-state machinery running for no visual benefit.

## Open Questions

1. Bar's animated path is opt-in (`animations === true`) while line's is opt-out. Should bar move to opt-out as part of this work, or separately?
2. Should the parity test run across every Storybook story automatically, or a curated list?
3. Grouped legends (`keys`) use a separate `_hoverGroupFractionData`. Should groups become a first-class groupby on the state table?
4. Should state stay encoded as a fraction with `HOVER_NEUTRAL_TARGET` as neutral, or become an explicit enum (`-1 | 0 | 1`) with the fraction derived from it?

## Related Discussions

- #958, #959, #960, #961, #962
