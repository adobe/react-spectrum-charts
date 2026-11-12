<!-- Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Status: Draft (local)
- Start Date: 2026-11-09
- RFC PR:
- Authors: Connor Lamoureux
- Parent Issue:

# S2 D3 engine: a scene-graph chart engine parallel to Vega

## Summary

Build a new rendering engine for the S2 packages on D3's math modules (`d3-scale`, `d3-shape`,
`d3-interpolate`, `d3-format`, `d3-time-format`, `d3-delaunay`, `d3-array`) instead of Vega.
Each chart type is one **chart definition** that turns validated options into a renderer-neutral
**scene**: a keyed tree of drawing primitives such as rects, paths, arcs and text. A small
runtime owns everything that isn't chart-specific: layout, the shared animation ticker, hover,
highlight and selection state, hit testing, tooltips and popovers, the Data Navigator, and two
renderers (Canvas 2D and SVG) that only know primitives. The public React API (`<Chart>`,
`<Line>`, `<Bar>`, `<Axis>`, ...) stays the same. Components, prop types, defaults, docs tables
and dashboard coverage are generated from one option schema per component.

The engine lives in a new `@spectrum-charts/chart-d3` package, a sibling of
`vega-spec-builder-s2` and the Vega view host, not a replacement for them. `<Chart engine="d3">`
selects it per chart. It starts in `lab`, proves itself on Line, then Bar and Donut. Whether it
becomes the default for any component is a later decision, made from parity and benchmark data.
S1 is out of scope.

## Motivation

The D3 engine has four goals. Each one is blocked by how the Vega engine is built.

### 1. Performance, especially animation

Vega has no frame-level animation model. S2 emulates one with spec dataflow:
- **Hover:** emphasis fractions are computed in signals and data transforms
  (`planning/research/hover-animation-system`).
- **Draw-in:** progress comes from lead transforms and a per-row time field
  (`planning/research/draw-in-animation`).
- **Ticker:** `animation/animationTicker.ts` advances a timer signal and calls `view.runAsync()`
  every frame for every animating chart.

Every animated frame re-evaluates the dataflow, re-encodes marks and re-renders the scene, even
though only a few numbers changed. Layout, scales and data transforms don't change during a hover,
but Vega can't skip them reliably. That's why the S2 code has frame budgets, round-robin ticking,
steady-frame holds and draw-in carry-over across rebuilds (`viewHost/viewHost.ts`).

### 2. Canvas, SVG and the Data Navigator

Vega supports both renderers. But the Data Navigator (`dataNavigator/`, about 2,250 lines) reads
geometry and state through Vega internals: `view.data(FILTERED_TABLE)`, `${markName}_stacks`
datasets, focus signals, and parity shims such as `barHoverParity.ts` that make keyboard focus look
like mouse hover. Each new chart needs its own structure builder and parity code.

### 3. Extendability

A cross-cutting behavior (hover animation, controlled highlight, legend interaction, draw-in,
focus) is rebuilt in each mark's spec builder as signals, data sources and encoding rules. The
`planning/README.md` cross-cutting checklist exists because these are easy to miss. Adding a chart
type means re-implementing every one of them.

### 4. Files touched per feature

Recent S2 feature PRs (file counts from GitHub):

| PR | Feature | Files |
|---|---|---:|
| #947 | Donut slice gap | 3 |
| #993 | Bar direct label collision hiding | 16 |
| #1007 | Bar draw-in and reduced-motion fades | 35 |
| #881 | Bar opacity animations | 27 |
| #913 | Bar data navigator | 43 |
| #1076 | Signal-only controlled hidden/highlighted state | 52 |

Even a plain prop touches about 10 files today:
- the `*Options` type and the `*OptionsWithDefaults` union
- the spec builder, often across several files: `barSpecBuilder`, `barUtils`, `stackedBarUtils`, `dodgedBarUtils`, `barAnimationUtils`, and shared helpers in `marks/`
- test utils and tests
- the React props type, and default values in the render-null component (`Bar.tsx`)
- the adapter if the prop involves children
- the zod schema in `@spectrum-charts/schemas`
- a story, the dashboard coverage map, the docs props table, and a changeset

Most of this spread is structural. One fact (a prop, its type, its default and its docs) lives in
five places. One behavior (hover) lives in every mark.

## Detailed Design

### Terms

- **Chart definition:** one module per chart or mark type. Declares its option schema and pure
  functions that build its data, scales and scene.
- **Scene:** the renderer-neutral output of a build. A tree of keyed primitives with resolved
  geometry and style, plus semantic metadata (datum, series, role).
