---
type: research
status: new
priority: P3 — low
story_points: 2pt spike
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Direct Label Stacked Outside Chart (Y-Axis Region)

## Images

- `direct-label-positioning-multi.png` — Design reference shows the simpler multi-series stacking. The outside-chart stacking is in the usage guidelines section of the Figma (not yet separately captured).

## Type

Research spike (2 points)

## Prerequisites

- `direct-label-left-position.md` — left-of-point positioning must work first.
- `direct-label-auto-stack.md` — auto-stacking must work first.
- A design consultation with Alan is required before implementation begins.

## Problem

The Figma usage guidelines show a label placement pattern where direct labels are stacked outside the chart — extending into the y-axis margin region — and not necessarily positioned directly next to their line terminus. Labels are ordered by line end position, styled with the series color, and stacked vertically to fit without collision. This allows many series to be labeled without labels overlapping the chart data area.

This is significantly more complex than the current end-of-line label positioning. It requires knowing the y-axis width, calculating label sizes, determining line ordering by terminus value, and managing stacking/collision within the axis region.

## Requirements (to be decided during spike)

1. Read the Figma usage guidelines section to get the full visual spec.
2. Determine ordering: are labels sorted by the y-position of the line's end point, or by another metric?
3. Determine collision handling: if labels are too dense, are some hidden? Or are they always all shown, just stacked?
4. Determine the boundary: do labels go into the existing axis margin, or does the margin need to expand?
5. Assess Vega feasibility: can text marks extend outside the plot area into the axis margin? This may require the `clip: false` Vega mark property.
6. Hold a design consultation with Alan before any implementation:
   - What happens when there are too many labels to stack without exceeding the chart height?
   - Is the label always at the line terminus position, or can it float to the nearest gap?
   - Should labels that extend into the y-axis region have a connector line?

## Plan

From the transcript (Connor, ~49:59–52:16):
> "They're stacked, but not necessarily directly connected to the line they're on. The color and style matches, the order matches, but the position of the label is not directly next to the line — it's positioned to fit without collision."
> "This requires calculating the axis width, determining label sizes, and managing stacking within the axis region. Label overflow — when there are too many to stack without exceeding the chart height — needs design guidance. This is a two-point research spike, low priority, addressed last. It starts with a design consultation on the implementation implications."

From Madeline's earlier comment (~50:26):
> "Avoid overlapping the y-axis — and the design shows labels in the y-axis area, which raises questions about whether the overlap avoidance guideline is meant to apply here."
(This tension — guideline says "avoid overlapping the y-axis" but the design example shows labels inside the y-axis region — requires design clarification.)

## Spike Deliverables

1. Design consultation summary (Alan): ordering, collision, boundary, connector lines, overflow behavior
2. Vega feasibility assessment: `clip: false`, axis margin expansion, positioning math
3. If feasible: proposed implementation approach and story point estimate
4. If not feasible: alternative recommendation (e.g., developer-controlled label positioning via a `position` prop override)
