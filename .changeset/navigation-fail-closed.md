---
'@spectrum-charts/vega-spec-builder-s2': patch
'@spectrum-charts/react-spectrum-charts-s2': patch
---

`accessibleNavigation` now stays off, with a console warning, for charts it doesn't support yet (non-bar marks, trellised bars, or more than one mark) instead of navigating them partially.
