---
type: research
status: new
priority: P2
story_points: TBD (complex spike)
epic: axis
figma_node_id: "2125:108913"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:108913"
---

# Diverging Axis (Centered-Zero, Labels on Both Sides)

## Type

Research spike (complex — estimate TBD)

## Problem

The S2 bar chart designs show a "diverging" axis pattern where:

1. The axis (x or y) is centered at zero — positive values extend one direction, negative values extend the other.
2. The axis labels (category labels) are positioned **at the zero line** rather than at the left or right edge of the chart.
3. Labels flip to either side based on whether the corresponding bar is positive or negative (the label follows the bar's anchor side).
4. The domain is calculated by finding the maximum absolute value in both directions, not just the positive range.

This is architecturally complex because it requires axis labels to be placed at a dynamic position within the chart (not at a fixed edge), which is not how Vega's `<Axis>` component works by default.

## Two implementation hypotheses (from discussion)

**Option A — Real axis offset**: Vega may support `axis.offset` or a similar property to position the axis at the zero point. If the domain is symmetric around zero, the axis can be rendered at the center of the plot area. Labels would appear on the axis line itself.

**Option B — Fake labels**: Render the axis without visible labels, and add separate text marks positioned left or right based on each datum's sign. This is simpler to implement but loses axis interactivity (hover, click) for free — would need to be rebuilt from scratch.

Connor's preference: try Option A first since it preserves axis functionality and avoids having to rebuild interactive label behavior.

## Plan

From the transcript (Connor and Madeline, ~1:17:30–1:27:06):
> Connor: "Some way to have a diverging axis where the labels are flipping based on where the values are. It's for sure a research spike ticket."
> Madeline: "It almost seems like the access doesn't even exist. It seems like they're just other labels for each bar."
> Connor: "If we do something that's not an axis for this, then every time we want to support an axis feature with this type of chart, we have to figure out how to — we're stuck. We'd have to write it from scratch."
> Connor: "Maybe there's something in Vega that we don't know about that will make it super easy. Gemini says we can offset the axis."
> Connor: "If you take a 0 and you expand the X domain, and you calculate the X domain based on the maximum negative value and the maximum positive value to fit that inside of the domain. That's where you decide the axis position based on that."

## Spike Deliverables

1. Vega feasibility for Option A: can the axis be repositioned to the zero-value position? Test with a prototype spec.
2. Domain calculation: determine how to compute a symmetric-around-zero domain from the data.
3. Label positioning: how are category labels rendered at the zero line when bars go left/right?
4. If Option A works: proposed API and implementation plan.
5. If Option A fails: evaluate Option B tradeoffs and propose a path forward.
6. Story point estimate for implementation ticket.

## Notes

- This is primarily a **bar chart** feature but the axis work applies to both bar and any future chart type with diverging data.
- Hover/click behavior on diverging axis labels must work as if it's a real axis (ties into `axis-label-interactive.md`).
