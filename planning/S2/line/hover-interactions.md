---
status: supported
figma_section: "Behaviors"
figma_variant: "N/A"
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# Hover Interactions

## Design Intent

Line charts support two hover modes: hovering near a data point highlights that point and shows a tooltip; hovering directly on a line segment highlights the series. Selection (click) persists the highlighted state. These interactions help users read precise values and compare series without visual clutter.

## Visual Observations

Behaviors section shows 4 distinct interaction states:
1. **Hover on a single data point**: vertical crosshair line, highlighted dot at hovered point, tooltip showing values for all series at that x-position
2. **Hovering the first-line area** (line hover): the hovered series highlights while others dim; a tooltip appears alongside
3. **Hover on a null value**: no tooltip or highlight shown at the gap; nearby valid points remain interactive
4. **Selection**: clicking a point persists the highlight (selected state replaces hover state)

Multi-series tooltip shows all series values stacked; single-series tooltip shows the single value. Tooltip layout matches S2 design tokens.

## Feature Comparison

**Status**: `partial`

Baseline hover behaviors (crosshair, series dimming, tooltip, popover, onClick) map to existing S2 props. However, the second transcript session (May 11 afternoon) identified several new hover behaviors not yet implemented:

- **Hover value label** (new): default on-hover label showing the metric value adjacent to the data point, without a `<ChartTooltip>`. See `tickets/hover-value-label.md`.
- **Line thickening on hover** (new): hovered line increases +0.5px in stroke width.
- **Hover point style** (gap): currently all hover points are hollow — S2 spec requires filled points with a background halo. Needs implementation.
- **Hover rule z-order** (gap): rule must be behind the hovered line but in front of faded lines.

Previously verified as supported:
- `<ChartTooltip>` — shows the tooltip on hover
- `<ChartPopover>` — shows a popover on click
- `interactionMode: 'nearest' | 'item'` — controls whether hover highlights the nearest series or the specific item under the cursor
- `onClick` prop — handles click selection
- `onContextMenu` / `contextMenuMode` — context menu support

The crosshair line, dimming of non-hovered series, and selection highlighting are all part of the built-in interaction behavior in S2 — no additional props needed.

## Analysis Artifact

```json
{
  "sectionTitle": "Behaviors",
  "sectionDescription": null,
  "sectionType": "design",
  "chartInstanceName": "Line chart — interactions",
  "chartVariant": null,
  "variantSource": "visual-only",
  "companionSizes": [],
  "figmaNodeId": "2125:109488",
  "figmaSectionNodeId": "2125:109488",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488",
  "structureFile": "./tmp/plan-s2-line/structure-behaviors.json",
  "coreFeature": "hover-interactions",
  "chartType": "line",
  "chartSize": "unknown",
  "frameWidth": 1440,
  "frameHeight": 5250,
  "seriesCount": 3,
  "hasLegend": true,
  "hasDirectLabels": false,
  "hasGradient": false,
  "hasReferenceLine": false,
  "hasMetricRange": false,
  "hasTrendline": false,
  "interpolationType": "linear",
  "interactionShown": "tooltip",
  "explanatoryText": null,
  "status": "supported",
  "confidence": "high",
  "ambiguities": []
}
```

## Node Structure

Key nodes identified:
- **Section frame**: `2125:109488` — Behaviors (1440×5250)

## Reference Image

Screenshotted from Figma section **"Behaviors"**, node `2125:109488`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488`
