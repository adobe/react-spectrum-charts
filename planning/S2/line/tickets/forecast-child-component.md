---
type: feature
status: new
priority: P1
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Forecast / Projected Line Child Component

## Images

- `forecast-single-series.png` — Design reference: "Monthly active users (MAU) trend overview and forecast" (bottom chart in single series section). Shows solid historical line with gradient fill, vertical "Forecast" divider, dotted projected continuation.

## Type

Feature ticket

## Prerequisites

None. Gradient (`gradient: true`) and reference line (`<ReferenceLine>`) already exist and are leveraged internally, but this ticket does not depend on any other new ticket.

## Problem

The forecast visual pattern — a solid historical line transitioning to a dotted projected line at a labeled vertical boundary — is a common use case. While it is theoretically achievable by manually composing existing features (two series + a reference line), this approach is too cumbersome: the developer must manage split data keys, ensure the two series join seamlessly at the cutoff, and manually wire the reference line label. A dedicated child component provides a clean, self-contained API for this pattern.

## Requirements

1. New child component `<LineForecast>` (or name TBD — see Open Questions) nestable inside `<Line>`.
2. Props:
   - `metric` — the data key for the forecast/projected values (may be the same key as the main metric, or a different one if the data uses split keys)
   - `start` — the x-axis value at which the forecast begins (used to place the vertical dividing rule and split the two Vega line marks)
   - `label` — customizable label string for the dividing line (default `"Forecast"`; must be customizable for localization)
3. Implementation uses two Vega line marks: one solid (historical) and one dotted (forecast), joined at the `start` cutoff.
4. The dividing vertical rule is drawn internally — **not** via the existing `<ReferenceLine>` component.
5. The label is positioned above the vertical rule, pinned to the rule's x-position (not to the line mark end). It does not reposition to avoid overlap; if horizontal space after the cutoff is too small, the label is hidden.
6. Default forecast line type: dotted.
7. The gradient fill (if `gradient: true` on the parent `<Line>`) extends over both the historical and forecast segments.

## Plan

From the transcript (Connor and Madeline, ~16:00–33:00):

**On API shape** (~22:00):
> Connor: "Object, child, or multiple forecast props on the line — child means we can manage its own state cleanly without coupling changes to the parent `<Line>` props."
> Madeline: "That would be an improvement from what it is now."
> Connor: "We'll do a child for forecasting."

**On the metric key** (~26:47):
> Connor: "The forecast child needs a key to identify the forecast data field."
> Madeline: "If you're passing a different key from the regular line data, you may not need an explicit start."
> Connor: "If the key is incorrect, the API can surface an error."

**On the `start` prop** (~27:36):
> Madeline: "There needs to be an explicit start indication — defaulting to today would not cover all use cases."
> Connor: "We'll add a start date prop."

**On label positioning** (~29:17):
> Connor: "The label is always next to the vertical rule. It cannot reposition left of the rule — that would place it over the non-forecast data and create confusion."
> Connor: "If horizontal space after the cutoff is too small, hide the label. This can be changed later."

**On Vega implementation** (~30:03):
> Connor: "Two line marks are needed — one solid, one dashed — so it looks like one continuous line but is rendered as two marks."

**On not reusing `<ReferenceLine>`** (~33:20):
> Madeline: "If it's tied to the reference line, you might want to add a label prop to the reference line component."
> Connor: "We're not reusing `<ReferenceLine>` for this. A rule mark is a general-purpose Vega primitive that can be used in different API contexts."

## Open Questions

- Final name: `<LineForecast>` or something more generic (since the pattern could apply to non-forecast uses like a "target vs. actual" divider)?
- Does the component name need to be confirmed with design/Alan before implementation?
- Should forecast line type be a configurable prop or always dotted for v1?

## Implementation Files

- New: `vega-spec-builder-s2/src/types/marks/supplemental/lineForecastSpec.types.ts`
- New: `vega-spec-builder-s2/src/forecast/` (data + mark + signal utilities)
- Update: `vega-spec-builder-s2/src/types/marks/lineSpec.types.ts` — add `forecasts?: LineForecastOptions[]`
- Update: `vega-spec-builder-s2/src/line/lineSpecBuilder.ts` — wire forecast data and marks
- New React component: `react-spectrum-charts-s2/src/components/LineForecast/`
- Update: `react-spectrum-charts-s2/src/types/marks/line.types.ts` — add child element handling
