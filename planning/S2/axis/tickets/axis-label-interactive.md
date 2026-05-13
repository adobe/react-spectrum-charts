---
type: feature
status: in-progress (research spike)
priority: P1
story_points: 5 (implementation, after spike completes)
epic: axis
figma_node_id: "2125:108913"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:108913"
---

# Interactive Axis Labels (Hover + Click)

## Type

Feature ticket (research spike in progress — Madeline)

## Current Status

Madeline is finishing the research spike. Implementation ticket to follow once Alan's design questions are answered.

## Problem

The S2 axis design shows interactive axis labels with two distinct states:

1. **Hover state**: a gray rectangle appears behind the hovered axis label. Other labels and axis elements (ticks, baseline, grid) fade with opacity.
2. **Click/selection state**: the selected label gets a black rectangle (dark highlight). An action bar appears for the selected label.

The current implementation has no hover or click state on axis labels. Madeline has confirmed via research that both states are achievable by adding rect marks to the axis label group.

## Requirements

1. **Hover**: add a gray rect mark behind the axis label on hover. All other x-axis elements (other labels, ticks, baseline, potentially y-axis labels) receive opacity.
2. **Selection**: add a black rect mark on click. The action bar (currently being researched by Tanu) appears at the selected position.
3. **Sub-labels**: behavior when a hovered label has a sub-label (e.g., year below month abbreviation) needs design confirmation — does the rect include the sub-label? Is the sub-label hidden on hover?
4. **Y-axis opacity on hover**: the Figma shows y-axis labels fading when x-axis is hovered. Connor suspects this is a design error — confirm with Alan before implementing.
5. **Action bar size**: Tanu's research indicates 4–5 action buttons. Axis action bar may be smaller than the data point action bar — confirm with Alan.

## Design Questions for Alan (Madeline to send)

- Are there multiple hover state variants? (gray box = clickable; bold text = just hover?)
- When there's an action on click, is the gray box always shown on hover?
- Does the hover gray box always appear, or only when there's an `onClick` handler?
- Does the action bar replace the popover for axis interactions?
- Sub-label inclusion in hover rect: include, hide, or show separately?
- Does y-axis get opacity when x-axis label is hovered?

## Plan

From the transcript (Connor and Madeline, ~1:05:51–1:12:32):
> Madeline: "It's doable by adding a rect mark for the hover state. It doesn't show it right here, but that light gray box that we were seeing. And then I'm also able to, on click, have the black box as well."
> Connor: "I think the initial work for this, I think we make it a 5 pointer."
> Madeline: "There's going to be a lot of edge cases. And then also what we talked about last week with the sub-labels."
> Connor: "What clarification we need from design — what happens on hover? Are there variations? Is this a special tooltip or a data tooltip? And is it always an action bar if it's actionable?"

## Implementation Approach (after spike)

- Add hover rect mark to axis label group in the spec builder
- Wire hover/selection signals for axis labels (separate from data point hover signals)
- Connect to action bar component (from Tanu's research)
- Handle sub-label edge cases based on design confirmation
