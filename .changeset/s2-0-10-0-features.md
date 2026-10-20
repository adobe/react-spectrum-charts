---
'@spectrum-charts/core-s2': minor
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

New features and changed defaults.

- Donut is now an alpha component: `Donut`, `DonutSummary`, and `SegmentLabel` are exported from the package root.
- Animation is on by default: lines, bars, donuts, and combos draw in once per mount, and hover fades animate, following Spectrum 2 motion. Users who prefer reduced motion skip draw-in but keep hover fades.
- Charts are much smaller in an app that already uses React Spectrum S2: about half the added bundle size.
- Add `ChartActionBar` (lab): a floating toolbar of actions for a clicked line point.
- Top and bottom legends align to the start of the chart by default.
- Donut segments sort largest first by default; set `sortOrder="data"` to keep data order.
- `Chart` props set to `undefined` fall back to their defaults.
- Donut `ChartInspect` and `ChartPopover` show default content (color, name, share, and value) when they have no children.
- Hovering a donut segment shows its label even when it was hidden to avoid overlap.
- Donut ring thickness, label spacing, and size scale with the chart size.
- `BarDirectLabel` follows each bar in stacked and dodged bars and hides labels that overlap or don't fit. Adds `overflow` and `dataKey`.
- Better bar keyboard and screen reader support, including focusable dodged bars and value summaries for focused bars and groups.
