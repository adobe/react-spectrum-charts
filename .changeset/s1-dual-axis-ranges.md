---
'@adobe/react-spectrum-charts': patch
'@spectrum-charts/vega-spec-builder': patch
---

Fixed Line and Bar charts with `dualMetricAxis` ignoring each metric axis's `range`, so both axes stayed anchored at zero.
