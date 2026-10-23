<!-- Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Status: Draft
- Start Date: 2026-10-14
- RFC PR: https://github.com/adobe/react-spectrum-charts/pull/1022
- Authors: Connor Lamoureux
- Parent Issue:

# S2 chart stability across prop changes

## Summary

Today almost any change to an S2 chart's props — including changes that alter nothing — destroys the Vega view and embeds a new one. That re-runs the whole dataflow, re-renders the scene from scratch, drops transient interaction state, and replays draw-in animations. This RFC defines how an S2 chart responds to every kind of update: which changes are no-ops, which are applied to the live view as signal or data updates, which rebuild the view, and which of those rebuilds replay draw-in. It defines the state that survives each update, how in-flight animations behave, and — because the main risk of avoiding redraws is a stale or partially-updated scene — the invariants and generated tests that prove an incrementally-updated chart always settles to exactly what a fresh mount would render.

S2 only. S1 is out of scope and will not receive this work.

## Motivation

### Measured behavior on `main`

View creations counted via `onVegaViewReady` on an S2 `Line` chart (`animations={false}`), after the initial mount:

| Scenario                                           | New views                 | Expected         |
| -------------------------------------------------- | ------------------------- | ---------------- |
| Parent re-renders with identical inline JSX        | 2                         | 0                |
| New `data` array, identical contents               | 2                         | 0                |
| Inline `onVegaViewReady` arrow, parent re-renders  | 2                         | 0                |
| Controlled `highlightedSeries` `undefined → a → b` | 3                         | 0                |
| Legend toggle (`isToggleable`)                     | 2                         | 0                |
| Initial mount                                      | 1 view, **2 SVG renders** | 1 view, 1 render |

Streaming 8 appends to a chart produces 9 view creations.

### Why it happens

