---
status: new
figma_section: "Single series"
figma_variant: "Single trend with gradient and forecast"
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Forecast / Projected Line Pattern

## Design Intent

Extend a historical line chart into a future projection by visually distinguishing the forecast segment: solid line for actuals, dotted line for projected values, with a vertical reference line marking the forecast boundary and a "Forecast" label. A gradient fill optionally covers the historical segment.

## Visual Observations

- Single-series chart: solid blue line with gradient fill up to a vertical divider labeled "Forecast"
- After the divider: a dotted blue line continuing upward to show the projected trend
- The "Forecast" label appears above the vertical reference line at the cutoff point
- Both segments share the same color (blue)
- x-axis spans from historical dates into future months

## Feature Comparison

**Status**: `supported`

This is a composition of existing features — no new feature needed:

1. **Gradient fill**: `gradient: true` on `<Line>` — covers the historical segment and extends under the forecast segment
2. **Vertical reference line**: `<ReferenceLine>` child of `<Axis>` at the forecast cutoff date with a label
3. **Dotted forecast segment**: Structure the data so the series contains both historical (not null) and forecast (not null) data points; add a second boolean/categorical field (e.g., `isForecast`) and map `lineType` to that field:
   ```tsx
   <Line lineType={{ field: 'isForecast', range: ['solid', 'dashed'] }} />
   ```

All three building blocks are supported in S2. The pattern requires data preparation (two segments as a unified series or a paired series joined at the cutoff) and a `<ReferenceLine>` for the boundary label.

## Analysis Artifact

```json
{
  "sectionTitle": "Single series",
  "sectionDescription": "Use a single-series line chart to highlight patterns, simplify the story, and focus attention.",
  "sectionType": "design",
  "chartInstanceName": "Line chart — forecast",
  "chartVariant": "Single trend with gradient and forecast",
  "variantSource": "figma-prop",
  "companionSizes": [],
  "figmaNodeId": "2125:109093",
  "figmaSectionNodeId": "2125:109093",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093",
  "structureFile": "./tmp/plan-s2-line/structure-single-series.json",
  "coreFeature": "forecast-pattern",
  "chartType": "line",
  "chartSize": "unknown",
  "frameWidth": 1200,
  "frameHeight": 2040,
  "seriesCount": 1,
  "hasLegend": false,
  "hasDirectLabels": false,
  "hasGradient": true,
  "hasReferenceLine": true,
  "hasMetricRange": false,
  "hasTrendline": false,
  "interpolationType": "linear",
  "interactionShown": "none",
  "explanatoryText": null,
  "status": "supported",
  "confidence": "high",
  "ambiguities": ["Whether gradient should extend only over historical or also over forecast segment — unclear from design"]
}
```

## Node Structure

Key nodes identified:
- **Section frame**: `2125:109093` — Single series (1200×2040)

## Reference Image

Screenshotted from Figma section **"Single series"**, node `2125:109093`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093`