- **Primitive:** `rect`, `path`, `arc`, `symbol`, `line`, `text`, `group`, and `image` if needed.
- **Trait:** a cross-cutting runtime behavior that marks opt into by declaring metadata, not by
  writing code. Examples: hover emphasis, selection, draw-in, tooltip, focus.
- **Channel:** a per-item animated value owned by the runtime, such as `emphasis` (0..1, neutral
  0.5, from the hover-animation research), `drawIn` (0..1) or `visible`.

### Layers

```
React layer (react-spectrum-charts-s2)      existing components, React Spectrum UI
    │  <Chart engine="vega">                 │  <Chart engine="d3">
    ▼                                        ▼
vega-spec-builder-s2 + VegaChart/viewHost    @spectrum-charts/chart-d3 (framework-neutral)
(unchanged)
    resolve options ─▶ data pipeline ─▶ scales ─▶ layout ─▶ scene build   (pure, memoized per stage)
                                                              │
         state + channels (hover, highlight, selection, hidden, draw-in, focus)
                                                              ▼
         animator (shared rAF ticker; tweens primitives and channels, no rebuild)
                                                              ▼
         renderer: SVG | Canvas2D        hit index (quadtree / Delaunay)        a11y / Data Navigator layer
```

The two engines share only the React components, `core-s2` (tokens, constants, locales) and the
options types. Neither imports the other.

This realizes #934's three-layer split, with a different contract between the runtime and the
chart. Instead of a spec plus an interaction manifest, the runtime gets a scene whose primitives
carry their semantics. No names to keep in sync means nothing can drift.

### Chart definitions

Each chart type is one folder, and normally one source file:

```ts
// packages/chart-d3/src/charts/bar/bar.ts (PROPOSED)
export const bar = defineMark({
  name: 'Bar',
  options: z.object({
    dimension: z.string().default(DEFAULT_CATEGORICAL_DIMENSION),
    metric: z.string().default(DEFAULT_METRIC),
    color: colorFacet.default({ value: 'categorical-100' }),
    type: z.enum(['stacked', 'dodged']).default('stacked'),
    orientation: z.enum(['vertical', 'horizontal']).default('vertical'),
    paddingRatio: z.number().default(PADDING_RATIO),
    /** ... JSDoc flows to generated docs and React prop types */
  }),
  children: [BarDirectLabel, ChartTooltip, ChartPopover, Trendline],
  data: (rows, o) => (o.type === 'stacked' ? stackBySeries(rows, o) : rows),
  scales: (data, o) => ({ x: band(o.dimension, o.paddingRatio), y: linearZero(o.metric), color: categorical(o.color) }),
  scene: (ctx, o) =>
    ctx.data.map((d) =>
      rect({ key: ctx.id(d), datum: d, series: ctx.series(d), x: ..., y: ..., width: ..., height: ..., fill: ctx.color(d) })
    ),
  navigation: dimensionThenSeries, // reusable preset
});
```

- **Option schema** (zod, as `@spectrum-charts/schemas` already uses) is the single source of
  truth. It produces the TypeScript options type (`z.infer`), defaults, React prop types, docs
  tables, dashboard coverage keys and the A2UI catalog entry. No separate `*SpecOptions` type,
  `*OptionsWithDefaults` union, or default values in a render-null component.
- **Pure stages:** `data`, `scales` and `scene` are pure and memoized on their inputs. A
  highlight change doesn't re-run any of them. A data change re-runs `data` onward. A resize
  re-runs layout and scene only.
- **Children:** child components (direct labels, trendlines, annotations, reference lines) are
  definitions too, built with the parent's `ctx` (scales, data, plot rect). A parent lists the
  children it accepts, and one generic dispatch replaces the per-mark `childrenAdapter` cases and
  adapters.
- **Shared building blocks** are plain functions: stacking, series facets, band, time and linear
  scale presets, label placement with collision avoidance, axis tick generation, legend layout.
  New charts compose them. They don't copy them.

### Scene and traits: cross-cutting behavior without per-mark code

Primitives carry metadata the runtime understands:

| Field | Enables |
|---|---|
| `key` | keyed diff for enter, update and exit animation, and state retention across updates |
| `datum` | tooltips, popovers, click callbacks, `COMPONENT_NAME`-style routing |
| `series` / `group` | series hover and highlight, legend interaction, hidden series |
| `role` (`mark`, `label`, `axis`, `legend`, `focusRing`, ...) | which traits apply |
| `channels` (opt-in) | which animated channels affect which style properties |

