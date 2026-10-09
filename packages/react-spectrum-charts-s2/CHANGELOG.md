# @spectrum-charts/react-spectrum-charts-s2

## 0.10.0

### Minor Changes

- bf42a3d: Improve S2 bar accessible navigation:
  Updated focus element position accuracy for screen magnifiers.

  Added keyboard and focus ring support for dodged bars.

  Added meaningful summaries of focused regions for screen readers while focusing elements in dodged and stacked bars.
  (e.g. "Browser: Chrome. Operating system: Windows, Downloads: 5. Operating system: Mac, Downloads: 3.")

  Whole-chart focus provides a "metric by dimension" summary (e.g. "Downloads by Browser chart, grouped by Operating system. 3 groups.") instead of a raw field-name id.

  Tabbing out of the chart now keeps the focused node so Shift+Tab returns to it (rather than resetting to the "Enter navigation area" button)

  Leaving the chart reverts the focus dimming so the non-focused marks return to full opacity.

- 9922dc7: S2 Donut: hovering a segment now shows its label even when it was hidden by label collision or because the segment is below the minimum label angle. Labels that would collide with the hovered label are hidden while it is hovered. (AN-495008)
- ef12f11: Add `ChartActionBar`, a new Line child component for Spectrum 2 charts. Clicking a data point shows a floating contextual toolbar with consumer-defined actions, overflow handling for actions that don't fit inline, drag-to-reposition, and an emphasized visual style option. (#797)
- 6a66423: Add `@spectrum-charts/core-s2`, an S2-only package with `constants`, `locales`, `tokens`, and `utils` subpath exports. The S2 packages now depend on it instead of the shared `@spectrum-charts/constants`, `themes`, `utils`, and `locales` packages, so S2 no longer has to stay in sync with S1. `@spectrum-charts/react-spectrum-charts-s2` no longer re-exports the S1-only `getSpectrumVegaConfig`.
- 0e60423: S2 Donut `ChartInspect` and `ChartPopover` now render default content (color swatch, series name, and share of the visible total with its short-number value, e.g. `65.2% (23K)`, formatted with the chart locale) without requiring children.

  When children are provided inside a `Donut`, their content replaces the default content.

  `@spectrum-charts/vega-spec-builder-s2` exports a new `formatPercentWithValue(locale)` formatter used for this content.

- 7363290: Ship the S2 packages as per-module ES modules built with Rollup, so bundlers share dependencies with the app and tree-shake unused code. In a consumer webpack build this cuts what `@spectrum-charts/react-spectrum-charts-s2` adds to an app that already uses React Spectrum S2 from about 350 KB to about 175 KB gzip, mostly by no longer bundling private copies of `@react-spectrum/s2` and React Aria.

  Breaking changes:

  - `@spectrum-charts/core-s2`, `@spectrum-charts/schemas`, `@spectrum-charts/vega-spec-builder-s2` and `@spectrum-charts/react-spectrum-charts-s2` are ESM-only (`"type": "module"` with an `exports` map). `require()`, the UMD global, and deep imports into `dist/` are no longer supported.
  - The packages declare `engines.node >=20.19.0`.
  - `@spectrum-charts/react-spectrum-charts-s2` adds `react-aria-components` `^1.14.0` as a peer dependency, so it shares React Aria context with `@react-spectrum/s2`.
  - The `./alpha` and `./beta` subpath exports of `@spectrum-charts/react-spectrum-charts-s2` are removed; they never pointed at published files.
  - Jest consumers must transform `@spectrum-charts/*` and stub CSS imports. See "Module format" in the S2 overview docs.

  Type declarations now resolve under `moduleResolution` `node16`/`nodenext` as well as `bundler`.

- c70b1c4: S2 legends positioned at the bottom or top are now left-aligned (`align: 'start'`) by default instead of centered. This also applies to S1 charts using the `s2` prop; S1 charts without it are unchanged. Pass `align="middle"` to keep the previous centered layout.

### Patch Changes

- 4ec4e4d: S2 Donut: the gap between the ring and its segment labels now scales with donut size (5px for small, 10px for medium/large, 15px for extra large) instead of a fixed 20px. Donut size is now based on chart size.
- 7426d40: The chart animations will respect the "reduce motion" setting on a users operating system.
- 9cfd99c: Remove the startAngle and otherItemColor prop from the S2 Donut.
- 5147cc4: S2 animations run on a shared on-demand ticker instead of each chart's always-on Vega timer.

  - Idle charts do no animation work; off-screen charts pause.
  - Animations run at the display's native refresh rate, within an 8ms per-frame budget across charts.
  - Draw-in starts on the first painted frame, so slow mounts no longer skip most of the animation.

- 6106b65: Add opt-in clockwise draw-in animations for S2 donuts with labels fading in linearly over 50ms after their slices finish drawing.
- 0571b96: Animate S2 donut segment and label opacity with the shared hover animation system.
- b042f60: Match S2 donut label interactions to their slices, including animated hover highlighting, inspect tooltips, and popovers.
- 4742b30: EmptyState now uses the S2 `ChartBarVert` icon instead of the undeclared S1 `@spectrum-icons/workflow` icon. This removes the S1 icon and provider code from the bundle: about 68 KB minified (7 KB gzip) less for a consumer rendering a bar chart.
- fd19202: Pre-Alpha S2 Donut fixes for label positioning, truncation, spacing, and dense collision handling; fixing visibility of tiny segments; and fixing semicircle summary delta overlap.
- Updated dependencies [25dbb44]
- Updated dependencies [bf42a3d]
- Updated dependencies [9922dc7]
- Updated dependencies [2ff88a7]
- Updated dependencies [4ec4e4d]
- Updated dependencies [7426d40]
- Updated dependencies [9cfd99c]
- Updated dependencies [ef12f11]
- Updated dependencies [5147cc4]
- Updated dependencies [3454151]
- Updated dependencies [6a66423]
- Updated dependencies [0e60423]
- Updated dependencies [6106b65]
- Updated dependencies [0571b96]
- Updated dependencies [b042f60]
- Updated dependencies [7363290]
- Updated dependencies [e404467]
- Updated dependencies [eee0b6e]
- Updated dependencies [c70b1c4]
- Updated dependencies [778d18a]
- Updated dependencies [2fe8a2c]
- Updated dependencies [904b468]
- Updated dependencies [d7e5b00]
- Updated dependencies [fd19202]
  - @spectrum-charts/vega-spec-builder-s2@0.10.0
  - @spectrum-charts/core-s2@0.10.0
  - @spectrum-charts/schemas@2.0.0

## 0.9.0

### Minor Changes

- bbb5b70: Add early accessibility and keyboard-navigation prototypes for Spectrum 2 bar charts and axes. This includes hierarchical bar and stacked-bar navigation, axis-label navigation and tooltips, orientation-aware segment traversal, focus and activation behavior, and clearer accessible labels. (#907, #913, #915, #918)

### Patch Changes

- 11df471: Publish Spectrum 2 packages through the standard release channel instead of the permanent `alpha` npm tag.
- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
  - @spectrum-charts/constants@1.53.0
  - @spectrum-charts/vega-spec-builder-s2@0.9.0
