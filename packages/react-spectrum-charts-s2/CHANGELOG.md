# @spectrum-charts/react-spectrum-charts-s2

## 0.11.0

### Minor Changes

- 88c036c: Require Node `>=22.12.0`. The `vega-lite` peer dependency (`^6.4.2`) now resolves to versions that require Node 22.12, so installs on Node 20 fail with strict engine checks.

### Patch Changes

- Updated dependencies [88c036c]
  - @spectrum-charts/core-s2@0.11.0
  - @spectrum-charts/vega-spec-builder-s2@0.11.0
  - @spectrum-charts/schemas@2.1.0

## 0.10.0

### Minor Changes

- e7b10b2: Breaking changes. To update your app, see "Upgrading to 0.10.0" in the S2 docs.

  - The S2 packages ship as ES modules only and require Node `>=20.19.0`. `require()`, the UMD global, and deep imports into `dist/` are no longer supported.
  - `react-aria-components` `^1.14.0` is a new peer dependency of `@spectrum-charts/react-spectrum-charts-s2`.
  - `Donut`, `DonutSummary`, and `SegmentLabel` are now alpha and exported from the package root. The `pre-alpha` entry point is renamed `lab`; `Area`, `Bullet`, `Combo`, `Scatter`, `ScatterAnnotation`, `ScatterPath`, `Trendline`, `TrendlineAnnotation`, and `ChartActionBar` are imported from `/lab`. The `alpha` and `beta` subpaths are removed.
  - Donut `startAngle` and `otherItemColor` are removed.
  - The S2 packages depend on the new `@spectrum-charts/core-s2` instead of the shared S1 packages, and no longer re-export `getSpectrumVegaConfig`.

- e7b10b2: New features and changed defaults.

  - Donut is now an alpha component: `Donut`, `DonutSummary`, and `SegmentLabel` are exported from the package root.
  - Animation is on by default: lines, bars, donuts, and combos draw in once per mount, and hover fades animate, following Spectrum 2 motion. Users who prefer reduced motion skip draw-in but keep hover fades.
  - Charts are much smaller in an app that already uses React Spectrum S2: about half the added bundle size.
  - Add `ChartActionBar` (lab): a floating toolbar of actions for a clicked line point.
  - Top and bottom legends align to the start of the chart by default.
  - Donut segments sort largest first by default; set `sortOrder="data"` to keep data order.
  - `Chart` props set to `undefined` fall back to their defaults.
  - Add the semicircle donut variant (`variant="semicircle"`).
  - Donut `ChartInspect` and `ChartPopover` show default content (color, name, share, and value) when they have no children. `@spectrum-charts/vega-spec-builder-s2` exports the `formatPercentWithValue(locale)` formatter used for it.
  - Hovering a donut segment shows its label even when it was hidden to avoid overlap, and donut labels respond to hover and click like their segments.
  - Donut ring thickness, label spacing, and size scale with the chart size.
  - `BarDirectLabel` follows each bar in stacked and dodged bars and hides labels that overlap or don't fit. Adds `overflow` and `dataKey`.
  - Better bar keyboard and screen reader support, including focusable dodged bars and value summaries for focused bars and groups.

### Patch Changes

- e7b10b2: Fixes and performance.

  - Line: fixed hover with `interactionMode="item"`, series highlighting, single-series lines, `interpolate="basis"`, fixed metric-axis ranges, and every series hidden; fixed crashes with `highlightedItem` on a non-interactive line and with `MetricRange`; hovering a point at the chart edge no longer shifts the chart.
  - Bar: fixed `highlightedItem` (now respects `idKey`), `ChartInspect` group highlighting, and short-number direct label formats.
  - Donut: fixed label overlap, tiny segments, side legend spacing, semicircle summaries, and donuts growing or shifting on resize; pie donuts have a 1px gap between segments.
  - Reference lines outside the axis range no longer collapse the chart or flicker on hover, and a right axis lines up with a gridded left axis.
  - Lab: Area no longer crashes with `highlightedItem` and places band hover points on the upper edge; Bullet handles hidden and missing targets and always uses gray-900 value labels; Scatter fixes `highlightedItem`, data-driven `stroke`, and dotted outlines; dotted Trendlines are visible; Combo respects `animations` and `animationTypes`.
  - Charts render once when first displayed instead of twice and no longer stay blank until hovered; charts with many bars render faster; hover animations stay smooth on large charts; off-screen or idle charts do no animation work.
  - `buildSpec` defaults `colors` to `s2Categorical20`, matching `Chart`.
  - A chart with no children logs an error instead of throwing, and failed renders are logged instead of left as unhandled rejections.

- Updated dependencies [e7b10b2]
- Updated dependencies [e7b10b2]
- Updated dependencies [e7b10b2]
- Updated dependencies [7363290]
  - @spectrum-charts/core-s2@0.10.0
  - @spectrum-charts/vega-spec-builder-s2@0.10.0
  - @spectrum-charts/schemas@2.0.0

## 0.9.0

### Minor Changes

- bbb5b70: Add early accessibility and keyboard-navigation prototypes for Spectrum 2 bar charts and axes. This includes hierarchical bar and stacked-bar navigation, axis-label navigation and tooltips, orientation-aware segment traversal, focus and activation behavior, and clearer accessible labels. (#907, #913, #915, #918)

### Patch Changes

- 11df471: Publish Spectrum 2 packages through the standard release channel instead of the permanent `alpha` npm tag.
- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
  - @spectrum-charts/constants@1.53.0
  - @spectrum-charts/vega-spec-builder-s2@0.9.0
