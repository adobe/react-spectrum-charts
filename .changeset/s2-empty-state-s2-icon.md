---
'@spectrum-charts/react-spectrum-charts-s2': patch
---

EmptyState now uses the S2 `ChartBarVert` icon instead of the undeclared S1 `@spectrum-icons/workflow` icon. This removes the S1 icon and provider code from the bundle: about 68 KB minified (7 KB gzip) less for a consumer rendering a bar chart.
