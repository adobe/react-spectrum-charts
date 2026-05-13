---
type: feature
status: new
priority: P1
figma_node_id: "2125:109150"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150"
---

# Series Overflow — Line Rendering

## Images

- `series-overflow-best-selling.png` — Design reference: "Best-selling video games" chart. Shows Minecraft and Tetris as named primary series with direct end labels; several faint gray lines below represent the "other" bucket with no individual labels.

## Type

Feature ticket

## Prerequisites

None.

## Problem

When a multi-series line chart has more series than the recommended maximum, showing all series as individually colored, labeled lines creates visual clutter. The design shows a pattern where the top N series render normally, and all remaining series are grouped into a de-emphasized "other" bucket: gray color, lower opacity, no direct labels.

This ticket covers only the line mark rendering side — the legend bucketing behavior is in `series-overflow-legend.md`.

## Requirements

1. Add a `seriesLimit` (or `maxSeries`) prop to `<Line>` accepting a positive integer.
2. Series beyond the limit are automatically bucketed and rendered as:
   - A default gray color using the appropriate Spectrum token (not hardcoded)
   - Reduced opacity compared to primary series (exact value TBD with design)
   - Direct labels suppressed on other-bucket lines regardless of `<LineDirectLabel>` presence
3. Add a `hiddenSeriesColor` prop for overriding the default gray with a custom color.
4. The `seriesLimit` threshold determines which series are primary — the first N (by data order or by value) are primary; the rest become "other."

## Plan

From the transcript (Connor, ~10:30):
> "Add a prop for developers to specify how many series render normally. Series beyond that count are bucketed into an 'other' category."

From the transcript (Connor, ~11:06):
> "A custom color for the other-bucket lines should be supported. Other-bucket lines should also be de-emphasized — direct labels on primary series should render normally, but other-bucket lines should suppress their labels."

From the transcript (Madeline, ~12:28 / Connor reply):
> Madeline: "If we lower the opacity on those other lines, would that help the collision?"
> Connor: "Collision is less critical for other-bucket lines — S2 labels have background rects, so they never fully overlap. The more important emphasis mechanism is label suppression: show direct labels on primary series only, not on other-bucket lines."

### Implementation approach

- Add `seriesLimit?: number` and `hiddenSeriesColor?: string` to `LineOptions` in `vega-spec-builder-s2/src/types/marks/lineSpec.types.ts`
- In `addData()`, add a Vega formula/filter transform that tags each series as `primary` or `other` based on its rank relative to `seriesLimit`
- In `addLineMarks()`, apply conditional color/opacity encoding: primary → normal color scale, other → `hiddenSeriesColor` or gray token + reduced opacity
- In direct label mark building, add a conditional: suppress label render for `other`-tagged series

## Design Check Required

- Hover behavior: do "other" bucket lines hover individually, batch-hover as a group, or are they non-hoverable?
- Opacity value: what is the exact reduced opacity for other-bucket lines?

## Open Questions

- Prop name: `seriesLimit`, `maxSeries`, or `visibleSeriesCount`?
- Does "first N by data order" mean insertion order in the data source, or top-N by some computed metric?
- Should the opacity reduction be configurable or fixed?
