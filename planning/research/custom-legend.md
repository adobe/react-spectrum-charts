# Custom (marks-based) Legend

## Why

The keyboard-navigation focus ring for legend entries needs a **~20px gap on all sides** of the
focused entry, and it must **not reflow the chart** when focus moves. Vega's built-in legend cannot
do this, so we are replacing the categorical legend rendering with our own marks.

### Root cause (proven from Vega source)

`vega-view-transforms/src/layout/legend.js` → `legendEntryLayout` runs for every `Symbols` legend
and unconditionally sets each entry group's box to its content bounds:

```js
g.width  = widths[g.column];   // = max(g.bounds.x2 - g.x) → exact content width
g.height = g.bounds.y2 - g.y;  //                          → exact content height
```

- The group background rect can only draw at `g.width × g.height`, so it is pinned to content.
  `encode.entries.{width,height}` we set is overwritten (verified: `width:200` renders as `24`).
- Any lever that inflates the box also inflates the group's **bounds**, which reflows the legend
  (and the plot). A focus-only inflation reflows *on focus* — the shift we must avoid.

Therefore a padded, non-reflowing ring must be a mark **we** draw and position. That means owning
the legend rendering.

### What works today (keep as reference / reuse)

- Root ring (whole legend) + per-entry ring are wired via `encode.legend` / `encode.entries`
  (`legendFocusUtils.ts`, `legendUtils.getFocusEncodings`). The per-entry ring is content-tight
  (the limitation above). No label bold (bolding changes text width → reflow).
- `FOCUSED_REGION` / `FOCUSED_SERIES` signals are set by `dataNavigator/dataNavigatorAdapter.ts`.
- Data/measurement we can reuse: `${name}Aggregate` (entries data w/ index), `${name}Entries`
  ordinal scale, `getColumns` (column count from measured widths), `getLabelWidth` expression fn,
  `${name}_maxLabelWidth` data source, `getHiddenEntriesFilter`.

## The hard part: space reservation (Phase 1 spike)

