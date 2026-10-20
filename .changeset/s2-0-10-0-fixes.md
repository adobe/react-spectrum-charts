---
'@spectrum-charts/core-s2': patch
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Fixes and performance.

- Line: fixed hover with `interactionMode="item"`, series highlighting, single-series lines, `interpolate="basis"`, fixed metric-axis ranges, and every series hidden.
- Bar: fixed `highlightedItem`, `ChartInspect` group highlighting, and short-number direct label formats.
- Donut: fixed label overlap, tiny segments, side legend spacing, semicircle summaries, and donuts growing or shifting on resize.
- Reference lines outside the axis range no longer collapse the chart, and a right axis lines up with a gridded left axis.
- Lab: fixed Area, Bullet, and Scatter `highlightedItem`, hidden or missing targets, and outlines; Combo respects `animations` and `animationTypes`.
- Charts render once when first displayed instead of twice, hover animations stay smooth on large charts, and off-screen or idle charts do no animation work.
- A chart with no children logs an error instead of throwing, and failed renders are logged instead of left as unhandled rejections.
