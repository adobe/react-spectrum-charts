# Issue: Line Points Ignore Hover and Controlled Opacity

## Symptom

Static points on a line mark stay at full opacity when the parent line is dimmed — during hover interactions (other series highlighted) and when controlled opacity/highlighting is applied. Points and their line visually disagree.

---

## Root Cause

`getLineStaticPoint()` in `linePointUtils.ts` encodes no opacity whatsoever in either its `enter` or `update` blocks. The parent line mark encodes opacity in its `update` block via `getLineOpacity()`, which handles five distinct interaction states. Static points receive none of this.

### What the line mark does (`lineMarkUtils.ts:88-129`)

`getLineMark` adds opacity to its `update` encoding (line 125):

```ts
update: {
  x: getXProductionRule(scaleType, dimension),
  opacity: getLineOpacity(lineMarkOptions),
}
```

`getLineOpacity()` (lines 131–216) produces production rules covering:

| Condition | Signal used | Behavior |
|---|---|---|
| Hover dimming | `HOVERED_ITEM` | Non-hovered series → `FADE_FACTOR` (0.25) |
| Controlled highlight | `CONTROLLED_HIGHLIGHTED_TABLE`, `CONTROLLED_HIGHLIGHTED_SERIES` | Non-highlighted → dimmed |
| Selection | `SELECTED_SERIES` | Non-selected → dimmed |
| Dimension hover | `DIMENSION_HOVER_AREA` | Dimension-level dimming |
| Group highlight | `highlightedData` lookup | Multi-series group dimming |

### What static points do (`linePointUtils.ts:73-107`)

```ts
encode: {
  enter: {
    size: { value: pointSize },
    fill: fillEncode,
    stroke: strokeEncode,
    y: getLineYEncoding(lineOptions, metric),
  },
  update: {
    x: getXProductionRule(scaleType, dimension),
  },
}
```

No `opacity` key anywhere. Points are permanently at full opacity regardless of interaction state.

---

## Test Coverage Gap

`linePointUtils.test.ts` tests for static points cover fill, stroke, and sparkline behavior only. There are no opacity tests. By contrast, `lineMarkUtils.test.ts` has 26+ test cases specifically for `getLineOpacity` covering all interaction modes.

---

## Relevant Files

| File | Role |
|---|---|
| `vega-spec-builder/src/line/linePointUtils.ts` | **Bug location** — `getLineStaticPoint()`, lines 73–107 |
| `vega-spec-builder/src/line/lineMarkUtils.ts` | Reference — `getLineOpacity()` lines 131–216 |
| `vega-spec-builder/src/marks/markUtils.ts` | `getMarkOpacity()` and `getOpacityProductionRule()` helpers |
| `vega-spec-builder/src/line/linePointUtils.test.ts` | Needs opacity test cases added |

---

## Proposed Fix

Add opacity encoding to `getLineStaticPoint()` mirroring the line mark:

```ts
enter: {
  size: { value: pointSize },
  fill: fillEncode,
  stroke: strokeEncode,
  y: getLineYEncoding(lineOptions, metric),
  opacity: getOpacityProductionRule(opacity),   // base opacity
},
update: {
  x: getXProductionRule(scaleType, dimension),
  opacity: getLineOpacity(lineMarkOptions),      // hover/controlled/selection dimming
},
```

`getLineStaticPoint` already receives `lineOptions` so the necessary options are already in scope. The function signature likely needs extending to accept the full `lineMarkOptions` shape that `getLineOpacity` expects, or `getLineOpacity` needs to be called with the options already available.
