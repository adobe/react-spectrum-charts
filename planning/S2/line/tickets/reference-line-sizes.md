---
type: feature
status: new
priority: P1
figma_node_id: "2125:109427"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427"
---

# Reference Line Sizes (XS / S / M / L)

## Images

- `chart-size-line-weight.png` — Design reference: the size table. The Figma sizes section shows XS, S, M, L variants of the primary reference line, including scaled caret arrows.

## Type

Feature ticket

## Prerequisites

- `chart-size-prop.md` — the chart `size` context drives automatic reference line size selection.

## Problem

The Figma shows XS, S, M, L size variants of the primary `<ReferenceLine>` component. Size affects the rule stroke weight and the caret triangle dimensions. Currently, only one size exists. Small and extra-small chart contexts (Sparkline, trellis panels) need appropriately scaled reference lines.

## Requirements

1. Define XS, S, M, L visual specs for `<ReferenceLine>` (stroke weight, caret SVG dimensions) — confirm exact values with design.
2. When chart `size` context is available, automatically select the matching reference line size.
3. Add a `size?: 'XS' | 'S' | 'M' | 'L'` prop on `<ReferenceLine>` for explicit override.
4. The triangle caret SVGs must be rescaled for each size — not just `strokeWidth`. Confirm whether carets use SVG path marks or symbol marks in the current implementation.
5. `XS` is the size used in Sparkline contexts.

## Plan

From the transcript (Connor, ~58:57–59:32):
> "This is an additional ticket we need to do for reference line, which is there are extra small, small, medium, large versions of the reference line and the secondary reference line."
> "That includes shrinking down the triangle SVGs as well."
> "One ticket for each for primary reference line and secondary reference line."

### Implementation approach

- Find where the reference line mark and caret marks are built: `vega-spec-builder-s2/src/referenceLine/referenceLineMarkUtils.ts`
- Check whether carets are SVG path strings (would need new path per size) or Vega symbol marks (can use `size` property)
- Define a size lookup table mapping `'XS' | 'S' | 'M' | 'L'` → `{ strokeWidth, caretSize }` values
- Wire into the spec builder; default to `'M'` unless chart `size` context provides another value

## Design Check Required

Before implementation: confirm XS/S/M/L pixel values for reference line stroke weight and caret dimensions with Alan/design.

## Open Questions

- Are caret triangles currently SVG path marks or Vega symbol marks? The answer determines how scaling is implemented.
- Should the `size` prop on `<ReferenceLine>` accept `'XS'` even for non-Sparkline contexts, or is `'XS'` only usable internally?
