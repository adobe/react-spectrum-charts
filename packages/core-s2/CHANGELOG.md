# @spectrum-charts/core-s2

## 0.10.0

### Minor Changes

- 5147cc4: S2 animations run on a shared on-demand ticker instead of each chart's always-on Vega timer.

  - Idle charts do no animation work; off-screen charts pause.
  - Animations run at the display's native refresh rate, within an 8ms per-frame budget across charts.
  - Draw-in starts on the first painted frame, so slow mounts no longer skip most of the animation.

- 6a66423: Add `@spectrum-charts/core-s2`, an S2-only package with `constants`, `locales`, `tokens`, and `utils` subpath exports. The S2 packages now depend on it instead of the shared `@spectrum-charts/constants`, `themes`, `utils`, and `locales` packages, so S2 no longer has to stay in sync with S1. `@spectrum-charts/react-spectrum-charts-s2` no longer re-exports the S1-only `getSpectrumVegaConfig`.
- 7363290: Ship the S2 packages as per-module ES modules built with Rollup, so bundlers share dependencies with the app and tree-shake unused code. In a consumer webpack build this cuts what `@spectrum-charts/react-spectrum-charts-s2` adds to an app that already uses React Spectrum S2 from about 350 KB to about 175 KB gzip, mostly by no longer bundling private copies of `@react-spectrum/s2` and React Aria.

  Breaking changes:

  - `@spectrum-charts/core-s2`, `@spectrum-charts/schemas`, `@spectrum-charts/vega-spec-builder-s2` and `@spectrum-charts/react-spectrum-charts-s2` are ESM-only (`"type": "module"` with an `exports` map). `require()`, the UMD global, and deep imports into `dist/` are no longer supported.
  - The packages declare `engines.node >=20.19.0`.
  - `@spectrum-charts/react-spectrum-charts-s2` adds `react-aria-components` `^1.14.0` as a peer dependency, so it shares React Aria context with `@react-spectrum/s2`.
  - The `./alpha` and `./beta` subpath exports of `@spectrum-charts/react-spectrum-charts-s2` are removed; they never pointed at published files.
  - Jest consumers must transform `@spectrum-charts/*` and stub CSS imports. See "Module format" in the S2 overview docs.

  Type declarations now resolve under `moduleResolution` `node16`/`nodenext` as well as `bundler`.

- 778d18a: S2 Line: draw-in animation is about 3× smoother on dashboards with many line charts. Lines with alternate (dashed) segments or a primary series now keep their styling while drawing in.

  `core-s2` no longer exports the internal line draw-in data/field constants (`DRAW_IN_PREV_DATA`, `DRAW_IN_TIP_DATA`, `DRAW_IN_LERP_DATA`, `DRAW_IN_POINT_INDEX_DATA`, `DRAW_IN_TIME_MS_FIELD`, `DRAW_IN_NEXT_*_FIELD`, `DRAW_IN_POINT_INDEX_FIELD`, `DRAW_IN_TIP_FLAG`, `DRAW_IN_DOMAIN_MIN/MAX`).

### Patch Changes

- 6106b65: Add opt-in clockwise draw-in animations for S2 donuts with labels fading in linearly over 50ms after their slices finish drawing.
