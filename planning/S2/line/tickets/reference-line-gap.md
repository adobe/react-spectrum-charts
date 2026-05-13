---
type: feature
status: investigation-needed
priority: P1
figma_node_id: "2125:108915"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:108915"
---

# Reference Line Gap / Caret Transparency Fix

## Images

- `reference-line-gap-anatomy.png` — Design reference: intro montage section. The anatomy diagram at the bottom labels the reference line and shows a vertical reference line with triangle carets. The gap between the carets and the center rule is currently transparent in the implementation, allowing content behind it to show through.

## Type

Feature ticket (small fix — pending design confirmation)

## Prerequisites

None.

## Problem

The reference line component renders a vertical rule with triangle caret markers (arrowheads) pointing inward from both ends toward the center. The gap between the carets and the center line of the rule is transparent, meaning chart content (grid lines, data marks, lines) shows through the gap. Depending on the chart content, this may or may not be visually acceptable.

The proposed fix: draw a thin background-colored line behind the caret gap (using the chart's `backgroundColor` signal value) to mask content behind the gap, making the reference line appear solid.

## Requirements

1. **Design confirmation first**: check with Alan/design whether the see-through caret gap is intentional in the S2 design or an oversight.
2. If the fix is confirmed: render a background-masked line segment in the gap between the carets and the center rule, using `{ signal: BACKGROUND_COLOR }` as the fill/stroke color.
3. The fix must use the `BACKGROUND_COLOR` signal (not a hardcoded value) so it respects the chart's `backgroundColor` prop.

## Plan

From the transcript (Connor, ~9:11):
> Connor: "This needs design confirmation, but: when the gap in the reference line between the caret triangles and the center rule falls over chart content, that content shows through. A background-colored line behind the gap would mask it."
> Connor: "The fix, if confirmed, is a background-colored line behind the carets — using the chart's background color. Design confirmation required before any code change."

### Implementation approach (if design confirms the fix)

In the reference line mark builder (likely `vega-spec-builder-s2/src/referenceLine/referenceLineMarkUtils.ts` or equivalent):
- Add a `rect` or `rule` mark positioned behind the carets with fill `{ signal: BACKGROUND_COLOR }`
- This mark should be rendered before (behind) the existing caret and rule marks
- Size/position it to cover the gap between carets

## Open Questions

- Is the see-through gap intentional? (Design check with Alan required before any code change.)
- If intentional: close this ticket as won't-fix.
- If unintentional: implement the background mask as described.
