---
'@spectrum-charts/core-s2': minor
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

Breaking changes. To update your app, see "Upgrading to 0.10.0" in the S2 docs.

- The S2 packages ship as ES modules only and require Node `>=20.19.0`. `require()`, the UMD global, and deep imports into `dist/` are no longer supported.
- `react-aria-components` `^1.14.0` is a new peer dependency of `@spectrum-charts/react-spectrum-charts-s2`.
- `Donut`, `DonutSummary`, and `SegmentLabel` are now alpha and exported from the package root. The `pre-alpha` entry point is renamed `lab`; `Area`, `Bullet`, `Combo`, `Scatter`, `ScatterAnnotation`, `ScatterPath`, `Trendline`, `TrendlineAnnotation`, and `ChartActionBar` are imported from `/lab`. The `alpha` and `beta` subpaths are removed.
- Donut `startAngle` and `otherItemColor` are removed.
- The S2 packages depend on the new `@spectrum-charts/core-s2` instead of the shared S1 packages, and no longer re-export `getSpectrumVegaConfig`.
