---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

`Trendline` (lab) replaces `lineWidth` and `opacity` with `size` (`XS`–`L`, like `ReferenceLine`); without `size`, its width follows the chart size. Trendlines and their annotations now fade smoothly with their series on hover and fade in after the chart draws in, and `TrendlineAnnotation` uses the standard bold direct-label text with a background halo. `TrendlineAnnotation`'s `badge` prop is removed. Hovering a trendline with a `ChartInspect` now fades the other series' points too. New `emphasis` prop on `Trendline` (`trendline` by default, `points`, or `none`) fades the scatter points or the trendline so the other stands out.
