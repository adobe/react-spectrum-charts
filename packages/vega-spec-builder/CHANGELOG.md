# @spectrum-charts/vega-spec-builder

## 1.53.1

### Patch Changes

- ca1a73a: Spectrum 2 categorical colors now use their dark values when `colorScheme` is `dark`, both as `categorical-*` tokens and in the `s2Categorical` palettes.
- Updated dependencies [ca1a73a]
  - @spectrum-charts/themes@1.53.1

## 1.53.0

### Minor Changes

- 003dddd: ReferenceLine labels on vertical axes are now aligned away from the chart so long labels no longer overlap the axis or the line. Adds a `labelPosition` prop (`'axis' | 'start' | 'end'`) to draw the label inside the chart area as a badge that flips to stay within the chart bounds.

### Patch Changes

- 25dbb44: Bullet value labels always use gray-900 instead of the threshold color when `thresholdBarColor` is enabled, matching side labels.
- Updated dependencies [ba758b4]
- Updated dependencies [c70b1c4]
  - @spectrum-charts/constants@1.54.0
  - @spectrum-charts/themes@1.53.0

## 1.52.1

### Patch Changes

- bbb5b70: Add accessible descriptions to horizontal bar marks so their SVG graphics expose accessible text. (#893)
- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
  - @spectrum-charts/constants@1.53.0
