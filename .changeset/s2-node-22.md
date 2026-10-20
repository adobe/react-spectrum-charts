---
'@spectrum-charts/core-s2': minor
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
'@spectrum-charts/schemas': minor
---

Require Node `>=22.12.0`. The `vega-lite` peer dependency (`^6.4.2`) now resolves to versions that require Node 22.12, so installs on Node 20 fail with strict engine checks.
