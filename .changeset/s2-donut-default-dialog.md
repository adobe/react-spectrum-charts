---
'@spectrum-charts/constants': minor
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

S2 Donut `ChartInspect` and `ChartPopover` now render default content (color swatch, series name, and share of the visible total with its short-number value, e.g. `65.2% (23K)`, formatted with the chart locale) without requiring children.

When children are provided inside a `Donut`, their content replaces the default content.

`@spectrum-charts/vega-spec-builder-s2` exports a new `formatPercentWithValue(locale)` formatter used for this content.
