---
'@spectrum-charts/core-s2': patch
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Fixes and performance.

- Line: fixed hover with `interactionMode="item"`, series highlighting, single-series lines, `interpolate="basis"`, fixed metric-axis ranges, and every series hidden; fixed crashes with `highlightedItem` on a non-interactive line and with `MetricRange`; hovering a point at the chart edge no longer shifts the chart.
- Bar: fixed `highlightedItem` (now respects `idKey`), `ChartInspect` group highlighting, and short-number direct label formats.
- Donut: fixed label overlap, tiny segments, side legend spacing, semicircle summaries, and donuts growing or shifting on resize; pie donuts have a 1px gap between segments.
- Reference lines outside the axis range no longer collapse the chart or flicker on hover, and a right axis lines up with a gridded left axis.
- Lab: Area no longer crashes with `highlightedItem` and places band hover points on the upper edge; Bullet handles hidden and missing targets and always uses gray-900 value labels; Scatter fixes `highlightedItem`, data-driven `stroke`, and dotted outlines; dotted Trendlines are visible; Combo respects `animations` and `animationTypes`.
- Charts render once when first displayed instead of twice and no longer stay blank until hovered; charts with many bars render faster; hover animations stay smooth on large charts; off-screen or idle charts do no animation work.
- `buildSpec` defaults `colors` to `s2Categorical20`, matching `Chart`.
- A chart with no children logs an error instead of throwing, and failed renders are logged instead of left as unhandled rejections.
