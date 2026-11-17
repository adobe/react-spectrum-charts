---
'@spectrum-charts/vega-spec-builder-s2': minor
---

Add controlled span selection through `Axis.axisAnnotations.selectedIds`.
Selected coincident groups and their ranges persist after pointer leave, including
anchors at zero. Empty selection restores ordinary hover; unavailable source IDs
do not hide unrelated annotations.
