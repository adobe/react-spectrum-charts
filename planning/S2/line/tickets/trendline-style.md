---
type: feature
status: new
priority: P1
figma_node_id: "2125:109249"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109249"
---

# Trendline Default Style

## Images

- `secondary-reference-line-designs.png` — Design reference: bottom chart shows "Total visits reached 18.9M in Dec 2024, consistently trending upward in H2" — a purple primary series line with a gray diagonal trendline. The trendline is neutral gray (secondary style), not series-matched purple.

## Type

Feature ticket

## Prerequisites

- `secondary-reference-line.md` — the secondary reference line style tokens should be established first so the trendline neutral style can reuse the same visual specification.

## Problem

In S1, trendlines follow the color and style of the series they're attached to (e.g., a purple series → purple dashed trendline). The S2 design shows trendlines as neutral gray diagonal lines that visually match the secondary reference line style — they provide trend context without being styled as a second copy of the series.

The current S2 trendline implementation needs to:
1. Change the default style from series-matched to neutral/secondary gray
2. Offer a `matchSeriesStyle` opt-in for developers who want the S1 series-matched behavior

## Requirements

1. Change the S2 default trendline stroke from series color to the neutral secondary style (same token as `secondary-reference-line.md`).
2. Add `matchSeriesStyle?: boolean` to `TrendlineOptions`:
   - `false` (default in S2): neutral gray secondary line style
   - `true`: series-matched color/style, same as current S1 behavior
3. The legend entry for the trendline should reflect the actual rendered style (gray swatch when `matchSeriesStyle` is false).

## Plan

From the transcript (Connor, ~51:34):
> "The trendline here is rendered as a neutral secondary reference line style. There should be a mechanism to control this — either neutral gray as the S2 default, or a `matchSeriesStyle` prop to opt into the S1 series-matched behavior. The default behavior differs from S1 and will need a decision during implementation."

### Implementation approach

- In `vega-spec-builder-s2/src/trendline/trendlineMarkUtils.ts`, check where the trendline stroke color currently defaults to series color
- Add `matchSeriesStyle?: boolean` to `TrendlineOptions`
- When `matchSeriesStyle` is falsy (default), apply the neutral secondary stroke token
- When `matchSeriesStyle` is true, retain the existing series-color behavior

## Open Questions

- Should the trendline dash pattern also change when `matchSeriesStyle` is false, or only the color?
- Does the trendline opacity change as part of the secondary styling?
