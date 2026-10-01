---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
'@spectrum-charts/constants': minor
'@spectrum-charts/locales': minor
'@spectrum-charts/schemas': minor
'@spectrum-charts/themes': minor
'@spectrum-charts/utils': minor
'@spectrum-charts/docs': patch
---

Ship the S2 packages as per-module ES modules built with Rollup so bundlers can tree-shake unused charts and components.

Breaking for S2 consumers:
- `@spectrum-charts/react-spectrum-charts-s2` and `@spectrum-charts/vega-spec-builder-s2` are now ESM-only. `require()` and the UMD global are no longer supported.
- Jest consumers must transform `@spectrum-charts/*` and stub CSS imports. See the "Module format" section of the S2 overview docs.

The shared packages (`constants`, `locales`, `schemas`, `themes`, `utils`) add an ESM build under the `import` condition and keep their existing CommonJS/UMD build. They now declare an `exports` map, so deep imports into `dist/` are no longer resolvable.
