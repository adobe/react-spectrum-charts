---
'@spectrum-charts/vega-spec-builder-s2': patch
---

Import `mergeConfig` from `vega-util` instead of `vega`. This was the package's only runtime import of `vega`, and it pulled a second copy of Vega and d3 into consumer apps. The code S2 charts add to a production app drops by about 19% (501 KB minified, 170 KB gzip), with no behavior change.
