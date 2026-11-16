---
'@spectrum-charts/vega-spec-builder-s2': patch
---

Keep metric range areas on their parent Line's custom or dual metric scale, update
their geometry during resizing, and preserve gaps when either bound is missing or
nonfinite. Match the parent's interpolation and allow independent center-line
opacity with `MetricRangeOptions.lineOpacity`.

Avoid references to nonexistent legend-hover signals when combining hover-only
metric ranges or trendlines with a non-highlighting Legend.
Keep forecast boundary rules full-height after initial layout and resizing.
Sort forecast/alternate segments by the actual transformed time field when a
Line uses a non-default temporal dimension.
