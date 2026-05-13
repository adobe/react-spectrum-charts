---
type: feature
status: new
priority: P1
story_points: 1
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# Hover Point Style

## Images

None colocated — reference the behaviors section images in `./tmp/plan-s2-line/behaviors.png`.

## Type

Feature ticket (spec compliance fix)

## Prerequisites

None. Independent of `hover-value-label.md`. Can be done early alongside `static-point-style.md` since both concern point mark encoding.

## Problem

The current S2 hover state renders the hovered data point as a **hollow circle** (stroke only, no fill). The S2 design spec requires a **filled circle with a background halo** — a solid colored dot with a white/background-colored circle behind it. This matches the S2 static point style defined in `static-point-style.md`, but for the hover state.

From `planning/S2/line/hover-interactions.md`:
> "Hover point style (gap): currently all hover points are hollow — S2 spec requires filled points with a background halo. Needs implementation."

## Requirements

1. Update the hover point mark encoding so the hovered dot is solid filled (matching series color), not hollow.
2. Render a background halo circle (using `BACKGROUND_COLOR` signal) behind the filled dot, at a slightly larger radius.
3. The filled dot radius and halo sizing should respect the chart `size` prop (XS/S/M/L) — see `chart-size-prop.md`.

## Hover Point Shape (open question — deferred to `static-point-shapes.md`)

When shapes faceting is implemented (circle/square/triangle per series), the hover point must be reconsidered: should it render in the series shape or always as a circle? This question is tracked in `static-point-shapes.md` and does not block this ticket. For now, implement hover point as a circle.

## Implementation Approach

- Find the hover point mark in `vega-spec-builder-s2/src/line/lineMarkUtils.ts` (the mark group used for hover state)
- Change the fill from `null`/transparent to the series color
- Add a background halo mark: a circle at `BACKGROUND_COLOR` fill, rendered below the colored dot using z-order (either as a separate mark or as the outer ring of a layered symbol)
- Follow the same encoding conventions as `static-point-style.md` once that ticket is implemented — they must visually match

## Open Questions

- Should the hover point radius be the same as the static point radius, or slightly larger to indicate "active" state?
- Is the halo radius a fixed offset or a proportional scale of the dot radius?
