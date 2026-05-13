---
type: bug
status: open
priority: P1
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# Label Background Opacity Fix

## Images

None — this is a behavior spec issue visible in any hover/highlight state with labels.

## Type

Bug / spec compliance ticket

## Prerequisites

None. Affects all label types.

## Problem

When a label (direct label, hover value label, or static point label) receives opacity as part of the hover/highlight state (e.g., non-hovered series are dimmed), the current implementation applies opacity to the entire label mark group — including the background rect. This breaks the background rect's masking purpose: it becomes semi-transparent, allowing content behind it to bleed through and making the label harder to read rather than easier.

The correct behavior: apply opacity only to the colored text mark; keep the background rect at full opacity.

## Requirements

1. In all label mark builders (direct label, hover value label, static point label), separate the opacity signal into two encode blocks:
   - Colored text mark: apply hover/highlight opacity as normal
   - Background rect mark: opacity always `1` (full), regardless of hover/highlight state
2. This must be consistent across `<LineDirectLabel>`, the hover point label, and static point labels.
3. Verify: when a series is dimmed because another series is hovered, the dimmed label's text fades but its background stays fully opaque.

## Plan

From the transcript (Connor, ~1:01:29–1:02:31):
> "When opacity is applied due to hover highlight state, it must not affect the background rect on direct labels or static point labels — applying opacity to the background rect breaks the masking behavior."
> "The label has a white background with colored text. If opacity is applied to both, the background becomes semi-transparent and labels are harder to read."
> "Apply opacity only to the colored text mark. The background rect stays at full opacity to continue serving its masking purpose."

### Implementation approach

- Find where label marks are assembled in `vega-spec-builder-s2/src/line/lineDirectLabelMarkUtils.ts` (and equivalent for hover/static point labels)
- Locate where the `opacity` signal is applied to the mark group or individual marks
- Split: text mark gets `opacity: { signal: opacitySignal }`, background rect gets `opacity: 1`
- Write a unit test asserting that the background mark's opacity is always `1` regardless of highlight state

## Open Questions

- Is the background rect currently in a separate Vega mark or encoded as a text mark property (via Vega's `fill` + `fillOpacity`)? The exact fix depends on how it's currently structured.
- Does this same issue affect labels in the `<MetricRange>` or `<Trendline>` components?
