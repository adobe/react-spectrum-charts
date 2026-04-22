# Issue: Chart sizing from Figma outer frame produces oversized RSC charts

## Problem

When the Figma node is a card-style component (title + chart content inside a padded frame),
`analyze-chart-design` reads the **outer frame dimensions** as `chartWidth`/`chartHeight` and
passes them directly to the RSC `Chart` component. This produces an RSC chart that is visually
much larger than the design.

### Root cause

Figma card components have decorative padding (e.g. 56px top / 64px bottom / 148px left / 96px
right) and a title text block that together consume a significant fraction of the outer frame.
RSC does not replicate this padding — the Vega engine fills all of `width × height` with the
chart visualization. As a result, the RSC plot area is far larger than the Figma plot area even
though both are nominally at the same outer dimensions.

### Concrete example (Line chart L, 4615-28409)

| | Figma | RSC at 752×480 |
|---|---|---|
| Outer frame | 752×480 | 752×480 |
| Card padding | 56 T / 64 B / 148 L / 96 R | none |
| Title area height | 66px | ~35px (Vega title) |
| Plot area dimensions | 506×244 px | 643×385 px |
| Plot area as % of frame | 67% W × 51% H | 85% W × 80% H |

The RSC chart is approximately **2.4× larger** in area than the Figma chart content.

---

## Fix 1: Use inner content group dimensions (implemented)

The first fix (now in `analyze-chart-design`) changed from outer frame to inner content group:

```
chartWidth  = chart content group width   (508)
chartHeight = chart content group height + title group height  (294 + 66 = 360)
```

This reduced RSC plot area to 399×265 — much closer but still not matching the 506×244 reference.

---

## Fix 2 (known gap): Axis area lives in card padding, not content group

### Problem

The Figma Y-axis labels and axis title live in the **card padding** (the 148px left padding),
not inside the "chart content group." RSC allocates these elements within its `width` budget.

As a result, setting `chartWidth = chart content group width (508)` leaves RSC with only
399px for the actual plot (85px consumed by Y-axis labels/title + 24px right margin).

Similarly, the Figma bottom axis labels and title live in the 64px **bottom card padding**,
outside the content group. RSC allocates these within its `height` budget.

### Measurements (4615-28409 at 508×360)

| Element | Figma | RSC at 508×360 |
|---|---|---|
| Left axis area (Y labels + title) | 148px card padding | 85px from chart width |
| Right margin | 96px card padding | 24px from chart width |
| Plot width | 506px | 399px |
| Title area | 66px title box | 35px from chart height |
| Bottom axis area | 64px card padding | 60px from chart height |
| Plot height | 244px | 265px |

### Correct heuristic

Anchor sizing on `referencePlotBounds` (gridline-derived plot area in the SVG), then add
back estimated RSC axis/title overhead:

```
chartWidth  = referencePlotBounds.width  + RSC_left_axis_overhead + RSC_right_margin
chartHeight = referencePlotBounds.height + RSC_title_overhead     + RSC_bottom_axis_overhead
```

**RSC overhead estimates:**

| Component | Typical range | Notes |
|---|---|---|
| Left Y-axis (labels + title) | 65–95px | 65px for short labels (0–100), 85–95px for "$300M"-style |
| Right margin | 20–30px | minimal, usually 20px if no right axis |
| Vega title | 35–45px | compact; 0 if no title |
| Bottom X-axis (labels + title) | 50–70px | 50px labels only, +20px if axis title present |

For the concrete case (4615-28409):
```
chartWidth  = 506 + 85 + 24 = 615px
chartHeight = 244 + 35 + 60 = 339px
```

### Why `referencePlotBounds` is the right anchor

The `referencePlotBounds` is derived from horizontal gridline x/y coordinates in the SVG — it
is a precise pixel measurement of the actual marks area, independent of card padding or group
hierarchy ambiguities. It is more reliable than inferring dimensions from the Figma node tree.

---

## Impact on existing stories

Any story generated from a Figma padded-card node using inner content group dimensions will
have a plot area narrower than the design. The most visible symptom is axis labels crowding
the plot, or the overall chart appearing compressed horizontally relative to the design.

## Acceptance criteria

- [ ] `analyze-chart-design` detects padded card nodes and uses `referencePlotBounds` + overhead
- [ ] `design-observation.json` records `referencePlotBounds`, `chartWidth`, `chartHeight`, and
      the RSC overhead estimates used
- [ ] The heuristic rationale in `analyze-chart-design.md` is updated to use this rule
- [ ] At least one round-trip test confirms the corrected size produces a plot area matching the
      reference plot dimensions within ±10%
