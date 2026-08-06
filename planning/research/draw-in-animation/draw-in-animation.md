# Line Draw-In Animation — Design & Architecture

A reference for the line mount-animation system: on mount, an animated line "draws in" left to right
instead of appearing fully formed. Companion to [`hover-animation-system.md`](../hover-animation-system/hover-animation-system.md),
which documents the animated hover/highlight engine this feature shares an opt-in gate with (`isAnimate`)
but is otherwise fully independent from.

---

## 1. What it does

Over `DRAW_IN_ANIMATION_DURATION_MS` (1000ms, eased), a cutoff position sweeps across the line's
dimension domain. The line only renders the portion up to that cutoff, so it appears to draw itself in.
The point currently being crossed (the "tip") is smoothly interpolated between its own position and the
next point's position, so the leading edge moves continuously rather than jumping point-to-point.

Draw-in activates when both are true, resolved once as `LineSpecOptions.isDrawInAnimate`:
- `animations === true` — explicit chart-level opt-in (not `!== false` — draw-in has no other gate like
  hover-animation's interactivity check, so it must default off)
- the line's `scaleType` is `'time'`, `'linear'`, or `'point'` (§2)

Everything downstream — data sources, signals, the facet-source swap, and the mark's x/y encoding —
gates on `isDrawInAnimate`.

---

## 2. Scale-type support

`isLineDrawInSupported` (`lineSpecBuilder.ts`) allows all three continuous/ordinal scale types line
supports:

```ts
const isLineDrawInSupported = (animations, options) =>
  animations === true &&
  (options.scaleType === 'time' || options.scaleType === 'linear' || options.scaleType === 'point');
```

`'time'` and `'linear'` share a property that makes them cheap to generalize together: the dimension
value doubles as both the sort key (for cutoff/tween math) and the scale-lookup key. `getDrawInSortField`
picks the right one — the raw dimension for `'linear'`, or a numeric-ms proxy for `'time'` (§3a, since
Vega's time scale domain is Date-typed but the math needs raw numbers).

**`'point'` (ordinal/categorical) needs two separate fields, not one.** A numeric dimension on a point
scale happens to work using the same single-field approach as linear (the sort/cutoff math never
touches the scale's *positions*, only the raw field value) — but a *genuinely categorical* dimension
(e.g. a `quarter` string field) can't be compared to a numeric cutoff directly. So for `'point'`,
`getDrawInSortField` returns a derived numeric **ordinal index** (this row's position within the scale's
domain) instead of the dimension itself — see §3i for how that index is computed and threaded through
the rest of the pipeline alongside the *real* category value (still needed, unchanged, for the actual
`scale('xPoint', ...)` position lookups).

---

## 3. The Vega data-flow pipeline

Per animated line named `line0`, everything lives in `vega-spec-builder-s2/src/marks/drawInAnimationUtils.ts`
(mirrors `hoverAnimationUtils.ts`'s pattern of keeping an animation system's data/signal/encoding logic
in one file).

### 3a. `rscDrawInTimeMs` — numeric time field on `table` (time scale only)

`addDrawInTimeMsTransform` adds `{ type: 'formula', expr: 'toNumber(datum.datetime)', as: DRAW_IN_TIME_MS_FIELD }`
to `table`, guarded against duplicate insertion. Skipped for `'linear'` scales — the dimension is
already numeric.

### 3b. Lead transform — each row's own next point, per series

`addDrawInLeadTransform` adds a `window` transform to its source (`filteredTable` for time/linear, the
point-index source for point scale — §3i):
```
{ type: 'window', sort: { field: <sortField>, order: 'ascending' }, groupby: [rscSeriesId],
  ops: ['lead', ...], fields: [<sortField>, metric, ...],
  as: ['${name}_drawInNextDimValue', '${name}_drawInNextMetricValue', ...] }
```
For `'point'` scale, a third field/lead is added — the next row's real category value
(`DRAW_IN_NEXT_CATEGORY_FIELD`) — since `<sortField>` (the ordinal index) isn't a valid scale-lookup
value there (§3i). Vega's `window` transform sorts internally by `sort` regardless of the incoming
array's physical order — so these per-row lead fields are correct regardless of whether the source data
happens to be sorted. Output fields are name-scoped since the source can be shared across marks. Guarded
against duplicate insertion.

### 3c. Derived sources — `getLineDrawInData`

| Source | Built from | Purpose |
|---|---|---|
| `${name}_drawInPrev` | `getDrawInDataSourceName`'s source (`filteredTable`, or `${name}_drawInIndexed` for point scale — §3i) filtered to `<sortField> <= cutoff` | the already-drawn portion of the line |
| `${name}_drawInTip` | same source, filtered per-row (§3e) | each series' currently-active bracketing point, flagged `isDrawInTip: true` |
| `${name}_drawInLerp` | `source: ['${name}_drawInPrev', '${name}_drawInTip']` | the merged source the line mark actually facets/renders from |

### 3d. Signals — `addLineDrawInAnimationSignals`

```
drawInStart              = now()                                    // shared, captured once at mount
drawInAnimT               = clamp((now() - drawInStart) / 1000, 0, 1) // shared, linear 0→1, throttled timer
drawInAnimTEased          = <shared, quadratic ease-in-out of drawInAnimT>
${name}_drawInDomainMin/Max  = extent(domain(<xScaleName>))[0]/[1]     // this mark's own x-domain range
${name}_drawInAnimCutoff  = drawInAnimTEased * (max - min) + min       // the sweeping cutoff, in domain units
```
`<xScaleName>` is `getScaleName('x', scaleType)` (`xTime`/`xLinear`/`xPoint`), so this generalizes across
supported scale types. For `'point'` scale, `domain(<xScaleName>)` holds category values, not numbers,
so domain min/max are instead the ordinal index range `[0, domain length - 1]` — matching the sort field
`getDrawInSortField` uses for that scale type (§3i). `drawInStart`/`drawInAnimT`/`drawInAnimTEased` are
pure elapsed-time math with no mark-specific inputs, so they're registered once (guarded by
`hasSignalByName`) and shared across every animated mark — every line reveals in sync off the same clock.

**No shared "which value is currently being crossed" signal exists.** An earlier version tracked a
single `${name}_drawInPrevValue`/`NextValue`/`Tween` per *mark*, computed by searching the flat
`filteredTable` array for "the next distinct value after the current max." That broke two ways: it
assumed every series was at the same point in its own sequence at the same time (false whenever series
have different domain coverage — e.g. one series ends earlier than others — the lagging series would
freeze until the sweep caught up, then snap), and the array search was sensitive to row order. The tip
identification (§3e) and tween (§3f) are per-row/per-series instead, using only the lead fields already
computed in §3b — no cross-row or cross-series lookup anywhere.

### 3e. Tip identification (in `getLineDrawInData`)

A row is the active tip for its series if:
```
datum.<sortField> <= cutoff && isValid(datum.<nextDimField>) && datum.<nextDimField> > cutoff
```
i.e. the cutoff has passed this row but not yet its own next row. A series' last point (no next point)
never qualifies — once past it, that row just stays a normal fully-drawn point via `drawInPrev` alone,
with nothing left to interpolate toward.

### 3f. Tween — `getDrawInTweenExpr`

```ts
const tween = `clamp((cutoff - datum.<sortField>) / (datum.<nextDimField> - datum.<sortField>), 0, 1)`;
```
Computed inline per-datum in the mark's x/y encoding (not a signal) — purely local to each row, using
only that row's own sortField and its own lead-computed next value.

### 3g. Encoding — `getLineDrawInXEncoding` / `getLineDrawInYEncoding`

```
x: isValid(datum.isDrawInTip) ? lerp([scale(xScale, datum[dimField]), scale(xScale, datum.<nextLookupField>)], tween) : scale(xScale, datum[dimField])
y: isValid(datum.isDrawInTip) ? lerp([scale(yScale, datum[metric]), scale(yScale, datum.<nextMetricField>)], tween) : scale(yScale, datum[metric])
```
Non-tip rows render at their normal scaled position (same as the static path). `<nextLookupField>` is
`<nextDimField>` for time/linear, but `DRAW_IN_NEXT_CATEGORY_FIELD` for `'point'` scale — see §3i for why
those diverge there. `getLineMark` branches on `isDrawInAnimate` (not `isAnimate`): static lines keep `y`
in `encode.enter` (evaluated once); draw-in animated lines move both `x` and `y` into `encode.update`
(re-evaluated every animation tick). Dual-metric-axis lines branch onto the primary/secondary y-scale via
the shared `getDualAxisDrawInRule`, matching `getLineYEncoding`'s static equivalent — the metric axis is
always numeric regardless of the x scale's type, so it needs no `'point'`-specific handling.

### 3h. Facet-source swap — `addLineMarks` (`lineSpecBuilder.ts`)

The line's facet group normally reads from `filteredTable` (or `${name}_with_bridges` /
`${name}_primarySeriesFacetData`). When `isDrawInAnimate`, it reads from `${name}_drawInLerp` instead —
this is what actually clips the rendered line to "drawn so far." The gradient area mark (if `gradient`
is set) shares the same facet group, so it's clipped too, but its own x/y encoding is never draw-in
aware (§7) — its leading edge jumps point-to-point rather than tweening smoothly like the line.

**Known gap:** the draw-in facet swap unconditionally wins over the alternate-segments facet
(`${name}_with_bridges`, used for forecasts/`alternateSegmentKey`) — combining draw-in with either isn't
handled and hasn't been tested.

The highlight overlay (`getLineHighlightOverlayGroup`) forces `isAnimate: false` **and**
`isDrawInAnimate: false` on its duplicate line mark so it always renders with the static encoding, even
though it still facets from the same (possibly `${name}_drawInLerp`) source as the base line.

### 3i. Point-scale ordinal index — `getLineDrawInPointIndexData`

For `'point'` scale, the dimension's raw value (a category, e.g. `'Q1'`) can't do double duty as both
sort key and scale-lookup key the way `'time'`/`'linear'` dimensions can — a category isn't itself an
orderable number. So a genuinely separate numeric sort key is derived: **this row's ordinal index within
the x scale's domain**.

```ts
{
  name: `${name}_drawInIndexed`,
  source: FILTERED_TABLE,
  transform: [{ type: 'formula', as: `${name}_drawInPointIndex`, expr: `indexof(domain('xPoint'), datum.<dimension>)` }],
}
```

This has to live on a data source **downstream of both `filteredTable` and the x scale** — never on
`filteredTable` itself. The x scale's domain is derived *from* `filteredTable`, so a formula added to
`filteredTable` that reads `domain('xPoint')` would create a circular dependency (the scale needs
`filteredTable` to finish; the formula needs the scale to finish first). `${name}_drawInIndexed` is a
plain derived source, so it's free to depend on the already-resolved scale.

Everything downstream treats this exactly like the time-scale ms field, with one difference: since the
ordinal index isn't a valid scale-lookup value, `addDrawInLeadTransform` (§3b) also leads the row's
*actual* category value forward (as `DRAW_IN_NEXT_CATEGORY_FIELD`) alongside the index, so
`getLineDrawInXEncoding` (§3g) has something real to pass to `scale('xPoint', ...)` for the tip's target
position — the index is only ever used for the cutoff/tween math (§3e/§3f), never for a scale lookup.

In `addData` (`lineSpecBuilder.ts`), `getLineDrawInPointIndexData`'s result is pushed as its own data
source and passed to `addDrawInLeadTransform` directly (rather than mutating `filteredTable` in place,
as the time/linear path does) — `getDrawInDataSourceName` tells `getLineDrawInData` (§3c) to source its
`prevData`/`tipData` from `${name}_drawInIndexed` instead of `filteredTable` for this scale type.

---

## 4. Constants

| Section | Constants |
|---|---|
| animation timing | `DRAW_IN_ANIMATION_DURATION_MS` (1000) |
| vega data source names | `DRAW_IN_PREV_DATA`, `DRAW_IN_TIP_DATA`, `DRAW_IN_LERP_DATA`, `DRAW_IN_POINT_INDEX_DATA` (point scale only, §3i) |
| vega data field names | `DRAW_IN_TIME_MS_FIELD`, `DRAW_IN_NEXT_DIM_FIELD`, `DRAW_IN_NEXT_METRIC_FIELD`, `DRAW_IN_TIP_FLAG`, `DRAW_IN_POINT_INDEX_FIELD` (point scale only, §3i), `DRAW_IN_NEXT_CATEGORY_FIELD` (point scale only, §3i) |
| signal names | `DRAW_IN_START`, `DRAW_IN_ANIM_T`, `DRAW_IN_ANIM_T_EASED` (shared), `DRAW_IN_DOMAIN_MIN`, `DRAW_IN_DOMAIN_MAX`, `DRAW_IN_ANIM_CUTOFF` (per-mark) |

---

## 5. Key files

| File | Role |
|---|---|
| `packages/constants/constants.ts` | draw-in constants (§4) |
| `vega-spec-builder-s2/src/marks/drawInAnimationUtils.ts` | everything: `getDrawInSortField`, `getDrawInDataSourceName`, `getLineDrawInPointIndexData` (§3i), `addDrawInTimeMsTransform`, `addDrawInLeadTransform`, `getLineDrawInData`, `addLineDrawInAnimationSignals`, `getDrawInTweenExpr`, `getLineDrawInXEncoding`/`getLineDrawInYEncoding`, `getDualAxisDrawInRule` |
| `vega-spec-builder-s2/src/line/lineSpecBuilder.ts` | `isLineDrawInSupported` gate, computes `isDrawInAnimate`; wires `addData`/`addSignals`/`addLineMarks` to call into `drawInAnimationUtils.ts` when true |
| `vega-spec-builder-s2/src/line/lineMarkUtils.ts` | `getLineMark`'s `isDrawInAnimate` branch; highlight-overlay override |
| `vega-spec-builder-s2/src/types/marks/lineSpec.types.ts`, `vega-spec-builder-s2/src/line/lineUtils.ts` | `isDrawInAnimate` field on `LineSpecOptions`/`LineMarkOptions` |

---

## 6. Storybook coverage

`packages/react-spectrum-charts-s2/src/stories/Line/Features/DrawInAnimation/LineDrawInAnimation.story.tsx`
exposes the same `animations` toggle pattern as the hover-animation stories, with stories for: baseline
time scale, linear scale, point scale (numeric dimension — uses the same single-field path as linear,
§2), categorical point scale (a genuine string dimension — the two-field ordinal-index case, §3i; draws
in correctly), and a "funky data shape" case (unsorted/interleaved rows with a mid-series gap, to
demonstrate order-independence).

---

## 7. Known gaps / not yet done

- **Gradient mark doesn't tween its tip.** `getLineGradientMark` always uses the static x/y encoding, so
  during draw-in its leading edge jumps between data points instead of smoothly tracking the line's
  interpolated tip.
- **Alternate segments / forecasts untested with draw-in.** The facet-source swap (§3h) unconditionally
  overrides `${name}_with_bridges`; combining the two hasn't been exercised.
- **No unit tests yet** for `drawInAnimationUtils.ts` (mirroring `hoverAnimationUtils.test.ts`'s
  coverage) or for the `isDrawInAnimate` gate in `lineSpecBuilder.test.ts`.
- **Only line uses this system.** `drawInAnimationUtils.ts` was written to generalize (parameterized by
  `name`/`dimension`/`metric`/`scaleType`, not line-specific internals) but hasn't been ported to
  another mark yet.