- `RscChart` memoizes sanitized children on `props.children`, which is a new object on every parent render with inline JSX. Everything derived from children (`useSpec`'s memo, `onNewView`, inspect options) is therefore new on every parent render.
- `useSpec` is a single `useMemo` over ~20 inputs. Any new reference rebuilds the spec, and a new spec object re-runs `VegaChart`'s embed effect.
- `VegaChart`'s embed effect depends on `spec`, `data`, `signals`, `onNewView`, `tooltip`, `config`, locale, padding and renderer. Any change finalizes the view and embeds a new one. The resize effect is the only incremental path.
- Controlled props (`hiddenSeries`, `highlightedItem`, `highlightedSeries`) are baked into signal initial values by `getDefaultSignals`, and `highlightedSeries` also changes mark encodings, so changing them requires a new spec.
- `useNewChartView` calls `view.tooltip()` after embed; Vega's `tooltip()` resets the renderer, so every mount renders twice (fixed by #987).
- Draw-in latches its start time on the first animation tick of each view, so every re-embed replays draw-in.

### What users see

- Charts flash and replay draw-in on unrelated parent state changes (e.g. a dashboard's size control), legend toggles and highlight changes.
- Hover, tooltip and popover state is dropped mid-interaction.
- Dashboards with many charts and streaming data pay a full parse, dataflow and render per update.

### The risk this RFC has to manage

The obvious fix — avoid re-embedding — creates the opposite failure: a change that should have reached the scene is dropped, or only part of it is applied, and the chart shows stale data or configuration with no error. Some of these updates are ours (a prop that changes the program but was treated as a signal update); some are Vega's (a data update that must re-derive scale domains, axis ticks, legend entries and layout). Any design here must make "too few updates" as detectable as "too many".

## Detailed Design

### Terms

- **Program** — the Vega spec with all data values and all signal _values_ removed. Two specs with equal programs can be reached from one another without a new view.
- **View** — a Vega `View` instance. A **rebuild** finalizes the view and creates a new one.
- **Settled** — every pending dataflow run, render and animation has completed.
- **Fresh mount of B** — a chart mounted directly with props B, settled.

### What Vega already provides

This RFC routes updates to Vega's existing mechanisms rather than building its own. In Vega 6:

| Need                                    | Vega provides                                                                            | Gap we fill                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Recompute only what changed             | Incremental dataflow: `view.signal()` and `view.change()` pulse only dependent operators | Deciding which updates are signal or data updates                              |
| Re-render only what changed             | Renderers redraw dirty items only                                                        | —                                                                              |
| Replace or patch data                   | `view.data(name, values)`, `view.change(name, changeset)` with insert/remove/modify      | Detecting content changes independent of array identity                        |
| Keep mark items across data replacement | Mark `key` property joins data tuples to existing items by field                         | We don't set `key` today, so a full replacement exits and re-enters every item |
| Carry state across views                | `view.getState()` / `view.setState()` export and restore signal values and modified data | Choosing which state to carry (retention rules)                                |
| Compare scenes                          | `sceneToJSON` (vega-scenegraph), `view.toSVG()`                                          | Normalizing nondeterministic fields                                            |
| Apply a changed program                 | Nothing — a new program requires `parse()` and a new `View`                              | Program comparison, replay policy                                              |
| Animation                               | Nothing built in                                                                         | The existing animation ticker and draw-in clock                                |

Prior art: react-vega takes the same split — deep-compare the spec to decide whether to re-embed, otherwise push data through changesets.

### Invariants

1. **Update equals fresh mount.** For any props A and B, mounting A, updating to B and settling must produce the same scene as a fresh mount of B, except for state the retention rules below explicitly carry over. This is the guard against stale and partial updates.
2. **View budget.** An update creates a new view only if the program changed (or renderer, config, locale or padding changed). Everything else updates the live view.
3. **Render once.** A mount or rebuild renders the scene once.
4. **Determinism.** The update class, retained state and animation behavior for a change are a pure function of (previous props, next props). They don't depend on timing, reference identity of equal values, or render order.

### Update classes

| Class                | Applied by                                        | Examples                                                                                       |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **No-op**            | nothing                                           | New `data` array with identical rows; identical inline JSX children; new inline callback       |
| **Signal**           | `view.signal(name, value)` then `runAsync()`      | Controlled `hiddenSeries`, `highlightedItem`, `highlightedSeries`; legend toggle               |
| **Data**             | `view.change(TABLE, changeset)` then `runAsync()` | `data` with different rows, streaming appends                                                  |
| **Size**             | existing resize path                              | `width`, `height`                                                                              |
| **Rebuild**          | new view                                          | Program changes without replay: padding, styling, axis options, `lineWidth`, `opacity`         |
| **Rebuild + replay** | new view, draw-in replays                         | Program changes that make it a different chart: metric, dimension, series identity, chart type |

### Routing: derive the class from compiled output, verify against declared classes

Routing must not depend on hand-maintained lists being correct, because a wrong entry is exactly a dropped update. The chart decides how to apply an update by comparing what it would give Vega:

1. Build the spec as today (memoized on inputs).
2. Split it into **program**, **signal values** and **table data**, and serialize the program (`JSON.stringify`, which matches what `VegaChart` already does before embedding, so JSON-equal is embed-equal).
3. If the program, renderer, config, locale or padding differ → **rebuild**. Otherwise apply changed signal values as signal updates and changed table data as a data update, in one batch, then run once.
4. If nothing differs → no-op.

Because anything that changes the program falls back to a rebuild, misrouting can only cost performance, never correctness. This also covers marks whose spec content depends on data (line and bar facet and series keys, donut segment IDs): such a data change changes the program and rebuilds.

Separately, every input is **declared** in a typed classification so behavior can be documented, tested and reasoned about:

```ts
export const LINE_UPDATE_CLASSES = {
  color: { update: 'rebuild', replay: true },
  lineWidth: { update: 'rebuild', replay: false },
  highlightedSeries: { update: 'signal', replay: false },
  // ...every key
} satisfies Record<keyof LineSpecOptions, UpdateClassification>;
```

- One table per mark, child component (`ChartTooltip`, `Trendline`, `MetricRange`, …) and for `ChartOptions`. `satisfies Record<keyof …>` makes a missing or new unclassified option a compile error.
- The declared `update` class is a **claim tested against the router**, not an input to it (see Validation). A declared `signal` input that the router actually rebuilds is a performance bug; a declared `signal` input whose change doesn't reach the scene is a correctness bug. Both fail tests.
- The `replay` flag _is_ an input: it drives the replay policy below, because whether something "looks like a new chart" is a product decision the compiled output can't infer.
- These tables generate the documented update matrix (see Documentation).

### Making controlled state signal-only

Phase 1 moves controlled state out of the program so it routes as signal updates:

- `hiddenSeries`, `highlightedItem`, `highlightedSeries` keep their signals, but their spec contribution must be value-independent. `getDefaultSignals` still seeds initial values; the router strips signal values from the program comparison.
- `highlightedSeries` currently adds encodings only when set. Those encodings must exist unconditionally and test the signal, so `undefined → a → b` doesn't change the program.
- Legend toggles stop flowing through the embed effect's `signals` dependency and are applied with `view.signal`.

Until an input is signal-only, the router will correctly rebuild for it.

### Data updates

- Phase 1 replaces the table in place: `view.change(TABLE, vega.changeset().remove(() => true).insert(rows))`. Vega re-derives every downstream transform, scale domain, axis, legend and layout from that. Row-level diffing is not needed for correctness and is deferred unless profiling shows a need.
- Interactive marks set Vega's mark `key` to the row identity (`idKey`, else dimension + series), so a replaced table updates existing items instead of exiting and re-entering all of them. That avoids exiting and re-entering every item on each update and lets an in-flight draw-in continue on the same items. It is not used to retain interaction state.
- Content comparison uses the same serialization the embed path already pays for. Identical content is a no-op regardless of array identity; changed content in a reused array is detected.
- Streaming appends use the same path. An insert-only changeset is an optimization the router may take when the previous rows are a prefix of the next.

### Stable references

- **`onNewView` and view listeners.** Register listeners once per view; handlers read the latest action bars, popovers, click and legend callbacks from a ref. This generalizes the latest-ref tooltip handler from #987.
- **`onVegaViewReady`.** Read from a ref; a new inline function is a no-op.
- **One legend state.** `useLegend` is currently called twice (`useChartInteractions` and `useChartInspectInteractions`), producing two independent hidden-series states. Collapse to one.
- **Spec identity.** The program comparison above replaces reference-based memo invalidation as the gate for rebuilds. Keep comparison state in a `useRef`, not in a closure mutated inside `useMemo`, so discarded concurrent renders can't advance it.

### State retention

Retention is conservative: interaction state that refers to rows or series is only kept when the update can't change what it refers to. Keeping state that no longer means the same thing is itself a stale-state bug.

| State                   | No-op | Signal update | Data update                             | Rebuild                                 |
| ----------------------- | ----- | ------------- | --------------------------------------- | --------------------------------------- |
| Selection               | kept  | kept          | cleared                                 | cleared                                 |
| Hidden series           | kept  | kept          | kept, minus series that no longer exist | kept, minus series that no longer exist |
| Hover, tooltip, popover | kept  | kept          | reset                                   | reset                                   |
| Draw-in progress        | kept  | see Animation | see Animation                           | see Animation                           |

Consumers that need selection to survive data updates or rebuilds control it themselves. Series identity is the series key value; row identity, where needed, is `idKey` when provided, otherwise dimension + series, never `rscMarkId`, which is regenerated per dataflow run. Each rule has its own test. These rules need further review before acceptance (see Open Questions).

Across signal and data updates, kept state lives in the live view. Across rebuilds, kept signals are carried with `view.getState()` / `view.setState()`, filtered to the signals the rules above name, rather than by rewriting the new spec.

### Animation

**Replay policy.** Draw-in replays when, and only when, a rebuild changes an input whose classification has `replay: true` — a change that makes it a different chart (metric, dimension, series identity, chart type). Specifically:

- Signal, data, size and no-op updates never replay. A one-value data change updates in place.
- A rebuild where only `replay: false` inputs changed does not replay.
- The replay key is computed from classified option values, not data reference identity.

**Mid-flight updates.** When an update arrives while draw-in is running:

- Updates that don't replay continue the draw-in. For signal and data updates this is automatic: the animation clock lives in the same view. For non-replaying rebuilds the draw-in clock signals are carried to the new view with `getState`/`setState` before its first run, so it continues from the same point; if a rebuild can't carry progress (phase 1, or an incompatible clock), it snaps to the end. This is deterministic because the set of non-replaying inputs is declared.
- Updates that replay restart the draw-in.
- Stretch goal: a transition that smooths the shift for in-flight updates.

Regardless of mid-flight behavior, invariant 1 holds once settled.

**Mid-flight correctness.** Draw-in encodings blend each item's current target with the progress signal and are re-evaluated every frame, so a mid-flight signal or data update changes the targets immediately: already-drawn parts snap to the new values at the current progress, and undrawn parts animate toward them. A change is only lost if something bypasses that re-evaluation, so on updatable marks:

- Data- or prop-dependent encodings must be in `update`, not `enter`. `enter` runs only for new items, so with a mark `key` existing items would never pick up the change. This applies after the draw-in as well as during it.
- Nothing data- or prop-dependent is latched at draw-in start. The start time and duration are the only latched values; anything derived from data (stack extents, label settle times, `drawInDone` gates) is recomputed by the dataflow.
- Values computed in JS and baked into the spec are part of the program, so changing them rebuilds rather than updating in place.
- If a rebuild's animation clock is incompatible with the previous one (for example, a mark with a different duration was added), the draw-in snaps to the end.

**Ticker ownership.** The animation ticker attaches to a view when it's created and detaches when it's finalized, owned by the same module that owns view creation, so a rebuild can't leave an orphaned ticker or start a second one.

### View host

Phase 1 consolidates view creation, routing, listener registration, the ticker and teardown into one module used by `VegaChart`, wrapping `vega-embed`. When vega-embed is removed (#935), only this module's internals change. Carrying draw-in progress across rebuilds is cleanest when we create the `View` ourselves and set signals before the first run, so it's phase 2.

### Phasing

**Phase 1 — inside the current `VegaChart`**

- Render once on mount (#987).
- Stable listeners, `onVegaViewReady` and a single legend state.
- Program-based routing with signal and data updates.
- Controlled state made signal-only, including unconditional `highlightedSeries` encodings.
- Replay policy driven by declared `replay` flags; no-replay updates never restart draw-in.
- Declared classification tables for all marks, child components and chart options.
- Validation harness (below).

**Phase 2 — after vega-embed removal (#935)**

- View host creates `View` directly.
- Draw-in progress carried across non-replaying rebuilds.
- Optional insert-only changesets and mid-flight smoothing.

### Validation

1. **View count tests.** For each scenario in the Motivation table, plus streaming appends: 0 new views after mount; 1 view and 1 render on mount; exactly 1 new view for each rebuild-class change.
2. **Update-equals-mount tests, generated from the classification tables.** For every classified input of every mark, child component and chart option: mount with A, change only that input to B, settle, and compare the scene graph to a fresh mount of B. Compare Vega's scene graph (serialized with `sceneToJSON`, with nondeterministic fields stripped), not the spec, so Vega-derived results are covered: scale domains, axis ticks and labels, legend entries, autosize and layout, facets and stacks.
3. **Classification agreement tests.** For the same generated changes, assert the router took the declared update class. Disagreement in either direction fails.
4. **Retention tests.** One per cell of the retention table.
5. **Animation tests.** Replay vs. no replay per `replay` flag; mid-flight continue and restart; no orphaned tickers after rebuild.
6. **Mid-flight equivalence tests, generated from the classification tables.** Draw-in progress is a signal, so tests can pin it. For every classified input: mount A, pin progress at a fixed point (e.g. 50%), change the input to B, and compare the scene to a fresh mount of B pinned at the same progress; then release and compare the settled scene to a settled fresh mount of B. This catches changes to already-drawn parts that never reach the scene.

7. **Controlled-prop tests (high priority).** Controlled props (`hiddenSeries`, `highlightedItem`, `highlightedSeries`, selection) are managed outside the chart and often shared across charts, so they get dedicated coverage beyond the generated tests:
   - **Echo loops:** a chart whose `onHover`/`onLegendClick` writes back into its own controlled prop settles in a bounded number of updates, with no hover reset or flicker.
   - **Cross-chart sync:** two or more charts sharing parent state (synced hover, shared hidden series) converge to the same state with zero new views, in either interaction order.
   - **Batching and ordering:** several controlled props changing in one React commit, a controlled change arriving while a previous `runAsync` is pending, and a controlled change during user interaction all settle to the latest props.
   - **Lagging external state:** controlled values that arrive late or asynchronously never get overwritten by stale internal state, and internal interactions never get overwritten by a stale controlled value from an earlier render.
   - **Controlled vs. uncontrolled:** switching a prop between controlled and uncontrolled, and controlled values referencing series or rows that no longer exist.
   - **With animation:** each of the above during an in-flight draw-in.

These are the acceptance criteria. Tests 2, 3, 6 and 7 are what prevent aggressive redraw prevention from dropping updates.

## Scope

| Issue | Description                                                                                                   | Stage                 |
| ----- | ------------------------------------------------------------------------------------------------------------- | --------------------- |
| #987  | Render once on mount; stable tooltip handler                                                                  | alpha                 |
| #1062 | Clear the legend-delay tooltip timeout on rebuild, not only unmount                                           | alpha                 |
| #1060 | View count and scene-equivalence test harness                                                                 | alpha                 |
| TBD   | Declared update classifications for all marks, child components and chart options, plus generated docs matrix | alpha                 |
| #1064 | Stable `onNewView` listeners, `onVegaViewReady` ref, single legend state                                      | alpha                 |
| #1063 | View host module and program-based routing                                                                    | alpha                 |
| #1065 | Signal-only controlled state (`hiddenSeries`, `highlightedItem`, `highlightedSeries`, legend toggle)          | alpha                 |
| TBD   | In-place data updates                                                                                         | alpha                 |
| TBD   | Set Vega mark `key` from row identity on interactive marks                                                    | alpha                 |
| TBD   | State retention rules                                                                                         | alpha                 |
| TBD   | Move data- and prop-dependent encodings from `enter` to `update` on updatable marks                           | alpha                 |
| TBD   | Draw-in replay policy                                                                                         | alpha                 |
| TBD   | Carry draw-in progress across non-replaying rebuilds                                                          | deferred (after #935) |
| TBD   | Insert-only changesets for streaming                                                                          | deferred              |
| TBD   | Mid-flight animation smoothing                                                                                | deferred              |

## Cross-Cutting Concerns

- **Hover animation:** hover, tooltip and popover state survive no-ops and signal updates (so a controlled `highlightedItem` echoed back from `onHover` doesn't reset the hover it came from) and reset on data updates and rebuilds. Hover fade timing stays in the program.
- **Controlled highlight:** routed as signal updates; requires unconditional encodings for `highlightedSeries`. Controlled props are externally managed and often shared across charts, so they are the highest-risk area for stale or looping state and get dedicated validation (Validation, test 7).
- **Legend interaction:** toggles become signal updates; one legend state instead of two.
- **Tooltip/popover:** handlers read latest options through refs; open tooltips and popovers close on rebuild.
- **New signal or scale:** no new signals, but every signal's initial value is excluded from program comparison, so builders must not encode state in signal _definitions_ other than `value`.
- **S1/S2 parity:** S2 only. S1 is not getting this work.

## Documentation

- A generated "Update behavior" docs page: for each update class, the expected behavior (view reused or rebuilt, state retained, draw-in replayed or not) and every input that triggers it, per chart type, mark, child component and chart option.
- Update `.claude/architecture-rendering-and-signals.md`: its description of the embed effect and its dependencies is out of date, and the update routing becomes the new model.
- `onVegaViewReady` docs: it fires once per view, not once per prop change.
- Changesets for the user-visible changes listed under Backwards Compatibility.

## Drawbacks

- Serializing the program on each spec rebuild adds work on the rebuild path. It's bounded by spec size, not data size, and is already paid once per embed today.
- Every new option needs a classification entry and is covered by generated tests, which raises the cost of adding props (intentionally).
- Making `highlightedSeries` encodings unconditional adds some always-present encoding rules.
- Fewer views means bugs that were masked by remounting (state leaking across updates) become visible.

## Backwards Compatibility Analysis

- **`onVegaViewReady`** fires far less often. Consumers that relied on a new view after legend toggles, highlight changes or data changes must listen on the existing view instead. This needs a changeset and docs note.
- **Draw-in** no longer replays on legend toggles, highlight changes, data updates or parent re-renders. This matches the intent of the animation; it's still a visible change.
- **Hidden series and selection** now survive signal updates (and hidden series survive data updates and rebuilds) that previously remounted the chart and reset them.
- **`UNSAFE_vegaSpec`** consumers go through the same router. Specs that store state in signal definitions may need the program comparison to treat them as rebuilds; to be confirmed.
- No API removals.

## Alternatives

- **Hide replays instead of avoiding rebuilds.** Keep rebuilding on every change, and when a rebuild "shouldn't" replay, rewrite the draw-in clock in the new spec to its finished state, keyed on the data array reference and a per-mark replay key. This was prototyped. It keeps all the cost of rebuilding, relies on spec rewriting that can leave the scene inconsistent with a fresh mount, misses content-equal new data arrays and in-place mutations, and only covered Line.
- **Route by the declared classification tables.** Simpler, but any misclassified input silently drops an update. Deriving the route from compiled output and testing the declarations against it is safer.
- **Spec dedupe only (#984).** Correct but narrow: it only helps when children are memoized, because `onNewView` still changes with inline children. Its idea is kept inside program-based routing.
- **Remove vega-embed first (#935).** Not required for phase 1: signal and data updates work on the view `embed()` returns. It mainly helps phase 2, so it shouldn't block the stability work.
- **Ask consumers to memoize.** Shifts the burden to every consumer and doesn't fix controlled state, legend toggles or data updates.

## Open Questions

- **Retention:** should selection survive a data refresh when the selected row still exists and no `replay: true` input changed? The draft clears it.
- **Replacement data with the same series** (e.g. switching the date range): replay draw-in, or update in place like a one-value change?
- Should insert-only changesets be in phase 1 for streaming dashboards, or wait for profiling?
- How should the scene-graph comparison normalize nondeterministic fields (gradient IDs, clip IDs, timing-dependent values)?
- Do any `UNSAFE_vegaSpec` patterns depend on remounting?
- Do we want performance budgets (frame time, update time) in addition to view counts?
- Should phase 1 be built on the framework-agnostic host from the addendum, or inside the existing hooks first?

## Help Needed

Review of the classification tables per mark by whoever owns each mark.

## Frequently Asked Questions

**Why not just trust the classification tables for routing?** Because a wrong entry would drop an update silently. The router can only over-rebuild; the tables are tested against it.

**Does this change the spec builder API?** No. Builders still return a full spec; the chart decides how to apply it.

**Will charts animate between data values?** Not as part of this RFC. Data updates apply in place; transitions are a possible follow-up.

## Related Discussions

- #984 — dedupe identical specs (closed in favor of this RFC)
- #987 — render once on mount
- #1007 — bar draw-in, S2 timing and reduced-motion fades
- #934 — layered architecture RFC
- #935 — remove vega-embed RFC
- #936 — server-side spec generation RFC
- #963 — highlight state RFC

## Addendum: reduced-React view host

The design above can be implemented inside the existing hooks, but most of the hook-specific machinery (latest-value refs, stable callbacks, dependency lists, memo-based dedupe) exists only to stop React re-renders from reaching the view. This addendum proposes owning view management in a framework-agnostic module instead, so React only feeds it inputs and reads its state.

### Host API

```ts
const host = createChartHost(container, { renderer, config, locale });

host.update({ spec, data, controlled, handlers }); // routes: no-op / signal / data / size / rebuild
const unsubscribe = host.subscribe(listener); // hover, legend, selection, popover anchor changes
host.getSnapshot(); // current interaction state
host.destroy();
```

### Responsibilities

| Host (plain TypeScript, no React)                                                                       | React layer                                                                               |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Program comparison and update routing                                                                   | Convert children and props to a spec (already pure)                                       |
| Signal and data updates on the live view                                                                | One effect: create the host on mount, destroy on unmount                                  |
| `getState` / `setState` retention across rebuilds                                                       | One effect: `host.update(...)` with the latest props                                      |
| Draw-in replay policy, animation ticker                                                                 | `useSyncExternalStore(host.subscribe, host.getSnapshot)` for legend, popover and hover UI |
| View listener registration; handlers are a field replaced on each `update`, so no ref pattern is needed | Render React UI (popovers, legend interactions) from the snapshot                         |
| Uncontrolled interaction state (hidden series, selection, hover)                                        | Pass controlled values in `controlled`                                                    |

### Rules

- **Single source of truth.** The host owns view and interaction state. React never keeps a parallel copy (this removes the duplicate `useLegend` state by construction).
- **Controlled values win.** When a controlled value is provided, the host applies it on every `update` and only reports user interactions through handlers; uncontrolled state lives in the host.
- **`update` is idempotent.** Calling it with equal inputs is a no-op, so React may call it on every render without dependency lists.
- **No React imports** in the host module, enforced by lint.

### Benefits

- Stability fixes such as #987 and #984 become ordinary code instead of hook workarounds.
- The host is testable with Vega and jsdom alone; the validation suite (view counts, update-equals-mount, retention, animation) runs against the host without `renderHook`.
- Aligns with the runtime-layer direction in #934; removing vega-embed (#935) only changes host internals, and server-side spec generation (#936) is unaffected because spec building stays pure.

### Costs and migration

- Interaction state the React UI needs (legend, popovers, hover) has to be exposed as host events and snapshots.
- Moving the current hooks (`useNewChartView`, `useChartInteractions`, `useLegend`, `useChartInspectInteractions`) is a real refactor. Migrate incrementally:
  1. Introduce the host wrapping the current vega-embed behavior unchanged, behind `VegaChart`.
  2. Move view listener registration and the ticker into the host.
  3. Move routing (signal and data updates) into the host.
  4. Move uncontrolled interaction state into the host and replace the hooks with snapshot subscriptions.
- Each step is covered by the validation suite, so behavior can't silently change between steps.

If adopted, the "View host" and "Stable references" sections above are implemented through this host rather than through hooks.
