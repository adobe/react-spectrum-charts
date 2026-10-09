---
'@spectrum-charts/vega-spec-builder-s2': patch
'@spectrum-charts/react-spectrum-charts-s2': patch
---

BarDirectLabel: labels now follow each bar in dodged and stacked layouts, hide when they would overlap other labels or bars, and hide (or spill outside with `overflow="spill"`) when they don't fit inside their bar. Adds `dataKey` to label only selected bars.
