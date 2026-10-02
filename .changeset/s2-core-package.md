---
'@spectrum-charts/core-s2': minor
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

Add `@spectrum-charts/core-s2`, an S2-only package with `constants`, `locales`, `tokens`, and `utils` subpath exports. The S2 packages now depend on it instead of the shared `@spectrum-charts/constants`, `themes`, `utils`, and `locales` packages, so S2 no longer has to stay in sync with S1. `@spectrum-charts/react-spectrum-charts-s2` no longer re-exports the S1-only `getSpectrumVegaConfig`.
