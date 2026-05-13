---
type: feature
status: new
priority: P1
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# Line Cap Style (Rounded Endpoints)

## Images

None colocated — visible in all S2 line chart examples including the null values section.

## Type

Feature ticket

## Prerequisites

None.

## Problem

Every S2 Figma line chart example shows rounded line endpoints (`strokeLinecap: 'round'`). The current S2 implementation uses the default Vega cap style (butt/square). Rounded caps apply to:
- The start and end of each line series
- The ends of line segments at null-value gap boundaries (lines break at gaps — each side of the gap has a rounded terminus)

The design also shows at least one example with square caps, so this must be an overridable default, not hardcoded.

## Requirements

1. Change the default `strokeLinecap` on line marks to `'round'` in the S2 spec builder.
2. Add a `lineCap?: 'round' | 'square' | 'butt'` prop to `LineOptions` for override. Default: `'round'`.
3. Ensure the cap style applies to all Vega line marks for a given `<Line>` — including the hover-thickened mark (same cap).
4. Applies at null-value gap boundaries automatically (no extra work needed — Vega's per-segment rendering already picks up the strokeLinecap setting).

## Plan

From the transcript (Connor, ~5:58–6:09):
> "The ends of the lines in all these examples are rounded — this is a feature we need to capture."
> "The current implementation does not use rounded caps. All shown examples have rounded caps, so round should be the default."
> "One example shows square caps. Both rounded and square exist, so we need to confirm with design what determines which is used. The implementation should default to rounded and add a prop to support square."

### Implementation approach

- In `vega-spec-builder-s2/src/line/lineMarkUtils.ts`, find where line mark `strokeCap` or `strokeLinecap` is set (or defaulted)
- Add `"strokeCap": "round"` to the Vega encode for the line mark
- Wire `lineCap` prop through `LineOptions` → `LineSpecOptions` → encode

## Design Check Required

- When should square cap be used — is it a specific chart pattern, or a developer preference?

## Open Questions

- Does `lineCap` need to be exposed in the React `LineProps`, or is `'round'` always the right default and only designers/devs would override it?
- Should forecast line marks (`<LineForecast>`) independently control cap style, or inherit from the parent `<Line>`?
