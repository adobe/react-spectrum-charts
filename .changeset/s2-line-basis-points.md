---
'@spectrum-charts/vega-spec-builder-s2': patch
---

Line: `interpolate="basis"` no longer draws static points, hover points, or hover labels. The curve does not pass through the data, so the points sat off the line.
