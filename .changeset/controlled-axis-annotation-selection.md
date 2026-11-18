---
'@spectrum-charts/vega-spec-builder-s2': minor
"@spectrum-charts/react-spectrum-charts-s2": minor
"@spectrum-charts/docs-s2": patch
---

Add controlled span selection through `Axis.axisAnnotations.selectedIds`.
Selected coincident groups and their ranges persist after pointer leave, including
anchors at zero. Empty selection restores ordinary hover; unavailable source IDs
do not hide unrelated annotations.
