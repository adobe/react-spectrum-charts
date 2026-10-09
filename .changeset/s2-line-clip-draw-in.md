---
'@spectrum-charts/vega-spec-builder-s2': patch
'@spectrum-charts/core-s2': minor
---

S2 Line: draw-in animation is about 3× smoother on dashboards with many line charts. Lines with alternate (dashed) segments or a primary series now keep their styling while drawing in.

`core-s2` no longer exports the internal line draw-in data/field constants (`DRAW_IN_PREV_DATA`, `DRAW_IN_TIP_DATA`, `DRAW_IN_LERP_DATA`, `DRAW_IN_POINT_INDEX_DATA`, `DRAW_IN_TIME_MS_FIELD`, `DRAW_IN_NEXT_*_FIELD`, `DRAW_IN_POINT_INDEX_FIELD`, `DRAW_IN_TIP_FLAG`, `DRAW_IN_DOMAIN_MIN/MAX`).
