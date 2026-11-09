# @spectrum-charts/constants

## 1.54.0

### Minor Changes

- ba758b4: Update the S2 Donut constants: label ring gaps now scale by size tier (`DONUT_LABEL_RING_GAPS`), and new constants cover semicircle radius, size tiers, label spacing, and the boolean secondary color. `DONUT_LABEL_RING_GAP`, `DONUT_ADVANCED_LABEL_RING_GAP`, and `DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO` are removed.

## 1.53.0

### Minor Changes

- bbb5b70: Add early accessibility and keyboard-navigation prototypes for Spectrum 2 bar charts and axes. This includes hierarchical bar and stacked-bar navigation, axis-label navigation and tooltips, orientation-aware segment traversal, focus and activation behavior, and clearer accessible labels. (#907, #913, #915, #918)

### Patch Changes

- bbb5b70: Update Spectrum 2 hover opacity animations to use a 250 ms ease-in-out transition. (#902)
