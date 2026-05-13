---
status: supported
figma_section: "Single series"
figma_variant: "Single trend with gradient and forecast"
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Gradient Fill

## Design Intent

A subtle gradient fill beneath the line fades from the line color to transparent, adding visual weight to single-series charts that are focal points of a page. The gradient emphasizes the magnitude of change over time without obscuring data precision.

## Visual Observations

- Single-series blue line with a soft blue gradient fill below it, fading to white/transparent at the bottom
- Used in the "MAU trend overview and forecast" chart in the Single series section
- Also visible in sparkline cards (red/green gradient fills for negative/positive trends)
- The gradient respects the series color (blue line → blue fill)
- In the forecast chart, the gradient covers the solid historical portion; the dotted forecast continuation also carries the gradient

## Feature Comparison

**Status**: `supported`

`gradient: boolean` prop exists on `LineOptions` in S2. Setting `gradient: true` adds the gradient fill below the line using the series color. No gaps identified.

## Analysis Artifact

```json
{
  "sectionTitle": "Single series",
  "sectionDescription": "Use a single-series line chart to highlight patterns, simplify the story, and focus attention.",
  "sectionType": "design",
  "chartInstanceName": "Line chart",
  "chartVariant": "Single trend with gradient and forecast",
  "variantSource": "figma-prop",
  "companionSizes": [],
  "figmaNodeId": "2125:109093",
  "figmaSectionNodeId": "2125:109093",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093",
  "structureFile": "./tmp/plan-s2-line/structure-single-series.json",
  "coreFeature": "gradient-fill",
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
  "explanatoryText": "A subtle gradient beneath the line can add emphasis when the chart is a visual focal point.",
  "status": "supported",
  "confidence": "high",
  "ambiguities": []
}
```

## Node Structure

Key nodes identified:
- **Section frame**: `2125:109093` — Single series (1200×2040)

## Reference Image

Screenshotted from Figma section **"Single series"**, node `2125:109093`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093`
