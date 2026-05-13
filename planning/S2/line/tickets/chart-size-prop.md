---
type: feature
status: new
priority: P0 — foundational (blocks static-point-scaling, direct-label-font-scaling, reference-line-sizes)
figma_node_id: "2125:109427"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109427"
---

# Chart Size Prop

## Images

- `chart-size-line-weight.png` — Design reference: line weight annotation table showing 3px (large), 2px (medium), 1.5px (small)
- `chart-size-small-multiple.png` — Design reference: trellis/small-multiple context where medium (2px) weight applies automatically

## Type

Feature ticket

## Prerequisites

None. This is foundational — implement first in the chart-size group.

## Problem

The S2 line design spec defines three chart size contexts (`L`/`M`/`S`) that drive automatic visual scaling:

| Size | Line weight | Use case |
|---|---|---|
| Large | 3px | Full-screen, data storytelling, one chart per screen |
| Medium | 2px | Widgets, small multiples / trellis |
| Small | 1.5px | Sparklines, mini-viz, dense dashboards |

Currently the default line weight is `lineWidths: ['M']` = 2px, but the S2 design spec requires 3px as the standard default for large-format line charts. There is no `size` prop on `<Chart>` — developers have no way to declare chart size intent.

## Requirements

1. Add a `size?: 'XS' | 'S' | 'M' | 'L'` prop to `<Chart>` (applied globally to all marks within the chart).
2. `'XS'` is used for Sparkline contexts — expose it in the prop type even though most developers won't set it directly; it will be used internally by Sparkline.
3. When `size` is set, automatically apply the corresponding `lineWidths` default:
   - `'L'` → `['L']` = 3px
   - `'M'` → `['M']` = 2px
   - `'S'` → `['S']` = 1.5px
   - `'XS'` → `['XS']` = 1px
3. Update `DEFAULT_LINE_WIDTHS` in `packages/constants/constants.ts` from `['M']` to `['L']` so the out-of-the-box default matches the S2 spec for standard (large) charts.
4. If a developer explicitly sets `lineWidths` on `<Line>`, that override takes priority over the chart-level `size`.

## Plan

From the transcript (Connor, ~48:00):
> "Charts need small, medium, and large variants. Developers declare which size context their chart is in, and visual properties like line weight are automatically adjusted."

> "A large chart has a 3px line weight. When that chart becomes a small multiple, the size context changes to medium — likely 2px."

> "Automatic breakpoints should not be assumed. Confirm with design whether the chart infers size from its rendered pixel width or always requires an explicit `size` declaration."

### Implementation approach

- Add `size?: 'S' | 'M' | 'L'` to `ChartOptions` in `vega-spec-builder-s2/src/types/`
- In `react-spectrum-charts-s2/src/Chart.tsx` (or the S2 chart adapter), map `size` → default `lineWidths` value before passing to spec builder
- Update `DEFAULT_LINE_WIDTHS` in `packages/constants/constants.ts:34` from `['M']` to `['L']`
- Pass `size` as context so dependent mark builders (static points, direct labels) can use it — see `static-point-scaling.md` and `direct-label-font-scaling.md`

## Design Check Required

Before implementation: confirm with Alan/design:
- Auto-breakpoints vs. explicit `size` prop vs. both (Connor specifically called this out as a question)
- Whether `size` lives on `<Chart>` globally or could also be per-mark (likely global)

## Open Questions

- Auto-breakpoints: should the chart automatically infer size from its rendered pixel width, or always require explicit `size` declaration?
- Should changing `DEFAULT_LINE_WIDTHS` to `['L']` be gated behind a S2-only code path, or is it safe to update the shared constant?
