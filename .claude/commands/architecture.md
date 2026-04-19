# react-spectrum-charts: System Architecture

Read this before implementing any feature or fixing any bug. It covers how the library actually works — not just the public API, but the internal pipeline that connects React props to a rendered Vega chart.

---

## The Full Pipeline

```
<Chart>
  <Line metric="value" dimension="datetime">
    <ChartTooltip />
  </Line>
</Chart>

1. childrenAdapter.ts: rscPropsToSpecBuilderOptions()
   → walks the React tree, dispatches each element by displayName
   → builds ChartOptions: { marks: [{ markType: 'line', metric: 'value', ... }] }

2. buildSpec(chartOptions) in chartSpecBuilder.ts
   → for each mark, calls addLine(acc, { ...mark, ...specOptions, index: lineCount })
   → addLine mutates the Vega spec draft via immer's produce

3. vega-embed renders the spec in VegaChart.tsx
```

Key entry points:
- `buildSpec` — `vega-spec-builder/src/chartSpecBuilder.ts`
- `rscPropsToSpecBuilderOptions` — `react-spectrum-charts/src/rscToSbAdapter/childrenAdapter.ts`
- `Chart.tsx` — `react-spectrum-charts/src/Chart.tsx`

---

## The Three-Type Pattern

Every mark has three related types across two packages:

**`<Mark>Options`** (`vega-spec-builder/src/types/marks/<mark>Spec.types.ts`)
All fields optional. This is the public contract — what callers of `buildSpec` pass. Includes the `markType` discriminant and child collection arrays (`chartTooltips?: ChartTooltipOptions[]`).

**`<Mark>SpecOptions`** (same file)
Internal working type used only inside the spec builder. Extends `PartiallyRequired<MarkOptions, MarkOptionsWithDefaults>`, which makes all defaulted fields required. Also carries internal fields injected by `chartSpecBuilder.ts`:
- `colorScheme` — active color scheme
- `highlightedItem` — current highlighted item from chart state
- `idKey` — the field name used for row identity
- `s2` — whether the chart is rendering in S2 mode

These four arrive via the `specOptions` spread in `chartSpecBuilder.ts`:
```ts
const specOptions = { colorScheme, idKey, highlightedItem, s2 };
// ...
return addLine(acc, { ...mark, ...specOptions, index: lineCount });
```

**`<Mark>Props`** (`react-spectrum-charts/src/types/marks/<mark>.types.ts`)
React component props. Extends `<Mark>Options` via `Omit` — replaces child-type fields with `children?: ReactElement`, and callback fields with typed function props (`onClick?`, `onMouseOver?`).

**`<Mark>OptionsWithDefaults`** — string literal union of every field that has a runtime default applied in the spec builder. Adding a key here makes that field required (non-nullable) in `<Mark>SpecOptions`.

---

## The Four Spec Builder Functions

Every mark's spec builder exports four independently-testable functions that `add<Mark>` calls in order:

**`add<Mark>(spec, options)`** — the orchestrator. Applies defaults, assembles `<Mark>SpecOptions`, calls the other three.

**`addData(data, options)`** — produces all Vega data sources needed by this mark. Time transforms, tooltip data sources, selection data sources, and trendline data go here.

**`addSignals(signals, options)`** — produces Vega signals for hover and interaction. Returns early if `!isInteractive(options)`.

**`setScales(scales, options)`** — extends the shared dimension and metric scales, adds fields to facet scales (color, lineType, opacity).

All four use `produce` from immer — the first argument is a draft array that the function mutates directly.

---

## VegaChart Rendering: Two Separate Effects

`VegaChart.tsx` has two effects that must never be merged:

**Embed effect** (deps: spec, data, config, signals — NOT width/height)
Calls `vega-embed`. Creates a new Vega `View`. Destroys the old one. Expensive. Any flicker or unnecessary full re-render traces to something that should be in the resize effect accidentally appearing in this dep array.

**Resize effect** (deps: width, height only)
Calls `view.width(w).height(h).resize().runAsync()`. No teardown. Cheap.

The spec must never depend on `chartWidth`/`chartHeight`. The only exception is Venn, which bakes circle positions into the spec itself.

**`hasMounted` / `needsInitEmbed` pattern**: handles the case where dimensions start at 0. The chart waits for a non-zero size before running the embed effect for the first time.

---

## Signal Architecture

Signals are named reactive variables in the Vega spec (`spec.signals[]`).

