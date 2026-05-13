---
type: feature
status: new
priority: P1
figma_node_id: "2125:109150"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150"
---

# Legend Hidden-Series Indicator (S2 Style)

## Images

- `legend-alignment-pair-of-series.png` — Design reference: legend in the multiple series section. The legend is visible here in its default (all-visible) state. The hidden state (closed-eye icon) is an S2-specific interaction behavior.

## Type

Feature ticket

## Prerequisites

None.

## Problem

In S1, when a user clicks a legend entry to hide a series, the legend item is visually grayed out. In S2, the design specifies a different treatment: a "closed eye with a dash" icon appears on the legend entry to indicate the series is hidden. This is a distinct UX pattern — an icon-based state indicator rather than a color-change — and is not yet implemented in S2.

## Requirements

1. When a series is hidden via legend click, display a "closed eye with a strikethrough" icon on that legend entry rather than graying out the entry.
2. The legend entry text and color swatch should remain at full opacity alongside the icon (the icon itself communicates the hidden state, not opacity reduction).
3. Clicking the legend entry again dismisses the icon and restores the series to visible.
4. Confirm the exact S2 icon with the design system / Spectrum icon set — look for a `VisibilityOff` or `EyeOff` icon in the Spectrum icon library.
5. The hidden/visible state toggle behavior (which series gets hidden) should remain the same as S1 — only the visual indicator changes.

## Plan

From the transcript (Connor, ~14:19):
> "There's a hide icon, so it wouldn't be gray. In S1, it's gray on the icon for the legend. But in S2, it's supposed to be an icon that shows you that it's closed. It's a closed eye with a dash over it."

### Implementation approach

- Find where the legend entry's "hidden" visual state is rendered in `vega-spec-builder-s2/src/legend/` or in the React layer (`react-spectrum-charts-s2/src/components/Legend/`)
- Currently the hidden state is likely applied via an opacity or color change in the Vega legend encode block
- S2 may need to handle this at the React layer rather than in Vega, since inserting an SVG icon into a Vega-rendered legend entry requires either a Vega symbol mark or a post-render DOM overlay
- Check whether the Spectrum icon library has the correct eye-off icon and how to inject it into the legend entry context

## Design Check Required

- Confirm the exact icon from the Spectrum icon set with Alan/design
- Confirm whether the legend entry text should stay at full opacity when series is hidden, or if there is a secondary visual change beyond just the icon

## Open Questions

- Is this a Vega legend encode change or a React DOM overlay on the rendered legend?
- Does the icon replace the color swatch, appear alongside it, or overlay it?
- Should series shown/hidden state persist across chart rerenders (i.e., is it controlled state)?
