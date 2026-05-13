---
status: new
figma_section: "Small multiple"
figma_variant: "Trellis"
figma_node_id: "2125:109369"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109369"
---

# Trellis / Small Multiple Layout

## Design Intent

Display multiple related line series each in its own panel, arranged in a grid, so that individual patterns are easy to read without overlapping lines. When there are more than six series, trellis keeps each series clear and makes patterns easy to scan side by side.

## Visual Observations

- Two trellis layouts shown:
  - **Horizontal panels**: Chrome, Safari, Edge, Firefox each in a separate column panel; first panel has full y-axis labels and a "Monthly visits" axis title; remaining panels share the same scale but show no redundant axis labels
  - **Toggle variant**: A "One chart / Trellis" toggle button switches between combined multi-series view and trellis view; "Trellis" selected shows 5 panels arranged in 2 rows (Chrome, Safari, Edge, Firefox, IE 11)
- Shared y-axis scale across all panels (with only the leftmost/bottom panels showing axis labels)
- Shared x-axis time labels on the last row only
- Legend appears above the trellis showing all series colors
- Each panel has its own colored line but the same x/y extents

## Feature Comparison

**Status**: `new`

`trellis`, `trellisOrientation`, and `trellisPadding` props already exist on the S2 `Bar` component. They are not present in `LineOptions` or `LineSpecOptions` in `vega-spec-builder-s2`. Porting this pattern from Bar to Line is the primary work.

The s1 Bar implementation at `vega-spec-builder/src/bar/barSpecBuilder.ts` can serve as a reference for how trellis faceting is wired into the Vega spec (group marks, scale faceting, shared axis suppression on inner panels).

## Implementation Notes

Add to `LineOptions`:
```ts
/** The data field used for the trellis categories */
trellis?: string;
/** Orientation of the trellis panels. Defaults to "horizontal". */
trellisOrientation?: 'horizontal' | 'vertical';
/** Padding between trellis groups (0–1 ratio). Defaults to 0.2. */
trellisPadding?: number;
```

Files that would need changes:
- `vega-spec-builder-s2/src/types/marks/lineSpec.types.ts` — add trellis fields to `LineOptions`
- `vega-spec-builder-s2/src/line/lineSpecBuilder.ts` — add trellis group mark wrapping (reference Bar's `addTrellis` logic)
- `react-spectrum-charts-s2/src/types/marks/line.types.ts` — pass through trellis props
- `react-spectrum-charts-s2/src/components/Line/Line.tsx` — default values

The toggle interaction ("One chart / Trellis") shown in the Figma is a UI affordance built on top of the chart, not a chart feature itself — no chart-level prop needed for the toggle.

## Analysis Artifact

```json
{
  "sectionTitle": "Small multiple",
  "sectionDescription": "Use small multiples (also called trellis charts) to compare trends across many related categories. When there are more than six lines to show, this layout keeps each series clear and makes patterns easy to scan side by side.",
  "sectionType": "design",
  "chartInstanceName": "Line chart — trellis",
  "chartVariant": "Trellis",
  "variantSource": "figma-prop",
  "companionSizes": [],
  "figmaNodeId": "2125:109369",
  "figmaSectionNodeId": "2125:109369",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109369",
  "structureFile": "./tmp/plan-s2-line/structure-small-multiple.json",
  "coreFeature": "trellis",
  "chartType": "line",
  "chartSize": "unknown",
  "frameWidth": 1200,
  "frameHeight": 1000,
  "seriesCount": 5,
  "hasLegend": true,
  "hasDirectLabels": false,
  "hasGradient": false,
  "hasReferenceLine": false,
  "hasMetricRange": false,
  "hasTrendline": false,
  "interpolationType": "linear",
  "interactionShown": "none",
  "explanatoryText": "Use small multiples (also called trellis charts) to compare trends across many related categories. When there are more than six lines to show, this layout keeps each series clear and makes patterns easy to scan side by side.",
  "status": "new",
  "confidence": "high",
  "ambiguities": ["How to handle shared vs. per-panel axis label suppression", "Whether inner-panel axis labels are auto-suppressed or require prop control"]
}
```

## Node Structure

Full traversal saved to `./tmp/plan-s2-line/structure-small-multiple.json`.

Key nodes identified:
- **Section frame**: `2125:109369` — Small multiple (1200×1000)

## Reference Image

Screenshotted from Figma section **"Small multiple"**, node `2125:109369`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109369`