The runtime implements each trait once. A mark gets hover emphasis, controlled highlight, legend
hover and toggle, selection, tooltip and draw-in by emitting keyed primitives with
`datum`/`series`. Per-mark tuning, such as bar draw-in growing from the baseline vs. line draw-in
revealing along x, is a small `drawIn` strategy chosen from a preset list. The cross-cutting
checklist in `planning/README.md` becomes a list of metadata to set.

Hover, highlight and selection use one per-item state table, which carries out #963 directly.
Props (`highlightedSeries`, `hiddenSeries`, `highlightedItem`) and pointer events write to the
same table. `animations` only controls whether channels tween or snap.

### Performance and animation

1. **Frames only interpolate and paint.** Layout, scales and the scene are built once per data or
   option change. A frame advances channels and tweens numbers (d3-interpolate, S2 easing tokens),
   then paints. No dataflow re-runs.
2. **Keyed scene diff:** a new scene is diffed by `key` against the previous one. Entering
   primitives get enter tweens, updated ones tween from their current interpolated values (so a
   mid-flight change continues smoothly), and exiting ones get exit tweens. Through the host's
   `updateProgram` route, option changes animate this way too instead of rebuilding the view.
3. **One page-wide ticker,** shared with the Vega engine once `animationTicker.ts` is generic: IntersectionObserver pausing,
   round-robin scheduling, sleeping when idle, `prefers-reduced-motion` turning tweens into fades
   or snaps.
4. **Canvas:**
   - Layered canvases: a static layer (grid, axes, plot background), a marks layer, and an overlay
     layer (hover rings, focus rings, crosshair). Hover usually repaints the marks layer only;
     focus repaints only the overlay.
   - Cached `Path2D` objects per primitive, devicePixelRatio scaling, dirty-rect repaint where it
     helps.
5. **SVG:** keyed element reconciliation, so each element is created once and attributes are set
   only when they change. Style-only channels (opacity) go through attributes, never through
   rebuilding elements.
6. **Hit testing** is renderer-independent: a `d3-quadtree` or `d3-delaunay` index over primitive
   bounds, rebuilt only when geometry changes. Canvas and SVG hover behave the same, and voronoi
   hover for lines comes free.
7. **Large data (deferred):** columnar or typed-array input, LTTB downsampling for lines, and a
   renderer in an OffscreenCanvas worker. The scene contract allows all of these without changing
   chart definitions.

Budgets, enforced by a benchmark suite run in CI (exact numbers are set after the Line prototype
is measured against the Vega engine):

| Scenario | Metric |
|---|---|
| Initial render, Line 10 series × 1k points | ms to first paint, Canvas and SVG |
| Hover emphasis tween, same chart | p95 frame time, main-thread ms/frame |
| Draw-in, Bar 500 bars | p95 frame time |
| Data update (streaming append) | ms per update, no view recreation |
| Bundle | min+gzip of `chart-d3` + React layer vs. `vega` + `vega-embed` today |

### Canvas and SVG parity

- Both renderers consume the same scene, so a scene snapshot is the main unit-test artifact (it
  replaces asserting Vega spec JSON). Renderer tests check primitive-to-output mapping once per
  primitive type, not per chart.
- Playwright screenshot tests (existing `browser/` setup) render each dashboard variation in both
  renderers and compare against baselines, plus a cross-renderer diff with a small tolerance.
- The renderer is a `<Chart renderer="canvas" | "svg">` choice, as today. SVG is the default;
  canvas is opt-in for dense or heavily animated charts.

### Data Navigator in both renderers

- The navigation structure comes from the scene plus the definition's `navigation` preset
  (`dimensionThenSeries`, `seriesThenPoint`, `slices`, ...): node ids are primitive `key`s,
  bounds are primitive bounds, and labels come from `datum` and axis/legend titles.
  `buildChartStructure`, `buildBarStructure` and `buildAxisStructure` collapse into one
  scene-driven builder plus presets.
- Keyboard focus writes to the same state table as hover, so focus and hover look the same by
  construction. `barHoverParity.ts` and the hover-guard listeners in `dataNavigatorAdapter.ts`
  go away.
- Focus rings are overlay primitives drawn by whichever renderer is active. The focusable,
  screen-reader-facing DOM layer is positioned from scene bounds, so it's identical over canvas
  and SVG. Data Navigator's existing `dataNavigatorIntl` strings are reused.

### React layer

- **Engine dispatch:** `Chart.tsx` reads `engine` (default `'vega'`). For `'d3'` it renders a
  `D3Chart` sibling of `VegaChart`. Both are thin wrappers that create a view host and pass it
  inputs; they differ only in the `ViewAdapter` they give it (see "View host and `d3ViewAdapter`").
  The Vega path is untouched.
