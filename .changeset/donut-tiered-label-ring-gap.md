---
'@spectrum-charts/constants': minor
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

S2 Donut: the gap between the ring and its segment labels now scales by size tier (XL 15px, L/M 10px, S/XS 5px) instead of a fixed 20px. Replaces `DONUT_LABEL_RING_GAP` and `DONUT_ADVANCED_LABEL_RING_GAP` with `DONUT_LABEL_RING_GAPS`.
