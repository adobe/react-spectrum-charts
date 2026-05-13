---
type: feature
status: new
priority: P1
figma_node_id: "2125:109427"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427"
---

# Static Point Size Scaling

## Images

- `chart-size-line-weight.png` — Design reference: the size table showing S/M/L contexts with associated visual scaling

## Type

Feature ticket

## Prerequisites

- `chart-size-prop.md` — requires the chart `size` prop to be implemented so the size context is available to mark builders.

## Problem

The `staticPoint` prop on `<Line>` renders a visible endpoint dot (circle) at each data point. Currently only a single size variant exists in S2. The design spec shows that endpoint dots should scale with chart size: smaller charts warrant smaller dot radii. Without size-aware scaling, the endpoint marker looks oversized on sparklines and undersized on large-format charts.

## Requirements

1. Define S/M/L pixel radii for the static point mark (values to be confirmed with design).
2. In the line spec builder, when `staticPoint` is set and a `size` context is available, automatically apply the matching point radius.
3. Allow per-mark override: a developer-provided explicit radius takes priority over auto-scaling.

## Plan

From the transcript (Connor, ~48:00):
> "We're going to automatically change things like the line weight based on that [chart size]."

(Static point scaling was discussed alongside line weight and direct label scaling as part of the same size-aware system.)

### Implementation approach

- In `vega-spec-builder-s2/src/line/lineMarkUtils.ts`, find where the static point symbol mark `size` (or `radius`) is set
- Accept a `chartSize` context parameter and select the appropriate pixel value
- The size values (likely something like `S`=4, `M`=6, `L`=8) need design confirmation before implementation

## Design Check Required

Before implementation: confirm S/M/L pixel radii for static points with Alan/design.

## Open Questions

- Are the endpoint dot sizes in the Figma spec explicitly annotated, or do they need to be measured?
- Does the static point symbol shape also change across sizes, or only the radius?
