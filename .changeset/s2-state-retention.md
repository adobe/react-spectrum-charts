---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Data updates and rebuilds now close open popovers, clear the selection, reset hover and tooltips, and drop hidden legend series that no longer exist. Series and categories that return after a data update keep their original order and colors.
