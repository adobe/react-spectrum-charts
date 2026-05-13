---
type: feature
status: new
priority: P1
figma_node_id: "2125:109427"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427"
---

# Direct Label Font Scaling

## Images

- `chart-size-line-weight.png` — Design reference: the S/M/L size context table that includes label size scaling

## Type

Feature ticket

## Prerequisites

- `chart-size-prop.md` — requires the chart `size` prop to be implemented so the size context is available.

## Problem

`<LineDirectLabel>` currently renders at a single font size regardless of chart size. The S2 design spec requires that direct label font size and weight scale down for medium and small chart contexts — a direct label appropriate for a large full-page chart is visually heavy on a sparkline or trellis panel.

## Requirements

1. Define S/M/L font sizes and weights for direct labels (values to be confirmed with design).
2. In the `<LineDirectLabel>` mark builder, when a `size` context is available, automatically apply the matching font size and weight.
3. Allow per-label override: a developer-provided `fontSize` or `fontWeight` prop takes priority over auto-scaling.

## Plan

From the transcript (Connor, ~48:00):
> "We're going to automatically change things like the line weight based on that [chart size]."

(Direct label font scaling was explicitly included alongside line weight and point scaling as part of the chart-size system.)

### Implementation approach

- In `vega-spec-builder-s2/src/line/lineDirectLabelMarkUtils.ts` (or equivalent), find where the label text mark font properties are set
- Accept `chartSize` context and select the appropriate `fontSize`/`fontWeight` values
- Confirm exact values with design before implementation

## Design Check Required

Before implementation: confirm S/M/L font size/weight values for direct labels with Alan/design.

## Open Questions

- Are font size and weight both scaled, or just font size?
- Is the label background padding also scaled (does the pill shape change)?
- Does the label offset from the line terminus scale with chart size as well?
