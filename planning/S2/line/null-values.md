---
status: supported
figma_section: "Behaviors"
figma_variant: "Null values"
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# Null Values (Data Gaps)

## Design Intent

When a data series has missing or unavailable values, the line breaks at those positions rather than connecting to zero or interpolating. The gap clearly signals to the user that data is absent rather than zero. Hover interaction skips null positions — no tooltip or highlight appears over the gap.

## Visual Observations

- Behaviors section shows multiple charts with explicit gaps in lines
- At null positions: no line segment is drawn, no dot is shown
- Adjacent non-null segments remain fully interactive
- When hovering near a null position, the nearest valid point is highlighted instead
- Gaps are visually distinct from low values near zero

## Feature Comparison

**Status**: `supported`

Null/undefined metric values in the data produce gaps automatically via Vega's built-in `defined` encoding on line marks. No special chart prop is needed — if `data[i].value === null` or `data[i].value === undefined`, Vega omits that point and breaks the line.

No gaps identified. This is Vega's default behavior and requires only that the developer set missing values to `null` (not `0`) in their data.

## Analysis Artifact

```json
{
  "sectionTitle": "Behaviors",
  "sectionDescription": null,
  "sectionType": "design",
  "chartInstanceName": "Line chart — null values",
  "chartVariant": "Null values",
  "variantSource": "figma-prop",
  "companionSizes": [],
  "figmaNodeId": "2125:109488",
  "figmaSectionNodeId": "2125:109488",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488",
  "structureFile": "./tmp/plan-s2-line/structure-behaviors.json",
  "coreFeature": "null-values",
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
  "interactionShown": "none",
  "explanatoryText": "When a data point is unavailable (null), the line breaks rather than connecting to zero.",
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
