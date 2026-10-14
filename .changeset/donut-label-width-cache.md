---
'@spectrum-charts/vega-spec-builder-s2': patch
---

Donut segment labels measure their text once per data update instead of on every animation frame, and `getLabelWidth` reuses one canvas and caches widths. Speeds up donut draw-in with labels.
