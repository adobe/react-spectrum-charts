---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

S2 Scatter (lab) now animates: points grow in from left to right when the chart mounts, and hovering a point or legend entry, or a controlled highlight, eases points in and out of their faded state. `animationTypes` and `animations` on `Chart` control both.

`Scatter` also gains `onClick` and `onContextMenu`, called with the nearest point's row.

New `outline` prop on `Scatter` draws a thin gray border so pale points stay visible: `auto` (default) outlines only points with less than 3:1 contrast against the background, `always` outlines every point, and `never` turns it off. `stroke` and `lineWidth` still take precedence.
