---
name: donut-metric-labels
description: Feature guidance for the Donut chart's center-hole metric total/label (the summary number shown in the middle of the ring). Use when generating a Donut with Metric value/Metric label enabled. Token values referenced here are defined in donut-chart-tokens.
---

# Metric Total & Labels

Tokens referenced below are defined in [`donut-chart-tokens`](../donut-chart-tokens/SKILL.md) — this file covers feature behavior only, not token values.

- `Metric value` / `Metric label` boolean variant properties
- 0/1/2/3-line configurations map to size tokens (XS=none, S=1, M=2, L/XL=3 — see [`donut-chart-tokens`](../donut-chart-tokens/SKILL.md) size tokens)
- 3-line variant's third line can carry a sentiment-colored delta (e.g. "+2.5%")
- Overflow: if the metric label text would overflow past the hole and onto the slices, **truncate the text** (e.g. with an ellipsis) rather than letting it overlap the ring — unlike direct labels, which wrap to 2 lines instead of truncating (see [`donut-direct-labels`](../donut-direct-labels/SKILL.md))
