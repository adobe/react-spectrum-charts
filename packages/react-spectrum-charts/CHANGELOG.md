# @adobe/react-spectrum-charts

## 1.53.0

### Minor Changes

- 003dddd: ReferenceLine labels on vertical axes are now aligned away from the chart so long labels no longer overlap the axis or the line. Adds a `labelPosition` prop (`'axis' | 'start' | 'end'`) to draw the label inside the chart area as a badge that flips to stay within the chart bounds.
- c70b1c4: S2 legends positioned at the bottom or top are now left-aligned (`align: 'start'`) by default instead of centered. This also applies to S1 charts using the `s2` prop; S1 charts without it are unchanged. Pass `align="middle"` to keep the previous centered layout.

### Patch Changes

- 4c6f4bf: Chart props explicitly set to `undefined` now fall back to their defaults instead of overriding them.
- Updated dependencies [25dbb44]
- Updated dependencies [4ec4e4d]
- Updated dependencies [003dddd]
- Updated dependencies [0e60423]
- Updated dependencies [c70b1c4]
- Updated dependencies [fd19202]
  - @spectrum-charts/vega-spec-builder@1.53.0
  - @spectrum-charts/constants@1.54.0
  - @spectrum-charts/themes@1.53.0

## 1.52.1

### Patch Changes

- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
- Updated dependencies [bbb5b70]
  - @spectrum-charts/constants@1.53.0
  - @spectrum-charts/vega-spec-builder@1.52.1
