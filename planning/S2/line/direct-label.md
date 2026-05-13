---
status: supported
figma_section: "Multiple series"
figma_variant: "Trend compared to past (YoY)"
figma_node_id: "2125:109150"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150"
---

# Direct Labels

## Design Intent

Label line series directly at their endpoints instead of using a detached legend, reducing the eye movement between line and label. Direct labels are shown at the end of each series (rightmost data point) with the series name. Multiple charts across the guidelines use this pattern — single series (showing the metric value), multi-series (showing the series name), and mixed (legend + direct labels together).

## Visual Observations

- Used in at least 4 chart designs across the guidelines:
  - Single series "Steady growth in Chrome visits": end label shows current value "9.5M" with a static endpoint circle
  - Multi-series "Chrome leads monthly browser traffic" (3 series): end labels Chrome, Safari, Edge — no legend shown
  - Multi-series "Best-selling video games": end labels Tetris, Minecraft alongside a legend
  - YoY "Chrome users showed better performance": end labels "2024" (solid pink), "2023" (dashed gray)
- Labels are right-aligned with the series line terminus
- In single-series, the label shows the metric value rather than the series name

## Feature Comparison

**Status**: `supported`

`<LineDirectLabel>` child component exists in S2 with props: `position`, `value`, `format`, `prefix`, `excludeSeries`. The default position is `'end'`.

No gaps identified between what's shown in the Figma and the current implementation.

## Analysis Artifact

```json
{
  "sectionTitle": "Multiple series",
  "sectionDescription": "Use multi-series line charts to compare trends. Limit the number of lines to six to keep it readable.",
  "sectionType": "design",
  "chartInstanceName": "Line chart",
  "chartVariant": "Trend compared to past (YoY)",
  "variantSource": "figma-prop",
  "companionSizes": [],
  "figmaNodeId": "2125:109150",
  "figmaSectionNodeId": "2125:109150",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150",
  "structureFile": "./tmp/plan-s2-line/structure-pair-of-series.json",
  "coreFeature": "direct-label",
  "chartType": "line",
  "chartSize": "unknown",
  "frameWidth": 1200,
  "frameHeight": 2040,
  "seriesCount": 2,
  "hasLegend": false,
  "hasDirectLabels": true,
  "hasGradient": false,
  "hasReferenceLine": false,
  "hasMetricRange": false,
  "hasTrendline": false,
  "interpolationType": "linear",
  "interactionShown": "none",
  "explanatoryText": null,
  "status": "supported",
  "confidence": "high",
  "ambiguities": []
}
```

## Node Structure

Key nodes identified:
- **Section frame**: `2125:109150` — A pair of series (1200×2040)

## Reference Image

Screenshotted from Figma section **"Multiple series"**, node `2125:109150`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150`
