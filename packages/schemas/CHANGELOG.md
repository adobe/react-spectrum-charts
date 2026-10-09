# @spectrum-charts/schemas

## 2.0.0

### Major Changes

- 7363290: Ship the S2 packages as per-module ES modules built with Rollup, so bundlers share dependencies with the app and tree-shake unused code. In a consumer webpack build this cuts what `@spectrum-charts/react-spectrum-charts-s2` adds to an app that already uses React Spectrum S2 from about 350 KB to about 175 KB gzip, mostly by no longer bundling private copies of `@react-spectrum/s2` and React Aria.

  Breaking changes:

  - `@spectrum-charts/core-s2`, `@spectrum-charts/schemas`, `@spectrum-charts/vega-spec-builder-s2` and `@spectrum-charts/react-spectrum-charts-s2` are ESM-only (`"type": "module"` with an `exports` map). `require()`, the UMD global, and deep imports into `dist/` are no longer supported.
  - The packages declare `engines.node >=20.19.0`.
  - `@spectrum-charts/react-spectrum-charts-s2` adds `react-aria-components` `^1.14.0` as a peer dependency, so it shares React Aria context with `@react-spectrum/s2`.
  - The `./alpha` and `./beta` subpath exports of `@spectrum-charts/react-spectrum-charts-s2` are removed; they never pointed at published files.
  - Jest consumers must transform `@spectrum-charts/*` and stub CSS imports. See "Module format" in the S2 overview docs.

  Type declarations now resolve under `moduleResolution` `node16`/`nodenext` as well as `bundler`.
