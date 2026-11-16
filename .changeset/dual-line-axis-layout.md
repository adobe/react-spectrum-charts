---
'@spectrum-charts/vega-spec-builder-s2': patch
---

Apply fixed dual metric axis ranges to the corresponding primary and secondary scales. Recompute Line, gradient, and point Y positions during layout updates so dual-axis geometry follows initial sizing and later resizes. Clip fixed-range dual lines and exclude hover candidates outside their own metric scale.
