---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Toggling legend entries and changing `hiddenSeries`, `highlightedItem`, or `highlightedSeries` now update the chart in place instead of recreating it, and re-shown series keep their stacking order. Legend entries may be spaced slightly wider so the hidden-series icon fits.
