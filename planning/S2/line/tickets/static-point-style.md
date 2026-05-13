---
type: feature
status: new
priority: P1
story_points: 1
figma_node_id: "2125:108913"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:108913"
---

# Static Point Style (S2 Visual Update)

## Images

None colocated — reference the usage guidelines section in Figma at the node above.

## Type

Feature ticket (spec compliance fix)

## Prerequisites

None. Can be done early — no dependencies.

## Problem

The current S2 `staticPoint` rendering uses a **hollow circle** (stroke-only, no fill), inherited from S1. The S2 design spec shows a **solid filled circle with a background halo** — a colored dot with a white/background-colored ring behind it.

From the transcript (Connor, ~42:56):
> "There's a solid version of the point mark shown here with a slight background colored or white circle. It is different from the one that we have in S1."

This is a pure visual change — no new props, no API changes. The `staticPoint` prop still accepts a data field key. Only the mark encoding changes.

## Requirements

1. Change the static point mark fill from transparent/hollow to the series color (solid fill).
2. Add a background halo: render a circle behind the filled dot using `BACKGROUND_COLOR` signal fill at a slightly larger radius.
3. Both the dot and halo must scale with chart `size` (XS/S/M/L) — see `static-point-scaling.md` for the radius lookup table.
4. Do not introduce new public props — this is an encoding-only change.

## Implementation Approach

- Find the static point mark in `vega-spec-builder-s2/src/line/lineMarkUtils.ts`
- Update fill encoding: `{ field: colorField }` (or the series color signal) instead of `null`
- Add a halo mark: either a second symbol mark behind the dot, or use Vega's `stroke` + `strokeWidth` on the existing mark to create the halo appearance
- Use `{ signal: BACKGROUND_COLOR }` for the halo color — do NOT hardcode a color value
- Cross-check against `barAnnotationUtils.ts` or `linePointUtils.ts` for the background color signal convention

## Open Questions

- Is the halo rendered as a separate Vega mark (two layered symbols) or as a `stroke` property on the single dot mark?
- Does the halo thickness change with chart size, or is it a fixed offset?