- **Same components, both engines:** during lab, `<Line>`, `<Bar>`, `<Axis>` and the rest stay as
  they are, and the D3 engine reads the same props through one generic children walk keyed on
  `displayName`. No per-mark adapter files on the D3 side. A type test checks that each D3 option
  schema accepts the existing `*Options` type, so the engines can't drift apart silently.
- **Generated components later:** `createChartComponent(definition)` generating components, prop
  types and defaults from the schema is part of the default-engine decision, since the Vega
  engine still needs today's hand-written types. Until then a D3-only prop also adds a line to the
  shared `*Options` type.
- React Spectrum UI (tooltips, popovers, action bars, ChartInspect) subscribes to framework-neutral
  runtime events (`hover`, `select`, `focus`, `contextmenu`, each with datum and bounds), as #934
  proposes. On the D3 path this replaces `useNewChartView`, `usePopovers` and
  `useChartInteractions`' Vega listeners with event subscriptions.

### View host and `d3ViewAdapter`

The D3 engine follows the existing pattern: `viewHost/` routes updates and owns the view
lifecycle, and each rendering library plugs in through `ViewAdapter` (`viewHost/viewAdapter.ts`).
A new `d3ViewAdapter.ts` sits beside `vegaViewAdapter.ts`:

| `ViewAdapter` member | `vegaViewAdapter` | `d3ViewAdapter` |
|---|---|---|
| `TSpec` / `TView` | Vega `Spec` / `View` | resolved `chart-d3` options / `ChartInstance` |
| `prepareSpec` | copies the spec with table rows and signal values | copies options with data rows and state values |
| `splitSpec` → `program` | spec JSON without table and signal values | options JSON without data and state |
| `splitSpec` → `signalValues` | Vega signal values | state values (`highlightedSeries`, `hiddenSeries`, `highlightedItem`) |
| `isSameEnvironment` | config, locale, padding, renderer, tooltip | locale, padding, renderer |
| `createView` | parse, `new View`, embed | `createChart(container, options)` |
| `updateView` | `view.signal`, `view.change`, resize, one run | `setState`, `setData`, `resize` on the instance |
| `updateProgram` (new, optional) | not implemented | `chart.update(options)`; returns `false` if it can't apply |
| `destroyView` | `view.finalize()` | `chart.destroy()` |
| `animation` | draw-in prep, hold and ticker attach | omitted at first; the D3 runtime animates through its scene diff |

The host's routing (rebuild, incremental, no-op, none), cancellation of superseded views and
deferred updates are reused unchanged. Inside `chart-d3`, `update(options)` and `setState`/
`setData`/`resize` re-run only the stages that changed (state, scene, layout or data).

Three changes to `viewHost/`, all behavior-preserving for Vega:

1. **Generic host:** `ViewHost`, `ViewHostInputs` and `createViewHost` take `TSpec`, `TView` and
   `TEnvironment` type parameters like `ViewAdapter` already does, instead of Vega's `Spec`,
   `View` and `VegaEnvironment`. `onNewView` receives `TView`.
