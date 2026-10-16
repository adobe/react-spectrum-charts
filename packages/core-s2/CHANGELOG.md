# @spectrum-charts/core-s2

## 0.10.0

### Minor Changes

- 5147cc4: S2 animations run on a shared on-demand ticker instead of each chart's always-on Vega timer.

  - Idle charts do no animation work; off-screen charts pause.
  - Animations run at the display's native refresh rate, within an 8ms per-frame budget across charts.
  - Draw-in starts on the first painted frame, so slow mounts no longer skip most of the animation.

- f6cf322: S2 bars draw in, and S2 animation timing follows Spectrum 2 motion.

  - Add `'drawIn'` to the chart's `animationTypes` to grow bars from the baseline. Stacked segments fill in order, and direct labels and annotations fade in once their own bar finishes.
  - Draw-in durations: line 850ms, bar 700ms, donut 750ms. Charts with more than one mark type finish together.
  - Draw-in and hover use the Spectrum 2 ease-in-out curve. Hover fades take 150ms.
  - Draw-in labels fade in over 150ms.
  - Users who prefer reduced motion now get hover fades; previously all animation was turned off for them. Draw-in is still skipped.

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

- 003c7e0: Preserve the intended visible donut ring thickness, including 40px at XL.

  Center full-circle DonutSummary stacks and bottom-align semicircles and their summaries with a 2px text inset, preserving the original spacing between values and labels.

- 0af59b6: Increase the M and L donut size-tier diameter breakpoints from 160px and 200px to 200px and 280px, respectively.
- 6106b65: Add opt-in clockwise draw-in animations for S2 donuts with labels fading in linearly over 50ms after their slices finish drawing.
- 56877b3: Speed up initial render of S2 charts with hover animations, most noticeably bar charts with many bars.
- 879a303: Improve line draw-in animation performance on interactive S2 line charts by loading the hover layer after the draw-in finishes, without changing chart layout.
- bb702bd: Give donuts a 10px base inset without labels, allow labels to use available width with a 10px edge inset, and keep donuts centered when resized.
- bb702bd: Increase the default XL donut ring thickness to 40px.
