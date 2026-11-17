<!-- Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Status: Draft
- Start Date: 2026-11-17
- RFC PR: https://github.com/adobe/react-spectrum-charts/pull/1115
- Authors: Madeline Luke

# Updated testing strategy

## Summary

Most of RSC's 4,900 unit tests check the structure of the generated Vega spec. They pass while real bugs ship, and they break whenever the rendering implementation is refactored. This RFC replaces them, as the main safety net, with browser tests that check what the user sees and does. Every test is a **case** (a chart and its data) plus **actions** (hover, resize, update) plus **checks** that decide pass or fail. The checks read the rendered pixels and an engine-neutral **chart description**, never engine internals, so the suite keeps working however the chart is rendered. Cases come from three sources: one pinned case per past bug, a small pairwise-generated matrix per chart type, and sweeps for continuous settings like width. Unit tests shrink to failure handling. The suite produces a machine-readable report so an agent can run it, open a failure, and fix it.

S2 only. S1 is in maintenance mode (see Open Questions).

## Motivation

### Bugs slip past the unit tests

RSC has 356 test files, about 4,900 tests and about 70,000 lines of test code. Bugs still ship, and most of them are in behavior a spec-structure test can't see.

Several recent crashes were all present on `main` with passing unit tests, and were found only by rendering every prop variation in a dashboard: `highlightedItem` on a non-interactive Line (#985), Bar (#988), Area (#994) and Scatter (#998), and a Bullet threshold + inspect + hidden target combination (#996).

### Where bugs actually come from

The 36 bug-labelled issues and about 100 fix PRs (Oct 2023 – Nov 2026) fall into these groups:

| Group                           | Share | Examples                                                                                                                                       |
| ------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Interaction and highlight state | ~25%  | stuck legend after click (#725), hover paths disagreeing (#857), children not following parent highlight (#831), bugs only with animations off |
| Layout and geometry             | ~20%  | hover resizing the chart (#965, #1035, #778, #1014, #787, #868), label collisions (#905), marks off their datum (#1034, #994)                  |
| Prop combinations               | ~12%  | "Unrecognized signal name" crashes (#985, #988, #994, #996, #998), props not reaching sub-marks (#1043), `undefined` replacing defaults (#955) |
| Lifecycle and animation         | ~12%  | blank until hovered and draw-in jumps (#1052), redraws on popover or resize (#689, #696), rebuild on every render (#1073)                      |
| Robustness and environment      | ~12%  | unhandled embed failures (#948), server rendering (#882, #885), bundlers                                                                       |
| Visual style and formatting     | ~10%  | invisible dotted strokes (#998), `shortNumber` labels (#988), colors (#1071)                                                                   |
| Data                            | ~6%   | NaN and null values (#717, #782), falsy dimensions (#939)                                                                                      |
| Accessibility                   | ~5%   | missing alt text (#646), keyboard navigation (#939)                                                                                            |

Most of these are about state over time or interactions between two settings, not about a single static render.

### Tests are tied to the implementation

Tests that inspect the Vega spec or scene graph have to be rewritten whenever the rendering implementation changes, which is exactly when tests are needed most. The suite has to be written against the public React API and the rendered output, so it can confirm that a reworked chart still looks and behaves the same.

### Expected outcome

- Each bug group above has tests aimed at it.
- The suite survives refactors of the rendering implementation without being rewritten.
- Fewer, cheaper unit tests that don't break on refactors.
- An agent can run the suite, see a failure, and fix it without a person describing the bug.

## Detailed Design

### Terms

- **Case:** a chart to render. JSX, data, size, chart-level settings and an ID.
- **Action:** something done to a rendered case: hover a datum, hover a legend entry, click, press a key, resize, change props, wait for animations to settle.
- **Check:** a function that passes or fails. Checks never read engine internals.
- **Chart description:** an engine-neutral summary of what is drawn, produced by a small adapter (below).
- **Reference:** what a comparison check compares against: the same case rendered from `main`.

### Test buckets

Every test belongs to exactly one bucket. Buckets become test tags and decide what runs where.

| #   | Bucket                     | Question                                 | Main checks                                       |
| --- | -------------------------- | ---------------------------------------- | ------------------------------------------------- |
| 1   | Data                       | Does it handle any data?                 | invariants, no errors                             |
| 2   | Layout and geometry        | Is everything where it should be?        | invariants                                        |
| 3   | Visual style               | Does it look right?                      | comparison                                        |
| 4   | Interaction state          | Does it respond correctly?               | equivalence, behavior                             |
| 5   | Composition and props      | Does every combination work?             | generated matrix with buckets 1, 2 and 4's checks |
| 6   | Lifecycle and animation    | Does it stay correct over time?          | equivalence                                       |
| 7   | Accessibility              | Can everyone use it?                     | axe, keyboard scripts                             |
| 8   | Robustness and environment | Does it fail safely and work everywhere? | unit tests, build checks                          |

Buckets 1–7 are browser tests. Bucket 8 is where the remaining unit tests live.

### The four kinds of checks

1. **Comparison.** Pixels and the chart description match the reference, within a tolerance. There are no committed baseline images: the reference is always rendered from `main` (or Vega), so merging a PR updates it.
2. **Invariants.** Rules that hold for any case, so generated cases need no hand-written expected results. The starting set:
   - one mark per non-null datum;
   - no overlapping labels;
   - nothing drawn outside the chart, and marks clipped to the plot where they should be;
   - attached marks (points, labels, halos, hover points) within a few pixels of their datum;
   - legend entries match the drawn series;
   - hovering never changes the plot area or container size;
   - dimmed and highlighted items match the highlight state.
3. **Equivalence.** Two routes to the same state must give the same chart description and pixels. These need no reference and target the largest bug groups:
   - animated and settled = not animated;
   - controlled `highlightedItem` = hovering that item;
   - after leaving = never hovered;
   - every hover path (mark, gap, axis label, legend entry) gives the same highlight state;
   - updated props, settled = a fresh mount of the new props;
   - re-render with identical or content-equal props = no change;
   - `prop={undefined}` = prop omitted;
   - resize and restore = original.
4. **Behavior.** No exceptions or console errors; popovers and tooltips open with the right content; callbacks fire with the right arguments; axe passes.

### Chart description

A small adapter produces the description from the rendered chart:

```ts
interface ChartDescription {
  plot: Rect;
  marks: {
    role: string; // 'line' | 'point' | 'bar' | 'arc' | 'label' | ...
    series?: string;
    datum?: Record<string, unknown>;
    bounds: Rect;
    fill?: string;
    stroke?: string;
    opacity: number;
    text?: string;
  }[];
  legend: { label: string; color: string; opacity: number; hidden: boolean }[];
  axes: { position: string; labels: { text: string; bounds: Rect }[] }[];
  overlays: { kind: 'tooltip' | 'popover'; bounds: Rect; text: string }[];
}
```

The Vega adapter reads the view's scene graph. Checks only ever see this shape, so a change to how charts are rendered only requires updating the adapter. Marks that exist only to capture events (voronoi cells, hover areas) are excluded, because they are implementation details.

### Case sources

**1. Pinned regression cases.** One case per past bug and every new bug fix, tagged with its bucket and issue or PR. These are the existing `Regressions` stories plus new ones. A regression case is never removed.

**2. Generated matrix per chart type.** Each chart type lists its behavior-changing props as **dimensions**, each with a few **value classes** (values that behave the same are one class). A shared generator returns the smallest set of cases that covers every pair of value classes at least once.

```ts
export const lineMatrix = defineMatrix({
  chart: 'line',
  dimensions: {
    data: { normal: {...}, single: {...}, gaps: {...}, outOfRange: {...} },
    interactivity: { none: {}, tooltip: {...}, popover: {...}, highlightedOnly: {...} },
    interpolate: { linear: {}, basis: {...} },
    child: { none: {}, trendline: {...}, metricRange: {...} },
    legend: { none: {}, highlight: {...}, toggle: {...} },
    animations: { on: {...}, off: {...} },
    size: { tiny: {...}, default: {...} },
  },
  constraints: [(c) => !(c.data === 'single' && c.interpolate === 'basis')],
  render: (p) => (/* JSX built from the value classes */),
});

generateCases(lineMatrix, { strength: 2, seed });
```

- **Case IDs are the values**, e.g. `line/data=gaps/interactivity=highlightedOnly/animations=off/...`, so a failure names the settings that broke.
- **Fixed seed**, so every PR run generates the same cases. A different seed generates a different set that still covers every pair.
- **`strength: 3`** for high-risk dimension groups (interactivity × highlight × children × animations) and for small charts like Bullet.
- Style-only props (`lineWidth`, `opacity`, `lineCap`) stay out of the matrix and get one case each.

Estimated counts, with 9–14 dimensions per chart:

| Chart   | Every combination | Pairwise | 3-way |
| ------- | ----------------- | -------- | ----- |
| Line    | 5,598,720         | 44       | 233   |
| Bar     | 6,635,520         | 42       | 200   |
| Donut   | 172,800           | 28       | 125   |
| Scatter | 259,200           | 32       | 127   |
| Area    | 14,400            | 28       | 116   |
| Bullet  | 24,576            | 18       | 62    |
| Combo   | 8,640             | 23       | 85    |

Every Line-related bug listed under Motivation involved two settings and would be covered by the pairwise set (for example #1034: `basis` × static points; #1014: fixed axis range × out-of-range data).

**3. Sweeps.** Continuous settings (width, label length, value magnitude) are swept across a range with invariants checked at each step. Donut label collisions (#905) and sizing (#1006) are the motivating cases.

**Chart-specific checks.** Each chart type may add 1–3 invariants of its own, such as donut labels outside the ring, bars in a group not overlapping, or a Bullet target at its value.

### Determinism

- Fonts are loaded before any capture, and CI renders in a pinned container image so fonts and anti-aliasing match.
- Animations run on a fixed clock, so a test can capture any frame or the settled state.
- Data and dates in cases are fixed. Random data comes only from a seeded generator.
- Pixel comparison uses a tolerance and reports the changed area, not just pass or fail.

### Runner and report

```
yarn test:visual [--base main] [--bucket interaction] [--case <id>] [--seed <seed>]
```

- Runs in Playwright against a small case-rendering page (`/case/<id>`). It doesn't depend on Storybook; existing stories can be loaded as cases.
- Writes a JSON report: case ID, bucket, status, failed checks, percentage of pixels changed, paths to reference, current and diff images, and chart-description differences (e.g. "`line` series `s2` opacity 1 → 0.4").
- Reference renders for `main` are cached as CI artifacts per commit, so a PR run renders only its own branch.
- Re-running one case takes seconds, so an agent can iterate on a failure.

### When it runs

The whole suite runs on every PR with a fixed seed: pinned regression cases, the pairwise matrices, 3-way groups, sweeps and accessibility. The estimate is 8–12 minutes on 4 CI workers. If that becomes too slow, PRs can run only the chart types a change affects, plus every pinned regression case.

A scheduled run with a new seed each time could later widen coverage beyond the fixed pairwise set (see Open Questions).

Pixel comparison is advisory (reported, reviewed) until flakiness is measured. Invariant, equivalence and behavior checks block merging from the start.

### Unit tests

New unit tests cover failure handling only:

- `null`, `undefined` and empty input;
- invalid prop combinations produce a clear error or warning, not a crash or a blank host app;
- errors are caught and reported (for example #948, #1024);
- pure helpers with real logic (formatters, layout math).

New tests that assert the structure of the generated spec are no longer added. Existing ones stay until browser coverage for that area exists, then are removed when they next need maintenance.

### Agent workflow

The JSON report and per-case URLs are the interface for agents. An agent can run the suite, read a failure, open the case side by side with its reference, use the chart description to find the mark that changed, fix the code, and re-run that one case. The same case-rendering page and chart-description adapters can back the team's interactive agent sandbox, so there is one implementation of each.

### Relationship to the S2 chart stability RFC

`rfcs/s2-chart-stability.md` already requires generated "update equals fresh mount" and mid-flight equivalence tests. Those are bucket 6 equivalence checks under this RFC. This RFC proposes that they compare the chart description instead of Vega's serialized scene graph, so they don't depend on Vega internals.

## Scope

| Issue | Description                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| new   | Case format, case-rendering page, and Playwright runner with JSON report                                                 |
| new   | Vega chart-description adapter                                                                                           |
| new   | Shared invariant checks (starting set above)                                                                             |
| new   | Shared equivalence checks                                                                                                |
| new   | Pairwise generator with constraints, seeds and strength                                                                  |
| new   | Line matrix and Line-specific checks (pilot)                                                                             |
| new   | Pinned cases for every open bug issue and recent fix PR                                                                  |
| new   | `main` reference caching in CI and the PR workflow                                                                       |
| new   | Determinism: fixed animation clock, font loading, pinned container image                                                 |
| new   | Matrices for Bar, Donut, Scatter, Area, Bullet and Combo                                                                 |
| new   | Donut width sweeps                                                                                                       |
| new   | Update `AGENTS.md` and the `fixing-bugs`, `adding-props` and related skills to add cases instead of spec-structure tests |

Pilot first: the runner, the Vega adapter, three checks (no errors, hover doesn't move the plot, after leaving = never hovered) and the Line matrix. Success means it catches #985, #1034 and #1014 when run on the commits before those fixes.

## Cross-Cutting Concerns

- **Hover animation:** every interaction case runs with animations on and off; settled-animated = not-animated is a core equivalence check.
- **Controlled highlight:** controlled = hovered is a core equivalence check; `highlightedItem`-only is a value class in every matrix.
- **Legend interaction:** legend hover, highlight and toggle are value classes; the legend-matches-series invariant applies everywhere.
- **Tooltip/popover:** behavior checks for content, and "every hover path agrees" covers which target opens them.
- **New signal or scale:** no direct impact; tests don't read signals or scales.
- **S1/S2 parity:** S2 only (see Open Questions).

## Documentation

- A testing guide in `packages/docs` (or `planning/`) covering buckets, how to add a pinned case, how to add a dimension, and how to read the report.
- Updates to `AGENTS.md` and the affected skills so agents follow the new approach.

## Drawbacks

- Browser tests are slower and can be flaky. Determinism work and advisory pixel checks reduce this but don't remove it.
- Intentional visual changes (a token update) can produce hundreds of diffs to review.
- Each new behavior-changing prop needs a matrix entry, which adds a little work per feature (intentionally).
- Pairwise coverage misses bugs that need three or more settings together, unless they are in a 3-way group.
- About 6–8 weeks of work for one person before the full suite exists. The pilot is about 2 weeks.

## Backwards Compatibility Analysis

No public API changes. Tests and tooling only.

## Alternatives

- **Hosted visual testing tied to Storybook (e.g. Chromatic).** Rejected: the team doesn't want to depend on Storybook or an outside service, and it gives pixel diffs only, without invariants or equivalence checks.
- **Vega scene-graph snapshots.** Fast and precise, but Vega-specific. Kept only as the Vega adapter's input.
- **Committed baseline images.** Rejected in favor of rendering the reference from `main`, which avoids baseline churn and merge conflicts.
- **Exhaustive or hand-picked prop combinations.** Exhaustive is millions of cases per chart; hand-picked misses the combinations nobody thought of, which is how #985–#998 shipped.
- **AI vision review as a gate.** Not deterministic. Possible later as an advisory step that sorts expected from unexpected diffs.
- **Keep investing in unit tests.** They don't catch the bug groups above and break when the implementation is refactored.

## Open Questions

1. Should the case-rendering page live in this repo, or be shared with the agent sandbox tool? Building it twice should be avoided.
2. Does S1 need any coverage, given it is in maintenance mode?
3. When do pixel comparisons become blocking, and at what tolerance?
4. Which existing unit tests are removed first, and on what schedule?
5. Which CI runner and container image do we standardize on for consistent fonts?
6. Should the stability RFC's validation switch from scene-graph comparison to the chart description?
7. Should we add a scheduled run (for example nightly) that uses a new seed each time, to cover more combinations than the fixed PR set?

## Help Needed

Input from whoever owns the agent sandbox on sharing the case-rendering page and adapters (Open Question 1).

## Frequently Asked Questions

**Why not test every prop combination?** There are millions per chart. Pairwise coverage gets every two-setting interaction in a few dozen cases, and most past bugs involved two settings.

**How do generated cases know what's correct?** They don't need to. Every case gets the same invariants and equivalence checks, which hold for any valid chart.

**What happens to Storybook stories?** They stay, and can be loaded as cases. The suite doesn't depend on Storybook.

## Related Discussions

- `rfcs/s2-chart-stability.md` (#1022)
- Variation dashboards (`packages/react-spectrum-charts-s2/src/dev/*/Dashboards/`), which found #985, #988, #994, #996 and #998
