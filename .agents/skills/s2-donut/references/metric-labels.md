# Metric Total & Labels

Tokens referenced below are defined in [`tokens.md`](tokens.md) — this file covers feature behavior only, not token values.

- `Metric value` / `Metric label` boolean variant properties
- 0/1/2/3-line configurations map to size tokens (XS=none, S=1, M=2, L/XL=3 — see [`tokens.md`](tokens.md) size tokens)
- 3-line variant's third line can carry a sentiment-colored delta (e.g. "+2.5%")
- Overflow: if the metric label text would overflow past the hole and onto the slices, **truncate the text** (e.g. with an ellipsis) rather than letting it overlap the ring — unlike direct labels, which wrap to 2 lines instead of truncating (see [`direct-labels.md`](direct-labels.md))
