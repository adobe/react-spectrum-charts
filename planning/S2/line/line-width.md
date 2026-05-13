---
status: partial
figma_section: "Line weight"
figma_variant: "N/A"
figma_node_id: "2125:109427"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427"
---

# Line Weight (Stroke Width)

## Design Intent

The default line weight for Spectrum 2 charts is 3px. Developers should adjust the weight based on chart size and purpose: 3px for large presentation charts, 2px for medium charts in widgets or trellis, and 1.5px for sparklines and mini-viz. Larger charts can support thicker lines for emphasis; smaller layouts benefit from thinner strokes for clarity.

## Visual Observations

- Reference table with three rows:
  - Large size chart (e.g., one chart per screen) → prioritize presentation, data storytelling → **3px weight**
  - Medium size chart (e.g., charts in big widgets, small multiple) → balanced in between → **2px weight**
  - Small size chart (e.g., sparkline, mini-viz) → prioritize accuracy, data analysis → **1.5px weight**
- Example charts below the table annotate lines with pink badges: "3px line" on a large single-series chart, "2px line" on a trellis/small-multiple view

## Feature Comparison

**Status**: `partial`

The mechanism exists: `lineWidths` is a `LineWidth[]` prop on `Chart` (part of `ChartProps` in `react-spectrum-charts-s2`). The `LineWidth` type maps T-shirt sizes to pixels:
- `'XS'` → 1px
- `'S'` → 1.5px
- `'M'` → 2px
- `'L'` → 3px
- `'XL'` → 4px
- `number` → exact value

What's missing: the **default** is `['M']` = 2px, but the Figma design specifies 3px (`'L'`) as the S2 standard. The constant `DEFAULT_LINE_WIDTHS = ['M']` is defined in `packages/constants/constants.ts:34`.

Additionally, the `lineWidths` prop is not documented as the mechanism for achieving the design spec's recommended weights, and there is no `lineWidth` prop directly on `<Line>` for a simple per-chart override (it exists only internally in `LineSpecOptions`).

## Implementation Notes

Two changes needed:

1. **Update the default** in `packages/constants/constants.ts`:
   ```ts
   export const DEFAULT_LINE_WIDTHS = ['L']; // was ['M']; Figma S2 spec: 3px default
   ```
   This affects all S2 charts globally. Verify this doesn't break existing stories/snapshots.

2. **Document the pattern** in the S2 docs page for Line. Developers choosing 2px (medium charts) or 1.5px (sparklines) should set:
   ```tsx
   <Chart lineWidths={['M']}> // 2px for trellis/widget context
   <Chart lineWidths={['S']}> // 1.5px for sparkline context
   ```

Optionally, add a `lineWidth` prop directly to `LineOptions` (not just `LineSpecOptions`) for per-mark override — but that may be over-engineering for initial S2 parity.

## Analysis Artifact

```json
{
  "sectionTitle": "Line weight",
  "sectionDescription": "The default line weight is 3px to match the visual style of the Spectrum 2 update. Adjust it based on the size of the chart, the screen it appears on, and its purpose.",
  "sectionType": "design",
  "chartInstanceName": "Line weight reference",
  "chartVariant": null,
  "variantSource": "visual-only",
  "companionSizes": [],
  "figmaNodeId": "2125:109427",
  "figmaSectionNodeId": "2125:109427",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427",
  "structureFile": "./tmp/plan-s2-line/structure-line-weight.json",
  "coreFeature": "line-width",
  "chartType": "line",
  "chartSize": "unknown",
  "frameWidth": 1200,
  "frameHeight": 1016,
  "seriesCount": 1,
  "hasLegend": false,
  "hasDirectLabels": false,
  "hasGradient": false,
  "hasReferenceLine": false,
  "hasMetricRange": false,
  "hasTrendline": false,
  "interpolationType": "linear",
  "interactionShown": "none",
  "explanatoryText": "The default line weight is 3px to match the visual style of the Spectrum 2 update. Adjust it based on the size of the chart, the screen it appears on, and its purpose. Larger charts and screens can support thicker lines for emphasis, while smaller layouts benefit from thinner strokes for clarity.",
  "status": "partial",
  "confidence": "high",
  "ambiguities": []
}
```

## Node Structure

Full traversal saved to `./tmp/plan-s2-line/structure-line-weight.json`.

Key nodes identified:
- **Section frame**: `2125:109427` — Line weight (1200×1016)

## Reference Image

Screenshotted from Figma section **"Line weight"**, node `2125:109427`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427`
