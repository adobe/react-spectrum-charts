---
status: supported
figma_section: "Multiple series"
figma_variant: "Trend compared to past (YoY)"
figma_node_id: "2125:109150"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150"
---

# Multiple Series with Line Type Faceting

## Design Intent

Use distinct line types (solid vs. dashed) to differentiate series in a multi-series comparison, particularly for year-over-year or current-vs-baseline comparisons. This reduces reliance on color alone for series differentiation and works well when two series should be perceived as "same metric, different time period."

## Visual Observations

- "Chrome users showed better performance..." chart: 2-series YoY
  - 2024: solid pink line with direct end label "2024"
  - 2023: dashed gray line with direct end label "2023"
  - No legend; differentiation entirely via line style + direct labels
- Other multi-series charts show all-solid series differentiated by color only
- "User retention by cohort": 4 series (Power, Regular, Casual, Trial) with legend — all solid, different colors with monotone curve interpolation

## Feature Comparison

**Status**: `supported`

`lineType` prop on `LineOptions` accepts a `LineTypeFacet` which can be a static value (`'solid'`, `'dashed'`, `'dotted'`, etc.) or a data-field facet reference. Combined with `<LineDirectLabel>`, this covers the full YoY pattern shown in the Figma.

No gaps identified.

## Analysis Artifact

```json
{
  "sectionTitle": "Multiple series",
  "sectionDescription": "Use multi-series line charts to compare trends. Limit the number of lines to six to keep it readable. For more categories, use a trellis layout or highlight key series while fading the rest.",
  "sectionType": "design",
  "chartInstanceName": "Line chart — YoY",
  "chartVariant": "Trend compared to past (YoY)",
  "variantSource": "figma-prop",
  "companionSizes": [],
  "figmaNodeId": "2125:109150",
  "figmaSectionNodeId": "2125:109150",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150",
  "structureFile": "./tmp/plan-s2-line/structure-pair-of-series.json",
  "coreFeature": "multi-series-line-type",
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
  "explanatoryText": "Use multi-series line charts to compare trends. Limit the number of lines to six to keep it readable.",
  "status": "supported",
  "confidence": "high",
  "ambiguities": []
}
```

## Node Structure

Key nodes identified:
- **Section frame**: `2125:109150` — Multiple series (1200×2040)

## Reference Image

Screenshotted from Figma section **"Multiple series"**, node `2125:109150`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150`
