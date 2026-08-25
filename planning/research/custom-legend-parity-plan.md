# Custom Legend — Full Prop Parity Plan

The accessible-navigation legend is rendered as our own Vega marks in a `legend` group in a band
below the plot (see `custom-legend.md` for why: the built-in legend's entry box is content-locked and
can't host the 20px padded focus ring). Because we own the marks, we must re-supply every feature the
built-in Spectrum-2 categorical legend provides. This plan tracks that to full `LegendOptions` parity.

Source of truth for behavior/values: `legendSpecBuilder.ts`, `legendUtils.ts`, `legendHighlightUtils.ts`,
and the theme `config.legend` block in `spectrum2Theme.ts`.

## Files
- `vega-spec-builder-s2/src/legend/legendBandGroup.ts` — the custom marks + layout data/signals.
- `vega-spec-builder-s2/src/legend/plotGroupLayout.ts` — the plot/legend band subview wrapper.
- `vega-spec-builder-s2/src/chartSpecBuilder.ts` — wires the legend when `accessibleNavigation`.

## Reuse strategy (keep, don't reimplement)
- `setHoverOpacityForMarks(legendName, marks)` — injects the chart-mark fade on legend hover. Our
  legend just drives `${legendName}_hoveredSeries`. (Done for highlight.)
- The chart's `FILTERED_TABLE` already filters on the `hiddenSeries` signal — click-to-hide just
  toggles that signal; no chart change needed.
- Palette comes from the top-level `color` scale (kept out of the plot group), so entry colors match.

## Status
- [x] Layout subview (plot group + dynamic band), honors user height in Vega only
- [x] Column math matches `getColumns` (cellWidth = label + symbol(16) + columnPadding(20))
- [x] Spacing constants: rowPadding 8, labelOffset 4, titlePadding 8, fontSize 14
- [x] `title`, `name`, `color` (field), `highlight` (hover fade, gated on prop)
- [x] Axis/label + 24px `layout.offset` reserved below plot

## Phase 1 — horizontal (bottom/top) prop parity
- [x] `isToggleable` / `defaultHiddenSeries` — hit-target has role `legend-symbol` + `value`, so the
      React click handler toggles `hiddenSeries`; eye-off symbol + gray-700/500 fill + transparent
      stroke + per-state label color (verified headless).
- [x] `hiddenEntries` — inherited free via the reused `${name}Aggregate` filter.
- [x] `legendLabels` — inherited free (display label + measured width via `${name}_maxLabelWidth`).
- [x] `descriptions` — entry `tooltip` = merge(datum, {COMPONENT_NAME}).
- [x] `hasOnClick` — routes through the same `legend-symbol` click handler.
- [x] Per-column-max layout (uniform columnPadding gaps), left-aligned title, gray-700 labels,
      1.5px series-color symbol stroke; exact `S=18` cell geometry from the line-by-line Vega spec.
- [x] `labelLimit`, `titleLimit` — honored (truncation + column math).
- [x] `align` — start/middle/end main-axis alignment via legendCenterOffset.
- [x] `hasMouseInteraction` — hit target present so RSC's mouseover/out handlers fire.
- [x] `opacity`, `symbolShape`, `lineType`, `lineWidth` — symbol facet encodings (fillOpacity,
      shape, strokeDash, strokeWidth); facet scales kept top-level so the legend group can read them.
- [x] **Keyboard focus rings** — per-entry padded (20px) ring + whole-legend ring, driven by
      FOCUSED_SERIES / FOCUSED_REGION (data-navigator). This is the original goal.
- [x] `position: 'top'` / `'bottom'` — band above/below (reserves height; wrapper offsets the plot y).

## Phase 2 — vertical (left/right) layout  ✅
- [x] Wrapper reserves **width** (`plotWidth = width - legendBandWidth - offset`); plot group scoped
      `width`/`height` signals; plot offset in x for a left legend.
- [x] Vertical single-column stacking via forcing `legendColumns = 1` (row = index) — reuses the
      horizontal entry marks unchanged; `legendBandWidth = one entry's content + 2·padding`.
- [x] Legend group positioned left (x=0) / right (x=width-bandWidth). Verified headless for all 4 sides.

## Phase 3 — grouped legends (`keys`)  ✅ (via inheritance)
- [x] Grouped aggregation comes through the built-in `${name}Aggregate`; grouped hidden test
      (`filteredTable` + `GROUP_ID`) and the built-in keyed hover signal are reused. Needs browser
      verification with real grouped data.

## Phase 4 — `chartPopovers` on the legend  ✅ (via click routing)
- [x] `clickable` includes `chartPopovers`, so the hit target (role `legend-symbol` + `datum.value`)
      routes through RSC's `handleLegendItemClick`, which triggers the popover. Needs browser verification.

## Verification
- Unit: extend `plotGroupLayout.test.ts` / add `legendBandGroup.test.ts` for each prop's spec output.
- Headless render probes for geometry; browser (real font metrics) for final visual parity.
- Cross-check each prop's output against the built-in legend's for the same options.
