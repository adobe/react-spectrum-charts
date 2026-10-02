# @spectrum-charts/constants

## 1.54.0

### Minor Changes

- 0e60423: S2 Donut `ChartInspect` and `ChartPopover` now render default content (color swatch, series name, and share of the visible total with its short-number value, e.g. `65.2% (23K)`, formatted with the chart locale) without requiring children.

  When children are provided inside a `Donut`, their content replaces the default content.

  `@spectrum-charts/vega-spec-builder-s2` exports a new `formatPercentWithValue(locale)` formatter used for this content.

### Patch Changes

- fd19202: Pre-Alpha S2 Donut fixes for label positioning, truncation, spacing, and dense collision handling; fixing visibility of tiny segments; and fixing semicircle summary delta overlap.

## 1.53.0

### Minor Changes

- bbb5b70: Add early accessibility and keyboard-navigation prototypes for Spectrum 2 bar charts and axes. This includes hierarchical bar and stacked-bar navigation, axis-label navigation and tooltips, orientation-aware segment traversal, focus and activation behavior, and clearer accessible labels. (#907, #913, #915, #918)

### Patch Changes

- bbb5b70: Update Spectrum 2 hover opacity animations to use a 250 ms ease-in-out transition. (#902)
