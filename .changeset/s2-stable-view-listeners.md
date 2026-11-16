---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Re-rendering a chart with the same children or an inline `onVegaViewReady` no longer recreates the chart view, and interaction callbacks always use the latest props.
