---
type: feature
status: partial
priority: P1
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Direct Label Auto-Stacking for 3+ Series

## Images

- `direct-label-positioning-multi.png` — Design reference: multiple series section. "Best-selling video games" chart shows two end labels (Tetris above the line terminus, Minecraft below) — top series gets label above, bottom series gets label below.

## Type

Feature ticket

## Prerequisites

None. `<LineDirectLabel>` already exists; this ticket fixes the auto-positioning behavior for multi-series cases.

## Problem

The current `<LineDirectLabel>` auto-positioning logic handles the two-series case: the higher series gets a label above, the lower series gets a label below. For **three or more series**, the expected behavior is that all labels stack above their respective line termini (not split top/bottom). The current behavior for 3+ series is unverified and may need explicit logic changes.

## Requirements

1. Verify the current auto-positioning behavior for 3+ series (code check first).
2. For 3+ series: all labels should default to stacking above the line terminus, offset vertically to avoid overlap.
3. For exactly 2 series: retain the current top/bottom split (top series → above, bottom series → below).
4. Manual `position` override on `<LineDirectLabel>` always takes priority over auto-positioning.

## Plan

From the transcript (Connor, ~2:20):
> "The main gap is positioning. The current logic handles the two-series case: top series gets label above, bottom series below. For three or more series, all labels should stack above."
> "A manual `position` prop exists to override auto-positioning."

From the transcript (Connor, ~43:16):
> "The current multi-series direct label support is mostly functional. The remaining gap is the auto-positioning behavior for 3+ series. The intent is that positioning is automatic — manual overrides may not be needed, but the auto-positioning must be reliable."

### Implementation approach

1. Read `vega-spec-builder-s2/src/line/lineDirectLabelMarkUtils.ts` to find where auto-positioning is determined.
2. Find the condition that handles 2-series top/bottom split.
3. Add a branch: when series count ≥ 3, set all labels to `above` and apply incremental y-offsets to avoid stacking on top of each other.
4. Write a unit test for the 3+ case that asserts all labels are positioned above.

## Open Questions

- Is "above" the correct default for 3+ series, or does it depend on the line's y-position (could a line at the very top of the chart benefit from a below label)?
- Should the stacking offset between labels when 3+ series are above be a fixed pixel value or scale-aware?
