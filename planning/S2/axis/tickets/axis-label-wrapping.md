---
type: research
status: new
priority: P2
story_points: 1pt spike
epic: axis
figma_node_id: "2125:108913"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:108913"
---

# Axis Label Text Wrapping

## Type

Research spike (1 point)

## Problem

The S2 axis usage guidelines specify that wrapping is preferred over truncating for long axis labels. The current implementation supports truncation (with ellipsis) but not multi-line wrapping. The guidelines show wrapped text that is centered.

Open question: what happens when an axis label wraps AND has a sub-label (e.g., month above year)? Does the wrap replace the sub-label pattern, or do both coexist?

## Requirements (to be decided during spike)

1. Assess whether Vega's axis label spec supports `wordWrap` or multi-line text natively.
2. If supported: determine the `width` limit for wrapping (based on the available label slot width).
3. Determine behavior when `wrap` is active and a sub-label is also set — does the sub-label appear below the wrapped text?
4. Confirm: does the S2 guideline intend to wrap for all label lengths, or only for labels exceeding a threshold?
5. Keep truncation as a fallback — the guideline says wrapping is preferred but truncation should still be available.

## Plan

From the transcript (Connor, ~1:14:17–1:15:07):
> Connor: "Wrapping text is what they want. So this is a ticket we would need to do, which is today we have sub labels. They're saying wrapping labels is better. The text is centered. So can we support text wrapping on axis labels?"
> Connor: "I think that's probably a one-point research spike we need to do."

## Spike Deliverables

1. Vega capability assessment: does `axis.labelLimit` + `axis.labelLineHeight` or similar properties enable wrapping?
2. Decision on wrap + sub-label interaction
3. Implementation approach and story point estimate for the implementation ticket
