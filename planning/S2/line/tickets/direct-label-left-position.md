---
type: feature
status: new
priority: P1
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# LinePointAnnotation — Port from S1 to S2

## Images

- `direct-label-positioning-single.png` — Design reference: single series section. "Steady growth in Chrome visits" shows a value label ("9.5M") positioned to the left of the endpoint static point dot.

## Type

Feature ticket (S1 → S2 port)

## Prerequisites

- `static-point-style.md` — the S2 solid fill + halo encoding should be in place first so the annotation renders adjacent to the correct point style.

## Problem

The S1 package has a `<LinePointAnnotation>` child component that renders a text label adjacent to static point markers on the line. It is entirely absent from S2. The Figma single-series chart shows a static point at the terminus with a value label to the left — this is `<LinePointAnnotation anchor="left">` behavior.

S1 API (in `vega-spec-builder/src/types/marks/supplemental/linePointAnnotationSpec.types.ts`):
- `anchor?: LabelAnchor | LabelAnchor[]` — position relative to the point; when an array, each position is tried in order until one fits without overlapping
- `matchLineColor?: boolean` — when true, the label text color matches the series color; default false
- `textKey?: string` — data field to display; defaults to the metric field

## Requirements

1. Port `<LinePointAnnotation>` to S2 as a child component of `<Line>`.
2. Preserve the full S1 API: `anchor`, `matchLineColor`, `textKey`.
3. Update the S2 label text mark style to use S2 tokens (font, color) rather than S1 values.
4. Wire up the child component adapter in `react-spectrum-charts-s2` so `<LinePointAnnotation>` inside `<Line>` is recognized and passed through to the spec builder.
5. Verify collision/fallback behavior: when an array is passed to `anchor`, the Vega label transform tries each position in order.

## Implementation approach

1. Copy `vega-spec-builder/src/line/linePointAnnotation/` into `vega-spec-builder-s2/src/line/linePointAnnotation/` and update imports.
2. Add `linePointAnnotations?: LinePointAnnotationOptions[]` to `LineOptions` in `vega-spec-builder-s2/src/types/marks/lineSpec.types.ts`.
3. In `lineSpecBuilder.ts` (S2), wire `linePointAnnotations` into `addLineMarks()` the same way S1 does.
4. Add a `LinePointAnnotation` component to `react-spectrum-charts-s2` mirroring the S1 component.
5. Add a case for `LinePointAnnotation.displayName` in the S2 children adapter.

## Plan

From the transcript (Connor, ~9:47):
> "The direct label on this one is left of the point — this is `<LinePointAnnotation anchor='left'>` behavior, which is absent from S2."

(The label shown is a `<LinePointAnnotation>` with `anchor="left"`, not a `<LineDirectLabel>`.)

## Open Questions

- Should the S2 label text style (font size, weight) differ from S1, or is this a straight port with only import/token changes?
- Does the background rect convention from `<LineDirectLabel>` apply here, or does the S2 annotation render as plain text?
