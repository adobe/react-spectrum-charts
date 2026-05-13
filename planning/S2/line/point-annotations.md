---
status: new
figma_section: "Single series"
figma_variant: "Single trend with annotated data"
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Point Annotations

## Design Intent

Annotate specific data points on a line with an event label and a callout arrow pointing to the data point. This is distinct from `LineDirectLabel` (which labels the end of a series) — point annotations mark interior data points and convey narrative context like "June 2024: New feature release drove engagement."

## Visual Observations

- Single-series line chart with two annotation callouts
- Each annotation: a filled circle at the data point, an arrow pointing outward, and a multi-line text label beside it
- Labels appear at arbitrary interior positions (not just line ends)
- Arrow direction adapts to avoid overlap (one points up-left, one points down-right)
- No legend shown
- Behavior section shows same pattern labeled "Annotated data"

## Feature Comparison

**Status**: `new`

`LineDirectLabel` places labels at the end of a series. It does not support labeling interior points or attaching callout arrows with event descriptions. No equivalent component or prop currently exists in S2.

The s1 package had `LinePointAnnotation` (a child component of `<Line>`), but it was not ported to S2. Per the current type files, it is listed as a "not yet supported" item — `LineOptions` has no `linePointAnnotations` array.

## Implementation Notes

A new `<LinePointAnnotation>` child component (or equivalent) is needed. Likely structure:

```tsx
<Line ...>
  <LinePointAnnotation dataKey="datetime" value="2024-06-01" label="New feature release\ndrove engagement" />
  <LinePointAnnotation dataKey="datetime" value="2024-09-01" label="Drop due to a big server outage" />
</Line>
```

Key design decisions:
- How is the annotation anchor specified? (a data field value, or a data row index)
- Auto-placement vs explicit placement of the arrow direction
- Multi-line label support
- Whether to support annotations on multi-series lines and how to disambiguate which series the point belongs to

Files that would need changes:
- `vega-spec-builder-s2/src/types/marks/lineSpec.types.ts` — add `linePointAnnotations?: LinePointAnnotationOptions[]` to `LineOptions`
- New file: `vega-spec-builder-s2/src/types/marks/supplemental/linePointAnnotationSpec.types.ts`
- `vega-spec-builder-s2/src/line/lineSpecBuilder.ts` — add data/mark generation
- `react-spectrum-charts-s2/src/types/marks/line.types.ts` — add child element handling
- New component: `react-spectrum-charts-s2/src/components/LinePointAnnotation/`

## Analysis Artifact

```json
{
  "sectionTitle": "Single series",
  "sectionDescription": "Use a single-series line chart to highlight patterns, simplify the story, and focus attention. When there's only one series, don't use a legend; label the dataset in the chart title or axis instead.",
  "sectionType": "design",
  "chartInstanceName": "Line chart",
  "chartVariant": "Single trend with annotated data",
  "variantSource": "visual-only",
  "companionSizes": [],
  "figmaNodeId": "2125:109093",
  "figmaSectionNodeId": "2125:109093",
  "figmaFileKey": "a9LVueYspAHETtc1x9Cll8",
  "figmaUrl": "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093",
  "structureFile": "./tmp/plan-s2-line/structure-single-series.json",
  "coreFeature": "point-annotations",
  "chartType": "line",
  "chartSize": "unknown",
  "frameWidth": 1200,
  "frameHeight": 2040,
  "seriesCount": 1,
  "hasLegend": false,
  "hasDirectLabels": false,
  "hasGradient": false,
  "hasReferenceLine": false,
  "hasMetricRange": false,
  "hasTrendline": false,
  "interpolationType": "linear",
  "interactionShown": "none",
  "explanatoryText": "Use a single-series line chart to highlight patterns, simplify the story, and focus attention. When there's only one series, don't use a legend; label the dataset in the chart title or axis instead.",
  "status": "new",
  "confidence": "high",
  "ambiguities": ["Arrow direction: auto-placed or explicit?", "Multi-series annotation targeting: which series owns the annotation?"]
}
```

## Node Structure

Full traversal saved to `./tmp/plan-s2-line/structure-single-series.json`.

Key nodes identified:
- **Section frame**: `2125:109093` — Single series (1200×2040)

## Reference Image

Screenshotted from Figma section **"Single series"**, node `2125:109093`.
To view in Figma: `https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093`
