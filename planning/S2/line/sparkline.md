---
status: supported
figma_section: "Sparkline"
figma_variant: "N/A"
figma_node_id: "2125:109338"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109338"
---

# Sparkline

## Design Intent

A sparkline is a compact, axis-free line chart embedded in a table row or small card, giving a quick visual read of upward, downward, or volatile movement without precise values. An optional gradient fill helps convey the relative magnitude of change even without a visible y-axis. An endpoint dot (static point) marks the most recent value.

## Visual Observations

- Two sparkline contexts shown:
  1. **Table rows**: 4 rows each with a compact blue sparkline (with endpoint dot and subtle blue gradient fill) + a numeric value (e.g., 6,345,980). Axes and labels absent. Lines fill a compact horizontal band.
  2. **Metric cards**: Horizontal row of 3 sparkline cards, each showing a labeled metric (-2.6% red, +3.5% green) with a small sparkline below. Negative metric → red sparkline with red gradient fill; positive → green sparkline with green fill.
- All sparklines: no axes, no tick labels, no chart title
- Gradient fill adapts to series color (blue/red/green)
- Endpoint circle dot present on sparklines in the table view

## Feature Comparison

**Status**: `supported`

S2 `LineOptions` has:
- `isSparkline: boolean` — removes axes, removes padding, applies sparkline-specific rendering
- `isMethodLast: boolean` — adds a static point at the last data point (the endpoint dot)
- `gradient: boolean` — adds gradient fill; works in combination with sparkline mode
- `staticPoint: string` — alternative for marking arbitrary data points, but `isMethodLast` is the right prop for the endpoint dot shown in Figma

No gaps identified between the Figma design and current S2 support.

## Analysis Artifact

```json
{
  "sectionTitle": "Sparkline",
  "sectionDescription": "Use a sparkline to show a simple, compact trend. Without axes or precise values, it offers a quick visual read of upward, downward, or volatile movement. Sparklines work especially well in tables or grids.",
  "sectionType": "design",
  "chartInstanceName": "Sparkline",
  "chartVariant": null,
  "variantSource": "visual-only",
  "companionSizes": [],
  "figmaNodeId": "2125:109338",
  "figmaSectionNodeId": "2125:109338",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109338",
  "structureFile": "./tmp/plan-s2-line/structure-sparkline.json",
  "coreFeature": "sparkline",
  "chartType": "line",
  "chartSize": "S",
  "frameWidth": 1200,
  "frameHeight": 336,
  "seriesCount": 1,
  "hasLegend": false,
  "hasDirectLabels": false,
  "hasGradient": true,
  "hasReferenceLine": false,
  "hasMetricRange": false,
  "hasTrendline": false,
  "interpolationType": "linear",
  "interactionShown": "none",
  "explanatoryText": "Use a sparkline to show a simple, compact trend. Without axes or precise values, it offers a quick visual read of upward, downward, or volatile movement. A subtle gradient fill can help convey the relative magnitude of change, even without a visible y-axis.",
  "status": "supported",
  "confidence": "high",
  "ambiguities": []
}
```

## Node Structure

Key nodes identified:
- **Section frame**: `2125:109338` — Sparkline (1200×336)

## Reference Image

Screenshotted from Figma section **"Sparkline"**, node `2125:109338`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109338`
