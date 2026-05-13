---
type: bug
status: open
priority: P1
figma_node_id: null
figma_url: null
---

# Chart Title Text Wrapping

## Images

None — this is a bug observed in the implementation, not a Figma design feature.

## Type

Bug ticket

## Prerequisites

None.

## Problem

When a chart title is too long to fit on a single line within the chart's container width, the current S2 implementation shrinks the chart horizontally to accommodate the overflowing title text rather than wrapping the title onto multiple lines. This causes the data visualization area to contract unexpectedly and is visually broken for long or dynamic title strings.

Expected behavior: long titles should wrap to a second line within the available container width, not cause the chart to narrow.

## Requirements

1. Chart titles must wrap onto multiple lines when the title text exceeds the container width.
2. The chart data area width must remain stable regardless of title length — it should not shrink to make room for a single-line title.
3. Wrapping behavior should respect the chart's left/right padding.
4. The fix must not affect charts with short titles (no regression).

## Plan

From the transcript (Connor, ~unspecified timestamp):
> Connor: "That one's a significant bug."

(Confirmed as a known issue during the planning session — observed behavior where long titles cause the chart to shrink horizontally instead of wrapping.)

### Investigation approach

1. Find where chart title text is rendered in `react-spectrum-charts-s2/src/Chart.tsx` or the chart container component.
2. Check whether the title is rendered inside the Vega canvas (as a Vega title mark) or outside it as a DOM element.
   - If Vega title: check the Vega `title` spec for `limit` and `wrap` properties — Vega supports `wordWrap: true` and `limit: <pixels>` on title marks.
   - If DOM element: check the CSS — the container may be using `white-space: nowrap` or `width: fit-content`.
3. Apply the fix appropriate to the render path and add a Storybook story that demonstrates wrapping with a long title string.

## Open Questions

- Is the title rendered by Vega (as a Vega title mark) or by the React host (as a DOM element outside the Vega embed)?
- Does the same wrapping bug affect chart subtitles?
- Should there be a maximum number of wrap lines before truncation with ellipsis, or should wrapping be unlimited?
