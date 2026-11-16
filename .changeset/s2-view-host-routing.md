---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

Charts now apply data, size and highlight changes to the current view instead of recreating it, so `onVegaViewReady` fires less often.
