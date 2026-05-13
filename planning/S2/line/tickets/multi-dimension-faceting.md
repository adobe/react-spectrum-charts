---
type: research
status: investigation-needed
priority: P2
story_points: 3 (research spike)
figma_node_id: "2125:109249"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109249"
---

# Multi-Dimension Series Faceting

## Images

- `multi-dimension-pair-of-series.png` — Design reference (multiple series section): "Chrome users showed better performance in visits during 2024 compared to 2023" — two series with line type differentiation (solid 2024, dashed 2023). This is a simple 2-series YoY that works today.
- `multi-dimension-reference-lines.png` — Design reference (reference lines section): "Total visits reached 18.9M in Dec 2024, consistently trending upward in H2" — single series with trendline overlay. Also confirms the "Total visits" + "Trendline" legend pattern.

> **Note**: The specific "Chrome outperforms Safari users in 2023 and 2024" 4-line chart discussed in the transcript (4 lines: Chrome 2023, Chrome 2024, Safari 2023, Safari 2024, with a year-based legend) was discussed verbally but the exact Figma frame was not captured. The transcript description is the primary reference.

## Type

Research ticket (3-point spike)

## Prerequisites

None for the spike. Implementation would likely follow `chart-size.md` and `trellis.md`.

## Problem

Some Figma designs show multi-series charts where the series are differentiated along two independent dimensions simultaneously: for example, browser (Chrome vs. Safari) AND year (2023 vs. 2024). This results in 4 lines on a single chart where:
- The color/line-type encoding reflects one dimension (browser)
- The legend is organized by the other dimension (year)

This 2D faceting is not currently supported. The existing API takes a single `color` field and a single `lineType` field — both must point to the same series dimension. There is no way to split series by both browser and year simultaneously, having one dimension drive color and another drive line-type/dashing.

## Requirements (to be decided during spike)

The spike should answer:
1. What does the ideal API look like? Options include:
   - An additional `secondaryColor` or `colorGroup` field that groups series before applying color
   - A `facets` array with separate dimension mappings
   - A data pre-processing convention (developer reshapes data, single `color` field encodes both)
2. How does this interact with the legend — which dimension controls legend entries?
3. How does the current `color` + `lineType` facet system need to extend to support 2D?
4. Is there a pattern in S1 or in Vega's native encoding that already handles this? Check Vega group marks and nested color/shape encodings.

## Plan

From the transcript (Connor, ~53:35):
> Connor: "We have Chrome and Safari, but the legend is based on the year. There are multiple ways of splitting the data — four lines where two are for one browser and two for another, each pair split by year. S1 does not support this. We need a clean API for 2D series faceting."

> Connor: "This is doable but will require an open-ended ticket. Assign a 3-point spike, let the implementer propose whatever API makes sense based on what they find."

> Connor: "The default behavior should match the spec — by default, the secondary-dimension lines use the grayer secondary color, unless explicitly overridden."

## Spike Deliverables

1. A proposed API for 2D series faceting
2. Confirmation of whether Vega's encoding system natively supports this or requires data transformation
3. An example data shape and corresponding JSX for the Chrome × Year use case
4. Updated ticket with story point estimate for implementation

## Reference

- Current `color` facet: `vega-spec-builder-s2/src/types/specUtil.types.ts` — `ColorFacet`, `FacetRef`
- Current `lineType` facet: same file — `LineTypeFacet`
- How scales are built: `vega-spec-builder-s2/src/chartSpecBuilder.ts` — `getDefaultScales`
