---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Remove circular imports from the S2 packages so they can ship as per-module ES modules. No behavior change. A new `import/no-cycle` lint rule keeps them from coming back.
