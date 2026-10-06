---
'@spectrum-charts/constants': minor
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

S2 Donut: the gap between the ring and its segment labels now scales by size tier (XL 15px, L/M 10px, S/XS 5px) instead of a fixed 20px. The size tier now always comes from chart size (`DONUT_SIZE_TIER_LABELED_CHART_SIZES` / `DONUT_SIZE_TIER_UNLABELED_CHART_SIZES`), and labeled donuts are capped so tier diameters don't overlap. Replaces `DONUT_LABEL_RING_GAP` and `DONUT_ADVANCED_LABEL_RING_GAP` with `DONUT_LABEL_RING_GAPS`, and renames `DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO` to `DONUT_LABEL_MIN_SPACE_RATIO`.
