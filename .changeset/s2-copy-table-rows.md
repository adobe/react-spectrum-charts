---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Rebuilding a chart after a prop change, like `colorScaleType`, no longer leaves stale internal fields on its data.
