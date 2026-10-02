---
'@spectrum-charts/constants': patch
'@spectrum-charts/vega-spec-builder-s2': patch
---

S2 Line: named line types now use Spectrum 2 dash and gap sizes for each chart size, compensated for round line caps. Custom dash arrays are treated as visible lengths at medium chart size and scale with chart size. Legend, bar, and trendline dash patterns use the medium-size values.
