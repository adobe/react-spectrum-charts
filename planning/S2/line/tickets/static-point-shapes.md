---
type: research
status: investigation-needed
priority: P2
figma_node_id: "2125:108913"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:108913"
---

# Static Point / Marker Symbol Shapes

## Images

None captured — this feature was identified from the Figma usage guidelines section, which was not reviewed before the session cutoff. The usage guidelines section (likely under the Line guidelines root node) needs to be read to extract the full spec.

## Type

Research / investigation ticket

## Prerequisites

- `static-point-style.md` — the S2 visual update (solid fill + background halo) should be in place before adding shape variants so that all shape marks are built on the correct base style.
- Related to `static-point-scaling.md` (size of the endpoint dot) but independent in scope — this ticket is about the shape of the symbol, not its size.

## Problem

The current `staticPoint` prop on `<Line>` renders endpoint dots as circles only. The Figma usage guidelines specify using different marker symbol shapes — circle, square, triangle — to differentiate series for accessibility (color-blind users). Shapes are by series, not per data point.

## Confirmed Design Spec (from transcript ~42:56–46:00)

From the transcript (Connor, ~42:56–46:00):
> "Point marks. There's a solid version of the point mark shown here with a slight background colored or white circle. It is different from the one that we have in S1."
> "Use point mark shapes to improve accessibility. The shape should match the legend."
> "The shape limit is 4. Three are shown: circles, squares, and triangles."
> "We can use a path and SVG path for shape. So these are all possible. We'd have to have the outline updated for those as well."
> "Whoever does this work needs to look at: what happens if you hover a square point? Because right now if we added square points and then you hover it, it would be a circle and you hover it."
> "There will be a shapes facet. Custom SVG path shapes are worth investigating — if a developer can pass an SVG string, that could be supported without much additional work. Not a requirement for v1."
> "Don't have different shapes on a single line."

**Key decisions:**
- Supported shapes: circle, square, triangle (3 shown; limit of 4)
- Shapes are a facet by series — same shape applies to all points in a series
- Shape must match the corresponding legend entry
- A single `<Line>` cannot have different shapes across data points
- Custom SVG path string: investigate feasibility, not a requirement
- Hover state for non-circle shapes: the hover point currently renders as a circle — determine whether a shaped hover is needed or if circle-hover on all shapes is acceptable (design question)

**Point mark style change**: The S2 point mark style differs from S1. S2 shows a solid point with a slight background/halo (white circle behind it). This style update should be implemented in the same ticket.

## Requirements

1. Add a `symbolShape?: FacetRef<SymbolShape>` prop to `<Line>` (analogous to `lineType`) mapping a data field or range to shapes.
2. `SymbolShape` type: `'circle' | 'square' | 'triangle'` (max 4 — fourth TBD with design).
3. Update legend entries to use the matching shape symbol (not always a circle/line swatch).
4. Determine hover state for non-circle shapes: does the hover point render in the same shape, or always circle? (See `hover-point-style.md` — the base hover point style is tracked there.)
5. Investigate custom SVG path support (feasibility check, not a requirement for v1).
6. Shapes cannot differ within a single series line.

Note: the static point visual style change (solid fill + background halo) is tracked separately in `static-point-style.md` and should be completed first.

## Implementation approach

1. Check `vega-spec-builder-s2/src/line/lineMarkUtils.ts` — find where static point symbol type is set
2. Add a shape scale analogous to the `lineType` scale
3. Update legend spec builder to reflect shape per series
4. For hover points: determine if Vega's hover mark can conditionally use a different symbol type

## Open Questions

- Is the fourth shape (beyond circle, square, triangle) confirmed? If so, what is it?
- Does hover always show a circle, or should the hover point match the series shape?
- Custom SVG path: is this achievable in Vega symbol marks?
