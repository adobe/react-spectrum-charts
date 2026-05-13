---
type: feature
status: investigation-needed
priority: P1
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Chart Grid Boundary / Y-Axis Scale Padding

## Images

- `forecast-single-series.png` — Design reference: bottom chart in the single series section. Shows how the topmost y-axis grid line aligns flush with the top of the chart boundary, and how the forecast reference line label is positioned relative to that boundary.

## Type

Feature / investigation ticket

## Prerequisites

None. However, fixing this will improve the forecast label positioning and reference line label collision described in `forecast-child-component.md`, so it should be investigated alongside or before the forecast component implementation.

## Problem

Two related visual gaps identified in the same part of the transcript:

### 1. Grid lines don't reach the chart boundary

The S2 Figma designs show grid lines that extend flush to the top (and sometimes right) edge of the chart plot area, creating a "boxed" visual appearance. The current Vega spec adds padding above the maximum y-axis value, so the topmost grid line falls short of the chart boundary. This makes the chart look open-topped rather than contained.

### 2. Reference line label collision with chart top

As a consequence of the above, when a reference line (or forecast boundary line) extends to the top of the chart, its label floats above the last grid line but not at the chart edge. In charts where the forecast `<LineForecast>` label should appear adjacent to the vertical rule, this creates a visual gap between the label position and the implied chart frame. Connor specifically noted this during the forecast discussion and said it needs solving "either during this implementation or in a separate ticket."

## Requirements

1. Investigate how Vega controls y-axis scale padding (`nice`, `zero`, `padding` on scale spec, and `domainMin`/`domainMax` overrides) — identify which setting causes the top-of-chart gap.
2. Determine whether setting `nice: false` or providing an explicit `domainMax` resolves the flush-grid behavior without breaking axis label placement.
3. If solvable: apply the fix such that the topmost and bottommost grid lines are flush to the chart plot boundary by default in S2.
4. Verify that reference line and forecast label placement looks correct after the fix.
5. Confirm with design that the "boxed" look is the intended default and not just an artifact of the Figma frame.

## Plan

From the transcript (Connor, ~28:07):
> "S2 charts box the chart area with grid lines flush to the boundary — a visual treatment the current Vega configuration does not produce. This should be solved."

From the transcript (~28:57):
> "With Vega, reference lines can extend to the chart top, but grid lines stop short — somewhere between the data max and the chart boundary. The reference line label ends up floating just above the last grid line rather than at the chart edge. This will not look clean in practice. Either during this implementation or in a separate ticket, find a way to make the label placement and grid boundary flush."

### Investigation approach

- Check `vega-spec-builder-s2/src/chartSpecBuilder.ts` — look for how y-scale `nice`, `padding`, or `domainMax` are currently set
- Read the Vega documentation on scale `nice` and `padding` — these control whether the domain is rounded up to a "nice" number, which is what creates the gap above the data max
- Try setting `nice: false` on the y-scale and observe whether grid lines reach the chart boundary
- Check whether this interacts negatively with axis label readability (e.g., labels at awkward non-round values)

## Design Check Required

- Is the boxed/flush-grid look the intended S2 default for all chart types, or only certain ones?
- When data max is, say, 9.87, should the y-axis still round up to 10 for a clean label, or should the grid be flush even if labels are non-round?

## Open Questions

- Is this fixable purely through Vega scale config, or does it require a post-render SVG resize/clip?
- Does this affect only the y-axis top or also the x-axis right edge?
- How does this interact with `MetricRange` or other marks that might extend to the chart boundary?
