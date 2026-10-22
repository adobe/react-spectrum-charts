# Architecture: Rendering, Signals, and Popovers

Read this when: diagnosing a render/flicker/resize bug, a stuck/incorrect hover-selection
signal, a popover showing wrong/blank content, or stale-spec-state after a spec rebuild.
Assumes you've already read `architecture-core.md`.

---

## VegaChart Rendering

### S1: Two Separate Effects

S1's `VegaChart.tsx` has two effects that must never be merged:

**Embed effect** (deps: spec, data, config, signals — NOT width/height)
Calls `vega-embed`. Creates a new Vega `View`. Destroys the old one. Expensive. Any flicker or unnecessary full re-render traces to something that should be in the resize effect accidentally appearing in this dep array.

**Resize effect** (deps: width, height only)
Calls `view.width(w).height(h).resize().runAsync()`. No teardown. Cheap.

**`hasMounted` / `needsInitEmbed` pattern**: handles the case where dimensions start at 0. The chart waits for a non-zero size before running the embed effect for the first time.

### S2: the View Host

S2's `VegaChart.tsx` is a thin React wrapper around `viewHost/createViewHost` (framework-agnostic; ESLint bans React imports there). One effect creates and destroys the host; another passes every input (spec, table, signals, environment — config, locale, padding, renderer, tooltip — size and `onNewView`) to `host.update()`, which routes it.

The host owns the routing and lifecycle; every call into the rendering library goes through a `ViewAdapter` (`viewHost/viewAdapter.ts`, which ESLint keeps free of React and Vega imports). `vegaViewAdapter` (`viewHost/vegaViewAdapter.ts`) is the only implementation: it splits Vega specs, embeds with `vega-embed`, and applies `view.signal`/`view.change`/resize. Its optional `animation` section prepares specs for draw-in and attaches views to the animation ticker; the host keeps the draw-in hold, first-paint fade and carry-over across rebuilds. A future renderer (e.g. a D3 builder) implements the same interface, and views from an adapter without `animation` don't animate.

- **Rebuild** (new view, old one destroyed): the *program* changed — for Vega, the spec JSON with TABLE values and signal values removed — or the environment or `onNewView` changed, or a draw-in chart went empty ↔ non-empty.
- **Incremental**: changed signal values go through `view.signal`, changed table content through `view.change`, size through `resizeView`, then one run. No new view; `onNewView` isn't called.
- **No-op**: equal inputs (table compared by content).
- **None**: zero width or height, until the chart has a size.

Updates that arrive while a view is being created are applied once it exists. `hiddenSeries` stays in the program (`PROGRAM_SIGNALS`) because Vega's legend layout doesn't re-measure symbols after a signal change. The host also owns the animation ticker and carries draw-in across rebuilds.

In both, the spec must never depend on `chartWidth`/`chartHeight`, or every resize rebuilds. The only exception is Venn (S1 only), which bakes circle positions into the spec itself.

---

## Signal Architecture

Signals are named reactive variables in the Vega spec (`spec.signals[]`).

- Names are always prefixed with the component name: `legend0_hoveredItem`, `scatter0_hoveredItem`
- Before calling `view.signal(name, value)`, check `specSignalNames.has(name)` — writing to an absent signal throws a runtime error; the set of signals varies based on which marks and features are active
- Every signal write must have a symmetric clear: set in `mouseenter` → clear in `mouseleave`; set `selectedData` on click → clear on popover close

Signal names in `packages/constants/constants.ts`: `HOVERED_ITEM`, `HOVERED_SERIES`, `SELECTED_ITEM`, `BACKGROUND_COLOR`.

---

## COMPONENT_NAME Invariant

When a mark is clicked, `{ [COMPONENT_NAME]: markName, ...datum }` is injected into `selectedData.current`. `ChartDialog` checks `datum[COMPONENT_NAME] === name` before rendering its content. This is how multiple marks with popovers coexist on one chart — only the dialog whose name matches the clicked mark renders.

Any popover showing blank content, wrong content, or firing for the wrong mark is a `COMPONENT_NAME` mismatch. Look in `markClickUtils.ts` and `getTooltip()` in the mark utils.

---

## `safeClone`

`buildSpec` returns a deep clone of the spec via `safeClone`, a private function in `chartSpecBuilder.ts`. `VegaChart.tsx` makes another copy before passing to `vega-embed`. Both the caller and `vega-embed` mutate the spec they receive — cloning prevents cross-contamination with the memoized canonical spec in `useSpec.tsx`. If you're seeing stale spec state, check whether something mutates the memoized spec directly rather than working on a clone.
