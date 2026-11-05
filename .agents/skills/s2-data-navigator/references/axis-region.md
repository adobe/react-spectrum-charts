# Axis region

`dataNavigator/axisRegion.ts`, built from `buildAxisStructure`. Only the bottom axis of a **vertical** chart with a categorical dimension gets a region (`getNavigableChart` sets `xAxis`); a horizontal bar's category axis is on the left.

- Ticks are restricted to labels Vega actually painted (`getVisibleAxisLabelColumns`), so overlap-hidden ticks and empty labels are skipped.
- The ring is a DOM overlay (`.dn-axis-focus-ring`) because it can extend past the plot's clipped bounds. The root rings the whole label row; a tick rings its label.
- Focusing a tick calls `chartRegion.highlightDimension(node)` and shows the label's React Spectrum tooltip (`showAxisLabelTooltip`), which dismisses itself on Escape. It clears the chart's focus signals so no mark ring shows.
- Space is swallowed (labels have no popover). Enter/Escape and arrows are plain structure moves.
- `restore` re-highlights the dimension after a mouseout cleared it; ticks never drive the chart tooltip.
