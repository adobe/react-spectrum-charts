---
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

Fix S2 bar keyboard navigation for more bar layouts and dimension types.

- Dodged-and-stacked bars (a `color` array, e.g. `['browser', 'platform']`) are now navigable, with bar and group focus rings.
- Bars whose series span several fields (e.g. time comparisons with `color` and `opacity`) are now distinct navigation nodes and read every field.
- Bar, stack and group focus rings now show for number and time dimensions.
- `0` and empty-string dimension values no longer break navigation.
- Bars with `dimensionDataType="time"` and date-string data are now navigable and read the original date strings.
- Dodged bars without an `order` prop now navigate in the order they're drawn, instead of reversed.
