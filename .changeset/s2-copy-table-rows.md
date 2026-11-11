---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Charts no longer write internal fields into the `data` rows you pass in, so changing props like `colorScaleType` can't leave stale series ids behind.
