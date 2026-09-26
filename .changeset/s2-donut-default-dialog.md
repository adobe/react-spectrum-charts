---
'@spectrum-charts/react-spectrum-charts-s2': minor
---

S2 Donut `ChartInspect` and `ChartPopover` now render default content (color swatch, series name, and raw metric value) without requiring children.

When children are provided inside a `Donut`, their content is appended below the default content instead of replacing it.
