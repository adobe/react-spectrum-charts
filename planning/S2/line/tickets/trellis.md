---
type: research
status: new
priority: P2
story_points: 5 (research spike)
figma_node_id: "2125:109369"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109369"
---

# Trellis / Small Multiple Line Chart

## Images

- `trellis-small-multiple.png` — Design reference: the small multiple section. Top: static 4-panel trellis (Chrome, Safari, Edge, Firefox), each with a single line sharing a common y-scale. Bottom: same data with "One chart / Trellis" toggle showing the 5-panel trellis layout with shared legend.

## Type

Research ticket (5-point spike)

## Prerequisites

- `chart-size.md` — trellis panels should automatically use medium (2px) line weight.

## Problem

Trellis / small multiple layouts are a key design pattern for comparing many series without overlapping lines. The Figma shows this as a first-class option alongside combined multi-series charts. `trellis`, `trellisOrientation`, and `trellisPadding` are already implemented for `<Bar>` in S2 but not for `<Line>`.

The S2 Bar implementation is the reference, but Line trellis has additional complexity:
- Shared y-axis scale across panels (a single scale covering all panels' data ranges)
- Axis label suppression: only the leftmost panel (or bottommost row) shows axis labels and titles; inner panels show only the line
- The design shows that axis label placement varies (sometimes leftmost panel, sometimes based on axis position)

## Requirements (to be decided during spike)

The spike should answer:
1. What is the API shape? Likely `trellis`, `trellisOrientation`, `trellisPadding` props on `<Line>` mirroring Bar — but confirm.
2. How are shared axis scales handled in the Vega spec? Does each panel get its own scale or does one scale span all panels?
3. How is inner-panel axis label suppression controlled — automatic (only outermost panels show labels) or developer-controlled?
4. Does the shared y-axis title appear once, or repeat?
5. How does `size` (from `chart-size.md`) interact with trellis — does the chart automatically switch to medium line weight when `trellis` is set?
6. How does the S1 Bar trellis implementation work as a reference — does its group mark wrapping translate to line?

## Plan

From the transcript (Connor, ~47:54):
> Connor: "This is a five-point research spike for trellis small multiple line charts. The implementer should prototype, then return with decisions on shared scales, axis labels, and size integration."

From the transcript (~8:13):
> Connor: "Bar trellis uses a similar pattern. The data and values are linked together there — check whether that approach translates to line."

From the transcript (~46:49):
> Connor: "Small multiples or trellis compares across related categories — Chrome, Safari, Edge, Firefox, each showing January through December for the same y-axis metric. These share a color. Axis label placement varies between examples — in one it's on the leftmost series, in another on the rightmost. The rule determining this needs investigation."

From the transcript (~1:24:11, on axis labels):
> Madeline: "Seems related to the axis position."
> Connor: "Agreed — unresolved, needs further investigation."

## Spike Deliverables

1. A proposed API (likely matching Bar's `trellis`/`trellisOrientation`/`trellisPadding` with any Line-specific additions)
2. A prototype or proof-of-concept Vega spec showing a trellis line chart with shared scale
3. Decisions documented on: shared scale approach, axis label suppression, size integration
4. Updated ticket with story point estimate for the implementation ticket

## Reference

- S2 Bar trellis: `vega-spec-builder-s2/src/bar/barSpecBuilder.ts` — look for `trellis` handling
- S2 Bar types: `vega-spec-builder-s2/src/types/marks/barSpec.types.ts` — `trellis`, `trellisOrientation`, `trellisPadding`
