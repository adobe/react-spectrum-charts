---
name: donut-binary
description: Feature guidance for the 2-segment (binary) Donut chart variant. Use when generating a Donut with exactly 2 segments and no separate swatch legend. Token values referenced here are defined in donut-chart-tokens.
---

# 2-Segment / Binary Donut

Tokens referenced below are defined in [`donut-chart-tokens`](../donut-chart-tokens/SKILL.md) — this file covers feature behavior only, not token values.

- `Segment=2` variant
- Primary segment: any categorical color; secondary: `chart.donut.color.secondary-gray`
- No legend component — label lives in the center hole (`Metric total` + `Metric label`, see [`donut-metric-labels`](../donut-metric-labels/SKILL.md))
- Only the primary segment is labeled
