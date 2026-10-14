# Pattern fills for S2 bars

- Status: Parked (waiting on [vega/vega#4290](https://github.com/vega/vega/pull/4290))
- Date: 2026-10-14
- Issues: closed prototype PR [#883](https://github.com/adobe/react-spectrum-charts/pull/883)

## Question

Can S2 bars use texture fills (stripes, dots, hatching) as well as, or instead of, color? The
motivating case is a period comparison where the previous period is striped and the current period is
solid, in the same series color. Patterns also give a non-color encoding for accessibility and print.

## Findings

### Prototype (PR #883, not merged)

The prototype lives on branch `canvasOverlay` at commit `81163211ce328bb9d03b346946e2800f16b5dbb1`.
It worked end to end for the canvas renderer without changing any Vega package.

**API**

- `pattern` on Bar works like `color`. A field name dodges. A `[primary, secondary]` tuple dodges by
  primary and stacks by secondary. When both are set, `pattern` wins for the fill.
- `patterns` on Chart works like `colors` (`string[] | string[][]`). Each entry is a built-in pattern name
  or a color (S2 token or literal). If a row has a pattern and a color, the pattern is drawn in that
  color. For example, `[['categorical-100', 'diagonal-stripe'], ...]` gives solid current and striped
  previous in the same hue.
- Built-in palette: `diagonal-stripe`, `diagonal-stripe-reverse`, `horizontal-stripe`, `dots`,
  `crosshatch`, `grid`.

**Spec side (`vega-spec-builder-s2`)**

- A new ordinal `PATTERN_SCALE` (`'pattern'`) and a `patterns`/`secondaryPattern` signal pair, built the
  same way as the color dual-facet scales.
- Pattern values are plain objects, `{ pattern: id, foreground?: color }`, detected the same way as
  Vega's `isGradient`. An earlier version used `url(#id)` / `id::color` strings and was dropped.
- Vega's scale parser rejects objects in a literal `range`, as it does for gradients. A signal is
  allowed, so the range comes from a `patternRange` signal.
- The value type and default IDs lived in `packages/utils` so both S2 packages could use them.

**Render side (`react-spectrum-charts-s2`)**

- After embed, if `renderer === 'canvas'` and the spec contains a pattern value, `VegaChart` patches
  the canvas context's `fillStyle` setter. Pattern objects become a cached `CanvasPattern`; any other
  value passes through untouched.
- Each pattern is drawn once on a small offscreen canvas and cached per context, keyed by
  `id + foreground`. A `WeakSet` ensures each context is patched only once.
- High-DPI: the scale comes from `canvas.width / canvas.clientWidth`, not `window.devicePixelRatio`.
  Rotation and DPI correction use `CanvasPattern.setTransform`.
- Opacity (`globalAlpha`) is applied separately from `fillStyle`, so dimming still works on legend
  swatches.

### Things learned that any implementation needs

- **Facet scale names are hardcoded in three places**, and the pattern scales must be added to all
  three:
  - `legendFacetUtils.ts` (`facetScaleNames`)
  - `legendUtils.ts` (`secondaryFacetMapping`)
  - `specUtils.ts` (`getFacetsFromScales`)

  Missing the last one leaves the pattern field out of `rscSeriesId`. Legend-to-bar hover then fails
  silently.
- **Pattern-only dodged bars crashed.** With `pattern` as the only facet, the dodge-group groupby was
  empty, which produced an empty formula that `vega.parse` rejects.
- **Renderer default is SVG.** Stories that didn't set `renderer="canvas"` showed no patterns. This
  can't be caught by checking the built spec or `vega.parse`, because the renderer is set in React, not
  in the spec.
- **Period consistency is awkward.** Keeping the same treatment per period required a 2D `patterns`
  array with one row per primary value. That's unwieldy when consumers don't know the domain size in
  advance.

### Upstream: vega/vega#4290

[vega/vega#4290](https://github.com/vega/vega/pull/4290) ("feat: Pattern Fills (#1372)") adds a native
`Pattern` value type, alongside `Gradient`. It was still open and unmerged at the last update on
2026-09-03. It provides:

- A `vega-pattern` package with a named registry (`vega.pattern(name, def)`).
- Pattern definitions by `name`, `shape` (SVG path), `rule` (angled lines) or `url` (image), with
  `foreground`, `background`, `strokeWidth`, `origin`, `scale` and `shapeRendering`.
- Pattern objects accepted in `fill`/`stroke` and directly in scale ranges, mixed with colors.
- A `pattern()` expression function, e.g.
  `pattern(scale('tex', datum.type), { foreground: scale('color', datum.group) })`.
- Built-in `patterns` and `monochrome` schemes.
- Native legend swatches.
- Matching canvas and SVG output.

It covers everything our prototype needed except custom draw callbacks, which are reasonable to leave
out of a JSON spec. Dodge and stack composition stays in our spec builder either way.

## Options

1. **Wait for #4290 and build on it.** This gives the native type, SVG support and legend swatches,
   with no canvas patching. It depends on the upstream timeline and a Vega upgrade.
2. **Ship the prototype approach now.** It's canvas only. Patching `fillStyle` is fragile across Vega
   versions and must be removed later. SVG would need a second mechanism (adding `<pattern>`
   definitions into the SVG `<defs>`), which was never built.
3. **Contribute to #4290.** Give review feedback from the prototype: DPI-correct tile sizing,
   color-matched pattern/solid pairs, and dual-facet scale composition. Keep comments generic.
   `setTransform` works in browsers; their raster-baked workaround is only needed for `node-canvas`.

## Recommendation

Option 1, optionally with 3. Close #883 and keep the `canvasOverlay` branch as a reference. When #4290
merges:

- Write a bar spec for the `pattern`/`patterns` API above, using the native `Pattern` value in place of
  `{ pattern, foreground }`. That value already uses the same `foreground` name.
- Carry over the facet-list, empty-groupby and renderer lessons.
- Before moving that spec to `implemented`, verify that legend highlight and hover dimming work over
  pattern fills.
