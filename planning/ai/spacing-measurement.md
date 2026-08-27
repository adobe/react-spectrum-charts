# Feature: Spacing measurement in verify-chart-story

## Problem

The `verify-chart-story` visual comparison checklist covers series colors, tick values,
gridline count, curve shape, and legend position — but not layout spacing. Spacing differences
between the RSC output and the Figma design go unreported.

In practice this means gaps like the following are never classified or surfaced:
- Gap between the title and the top of the plot area (title-to-chart spacing)
- Left margin between axis labels and the plot left edge
- Right margin between the plot right edge and axis labels
- Top padding above the first gridline
- Bottom padding below the x-axis tick labels

These are real library gaps between RSC's default padding and the S2 design spec, and they
belong in the gap classification report.

### Observed measurements (4615-28409, Line chart at 508×360)

| Margin | Figma | RSC at 508×360 | Delta |
|---|---|---|---|
| Top (title-to-plot) | 66px | 35px | −31px |
| Left (axis labels to plot) | 0px (Y-axis is in card padding) | 85px | +85px |
| Right | 2px (within content group) | 24px | +22px |
| Bottom (plot to x-axis bottom) | 49px | 60px | +11px |

The title-to-plot gap (−31px) is the most visible issue: RSC's Vega title takes ~35px while
the Figma title box allocates 66px. This cannot be fixed by resizing alone — it would require
a `titlePadding` or `titleOffset` prop on the RSC `Title` component to match the S2 spec.

The left-axis margin discrepancy (+85px) is the root of the "chart width too narrow" problem:
the Y-axis area is in the Figma card padding but inside RSC's `width` budget. See
`chart-sizing-from-figma.md` for the corrected `chartWidth` heuristic.

---

## Proposed solution

Add a `measure-spacing.mjs` script that computes margin measurements from available bounding
box data and writes a diff.

### Inputs

- `./tmp/ai/plot-bounds.json` — Vega plot area bounding box (x, y, w, h) within the result screenshot
- `chartWidth`, `chartHeight` from `design-observation.json` — full result frame dimensions
- `referencePlotBounds` from `design-observation.json` — reference plot area bounding box
- `frameWidth`, `frameHeight` from `design-observation.json` — reference frame dimensions

### Computed margins

For both reference and result:
```
topMargin    = plotY
leftMargin   = plotX
rightMargin  = frameWidth - (plotX + plotWidth)
bottomMargin = frameHeight - (plotY + plotHeight)
```

Output written to `./tmp/ai/spacing-comparison.json`:

```json
{
  "reference": { "top": 96, "left": 40, "right": 32, "bottom": 48 },
  "result":    { "top": 56, "left": 17, "right": 35, "bottom": 50 },
  "deltas":    { "top": -40, "left": -23, "right": 3, "bottom": 2 }
}
```

### Integration with verify-chart-story

- Run `measure-spacing.mjs` after the screenshot step.
- Include a `spacing` section in `verification-report.json`.
- Any delta > 4px on any side surfaces as a discrepancy in `gap-classification.json`.
- Classify spacing gaps as Category 2 or 3 depending on whether they could be addressed
  via a new prop (e.g. `titlePadding`) or require spec builder changes.

## Acceptance criteria

- [ ] `spacing-comparison.json` is written on every verify run
- [ ] `verification-report.json` includes a `spacing` section with all four margins and deltas
- [ ] Spacing deltas > 4px appear as discrepancies in `gap-classification.json`
- [ ] The checklist in Step 3 of `verify-chart-story` explicitly lists title-to-chart gap
      and internal margins as required checks
