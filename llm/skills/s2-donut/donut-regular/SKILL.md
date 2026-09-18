---
name: donut-regular
description: Feature guidance for the regular (multi-segment, non-binary) Donut chart variant. Use when generating a standard Donut with 2-6 segments and no benchmark. Token values referenced here are defined in donut-chart-tokens.
---

# Regular Donut

Tokens referenced below are defined in [`donut-chart-tokens`](../donut-chart-tokens/SKILL.md) — this file covers feature behavior only, not token values.

- Segment count: 2–6 → bind to `Segment` variant property (`Donut (S/M/L)` component set)
- Colors: `chart.donut.color.categorical-01..06`
- Sort order: largest segment first at 12 o'clock, descending clockwise (layout rule, not a token — enforce in data-prep logic)
- Corners: **slices never have rounded corners** — flat/square arc edges only, on every segment
