---
type: research
status: new
priority: P1
story_points: 2–3 (research spike) → TBD (implementation)
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# Hover Value Label

## Images

None colocated — reference the behaviors section images in `./tmp/plan-s2-line/behaviors.png`.

## Type

Research spike → Feature ticket

## Prerequisites

- `chart-size-prop.md` — hover labels scale with chart size (XS/S/M/L).
- Must be implemented before `trellis.md` — Connor: *"Labels have to be done before small multiples."*

## Related Tickets

- `hover-point-style.md` — the filled dot + background halo for the hover state. Separate ticket; can be done independently before or after this one.

## Problem

The S2 default hover behavior shows a value label adjacent to the hovered data point on the line — no `<ChartTooltip>` component needed. This is a new pattern that doesn't exist in S1 or the current S2 implementation: point labels are not currently used as a tooltip alternative. The label appears on the dot, the line thickens, and the label shows the metric value.

This is architecturally distinct from `<LineDirectLabel>`, which is a static end-of-line label. The hover value label is transient, tied to the hovered point position, and must be consistent in style with `<LineDirectLabel>` (same text mark + background rect pattern).

## Requirements

1. **Default on**: when no `<ChartTooltip>` is present, show the metric value as a label adjacent to the hovered data point. No opt-in required.
2. **Tooltip wins**: if `<ChartTooltip>` is present, show the tooltip and suppress the hover value label.
3. **Configurable key**: the label defaults to the metric value but accepts a configurable data key to display a different field.
4. **No callback on first pass**: custom formatter callback can be added later.
5. **Shared text style**: reuse the same text mark + background rect implementation as `<LineDirectLabel>`. They must always visually match.
6. **Auto-position**: default to right-of-point. The Figma shows labels positioned at top-right or bottom-right corners when labels are dense (corner offsets).
7. **Line thickening**: on hover, the hovered line increases by +0.5px (e.g., L=3px → 3.5px). On dimension hover, all lines thicken by +0.5px.
8. **Hover rule z-order**: the crosshair rule is drawn behind the hovered line but in front of faded-back lines. For dimension hover, it goes behind all hovered points.
9. **Label scaling**: hover labels scale with chart size, same as `<LineDirectLabel>`.
10. **Dimension hover (multiple series)**: all series show their value label simultaneously. Collision is handled by stacking — last-drawn label (highest z-order) wins visual prominence. Background rects ensure partial readability even when overlapping.

## Collision Research (spike deliverable)

From the transcript (Connor, ~11:29–18:24):
> "The last drawn line — the highest z-order series — would be at the top, with others layering behind it so labels are partially visible. In S1, they all collide and nothing is readable."

> "The approach is a two–three point research spike: get the labels in place, styled consistently with `<LineDirectLabel>`, test the condensed chart case, then bring results to design to decide how to handle edge cases."

> "Vega is essentially all-or-nothing with collision hiding, which makes this a challenge."

Spike must:
1. Implement the label on point hover and dimension hover
2. Test a condensed chart (many series, close y-values) and document what it looks like
3. Bring results + screenshots to design (Alan) to decide: hide-on-collision, clamp to N labels, or accept overlap with z-order

## Plan

From the transcript (Connor, ~1:32–3:53):
> "There is a hover value label — the metric value at that point shown in place of a tooltip."
> "The line thickens, a dot appears in the mark, and the value is shown."
> "The value should be shown by default. If developers need to suppress it, a way to opt out can be provided."
> "If a tooltip is present, show the tooltip instead."
> "The label should support a configurable data key. The default is the metric field."

From the transcript (~4:51–5:02):
> "The positioning will differ from `<LineDirectLabel>` because it is tied to the point rather than the line terminus."
> "The text mark + background rect code should be shared between both so they always match visually."

### Implementation approach

- Find where hover signal marks are built in `vega-spec-builder-s2/src/line/lineMarkUtils.ts`
- Add a text mark (+ background rect) to the hover mark group, positioned at the hovered data point
- The text mark content: `datum[hoverLabelKey]` where `hoverLabelKey` defaults to the metric field
- Suppress when `<ChartTooltip>` is detected in the spec options
- Wire line thickening: in the hover encode, apply `strokeWidth: existingWidth + 0.5`

## Open Questions

- Should the hover value label be opt-out (always on unless explicitly disabled) or opt-in via a prop?
- Is there a maximum number of visible labels for dimension hover before we suppress some?
- What is the corner offset algorithm when labels would overlap?