- Names are always prefixed with the component name: `legend0_hoveredItem`, `scatter0_hoveredItem`
- Before calling `view.signal(name, value)`, check `specSignalNames.has(name)` — writing to an absent signal throws a runtime error; the set of signals varies based on which marks and features are active
- Every signal write must have a symmetric clear: set in `mouseenter` → clear in `mouseleave`; set `selectedData` on click → clear on popover close

Signal names in `packages/constants/constants.ts`: `HOVERED_ITEM`, `HOVERED_SERIES`, `SELECTED_ITEM`, `BACKGROUND_COLOR`.

---

## Data Sources

Two base sources are always present:
- `TABLE` (`'table'`) — raw user data, stamped with a unique `MARK_ID` per row by identifier transform
- `FILTERED_TABLE` (`'filteredTable'`) — derived source that hides series via the `hiddenSeries` signal

Per-mark sources follow `${markName}_sourceType`:
- `${name}_filteredTableForTooltip` — `FILTERED_TABLE` with NaN/null rows removed; feeds voronoi hover overlay
- `${name}_selectedData` — rows matching `SELECTED_ITEM`; feeds selection rings (added when mark has popover children)
- `${name}_highlightedData` — rows sharing the hovered group; feeds group-highlight behavior

---

## Scale System

Scales are shared across all marks. `chartSpecBuilder.ts` pre-initializes them before the marks loop. Each mark's `setScales()` **extends** (never replaces) existing scales by adding domain fields. After all marks run, `removeUnusedScales()` strips scales with empty domains.

Facet scale name constants: `COLOR_SCALE = 'color'`, `LINE_TYPE_SCALE = 'lineType'`, `OPACITY_SCALE = 'opacity'`.

Use `addContinuousDimensionScale` and `addMetricScale` helpers. `addFieldToFacetScaleDomain` only adds domain entries for field references (strings), not static values (`{ value: ... }`). A mark that always uses a static color will not add a color scale domain entry — `removeUnusedScales` will remove the scale, which is correct.

---

## Interactive Mark System

A mark is interactive when it has tooltip or popover children. `isInteractive(options)` returns true.

When interactive:
- `addData` adds `${name}_filteredTableForTooltip` and (for popovers) `${name}_selectedData`
- `addSignals` adds a `${name}_hoveredItem` signal via `addHoveredItemSignal`
- `addMarks` adds a voronoi overlay for hover detection
- `spec.usermeta.interactiveMarks` is updated via `addUserMetaInteractiveMark`

`interactiveMarkName` on `SpecOptions` is the Vega mark name that Vega event listeners attach to. Compute via `getInteractiveMarkName({ chartPopovers, chartTooltips }, markName)`. For marks with a voronoi overlay, this should reference the voronoi mark name, not the data mark — so events fire on the overlay.

---

## COMPONENT_NAME Invariant

When a mark is clicked, `{ [COMPONENT_NAME]: markName, ...datum }` is injected into `selectedData.current`. `ChartDialog` checks `datum[COMPONENT_NAME] === name` before rendering its content. This is how multiple marks with popovers coexist on one chart — only the dialog whose name matches the clicked mark renders.

Any popover showing blank content, wrong content, or firing for the wrong mark is a `COMPONENT_NAME` mismatch. Look in `markClickUtils.ts` and `getTooltip()` in the mark utils.

---

## Child Component Dispatch Pipeline

```
<Line>
  <MetricRange metric="range" />
</Line>

↓ childrenAdapter.ts: childrenToOptions(children)
  case MetricRange.displayName:
    metricRanges.push(child.props as MetricRangeProps)

↓ lineAdapter.ts: getLineOptions({ children })
  const { metricRanges } = childrenToOptions(children)
  return { ...lineProps, metricRanges, markType: 'line' }

↓ lineSpecBuilder.ts: addLine(spec, { metricRanges: [...], ... })
```

### Sanitize Gate

Before `childrenToOptions` sees any element, the component's `displayName` must be registered in the correct sanitize function in `utils.ts`. All 6 functions are independent — there is no master list:
- `sanitizeRscChartChildren` — direct children of `<Chart>`
- `sanitizeMarkChildren` — inside any mark
- `sanitizeAxisChildren` — inside `<Axis>`
- `sanitizeAxisAnnotationChildren` — inside `<AxisAnnotation>`
- `sanitizeTrendlineChildren` — inside `<Trendline>`
- `sanitizeBigNumberChildren` — inside `<BigNumber>`

A component not registered is silently dropped with no error.

### Three Dispatch Patterns

