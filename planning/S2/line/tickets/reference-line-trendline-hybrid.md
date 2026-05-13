---
type: research
status: investigation-needed
priority: P2 — low
story_points: 1pt spike
figma_node_id: "2125:109427"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427"
---

# Reference Line / Trendline Hybrid

## Images

None colocated — visible in the Figma sizes section. The reference line variant shown there is not a straight rule — it follows data (curved/diagonal) but still has the caret arrow markers.

## Type

Research spike (1 point)

## Prerequisites

None. Low priority — address after primary reference line and trendline work is done.

## Problem

The Figma sizes section shows a reference line that is not a straight horizontal or vertical rule — it follows a data-driven path (like a trendline) but renders with the caret arrow markers of a reference line. It's ambiguous whether this is:

1. A trendline that should be styled with the secondary reference line visual (carets + secondary color)
2. A new type of data-driven reference line (e.g., a rolling average rendered as a reference line)
3. Just a trendline rendered in secondary style, and the carets are incidental/design error

Functionally, reference lines and trendlines are different: a reference line marks a **single value** on an axis; a trendline shows **continuous data** across the domain. But the Figma shows a visual that sits between them.

## Plan

From the transcript (Connor and Madeline, ~57:48–1:01:07):
> Connor: "There's an example of a reference line that's not a straight rule — it follows a data-driven path, which makes it look like a reference line version of a trendline."
> Madeline: "It does seem more like a trendline, but it has the carets — the little triangles."
> Connor: "This is a one-point research spike, low priority."
> Connor: "These are two distinct features: a reference line marks a position on the X or Y axis; a trendline shows continuous data across the domain. Functionally they're different, even if this Figma example visually blurs them."

## Spike Deliverables

1. Read the Figma sizes section directly — identify the exact node and screenshot the variant in question
2. Determine: is this a trendline with secondary-style carets, or a genuinely new mark type?
3. If it's a trendline: does `trendline-style.md` already cover making it look like a secondary reference line? If so, are carets needed on trendlines?
4. If it's a new mark type: draft an API sketch and update this ticket with story point estimate
5. Recommendation on how the existing `<ReferenceLine>` and `<Trendline>` components should (or shouldn't) cover this case

## Open Questions

- Should trendlines ever render with caret arrows? That would blur the semantic boundary between ref line and trendline.
- Is the caret on this element intentional or a Figma design inconsistency?
