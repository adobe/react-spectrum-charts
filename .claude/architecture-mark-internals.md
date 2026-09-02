# Architecture: Mark Internals

Read this when: adding a new mark, modifying `addData`/`addSignals`/`setScales`/`add<Mark>Marks`
for an existing one, or diagnosing a data-source/scale/interaction-wiring bug. Assumes you've
already read `architecture-core.md`.

---

## The Four Spec Builder Functions

Every mark's spec builder exports four independently-testable functions that `add<Mark>` calls in order:

**`add<Mark>(spec, options)`** — the orchestrator. Applies defaults, assembles `<Mark>SpecOptions`, calls the other three.

**`addData(data, options)`** — produces all Vega data sources needed by this mark. Time transforms, tooltip data sources, selection data sources, and trendline data go here.

**`addSignals(signals, options)`** — produces Vega signals for hover and interaction. Returns early if `!isInteractive(options)`.

**`setScales(scales, options)`** — extends the shared dimension and metric scales, adds fields to facet scales (color, lineType, opacity).

All four use `produce` from immer — the first argument is a draft array that the function mutates directly.

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
