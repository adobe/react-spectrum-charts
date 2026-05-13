---
type: feature
status: new
priority: P1
figma_node_id: "2125:109150"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150"
---

# Legend Alignment

## Images

- `legend-alignment-pair-of-series.png` — Design reference: "Best-selling video games" chart (third chart in the multiple series section) shows the legend left-aligned rather than the default centered position.

## Type

Feature ticket

## Prerequisites

None.

## Problem

The current `<Legend>` component always centers the legend horizontally. The Figma designs show legends left-aligned in several charts (e.g., "Best-selling video games"). There is no prop to control legend alignment. A prior implementation attempt for left-alignment ran into what appeared to be a Vega bug that needs investigation.

## Requirements

1. Add an `align` prop to `<Legend>` accepting `'start' | 'center' | 'end'` (or CSS-convention equivalents).
2. For horizontal legends (below/above the chart): `start` = left-align, `center` = centered (current default), `end` = right-align.
3. For vertical legends (left/right of the chart): `top` = top-align, `center` = centered, `bottom` = bottom-align. (Whether this is the same `align` prop or a separate one TBD based on implementation.)
4. Default remains `center` for backwards compatibility.

## Plan

From the transcript (Connor, ~43:50):
> Connor: "This needs a legend ticket — adding the ability to align the legend left, center, right, or if it's a vertical legend, top, center, bottom."
> Connor: "The prop values may end up as start, middle, end — check what the existing convention is and what CSS normally uses."

From the transcript (~1:04:56, within the D3 exploration discussion — confirms the Vega limitation):
> Connor: "A prior implementation of the legend position work ran into trouble with left-alignment — appears to be a Vega bug."

### Implementation approach

1. Investigate the prior Vega bug: determine whether the issue is in how Vega resolves the legend `orient` or `align` property, and whether it can be worked around in the Vega spec (e.g., using `encode` overrides on the legend label or entry positions).
2. If Vega supports it correctly with a specific spec structure, wire the new prop through `chartSpecBuilder.ts` → `legendSpecBuilder.ts`.
3. If Vega does not reliably support it, explore a post-render CSS override on the Vega-embedded SVG's legend group.

### Files to update

- `vega-spec-builder-s2/src/types/legendSpec.types.ts` — add `align` to `LegendOptions`
- `vega-spec-builder-s2/src/legend/legendSpecBuilder.ts` — apply alignment to Vega legend spec
- `react-spectrum-charts-s2/src/components/Legend/Legend.tsx` — thread through the prop
- `react-spectrum-charts-s2/src/types/legendSpec.types.ts` — if separate React types exist

## Open Questions

- Is this `align` on `<Legend>`, or should it be named differently to avoid confusion with text alignment?
- Do vertical legends need a separate prop or can the same `align` prop handle both axes?