**Pattern A — Direct cast**: props map 1-to-1, no transformation needed.
```ts
case MetricRange.displayName:
  metricRanges.push(child.props as MetricRangeProps);
  break;
```

**Pattern B — Adapter call**: component has a render-function `children` prop or callbacks that must be stripped.
```ts
case ChartTooltip.displayName:
  chartTooltips.push(getChartTooltipOptions(child.props as ChartTooltipProps));
  break;
```

**Pattern C — Recursive**: component has its own children that need parsing.
```ts
case Axis.displayName:
  axes.push(getAxisOptions(child.props as AxisProps)); // calls childrenToOptions internally
  break;
```

---

## Encoding Conventions

- **Background-tracking colors**: use `{ signal: BACKGROUND_COLOR }`, not a hardcoded value. A static value is baked into the spec and won't react to runtime `backgroundColor` prop changes.
- **Opacity**: use `getMarkOpacity()`, not a hardcoded value.
- **Decorative/overlay marks**: must have `interactive: false` — without it they intercept mouse events meant for data marks beneath them.
- **Hiding text marks**: use `fontSize: 0`, not `fillOpacity: 0`. Opacity still runs layout calculations (like `limit` constraints), which can produce NaN.
- **Vega encode assertions in tests**: use `toHaveProperty('key', value)`, never direct property access — Vega uses `ProductionRule<T>` union types that TypeScript rejects.

---

## Callback Props and Boolean Flags

Callback props (`onClick`, `onMouseOver`, `onMouseOut`, `onContextMenu`) never enter the Vega spec. The adapter converts them to boolean flags that gate voronoi/hover mark creation. The mapping is mark-specific:

For Line:
- `hasOnClick: Boolean(onClick)` — gates click behavior
- `hasMouseInteraction: Boolean(onMouseOut || onMouseOver)` — gates hover behavior

Always read the existing adapter for the mark before writing new flag logic — do not assume one flag covers all callbacks.

---

## Alpha vs Stable Components

When a mark is not ready for the public API, place it in `alpha/`:
- Component: `react-spectrum-charts/src/alpha/components/<Name>/`
- Import in `childrenAdapter.ts` from `'../alpha/components/<Name>'`
- Spec builder, types, and `chartSpecBuilder.ts` registration are identical to stable

To graduate from alpha to stable: move the component to `components/`, update the import in `childrenAdapter.ts`. No spec builder changes needed.

---

## S2 Parity

`vega-spec-builder-s2` mirrors `vega-spec-builder` structurally. When changing an s1 file, always check the corresponding s2 file. S2 differences:
- Uses `getS2ColorValue` instead of `getColorValue`
- No Venn support
- No `s2` boolean prop (always S2 context)
- Some marks have intentional behavioral differences (e.g. `staticPoint` in S2 only supports `true`, not `'hollow'`/`'solid'`)

When a bug fix applies to both, fix both. Don't port s1-specific behavior blindly — verify the bug exists in s2 before applying the fix.

---

## File Creation Conventions

**Copyright header** — Every new `.ts` or `.tsx` source file must start with the Apache 2.0 copyright block. ESLint enforces this as an error; the build will fail without it. Excluded: `.story.tsx` files, test-utils, docs files.

```ts
/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
```

**No `import React`** — The project uses the JSX runtime transform (`plugin:react/jsx-runtime`). Do not add `import React from 'react'` to `.tsx` files; it is not needed and ESLint will flag it as an unused import.

**No duplicate imports** — ESLint enforces `no-duplicate-imports: 'error'`. If you need multiple named imports from the same module, combine them into a single import statement.

**`ScSpec` not `Spec`** — All spec builder `produce<>` calls must use `ScSpec` (the project's extension of Vega's `Spec`) as the return type. `ScSpec` carries project-specific `usermeta` constraints that Vega's bare `Spec` does not express. Pattern: `produce<ScSpec, [MarkOptions]>((spec, options) => { ... })`.

**Type literals over bare strings** — When defining prop types that take a fixed set of values, use a string literal union (`'last' | 'first' | 'average'`). Do not add `| string` to widen the union — restrict to known valid values only.

---

## `safeClone`

`buildSpec` returns a deep clone of the spec via `safeClone`, a private function in `chartSpecBuilder.ts`. `VegaChart.tsx` makes another copy before passing to `vega-embed`. Both the caller and `vega-embed` mutate the spec they receive — cloning prevents cross-contamination with the memoized canonical spec in `useSpec.tsx`. If you're seeing stale spec state, check whether something mutates the memoized spec directly rather than working on a clone.