2. **Generic ticker:** `animationTicker.ts` is keyed on a small `Tickable` interface (a tick
   method that returns whether it's still animating) instead of Vega `View` and `runAsync`. Vega
   views get a wrapper. Both engines share one page-wide frame loop with the same visibility
   pausing and round-robin scheduling.
3. **Optional `updateProgram`:** when the program changes and the adapter implements
   `updateProgram`, the host calls it before falling back to a rebuild. If it returns `true` the
   route is `incremental` and `onNewView` isn't called. This lets the D3 engine animate option
   changes (switching `type`, adding a series) through its keyed scene diff. `vegaViewAdapter`
   doesn't implement it, so Vega routing is unchanged.

`viewHost/` stays in `react-spectrum-charts-s2`. ESLint already keeps `viewAdapter.ts` free of
React and Vega. `d3ViewAdapter.ts` may import `chart-d3` but not Vega.

### Files touched, target

| Change | Today (typical) | Target |
|---|---|---|
| Plain prop on an existing mark | ~10 | 3–4: definition, its test, a dashboard variation or story, changeset |
| Prop that needs hover, highlight or animation | 15–35 | same 3–4; traits are automatic |
| New child component | 12–20 | 4–5: definition, test, parent `children` entry, story, changeset |
| New chart type | 40+ | 5–7: definition folder (source + test), registration export, story, dashboard, changeset |
| Data Navigator for a new chart | ~40 (#913) | 0–1: pick or write a `navigation` preset |

Docs props tables, dashboard coverage keys, React prop types and the A2UI schema are generated, so
they don't count as touched files. CI fails if the generated output is stale. While both engines
share hand-written React components (lab), a new prop also adds one line to the shared `*Options`
type, so the targets above are +1.

### What `chart-d3` contains (PROPOSED)

`@spectrum-charts/chart-d3` is an ESM, framework-neutral package. It depends only on
`@spectrum-charts/core-s2` (tokens, constants, locales) and individual `d3-*` modules. It never
imports React or Vega; ESLint enforces this, as it does for `viewHost/` today.

```
packages/chart-d3/src/
  define/       defineChart, defineMark, defineChild; option-schema helpers (color facet, metric, ...)
  runtime/      createChart(container, options) → ChartInstance; stage routing inside a view
                (state, scene, layout, data); state table; channels; animator (frames come from
                the shared ticker in react-spectrum-charts-s2); event emitter
  scene/        primitive types (rect, path, arc, symbol, line, text, group), bounds, keyed diff,
                scene snapshot serializer for tests
  render/svg/   keyed SVG reconciliation, export to SVG string
  render/canvas/ layered canvases, DPR, Path2D cache, export to PNG
  hit/          quadtree / Delaunay hit index, pointer → item resolution
  layout/       plot rect, axes (ticks, label overlap), gridlines, legend (wrap, symbols), title,
                label collision, trellis faceting, text measurement
  blocks/       stacking, series facets, scale presets (band, linear, time, ordinal color),
                per-chart locale number/time formatting, sorting, empty and loading states
  navigation/   scene → Data Navigator structure, presets (dimensionThenSeries, seriesThenPoint,
                slices), focus DOM layer, intl strings
  traits/       hover emphasis, highlight, selection, hidden series, draw-in strategies,
                tooltip and popover anchoring, reduced motion
  charts/       one folder per chart or child definition: line, bar, donut, axis, legend,
                directLabel, referenceLine, trendline, ...
  index.ts      public API: createChart, define*, types; no chart internals
```

| Area | Vega-engine counterpart |
|---|---|
| `define/` + `charts/` | `vega-spec-builder-s2` (mark builders, types, test utils), render-null components, `rscToSbAdapter/` |
| `runtime/` | `vegaViewAdapter.ts`, Vega's dataflow, parts of `useNewChartView`, `useChartInteractions` (the host and ticker are shared) |
| `scene/`, `render/`, `hit/` | Vega's parser, dataflow, scenegraph and renderers, `vega-embed`, `vega-tooltip` |
| `layout/` | Vega axes, legends, title and autosize, `textUtils.ts` |
| `traits/` | per-mark hover-animation, draw-in and highlight code in each spec builder |
| `navigation/` | `dataNavigator/` structure builders, `barHoverParity.ts`, hover guards |

What stays in `react-spectrum-charts-s2`: `<Chart>`, `createChartComponent`, the generic children
walk, the React Spectrum UI (tooltip and popover content, action bar, ChartInspect, empty and
loading states) and the hooks that subscribe to runtime events. During lab this lives in
`src/lab/d3/`.

### Consumer access to the chart (D3 counterpart of `onVegaViewReady`)

D3-based libraries split two ways. Declarative React libraries (Recharts, Nivo, visx) expose only
a DOM ref. Imperative ones (ECharts' `echarts.init` instance, Highcharts' chart object) expose an
instance with methods. Observable Plot is in between: `Plot.plot()` returns the SVG element with
`plot.scale(name)` for reading a scale after render. The common pattern for a React wrapper is an
`onReady` callback or ref that gives a typed instance.

Proposal: `onChartReady(chart: ChartInstance)`, plus the same object on the existing `ref`
(`ChartHandle` already exposes `copy`, `download`, `getBase64Png` and `getSvg`, all of which
carry over).

```ts
interface ChartInstance {
  element: HTMLElement;                       // container; svg or canvas root inside it
  scale(name: string): ScaleCopy | undefined; // a copy of the d3 scale, like Plot's plot.scale()
  plotBounds(): Bounds;                       // plot rect in container coordinates
  itemAt(x: number, y: number): ChartItem | undefined; // hit index: datum, series, bounds
  items(filter?: Partial<ChartItem>): ChartItem[];    // datum + bounds for overlays and tests
  on(event: 'hover' | 'select' | 'focus' | 'contextmenu' | 'render', fn): () => void;
  setState(state: { highlightedSeries?; highlightedItem?; hiddenSeries? }): void;
  toSVG(): Promise<string>;
  toImageURL(type: 'png'): Promise<string>;
}
```

`scale()` and `plotBounds()` cover the overlay use case (the `D3Overlays` prototype positions
brush and zoom overlays from Vega scales today). `items()` and `on()` replace reading
`view.data()` and adding signal listeners. Nothing in the instance exposes the scene's internal
structure, so the scene can change without breaking consumers.

### Phasing

1. **Foundations (lab):** scene types and keyed diff, Canvas and SVG renderers, hit index, ticker
   and channels, state table, layout (axes, legend, title), option-schema codegen, generic React
   binding, benchmark harness.
2. **Line (lab):** draw-in, hover emphasis, controlled highlight, legend interaction, tooltip,
   popover, direct labels, Data Navigator, both renderers. Measure against the Vega Line and set
   the budgets.
3. **Bar and Donut (lab):** stacked, dodged, trellis; slices, labels with collision; both
   navigation presets.
4. **Parity:** side-by-side dashboards (Vega engine vs. D3 engine) and a parity matrix per
   component, with benchmark results.
5. **Default decision (follow-up RFC):** per component, decide from the parity matrix and budgets
   whether `engine` defaults to `'d3'`. Removing Vega from S2 would be its own RFC, only if every
   S2 component has switched.

## Scope

All rows are proposed and local only. No issues exist.

| Issue | Description | Stage |
|---|---|---|
| new | `chart-d3` package scaffold, ESLint boundaries, build and exports | lab |
| new | Scene primitive types, bounds, keyed diff | lab |
| new | Canvas 2D renderer: layers, DPR, `Path2D` cache | lab |
| new | SVG renderer: keyed reconciliation | lab |
| new | Hit index (quadtree/Delaunay) and pointer event model | lab |
| new | Runtime: stage routing, state table, channels, animator, reduced motion | lab |
| new | Generic `ViewHost` and `Tickable` ticker; optional `ViewAdapter.updateProgram` | lab |
| new | `d3ViewAdapter` and `D3Chart` | lab |
| new | Layout: plot rect, axes (ticks, labels, overlap), gridlines, legend, title | lab |
| new | Building blocks: stacking, series facets, scale presets, per-chart locale formatting | lab |
| new | Option schema codegen: types, defaults, React props, docs tables, dashboard coverage, A2UI | lab |
| new | React binding: `createChartComponent`, generic children walk, runtime events → tooltip, popover, action bar | lab |
| new | Scene-driven Data Navigator and navigation presets | lab |
| new | Benchmark suite and CI budgets | lab |
| new | Line on the D3 engine | lab |
| new | Bar on the D3 engine | lab |
| new | Donut on the D3 engine | lab |
| new | Vega/D3 parity dashboards and per-component parity matrix | lab |
| new | `<Chart engine>` prop and engine dispatch in `Chart.tsx` | lab |
| new | Per-component default-engine decision (follow-up RFC) | deferred |
| new | Columnar input, LTTB downsampling | deferred |
| new | OffscreenCanvas worker renderer | deferred |
| new | Server-side SVG rendering of a scene (relates to #936) | deferred |

## Cross-Cutting Concerns

- **Hover animation:** becomes a runtime trait on the `emphasis` channel. Same 0..1 model as
  today, but tweened in the animator instead of in spec dataflow. Marks opt in with `series` or
  `key`.
- **Controlled highlight:** the same state table as pointer hover. Prop changes are state updates,
  never scene rebuilds.
- **Legend interaction:** the legend is a scene block whose entries carry `series`. Hover and
  toggle write to the state table. Hidden series change data, so they go through the keyed diff
  and animate out and in.
- **Tooltip or popover:** driven by primitive `datum` through runtime events. `COMPONENT_NAME`
  routing becomes the primitive's owning definition name.
- **New signal or scale:** there are no signals. Scales are plain d3 scales in `ctx`.
- **S1/S2 parity:** S2 only. S1 stays on Vega.

## Documentation

- `architecture/` gets a new `d3-engine.md` (layers, scene, traits, how to add a chart) and the
  skills (`adding-props`, `adding-chart-marks`, `adding-child-components`) get D3-engine
  variants, each much shorter than today's.
- Docs props tables are generated from schemas.
- Lab docs explain `engine="d3"`, the supported props per component (from the parity matrix) and `onChartReady`.

## Drawbacks

- **Parallel cost:** for each component the D3 engine supports, there are two implementations to
  keep in parity until a default-engine decision is made. Features land in one engine first and
  the parity matrix shows the gap.
- **Scale of the port:** the S2 Vega spec builder is about 24.5k lines. The D3 engine aims to be
  much smaller, but it still has to cover the same features per component.
- **Owning what Vega gave for free:** tick generation and label overlap, legend layout and
  wrapping, time-scale edge cases (timezones, daylight saving), text measurement, and SVG
  accessibility attributes. Each needs tests.
- **Losing the Vega spec as an artifact:** Vega specs are inspectable in the Vega editor and are
  what tests assert on today. The scene snapshot and a debug inspector replace them, but they're
  new tools.
- **Generated code has its own cost:** schema codegen is a build step contributors must
  understand, and errors in it affect every component.
- **AI tooling:** the MCP server and A2UI catalog describe options, not specs, so they mostly
  carry over. Any tooling that emits raw Vega specs doesn't.

## Backwards Compatibility Analysis

- Nothing changes for existing consumers. `engine` defaults to `'vega'`, and the Vega path,
  `onVegaViewReady` and `ChartHandle` behave as today.
- With `engine="d3"`, `onVegaViewReady` isn't called; `onChartReady(ChartInstance)` is. The
  `ChartHandle` methods (`copy`, `download`, `getBase64Png`, `getSvg`) work on both engines.
- Props the D3 engine doesn't support yet are reported as a development warning, listed in the
  parity matrix and in the lab docs.
- Visual output may differ from the Vega engine by sub-pixel amounts (text layout,
  antialiasing). D3-engine stories get their own screenshot baselines.
- S1 is unaffected.

## Alternatives

- **Keep Vega and optimize** (#1022 stability, #935 remove vega-embed, #963 unified state). Fixes
  rebuilds and bundle overhead, but frames still re-run the dataflow, and features still spread
  across signals and encodings in every mark. These RFCs are worth doing anyway; their concepts
  (update routing, state table, framework-neutral layer) move directly into this engine.
- **D3 renderer for the existing Vega specs** (approach B). Keeps the 24.5k-line builder, so it
  keeps the file spread and inherits Vega semantics (signals and expressions) that would have to
  be re-implemented. Rejected.
- **Adopt an existing library:**
  - Observable Plot: D3-based and declarative, but SVG only, with no animation model.
  - ECharts: canvas and SVG with animation, but a large bundle, its own option model and
    theming, and limited control over Spectrum interactions and the Data Navigator.
  - visx: React-only SVG, so it doesn't meet the canvas or framework-neutral goals.
  - uPlot: fast, but time-series only.
  None meet all four goals. Each would still need the Spectrum layer, Data Navigator and
  interactions on top.
- **WebGL renderer first:** fastest for very large data, but heavier to build, weak for text and
  accessibility, and unnecessary at typical sizes. The scene contract leaves room for it later.

## Decisions

- **Placement:** a new `@spectrum-charts/chart-d3` package, parallel to `vega-spec-builder-s2` and
  the Vega view host. Neither engine imports the other.
- **Engine switch:** `<Chart engine="d3">`. Default stays `'vega'`.
- **View host:** the D3 engine plugs into the existing `viewHost/` through a new `d3ViewAdapter`,
  with the host and ticker made generic and an optional `updateProgram` added to `ViewAdapter`.
- **Default renderer:** SVG. Canvas is opt-in with `renderer="canvas"` for dense or heavily
  animated charts. Budgets are measured for both.
- **Consumer access:** `onChartReady(ChartInstance)` and the existing `ref` (see above).
- **Option schemas:** written in zod. A build step generates the TypeScript types, a plain
  defaults object and docs. The shipped runtime applies defaults from the generated object and
  validates with zod only in development builds and in `@spectrum-charts/schemas` (A2UI), so zod
  stays out of production bundles.
- **Text measurement:** same approach as Vega and S2 today. Vega's `textMetrics` uses canvas
  `measureText` with an LRU cache (browser, or `node-canvas` if installed) and otherwise falls back
  to an estimate of `0.8 × fontSize × characters`. S2's `getLabelWidth` already measures with a
  canvas context and skips caching while `document.fonts` is loading. `chart-d3`'s
  `layout/textMeasure` does the same: measure with a cached canvas context, estimate when there's
  no canvas (SSR, jsdom tests), and re-run layout once when `document.fonts.ready` resolves.
- **Line lab scope:** full parity with the Vega engine's S2 Line, including its child components,
  before Line's lab release on the D3 engine.
- **Animation parity:** draw-in, hover, highlight and data-change animations must match the Vega
  engine exactly (timing, easing, hold, first-paint fade, reduced motion). The mechanism is
  different: the D3 runtime tweens scene primitives and channels instead of Vega signals and
  dataflow. Parity is verified by sampling both engines at the same timestamps.
- **Existing Vega-engine RFCs** (#934, #935, #963, #1022) are out of scope for this RFC.
- **Shared contract, independent engines:** the engines share only the public option types and
  the parity tests. The option types (`ChartOptions`, `LineOptions`, `LegendOptions` and the rest)
  move from `vega-spec-builder-s2` to `@spectrum-charts/core-s2/options`, with no Vega types in
  them. `vega-spec-builder-s2` re-exports them, so existing imports keep working. Vega-only fields
  (`UNSAFE_vegaSpec`, Vega `Data` inputs) live in a `VegaChartOptions` extension, and `*SpecOptions`
  stay in the Vega builder. `chart-d3` consumes `ChartOptions` directly, with no mirrored `D3*`
  types or casts. Behavior isn't shared: each engine implements it idiomatically, because porting
  Vega helpers (which take Vega scales and signals) would bend the D3 engine to Vega's structure.
  When the zod option schemas (above) land, they generate `core-s2/options` at the same path.
- **One emphasis model in `chart-d3`:** a single module resolves each series' or group's emphasis
  from pointer hover, legend hover, controlled highlight and selection, with a fixed priority.
  Marks, legends and the Data Navigator read it; none re-implement the rules.
- **Parity is type-enforced:** each D3 chart type has a parity coverage map typed
  `ParityCoverage<Options>` (the dashboard pattern, in `d3Parity/parityCoverage.ts`). `tsc` fails
  until every option names a parity case, a `skip` reason (engine-independent or ignored by Vega),
  or a `gap` reason. A test checks every case name exists, and the `gap` entries are the parity
  backlog.
- **Parity means user-visible parity, not scene identity:** parity tests compare what users see
  and do: the same visible elements, colors, text, interaction states, and animation timing and
  easing, with positions within a small tolerance (`POSITION_TOLERANCE`, 2px). They don't compare
  Vega mark names, z-order of invisible marks, or bounds bookkeeping. Vega behavior that D3
  deliberately doesn't reproduce is listed in `d3Parity/divergences.ts`, each entry with a reason
  and a test pinning both engines' behavior (for example, Vega leaves an axis annotation
  highlighted after a press is released off its icon, and fails to render trendline inspects with a
  non-highlight legend). An unlisted difference fails the tests.
- **Engine structure: one state table, components, runtime traits:**
  - Interaction state is one table keyed by item key (`hovered`, `pressed`, `selected`,
    `focused`), plus chart-level values from props. Features don't add state fields.
  - Hit targets carry semantics (`datum`, `series`, `role`, `cursor`) and declare which
    interactions they respond to. Pointer routing in the runtime is generic and has no
    feature-specific branches.
  - Marks, child components, axes, legends, annotations, thumbnails, reference lines and the title
    are all components that declare `layout` (space they reserve), `scene` and `targets`. The
    runtime walks the tree, so adding a feature doesn't edit the runtime or layout code. A parent
    lists the child components it accepts.
  - Emphasis and draw-in are runtime traits applied from node metadata. Scenes are rebuilt only
    when data, options or state change; animation frames tween channels and paint.
- **Vega lifecycle:** Vega stays the default and the parity oracle. When a chart type reaches
  parity and meets its budgets, `engine` defaults to `'d3'` for it, and its Vega path becomes
  maintenance-only (bug fixes). New features then land in D3 only; using them with
  `engine="vega"` logs a development warning. Vega is removed after a deprecation window, and the
  parity tests become D3 scene snapshots.

## Open Questions

None at this time.

## Frequently Asked Questions

**Why not drop D3 too?** D3's scale, shape, interpolate, format and Delaunay modules are small,
tree-shakeable, pure functions with years of edge-case fixes. Rewriting them saves almost no
bytes and adds risk.

**Is canvas accessible?** Canvas itself isn't, but the Data Navigator's DOM layer, positioned
from scene bounds, provides keyboard and screen-reader access for both renderers.

**What about trellis and combo charts?** A trellis is a layout block that repeats a definition's
scene per facet with shared scales. A combo chart is several definitions sharing one `ctx`. Both
are runtime features, not per-chart code.

## Related Discussions

- #934 S2 layered architecture
- #935 Replace vega-embed with RSC-owned embedding
- #936 Server-side spec generation
- #963 Unified highlight and selection state
- #1022 S2 chart stability across prop changes (`rfcs/s2-chart-stability.md`)
- `planning/research/hover-animation-system`, `planning/research/draw-in-animation`
- `D3Overlays.story.tsx` prototype on the `prototypes-on-main` branch
