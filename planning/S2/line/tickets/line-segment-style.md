---
type: feature
status: new
priority: P1
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# Line Segment Style (Estimated / Alternate Segment)

## Images

None colocated — reference the null values / behaviors section of the Figma. The design shows a dotted continuation of a line for estimated/interpolated data segments.

## Type

Feature ticket

## Prerequisites

None.

## Problem

Some line charts need to visually distinguish a segment of a single series as "estimated," "projected," or otherwise uncertain — rendering that segment with a different line type (e.g., dotted) while keeping it as part of the same line and the same color. This is distinct from `<LineForecast>`, which draws two Vega marks and uses a separate child component. This is a per-data-point flag on a single continuous series.

The current API has no way to do this on a single `<Line>`. Developers would have to use two separate `<Line>` components and manually manage visual consistency.

## Requirements

1. Add a prop (name TBD — see Open Questions) accepting a **data key string** that RSC will check per data point. When the value at that key is truthy, that point is part of an "alternate" segment.
2. Add a second linked prop for the **alternate line type** to use for those flagged points (default: `'dotted'`). Line type values match the existing `LineType` enum.
3. The alternate segment should be the same color as the main series line.
4. No color change for alternate segments — Connor: *"Color is always some indicator of more fundamental data change. If you introduce color, it's going to look like two overlapping lines."*
5. **Hover label append**: when a dimension hover or point hover lands on an alternate-segment point, append a configurable text string to the hover value label (e.g., "(Estimated)"). The append text is developer-controlled for localization — RSC does not provide a default string.
6. The append prop is keyed to the same alternate-segment data key, so it only appears for points where that key is truthy.

## Plan

From the transcript (Connor and Madeline, ~23:31–36:54):

**On API shape** (~31:46):
> Connor: "Two linked props: one string prop for the data key that flags alternate-segment points, and a second prop for the line type to use on those points. A child component is not appropriate here."

**On name** (~31:46):
> Connor: "The name should not be 'estimate' — that's too specific. Whoever implements this should choose a more generic name."

**On color** (~31:00):
> Tanu: "Do we give colors too?"
> Connor: "No — color is always an indicator of more fundamental data change. Introducing color would make it look like two overlapping series."

**On hover label append** (~34:05–36:54):
> Connor: "When hovering over an alternate-segment point, append a string in parentheses after the value — for example, '(Estimated).' This is the default behavior."
> Madeline: "Having that as an append option is useful — developers may want to append something even outside the alternate-segment case."
> Connor: "Agreed — but the append must be scoped to the alternate segment only, with a separate prop to control it."

**On not reusing `lineType`** (~32:44):
> Connor: "Reusing the existing `lineType` prop would mix concerns. A separate prop that functions as a facet is the right approach, even if it duplicates some mechanics."

### Implementation approach

- Add two new optional props to `LineOptions`:
  - `alternateSegmentKey?: string` — data field key that flags which points are alternate-style
  - `alternateSegmentLineType?: LineType` — line type for those points (default `'dotted'`)
  - `alternateSegmentLabel?: string` — text to append to hover value label for alternate points (no default — omitted means no append)
- In the Vega spec, use a conditional `strokeDash` encoding on the line mark driven by `datum[alternateSegmentKey]`
- For the hover label append: in the hover text mark expression, check `datum[alternateSegmentKey]` and conditionally concatenate `alternateSegmentLabel`

## Open Questions

- What is the right name? "Alternate segment" is generic; "estimate" is specific. Options: `estimatedSegmentKey`, `segmentStyleKey`, `alternateLineKey`.
- Should the two props be flat on `<Line>` or grouped as an object prop? Decided: flat (consistent with current pattern).
- Can a single series have multiple alternating segments (e.g., solid → dotted → solid → dotted)? The data-key approach naturally supports this.
