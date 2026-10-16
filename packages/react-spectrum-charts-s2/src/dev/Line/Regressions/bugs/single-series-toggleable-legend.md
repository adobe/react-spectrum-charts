# Toggleable legend reported broken with the single series dataset

## Reproduction

Select the single series dataset in the Line variation dashboard and view the
"Toggleable legend" variation.

## Confirmed behavior

Hiding the only series empties the axis domains. The legend remains available
and toggling it reveals the line again, but the hidden state has empty axes.

## Resolution

This variation sets `defaultHiddenSeries` to the first series and enables
`isToggleable`. With a single series, all line data starts hidden by design.
Keep this behavior and the ability to hide every series. Line charts derive
their axis domains from the full dataset, so hiding or showing lines does not
change the axes. No fallback datasets are needed.

See `legend-toggleable` in
`packages/react-spectrum-charts-s2/src/dev/Line/Dashboards/line.dashboard.tsx`.

The regression story is `SingleSeriesToggleableLegend.story.tsx` in this
directory's parent.

## Hidden legend entry variation

`legend-hidden-entries` intentionally removes the last legend entry. With a
single series, this should remove the entire legend but leave the line visible.
An empty Vega legend instead produced invalid layout bounds and collapsed the
plot height to zero. Empty legends now skip layout and hide their title until
entries are available again. The regression story is
`SingleSeriesHiddenLegendEntry.story.tsx` in this directory's parent.
