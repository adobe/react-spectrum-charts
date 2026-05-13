---
type: feature
status: new
priority: P1
figma_node_id: "2125:109249"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109249"
---

# Secondary Reference Line Style

## Images

- `secondary-reference-line-designs.png` — Design reference: the "A pair of series" reference lines section. Charts 1 and 2 show horizontal "Target" reference lines rendered with caret arrows. These are the secondary-style reference lines — lighter weight, less visually prominent than the primary data line.

## Type

Feature ticket

## Prerequisites

None. `<ReferenceLine>` already exists in S2; this ticket adds a `secondary` style variant.

## Problem

The Figma designs show a lighter-weight, less prominent reference line used for "target" or "average" baselines — lines that provide context without competing with the primary data. The current `<ReferenceLine>` has one visual style. A `secondary` variant is needed for contextual lines that should recede visually.

## Requirements

1. Add a `secondary?: boolean` prop to `<ReferenceLine>` (and its `ReferenceLineOptions` type).
2. When `secondary: true`, render the reference line with the S2 secondary style:
   - Lighter stroke color (Spectrum token — confirm exact token with design)
   - Potentially reduced weight or opacity compared to the primary reference line style
3. The caret arrows (if present) should also render in the secondary style when `secondary: true`.

## Plan

From the transcript (Connor, ~51:34):
> "Add a secondary reference line style — useful for trendlines and averages. The existing `<ReferenceLine>` component handles both; add a `secondary` boolean prop to switch to the lighter visual treatment."

### Implementation approach

- In `vega-spec-builder-s2/src/types/marks/supplemental/referenceLineSpec.types.ts`, add `secondary?: boolean` to `ReferenceLineOptions`
- In the reference line mark builder, apply a secondary encode branch: use a lighter Spectrum stroke token rather than the primary foreground token
- Apply the same conditional to caret arrow marks so the full reference line (rule + carets) is consistently secondary

## Design Check Required

Before implementation: confirm with Alan/design:
- Exact Spectrum token for secondary reference line stroke color
- Whether the secondary caret arrows change size/style as well, or only color
- Whether stroke weight changes or only color/opacity

## Size Variants

From the transcript (Connor, ~59:18–59:32):
> "There are extra small, small, medium, large versions of the reference line and the secondary reference line. One ticket for each."

This ticket includes XS/S/M/L size variants for the secondary reference line style. Size affects the rule stroke weight and caret dimensions at the secondary visual level. Implementation should align with `reference-line-sizes.md` so both primary and secondary use the same size lookup table and caret scaling approach.

## Open Questions

- Should `secondary` affect only stroke color, or also stroke weight?
- Does the secondary reference line label (if present) also render in a lighter style?
- What are the XS/S/M/L token values for secondary stroke weight and caret size?
