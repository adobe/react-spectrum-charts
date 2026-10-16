# @spectrum-charts/vega-spec-builder-s2

## 0.10.0

### Minor Changes

- bf42a3d: Improve S2 bar accessible navigation:
  Updated focus element position accuracy for screen magnifiers.

  Added keyboard and focus ring support for dodged bars.

  Added meaningful summaries of focused regions for screen readers while focusing elements in dodged and stacked bars.
  (e.g. "Browser: Chrome. Operating system: Windows, Downloads: 5. Operating system: Mac, Downloads: 3.")

  Whole-chart focus provides a "metric by dimension" summary (e.g. "Downloads by Browser chart, grouped by Operating system. 3 groups.") instead of a raw field-name id.

  Tabbing out of the chart now keeps the focused node so Shift+Tab returns to it (rather than resetting to the "Enter navigation area" button)

  Leaving the chart reverts the focus dimming so the non-focused marks return to full opacity.

- 9922dc7: S2 Donut: hovering a segment now shows its label even when it was hidden by label collision or because the segment is below the minimum label angle. Labels that would collide with the hovered label are hidden while it is hovered. (AN-495008)
- ef12f11: Add `ChartActionBar`, a new Line child component for Spectrum 2 charts. Clicking a data point shows a floating contextual toolbar with consumer-defined actions, overflow handling for actions that don't fit inline, drag-to-reposition, and an emphasized visual style option. (#797)
- f6cf322: S2 bars draw in, and S2 animation timing follows Spectrum 2 motion.

  - Add `'drawIn'` to the chart's `animationTypes` to grow bars from the baseline. Stacked segments fill in order, and direct labels and annotations fade in once their own bar finishes.
  - Draw-in durations: line 850ms, bar 700ms, donut 750ms. Charts with more than one mark type finish together.
  - Draw-in and hover use the Spectrum 2 ease-in-out curve. Hover fades take 150ms.
  - Draw-in labels fade in over 150ms.
  - Users who prefer reduced motion now get hover fades; previously all animation was turned off for them. Draw-in is still skipped.

- 6a66423: Add `@spectrum-charts/core-s2`, an S2-only package with `constants`, `locales`, `tokens`, and `utils` subpath exports. The S2 packages now depend on it instead of the shared `@spectrum-charts/constants`, `themes`, `utils`, and `locales` packages, so S2 no longer has to stay in sync with S1. `@spectrum-charts/react-spectrum-charts-s2` no longer re-exports the S1-only `getSpectrumVegaConfig`.
- 0e60423: S2 Donut `ChartInspect` and `ChartPopover` now render default content (color swatch, series name, and share of the visible total with its short-number value, e.g. `65.2% (23K)`, formatted with the chart locale) without requiring children.

  When children are provided inside a `Donut`, their content replaces the default content.

  `@spectrum-charts/vega-spec-builder-s2` exports a new `formatPercentWithValue(locale)` formatter used for this content.

- 7363290: Ship the S2 packages as per-module ES modules built with Rollup, so bundlers share dependencies with the app and tree-shake unused code. In a consumer webpack build this cuts what `@spectrum-charts/react-spectrum-charts-s2` adds to an app that already uses React Spectrum S2 from about 350 KB to about 175 KB gzip, mostly by no longer bundling private copies of `@react-spectrum/s2` and React Aria.

  Breaking changes:

  - `@spectrum-charts/core-s2`, `@spectrum-charts/schemas`, `@spectrum-charts/vega-spec-builder-s2` and `@spectrum-charts/react-spectrum-charts-s2` are ESM-only (`"type": "module"` with an `exports` map). `require()`, the UMD global, and deep imports into `dist/` are no longer supported.
  - The packages declare `engines.node >=20.19.0`.
  - `@spectrum-charts/react-spectrum-charts-s2` adds `react-aria-components` `^1.14.0` as a peer dependency, so it shares React Aria context with `@react-spectrum/s2`.
  - The `./alpha` and `./beta` subpath exports of `@spectrum-charts/react-spectrum-charts-s2` are removed; they never pointed at published files.
  - Jest consumers must transform `@spectrum-charts/*` and stub CSS imports. See "Module format" in the S2 overview docs.

  Type declarations now resolve under `moduleResolution` `node16`/`nodenext` as well as `bundler`.