The chart uses Vega's default `autosize: 'pad'` — `width`/`height` are the **plot** rectangle and
Vega auto-expands padding to fit guides (that's how the built-in legend reserves its space). A
custom marks legend is invisible to that mechanism, so the plot won't shrink for it.

**Phase 1 must answer:** how do we reserve the legend's vertical space (bottom orient) without the
built-in legend, and keep it responsive? Candidate approaches to spike:

1. Compute legend height (`ceil(entries / columns) * rowHeight`) and reduce the plot height / set
   the metric scale range to `[0, height - legendHeight]`, drawing the legend group below.
2. Keep an **invisible** built-in legend purely for space reservation and draw custom marks in the
   space it reserves (hybrid; avoids reimplementing layout math, but positioning onto the reserved
   band still needs the built-in legend's origin).
3. A dedicated bottom band via signals/padding.

### Phase 1 result: an *in-view* custom legend is blocked

I built and tested the "carve a band from the plot rect" approach (shrink the metric scale range to a
`plotHeight` signal, draw legend marks in the freed band). It renders, but it is **architecturally
wrong** and was reverted:

- **Axes bind to Vega's `height` signal, not the scale range.** A bottom axis renders at `y = height`
  regardless of the shrunk scale, so the legend band ended up *inside* the plot with the axis
  stranded below it. Shrinking the range moves the bars, not the axis.
- **Positioning the legend *below* the axis instead needs the axis's rendered height**, which Vega
  computes internally (its own legend layout uses the plot+axis bounds `yb.y2`, see
  `vega-view-transforms/src/layout/legend.js` → `legendParams`) and **does not expose to any mark in
  the spec**.

Conclusion: a fully-declarative custom legend *inside* the Vega view cannot be positioned to match
Vega, because Vega never hands marks the computed guide geometry (axis height, legend origin). Both
`autosize` and the layout transforms own that, opaquely.

### Viable paths (pick one)

- **A′ — separate legend element below the chart.** Render the legend as its own React/SVG element
  (or its own small Vega view) laid out below the chart by normal DOM layout. Full control of the
  padded ring; no in-view space/position problem. Cost: a new legend component + matching Vega's look
  by hand; focus (`FOCUSED_SERIES`) driven by the data-navigator adapter across both.
- **B — keep Vega's built-in legend, add only the ring.** Legend layout/spacing/position are
  Vega's, so they match by definition. Add the padded ring as an in-canvas Vega `rect` mark whose
  position comes from the focused entry's rendered scenegraph bounds (± pad), set by the adapter.
  Small; the only non-declarative part is measuring that one entry's box at focus time.

Both ultimately rely on something outside pure spec declarations for placement (A′ uses DOM layout;
B measures one box). The purely-declarative in-view approach is not achievable.

### Chosen + implemented: B (keep Vega's legend + overlay ring)

- `legendFocusRingMark.ts` — an in-canvas `rect` overlay mark (`legendFocusRing`) + four position
  signals (`legendFocusRingX1/Y1/X2/Y2`), added by `addLegend` only when the legend's color field
  matches an accessibly-navigable mark. Opacity keys on `isValid(focusedSeries)` + a measured box.
- `dataNavigatorAdapter.ts` → `setLegendFocusRing()` — on focusing a legend entry, walks the
  scenegraph for that entry's `legend-symbol`/`legend-label` items (matched by `datum.value ===
  focusedSeries`), unions their bounds, pads by `LEGEND_FOCUS_RING_PAD`, and sets the ring signals.
  Legend guide items and the mark share the root-frame space, so bounds map directly.
- The built-in legend is otherwise untouched (getEncodings no longer emits focus rings), so
  layout/spacing/position are Vega's. The old content-locked encode rings + `getFocusEncodings` /
  group/entry stroke helpers were removed.

B was abandoned: the outer ring regressed and, more fundamentally, an overlay mark lives in the plot
rectangle's space and can't reach the legend (a guide rendered out in the padding). Coordinate/clip
reconciliation was not tractable without a browser. Pivoted to A′.

## A′ — standalone legend view (chosen, in progress)

Modeled on S1's "disconnected legend" (`LegendDisconnectedStory` = a `<Chart>` with only a
`<Legend>`), the accessible-nav legend is a **separate, legend-only Vega view** below the chart. With
no plot or axis in that view, we own layout and coordinates, so the padded per-entry ring and the
whole-legend ring are straightforward.

**Done + unit-tested (`standaloneLegendSpec.ts`, headless render):**
- `getStandaloneLegendSpec({ series, colors, colorScheme })` → a self-contained legend Vega spec:
  entries data (+ measured `labelWidth`/`maxLabelWidth`), a `color` ordinal scale matching the
  chart's palette, layout signals (`cellWidth`, `columns`, `rowCount`), and marks — per-entry
  `symbol` + `text` + padded focus `rect` (20px, keyed on `FOCUSED_SERIES === datum.series`), plus a
  whole-legend ring (keyed on `FOCUSED_REGION === 'legend' && !isValid(FOCUSED_SERIES)`).
- Verified: one symbol/label/ring per series with palette-matched colors, entry ring toggles on the
  focused series, outer ring toggles root vs. entry. Exported from the package index.

**React integration (next — needs the app to verify):**
1. `RscChart`: when `accessibleNavigation` + a categorical legend, **omit the legend from the main
   chart spec** and render a second view below it.
2. A small component renders `getStandaloneLegendSpec(...)` via its own Vega view, width = container,
   height = `rowCount * STANDALONE_LEGEND_ROW_HEIGHT` (read `rowCount` after first render, or compute
   from series/width).
3. `dataNavigator` adapter: for the legend region, drive `FOCUSED_SERIES`/`FOCUSED_REGION` on the
   **legend view** (not the chart view) — `getView` must resolve to the legend view for legend nodes.
4. Tuning (browser): `STANDALONE_LEGEND_RING_PAD`, row height, centering, column wrapping.

## Scope / phasing

- **Phase 1 — layout spike:** categorical, `orient: bottom` (horizontal), single legend. Prove
  space reservation + a custom entry group (rect ring w/ 20px gap + symbol + text) laid out via
  `getColumns`/`getLabelWidth`. Validate visually in Storybook (jsdom has no font metrics).
- **Phase 2 — parity:** hide/show (`hiddenEntries`), hover highlight, `highlightedSeries`, click,
  label truncation, column wrapping, title.
- **Phase 3 — orientations & edge cases:** left/right/top, multiple legends, RTL/i18n, gradient
  legends stay on the built-in path.
- Gate behind opt-in (e.g. `accessibleNavigation` or explicit prop); validate against the existing
  legend story suite + visual regression before changing any default.

## Risks

- **Space reservation / responsive reflow** — highest-probability defect source (Phase 1 gates the
  whole effort).
- **Behavioral regression** across the many charts using legends.
- **S1/S2 divergence** — this work is S2-only unless mirrored.
- **Maintenance** — we own legend behavior instead of inheriting Vega's.

## Testing notes

- Cross-package tests import `@spectrum-charts/vega-spec-builder-s2` as **dist**; import from a
  relative `src` path to reflect edits, and `yarn build:s2` before Storybook. (See
  memory: S2 dist-stale gotcha.)
- jsdom has no font metrics, so entry content bounds collapse to ~symbol width — layout/size must be
  verified in a real browser, not jsdom.
