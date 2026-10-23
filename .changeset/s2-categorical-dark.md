---
'@spectrum-charts/core-s2': minor
'@spectrum-charts/vega-spec-builder-s2': patch
'@spectrum-charts/react-spectrum-charts-s2': patch
'@spectrum-charts/themes': minor
'@spectrum-charts/vega-spec-builder': patch
'@adobe/react-spectrum-charts': patch
---

Spectrum 2 categorical colors now use their dark values when `colorScheme` is `dark`, both as `categorical-*` tokens and in the `s2Categorical` palettes. New `getColorSchemeColors(name, colorScheme)` returns a named palette's colors for a color scheme. New `s2CategoricalPaletteColors` maps each categorical token to the Spectrum 2 palette color it uses, like `categorical-100` to `indigo-1100`.