- c70b1c4: S2 legends positioned at the bottom or top are now left-aligned (`align: 'start'`) by default instead of centered. This also applies to S1 charts using the `s2` prop; S1 charts without it are unchanged. Pass `align="middle"` to keep the previous centered layout.
- 904b468: Hide text in the DonutSummary if it truncates down all the way to `...`
- d7e5b00: Adjust slice gap so the pie variation of a Donut has a 1px gap.

### Patch Changes

- acf2e4c: Fix Area crashing with a controlled highlightedItem and no interactive children, and place the hover and anchor points on the upper edge of metricStart/metricEnd bands.
- f172f3a: Fix S2 bar `ChartInspect` group highlighting with hover animations, `highlightedItem` on non-interactive bars, and `shortNumber`/`shortCurrency` bar direct label formats; controlled `highlightedItem` now respects `idKey`.
- 1bbf70e: Show the bullet metric axis when `showTargetValue` is set but `showTarget` is false.
- 7e9b98d: Hide the bullet target line when a row has no target value instead of drawing it at zero.
- be4cf85: Fix a bullet chart with thresholds and `ChartInspect` failing to render when `showTargetValue` is set but `showTarget` is false.
- 25dbb44: Bullet value labels always use gray-900 instead of the threshold color when `thresholdBarColor` is enabled, matching side labels.
- 03ebd82: Clip reference lines to the plot so out-of-range values no longer collapse the chart or flicker on hover.
- bb702bd: Sort categorical donut segments largest-first by default, with `sortOrder="data"` to preserve input order.
- 2ff88a7: Donut segment labels measure their text once per data update instead of on every animation frame, and `getLabelWidth` reuses one canvas and caches widths. Speeds up donut draw-in with labels.
- 003c7e0: Preserve the intended visible donut ring thickness, including 40px at XL.

  Center full-circle DonutSummary stacks and bottom-align semicircles and their summaries with a 2px text inset, preserving the original spacing between values and labels.

- 7cd2cfd: S2 Donut: keep a donut's left or right legend next to the donut when the chart is wider than it is tall.
- 0af59b6: Increase the M and L donut size-tier diameter breakpoints from 160px and 200px to 200px and 280px, respectively.
- 4ec4e4d: S2 Donut: the gap between the ring and its segment labels now scales with donut size (5px for small, 10px for medium/large, 15px for extra large) instead of a fixed 20px. Donut size is now based on chart size.
- ce9edf4: Fix donuts growing during resize and retaining unnecessary side padding when there is no surplus width for a side legend.
- 7426d40: The chart animations will respect the "reduce motion" setting on a users operating system.
- ea138a4: Fix S2 Line crashes from missing signals: `highlightedItem` on a non-interactive Line, and MetricRange on a Line with draw-in animation.
- 9cfd99c: Remove the startAngle and otherItemColor prop from the S2 Donut.
- 5147cc4: S2 animations run on a shared on-demand ticker instead of each chart's always-on Vega timer.

  - Idle charts do no animation work; off-screen charts pause.
  - Animations run at the display's native refresh rate, within an 8ms per-frame budget across charts.
  - Draw-in starts on the first painted frame, so slow mounts no longer skip most of the animation.

