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

### Patch Changes

- Updated dependencies [bf42a3d]
  - @spectrum-charts/vega-spec-builder-s2@0.10.0

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
