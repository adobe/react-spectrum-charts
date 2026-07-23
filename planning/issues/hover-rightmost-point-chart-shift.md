# Issue: Hovering the Rightmost Data Point Causes a Slight Horizontal Chart Shift

**Status:** Open

## Symptom

When hovering over the rightmost data point on a line chart, the entire chart — including axes — shifts slightly to the left. Moving off the rightmost point shifts it back. The shift is horizontal only and affects all marks and axes in the plot area. It occurs regardless of whether hover labels are enabled.

Confirmed on: `WithoutHoverLabel`, `WithHoverLabel`, `DimensionHover` stories in `React Spectrum Charts 2/Line/Features/HoverLabel`.

---

## Root Cause

Unknown. Investigation narrowed it down to a pre-existing issue in the hover marks (hover rule, highlight point), not the hover label feature. The chart uses `autosize: { type: 'fit', contains: 'padding', resize: true }`, which reruns layout on every update. The leading hypothesis is that a hover mark at the rightmost data point overflows the plot area boundary by a pixel or two — either the hover rule's 1px stroke bleeding past `x = width`, or the highlight point's stroke at the chart edge — causing Vega to add right padding, compressing the plot width, and shifting all content left. When the hover moves off the rightmost point, the padding reverts.

---

## Relevant Files

| File | Role |
|---|---|
| `vega-spec-builder-s2/src/line/lineMarkUtils.ts` | `getHoverRule()`, `getHighlightPoint()` — the hover marks that render at the rightmost point |
| `vega-spec-builder-s2/src/line/linePointUtils.ts` | `getHighlightPoint()` — highlight point size and stroke |
| `react-spectrum-charts-s2/src/hooks/useSpec.tsx` | Sets `autosize: { type: 'fit', contains: 'padding', resize: true }` |
| `themes/src/spectrum2Theme.ts` | Also sets `autosize: { type: 'fit', contains: 'padding', resize: true }` |

---