- 3454151: Import `mergeConfig` from `vega-util` instead of `vega`. This was the package's only runtime import of `vega`, and it pulled a second copy of Vega and d3 into consumer apps. The code S2 charts add to a production app drops by about 19% (501 KB minified, 170 KB gzip), with no behavior change.
- e552107: Default `colors` in `buildSpec` to `s2Categorical20`, matching `Chart`.
- 6106b65: Add opt-in clockwise draw-in animations for S2 donuts with labels fading in linearly over 50ms after their slices finish drawing.
- 0571b96: Animate S2 donut segment and label opacity with the shared hover animation system.
- b042f60: Match S2 donut label interactions to their slices, including animated hover highlighting, inspect tooltips, and popovers.
- 5f0f7ee: S2 Donut: smoother draw-in animation.
- dda494c: Fix dotted Scatter outlines and Trendlines rendering invisible by using round stroke caps.
- e404467: S2 Line, Bar and Donut: smoother hover animations on charts with many points.
- eee0b6e: S2 Line, Bar, Donut and Legend: smoother hover animations on charts with many series.
- 56877b3: Speed up initial render of S2 charts with hover animations, most noticeably bar charts with many bars.
- c972414: Line: `interpolate="basis"` no longer draws static points, hover points, or hover labels. The curve does not pass through the data, so the points sat off the line.
- 778d18a: S2 Line: draw-in animation is about 3× smoother on dashboards with many line charts. Lines with alternate (dashed) segments or a primary series now keep their styling while drawing in.

  `core-s2` no longer exports the internal line draw-in data/field constants (`DRAW_IN_PREV_DATA`, `DRAW_IN_TIP_DATA`, `DRAW_IN_LERP_DATA`, `DRAW_IN_POINT_INDEX_DATA`, `DRAW_IN_TIME_MS_FIELD`, `DRAW_IN_NEXT_*_FIELD`, `DRAW_IN_POINT_INDEX_FIELD`, `DRAW_IN_TIP_FLAG`, `DRAW_IN_DOMAIN_MIN/MAX`).

- 2fe8a2c: Fix S2 line charts reflowing by a pixel when hovering a point at the chart edge
- 3f3855e: Line: hovering no longer thickens lines when there is only one series or when highlighting by dimension.
- 39d2d54: Line: `interactionMode="item"` no longer shrinks the plot. Its hover areas are now clipped to the plot.
- 74e9130: Line: highlighting by series no longer shows the hover rule, point, or value label. Only the other series fade.
- 879a303: Improve line draw-in animation performance on interactive S2 line charts by loading the hover layer after the draw-in finishes, without changing chart layout.
- 51120d6: Vertical axes space their ticks by height even without `grid`, so a right axis lines up with a gridded left axis.
- 32cd159: Fix Scatter rendering blank when `highlightedItem` is set without interactive children.
- 386e551: Fix Scatter `stroke` set to a data field rendering no outline.
- 003c7e0: Place semicircle DonutSummary deltas inside the arc, below the value and label, without moving the arc.
  Hide semicircle deltas at XS/S without reserving space; show them from M upward.

  Size semicircle rings and text to match the arc diameter in wide containers.

- fd19202: Pre-Alpha S2 Donut fixes for label positioning, truncation, spacing, and dense collision handling; fixing visibility of tiny segments; and fixing semicircle summary delta overlap.
- bb702bd: Give donuts a 10px base inset without labels, allow labels to use available width with a 10px edge inset, and keep donuts centered when resized.
- bb702bd: Increase the default XL donut ring thickness to 40px.
- Updated dependencies [003c7e0]
- Updated dependencies [0af59b6]
- Updated dependencies [5147cc4]
- Updated dependencies [f6cf322]
- Updated dependencies [6a66423]
- Updated dependencies [6106b65]
- Updated dependencies [7363290]
- Updated dependencies [56877b3]
- Updated dependencies [778d18a]
- Updated dependencies [879a303]
- Updated dependencies [bb702bd]
- Updated dependencies [bb702bd]
  - @spectrum-charts/core-s2@0.10.0

## 0.9.0

### Minor Changes

- bbb5b70: Add early accessibility and keyboard-navigation prototypes for Spectrum 2 bar charts and axes. This includes hierarchical bar and stacked-bar navigation, axis-label navigation and tooltips, orientation-aware segment traversal, focus and activation behavior, and clearer accessible labels. (#907, #913, #915, #918)

### Patch Changes

- bbb5b70: Update Spectrum 2 hover opacity animations to use a 250 ms ease-in-out transition. (#902)
- bbb5b70: Add accessible descriptions to horizontal bar marks so their SVG graphics expose accessible text. (#893)
- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
  - @spectrum-charts/constants@1.53.0
