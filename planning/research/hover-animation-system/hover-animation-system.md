# Hover Animation System — Design & Architecture

A reference for rebuilding the line/mark hover-animation system (smooth opacity / stroke-width
transitions on hover) from scratch. Written against the `vega-spec-builder-s2` implementation but the
design is engine-agnostic: it's a Vega-signal/data-flow pattern that can be reproduced anywhere charts
are compiled to Vega specs.

---

## 1. What it does

When a user hovers a series (or a legend entry, or an external highlight is applied), the emphasized
series stays prominent while the others **smoothly animate** to a de-emphasized state, and back again on
un-hover. Instead of an instant `hovered ? A : B` production rule, every animatable property is driven by
a continuously-interpolated per-series value.

The engine is property-agnostic: it drives a single animated fraction per series (§2), and *any* property
whose visual treatment can be expressed as an emphasize/deemphasize ramp on that fraction is a candidate
consumer — not just the two below. **Opacity** and **stroke width** are simply the two that have been built
and tested so far: opacity (non-hovered series fade toward `0.2`) and stroke width (the hovered series grows
toward the hover width). New properties are added purely by writing a new consumer that maps
`getHoverFractionSignal` via the ramp helpers (§4) — no engine changes required. For the line mark, only
**opacity** is wired up so far (`getLineOpacity`, §6) — deliberately left as the single reference example for
how to wire a consumer; stroke width (`getLineStrokeWidth`) still uses the original instant production rules
unconditionally and is a good next consumer to add by following the same pattern.

---

## 2. Core concept: the "emphasis level" fraction

The whole system reduces to **one scalar per series**, animated over time, called the *fraction* or
*emphasis level*, in `[0, 1]` with **neutral at the midpoint (`0.5`)**:

```
0 ─────────────── 0.5 ─────────────── 1
deemphasized       neutral          emphasized
(another series    (nothing         (this series
 is hovered)        hovered)          is hovered)
```

The key insight that makes it versatile: a single scalar can't be both "how faded" and "how emphasized"
at once *unless* you put neutral in the middle. Then each consumer maps the **half** it cares about:

- **Opacity** reacts to the **lower half `[0, 0.5]`** — fades out on de-emphasis; neutral and emphasis
  are both fully opaque. (Opacity must stay `1` at rest, which is exactly the `[0.5, 1]` flat region.)
- **Stroke width** reacts to the **upper half `[0.5, 1]`** — grows on emphasis; neutral and de-emphasis
  are both the normal width.

Because neutral is the exact midpoint, both halves get a full `[0..1]` sub-range and animate over the
same duration (symmetric timing).

This is the single most important design decision. An earlier 2-state target (`1` = emphasized/at-rest,
`0` = deemphasized) worked for opacity but made stroke width impossible, because "at rest" and "hovered"
both mapped to `1`.

---

## 3. The Vega data-flow pipeline (the heart of it)

Per animated mark named `line0`, five spec pieces are emitted. Data sources feed each other; a global
timer drives re-evaluation.

### 3a. Global timer signal (one per chart, shared)
```json
{ "name": "hoverTimer", "value": 0,
  "on": [{ "events": { "type": "timer", "throttle": 33 }, "update": "now()" }] }
```
Ticks ~30fps. Every data source that depends on it re-computes each tick, which is what produces motion.
Guarded by name so multiple marks share one timer.

### 3b. Target data — `line0_hoverTargetData`
Aggregates the filtered table by the **identity field** (series id) and computes a per-series `target`
(the value we're animating *toward*): `1` emphasized, `0` deemphasized, `0.5` neutral.
```json
{ "name": "line0_hoverTargetData", "source": "filteredTable",
  "transform": [
    { "type": "aggregate", "groupby": ["rscSeriesId"] },
    { "type": "formula", "as": "hoveredMatch", "expr": "<1|0|null>" },
    { "type": "formula", "as": "controlledTableMatch", "expr": "<1|0|null>" },
    { "type": "formula", "as": "controlledSeriesMatch", "expr": "<1|0|null>" },
    { "type": "formula", "as": "target",
      "expr": "isValid(datum.hoveredMatch) ? datum.hoveredMatch : ... : 0.5" }
  ] }
```
Each match rule yields `1` (this series is the hovered/highlighted one), `0` (something is active but not
this series), or `null` (that rule is inactive). `target` = **first non-null match, else neutral (`0.5`)**.

### 3c. Targets signal — `line0_hoverTargets`
```json
{ "name": "line0_hoverTargets", "update": "pluck(data('line0_hoverTargetData'), 'target')" }
```
An array of the current targets, indexed positionally by series. Used as the trigger + source-of-truth
for the animation state.

### 3d. Animation state — `line0_hoverAnimStateData`
A `values` data source, **one row per series identity**, tracking the in-flight animation:
```json
{ "name": "line0_hoverAnimStateData",
  "values": [{ "rscSeriesId": "<id>", "startTime": 0, "startValue": 1, "target": 1 }, ...],
  "on": [{ "trigger": "line0_hoverTargets", "modify": "data('line0_hoverAnimStateData')[i]",
           "values": "{startTime: hasChanged ? now() : old.startTime,
                       startValue: hasChanged ? currentFraction : old.startValue,
                       target: line0_hoverTargets[i]}" }, ...] }
```
When the target for row `i` changes, it snapshots `startTime = now()` and `startValue = the fraction
value it's currently at` (so mid-animation reversals are smooth), and stores the new `target`. One
`on`-trigger entry per row, indexed positionally.

### 3e. Fraction data — `line0_hoverFractionData`
The actual interpolation, recomputed every time its driving clock ticks:
```json
{ "name": "line0_hoverFractionData", "source": "line0_hoverAnimStateData",
  "transform": [{ "type": "formula", "as": "fraction",
    "expr": "lerp([datum.startValue, datum.target], datum.target === datum.startValue ? 1 : clamp((hoverActiveTimer - datum.startTime) / (100 * abs(datum.target - datum.startValue)), 0, 1))" }] }
```
`fraction` linearly interpolates `startValue → target` at **constant speed**, not fixed duration:
`ANIMATION_HOVER_SPEED` (100ms) is the time for a full `0↔1` sweep, and the denominator scales it by
`abs(target - startValue)` so a shorter hop (e.g. a reversal mid-animation, where `startValue` is
wherever the fraction currently sits) finishes proportionally sooner instead of taking the same 100ms as
a full sweep. `target === startValue` is special-cased to `1` (elapsed already "complete") purely to
avoid a `0/0` division — it's not a real animation, just the resting state. This is the animated emphasis
level consumers read. Note it reads `hoverActiveTimer`, not `hoverTimer` directly — see §3f, the idle gate
that freezes this recompute while nothing is transitioning.

### 3f. Idle gating — freezing the clock while nothing animates

`hoverTimer` (§3a) ticks at 30fps for as long as *any* animated mark exists on the chart (gated at the
chart level by `isAnimate`, §6 — that gate decides *whether the timer exists at all*). But most of a
chart's life is spent with nothing hovered and no transition in flight: once a fade/grow finishes, there's
no reason to keep recomputing `hoverFractionData`'s `lerp(...)` for every row of every animated mark on
every tick forever. Idle gating adds a second, narrower gate: **pause the *clock that drives the fraction
recompute*, not the timer itself**, whenever nothing has changed recently.

Three additional pieces, all shared/global (guarded the same way `hoverTimer` is — added once regardless
of how many marks call in):

- **`hoverAnimLastChangeData`** — a single-row shared data source (one row for the whole chart, *not*
  per-mark) recording the timestamp of the most recent hover-target change from *any* animated mark:
  ```json
  { "name": "hoverAnimLastChangeData", "values": [{ "lastChange": 0 }],
    "on": [
      { "trigger": "line0_hoverTargets", "modify": "data('hoverAnimLastChangeData')[0]", "values": "{lastChange: now()}" },
      { "trigger": "bar0_hoverTargets",  "modify": "data('hoverAnimLastChangeData')[0]", "values": "{lastChange: now()}" }
    ] }
  ```
  Built by `addHoverAnimLastChangeData(data, name)`. Unlike `getHoverTargetData` / `getHoverAnimStateData` /
  `getHoverFractionData` — which are per-mark-uniquely-named and always safe to construct-and-return a
  fresh object — this data source is a **singleton shared across every animated mark**, so it needs
  find-or-create + append semantics against the full spec `data` array (find the existing row, or create
  it, then push one more `on`-trigger for this mark) rather than minting a new object each call. That's why
  its signature is `(data: Data[], name: string): void` (mutates in place) instead of `(options): SourceData`
  (returns a fresh object) — the same shape `addHoverAnimationSignals` already uses for the shared
  `hoverTimer`.

- **`hoverAnimating`** — a boolean signal, true while any change happened recently enough that a transition
  could still be in flight:
  ```json
  { "name": "hoverAnimating", "value": false,
    "update": "(hoverTimer - data('hoverAnimLastChangeData')[0].lastChange) < (ANIMATION_HOVER_SPEED + ANIMATION_THROTTLE)" }
  ```
  The `+ ANIMATION_THROTTLE` headroom gives the timer one extra tick past the nominal animation duration so
  a transition is guaranteed to reach its exact resting value before `hoverAnimating` flips false.

- **`hoverIdleTicks`** — counts consecutive ticks since `hoverAnimating` last went false, resetting to 0 the
  moment it's true again:
  ```json
  { "name": "hoverIdleTicks", "value": 0, "update": "hoverAnimating ? 0 : hoverIdleTicks + 1" }
  ```
  Exists purely to give `hoverActiveTimer` (below) a one-tick grace period past the idle transition. Without
  it, on a slow machine where frames get dropped, the tick where `hoverAnimating` flips false can be the
  *same* tick that jumps straight from mid-transition elapsed time to past-threshold elapsed time — skipping
  over the moment `hoverActiveTimer` would have captured the fraction's clamped resting value. That freezes
  `hoverActiveTimer` (and therefore the animated opacity/stroke-width) at a stale mid-transition value
  forever, since nothing re-fires it without a new hover event. Symptom in the wild: quickly hovering off one
  chart onto another while the machine is under load leaves the first chart's emphasis visibly stuck until
  you hover back over it.

- **`hoverActiveTimer`** — a gated clock that tracks `hoverTimer` while animating, *and for one tick past
  that* (`hoverIdleTicks <= 1`), then **holds its previous value (self-reference) from the second
  consecutive idle tick on**:
  ```json
  { "name": "hoverActiveTimer", "value": 0,
    "update": "hoverAnimating || hoverIdleTicks <= 1 ? hoverTimer : hoverActiveTimer" }
  ```
  `hoverFractionData` (§3e) reads *this*, not `hoverTimer`. Once `hoverActiveTimer` stops changing value,
  Vega's dataflow doesn't re-pulse anything downstream of it — so `hoverFractionData`'s `lerp(...)` formula
  transform (the actual per-row cost, which scales with series/mark count) stops recomputing entirely while
  idle. Any subsequent target change re-fires `hoverAnimLastChangeData`'s `on`-trigger for that mark, which
  flips `hoverAnimating` true again and lets `hoverActiveTimer` resume tracking `hoverTimer`. The
  `hoverIdleTicks <= 1` grace tick is what guarantees the resting value gets captured even when frames drop
  right at the idle boundary — mirroring the same "one extra tick of headroom" pattern `hoverAnimating`
  already uses via `+ ANIMATION_THROTTLE`.

**What this does and doesn't save:** `hoverTimer` itself still ticks at 30fps forever (via the browser
timer) as long as any animated mark exists — this gate doesn't stop that, and `hoverAnimating` /
`hoverActiveTimer` still get evaluated (cheap O(1) boolean/conditional) on every one of those ticks. That's
an inherent floor for a polling-based idle detector: something has to run each tick to notice "has it been
idle long enough to stop." What idle gating removes is the expensive part downstream — the per-row
`lerp(...)` recompute across every series of every animated mark — which is where the real CPU cost scales
with chart size. For a chart with many series/marks, that's the win; for a one-series chart it's a wash.

**Coupling risk — read before wiring this in:** `hoverAnimating`'s `update` expression references
`data('hoverAnimLastChangeData')[0]` by name. If `addHoverAnimationSignals` is called for a mark but
`addHoverAnimLastChangeData` is never called for *any* mark on that chart, `hoverAnimLastChangeData` won't
exist in the spec and Vega will throw "Unrecognized data set" at runtime. The two must always be wired
together for every chart that uses this engine — whoever wires idle gating into `addLine`/`addData` should
call both from the same place (or make one call the other) so they can't drift apart.

### Data-flow summary
```
hoverTargets signal ◄── hoverTargetData.target (0 / 0.5 / 1 from match rules)
   │
   ├─► hoverAnimStateData (on target change: snapshot startTime/startValue)
   │
   └─► hoverAnimLastChangeData.lastChange = now()  (shared across every animated mark)
                │
                ▼
hoverTimer (30fps) ──► hoverAnimating = (hoverTimer - lastChange) < speed + throttle
                                │
                                ├─► hoverIdleTicks = hoverAnimating ? 0 : hoverIdleTicks + 1
                                │            │
                                ▼            ▼
                        hoverActiveTimer = (hoverAnimating || hoverIdleTicks <= 1) ? hoverTimer : hoverActiveTimer
                                │                                        (frozen from the 2nd idle tick on)
                                ▼
                        hoverFractionData.fraction = lerp(startValue→target, elapsed/speed)
```

---

## 4. Consumers — mapping the fraction to a property

Consumers live in the mark/legend code, **not** the engine. They read the fraction by looking it up per
datum and apply property-specific math. Two shared range-mapping helpers keep the "which half" logic DRY
while leaving the property values (`LOW`, `NORMAL`, `HOVER`) in the consumer:

```ts
// raw emphasis level for `datum`, looked up by identity field (default series id)
getHoverFractionSignal(name, keyField) =>
  "(data('line0_hoverFractionData')[indexof(pluck(...,'rscSeriesId'), datum.rscSeriesId)]
    || {fraction: 0.5}).fraction"   // default = neutral when no row

// lower half: 0 at deemphasized, ramps to 1 at neutral, stays 1 through emphasis
getDeemphasisRamp(fractionExpr) => "clamp(fractionExpr / 0.5, 0, 1)"

// upper half: 0 through deemphasis and neutral, ramps to 1 at emphasized
getEmphasisRamp(fractionExpr)   => "clamp((fractionExpr - 0.5) / (1 - 0.5), 0, 1)"
```

Consumer formulas:
```ts
// opacity: fade to LOW on deemphasis; neutral & emphasis = full
opacity = `${LOW} + (1 - ${LOW}) * ${getDeemphasisRamp(getHoverFractionSignal(name))}`

// stroke width: grow to HOVER on emphasis; neutral & deemphasis = NORMAL
//   NOTE the delta — (HOVER - NORMAL), not HOVER added on top of NORMAL
strokeWidth = `${NORMAL} + (${HOVER} - ${NORMAL}) * ${getEmphasisRamp(getHoverFractionSignal(name))}`
```

Adding a new animated property = write one more consumer that maps `getHoverFractionSignal(...)` however
it wants. The engine never changes.

---

## 5. Match rules — how `target` is computed

Rules are `{ as: string, expr: string }` where `expr` evaluates to `1 | 0 | null`. The engine composes
them first-non-null-else-neutral. The line supplies:

| Rule (`as`) | Fires when | Notes |
|---|---|---|
| `hoveredMatch` | direct interactive hover | **Must be named `hoveredMatch`** — legend injection prioritizes it |
| `controlledTableMatch` | externally controlled highlight (row set) | |
| `controlledSeriesMatch` | externally controlled highlight (series) | |
| `popoverMatch` | a popover selection is open | match on selected **series**, not the mark id |
| `comboSiblingMatch` | a sibling combo mark is hovered | (semantics pre-existing; review before reuse) |
| `legendHoverMatch` | legend entry hovered | **injected later** by the legend builder, not emitted by the line |

Convention: emphasized → `1`, "something active but not this series" → `0`, rule inactive → `null`,
nothing active at all → falls through to the neutral fallback (`0.5`).

---

## 6. The gate — resolve once, thread down (`isAnimate`)

Creating the timer + data sources on a static, non-interactive chart means a 30fps re-render forever, so
whether a line animates is gated. The gate is **computed exactly once**, in `addLine`, where the full
`LineSpecOptions` is in scope, and the resolved boolean is **threaded down** to everything else:

```ts
// in addLine, LineSpecOptions in scope (has legendHighlightSignals + everything isInteractive needs)
// `animations` is a chart-level prop (default on) that can force the whole line onto the old system.
lineOptions.isAnimate = animations !== false && usesHoverAnimation(lineOptions);

const usesHoverAnimation = (options) =>
  isInteractive(options) || options.highlightedItem !== undefined
  || (options.legendHighlightSignals?.length ?? 0) > 0;
```

`isAnimate` is stored on the options object (added to both `LineSpecOptions` and the narrower
`LineMarkOptions`) so every downstream reader gets the *same resolved answer* rather than recomputing:

- data sources (`hoverTargetData` / `hoverAnimStateData` / `hoverFractionData`) — `if (options.isAnimate)`
- the `hoverTimer` + `hoverTargets` signals — `if (options.isAnimate)`
- `animatedMarks` registration (see §7) — `if (isAnimate)`
- the property encodings — `getLineOpacity` branches: `isAnimate` → animated signal, else → the original
  instant production-rule fade (`getLineOpacityRules`). This is currently the *only* wired consumer for
  line — see §1. `getLineStrokeWidth` does not read `isAnimate` at all yet and always returns the original
  instant production rules; wiring it up means splitting it the same way (`getLineStrokeWidth` wrapper +
  a `getLineStrokeWidthRules` fallback), which hasn't been done.
- any mark options that reuse `getLineMark`/`getLineOpacity` under a **different mark name** than the one
  the data sources were built for **must** override `isAnimate: false` — otherwise the encoding references
  a `_hoverFractionData` that doesn't exist for that name and Vega throws "Unrecognized data set" at
  runtime. Three call sites do this today: the highlight overlay, trendlines, and the metric-range boundary
  line (see the Overlay exception note below).

### The `animations` toggle (chart-level prop)

`<Chart animations={false}>` opts the whole chart out of the animated system back to the original instant
production-rule highlight. It's a `ChartOptions` field (default `true` = animated), threaded through
`chartSpecBuilder`'s `specOptions` into every mark — so `animations !== false` simply becomes one more
factor in `isAnimate`. When off: no hover data/timer is created, `animatedMarks` stays empty (so the
legend falls back to `getOpacityEncoding`), and `getLineOpacity` returns the production-rule array
(`getLineStrokeWidth` returns that array unconditionally either way, since it isn't gated on `isAnimate`
yet — see above). The `!Array.isArray` guards in `setHoverOpacityForMarks` / `setHoverStrokeWidthForMarks`
then re-engage (array ⇒ old legend-hover path applies), so the entire old system is restored coherently by
flipping one prop.

**Why resolve-once-and-thread rather than each function recomputing?** Two reasons:
1. **Type visibility.** The encoding functions are typed on `LineMarkOptions`, which historically didn't
   carry `legendHighlightSignals`, so if they recomputed the gate themselves they couldn't see the legend
   condition — that was the root cause of the old "legend-only" gap. Passing a *resolved boolean* (not raw
   `legendHighlightSignals`) sidesteps the narrow-type problem entirely.
2. **One source of truth.** "Hover data exists" and "encoding is animated" are now driven by the *same*
   value, so they cannot drift. Emitting an animated encoding that references a `_hoverFractionData` that
   was never created is structurally impossible.

This unified the previously-split gate and **closed the legend-only-highlight gap**: a line whose only
interactivity is a highlight legend now animates both its legend entry *and* its strokes/opacity.

> Overlay exception: the highlight overlay (§10) reuses `getLineMark` under a *different* mark name that
> has no `_hoverFractionData`. It's built with `isAnimate: false` so its animated encodings resolve to the
> static default instead of referencing a data source that only exists for the base line's name.
>
> The same fix is required anywhere else `getLineMark`/`getLineOpacity` is reused under a renamed mark by
> spreading the parent line's options — spreading also carries along the parent's `isAnimate: true`, which
> is wrong for the renamed mark. Trendlines (`getLineMarkOptions` in `trendlineMarkUtils.ts`) and the
> metric-range boundary line (`getMetricRangeMark` in `metricRangeUtils.ts`) both hit this and now both
> explicitly set `isAnimate: false` for the same reason as the overlay.

---

## 7. Legend integration (cross-builder coordination)

The legend is built by a separate `produce` function from the marks, so it needs a channel to learn which
marks animate and where their fraction data lives. That channel is **`usermeta.animatedMarks`** (a list of
mark names), mirroring the pre-existing `usermeta.interactiveMarks` pattern. Vega's `usermeta` is
arbitrary spec metadata Vega ignores — ideal for build-time bookkeeping that persists across the
sequential builder calls operating on the same spec.

Flow:
1. `addLine` registers the mark: `addUserMetaAnimatedMark(spec.usermeta, lineName)` (gated by
   `usesHoverAnimation`, so the list truthfully reflects marks that have `_hoverFractionData`).
2. `addLegend` runs **after** the marks. `injectLegendHoverIntoHoverData(legendName, data, keys)` mutates
   each `*_hoverTargetData`: renames the existing `target` formula to `conditions`, adds a
   `legendHoverMatch` formula, and rebuilds `target` as
   `hoveredMatch ?? legendHoverMatch ?? conditions`. For grouped legends it also aggregates a
   `*_hoverGroupFractionData` (max fraction per group).
3. `getLegendOpacity` iterates `usermeta.animatedMarks`; if non-empty it reads the fraction data (grouped
   or per-series) and applies the **same deemphasis ramp** as the line (fading to `FADE_FACTOR`).
   Empty list → falls back to the old instant `getOpacityEncoding`.

Ordering guarantee: the chart builder computes `legendHighlightSignals` and passes it into `addLine`
*before* `addLine` runs, and `addLegend` runs *after* all marks — so the line's `_hoverTargetData` /
`animatedMarks` exist by the time the legend injects into and reads them.

---

## 8. Constants

| Constant | Value | Meaning |
|---|---|---|
| `ANIMATION_THROTTLE` | `33` | timer throttle (ms) → ~30fps |
| `ANIMATION_HOVER_SPEED` | `100` | ms for a full `0↔1` sweep; actual duration scales down for shorter hops (§3e) |
| `HOVER_OPACITY_LOW` | `0.2` | opacity of a deemphasized line |
| `FADE_FACTOR` | `0.2` | opacity of a deemphasized legend entry (same value, legend-scoped name) |
| `HOVER_NEUTRAL_TARGET` | `0.5` | the neutral emphasis level (fallback target when nothing is hovered) |
| `HOVER_TIMER` | `'hoverTimer'` | timer signal name |
| `HOVER_TARGETS` | `'hoverTargets'` | per-mark targets-array signal suffix |
| `HOVER_ANIM_LAST_CHANGE_DATA` | `'hoverAnimLastChangeData'` | shared single-row data source name (§3f idle gate) |
| `HOVER_ANIMATING` | `'hoverAnimating'` | shared boolean signal name (§3f idle gate) |
| `HOVER_IDLE_TICKS` | `'hoverIdleTicks'` | shared idle-tick counter, gives `hoverActiveTimer` its one-tick grace period (§3f idle gate) |
| `HOVER_ACTIVE_TIMER` | `'hoverActiveTimer'` | shared gated-clock signal name (§3f idle gate) |

Data-source naming convention (relied on by legend injection): `{mark}_hoverTargetData`,
`{mark}_hoverAnimStateData`, `{mark}_hoverFractionData`, `{mark}_hoverGroupFractionData`. The idle-gate
data source (`hoverAnimLastChangeData`) breaks this convention deliberately — it is *not* mark-scoped, it's
one shared row for the whole chart (§3f).

---

## 9. Key files (this codebase)

| File | Role |
|---|---|
| `packages/constants/constants.ts` | all the constants above |
| `vega-spec-builder-s2/src/marks/hoverAnimationUtils.ts` | **the engine** — `getHoverTargetData`, `getHoverAnimStateData`, `getHoverFractionData`, `addHoverAnimationSignals` (also adds the §3f idle-gate signals), `addHoverAnimLastChangeData` (§3f), `getHoverFractionSignal`, `getDeemphasisRamp`, `getEmphasisRamp`, `HoverMatchRule` type |
| `vega-spec-builder-s2/src/line/lineDataUtils.ts` | `getLineHoverRules` (line-specific match rules) |
| `vega-spec-builder-s2/src/line/lineMarkUtils.ts` | consumers: `getLineOpacity` (wired) / `getLineOpacityRules` (fallback), `getLineStrokeWidth` (not yet wired — still the original unconditional rules); plus `getHighlightedSeriesOpacityRules` (the overlay — see §10) |
| `vega-spec-builder-s2/src/line/lineSpecBuilder.ts` | `usesHoverAnimation` gate; wires data/signals/registration in `addData`/`addSignals`/`addLine` |
| `vega-spec-builder-s2/src/trendline/trendlineMarkUtils.ts` | `getLineMarkOptions` — sets `isAnimate: false` for trendline marks (§6 overlay exception) |
| `vega-spec-builder-s2/src/metricRange/metricRangeUtils.ts` | `getMetricRangeMark` — sets `isAnimate: false` for the boundary line (§6 overlay exception) |
| `vega-spec-builder-s2/src/legend/legendHighlightUtils.ts` | `injectLegendHoverIntoHoverData`, `getLegendHighlightSignals` |
| `vega-spec-builder-s2/src/legend/legendUtils.ts` | `getLegendOpacity` (legend consumer) |
| `vega-spec-builder-s2/src/specUtils.ts` + `types/specUtil.types.ts` | `addUserMetaAnimatedMark`, `animatedMarks` on `UserMeta` |

The engine functions are parameterized by an **identity `keyField`** (default `rscSeriesId`). A different
mark could pass `rscMarkId` (bar) etc. — see §11.

---

## 10. Gotchas / lessons learned (read before rebuilding)

- **Every fraction consumer shares the neutral baseline.** Changing `HOVER_NEUTRAL_TARGET` (or the target
  fallback) shifts the resting value for *all* consumers — line opacity, gradient opacity, legend
  opacity, stroke width. They must all use the ramp helpers, or a consumer will sit at half-strength at
  rest. This bit us: moving neutral from `1` to `0.5` required updating the legend opacity in the same
  pass.
- **The highlight overlay is NOT part of the animation.** `getHighlightedSeriesOpacityRules` drives a
  duplicate "overlay" line drawn above direct labels purely for z-ordering. It uses **instant show/hide**
  production rules with fallback `0` (hidden at rest), the *opposite* resting state from the main line
  (visible at rest). Do not try to feed it the fraction — at rest the fraction is neutral (→ visible),
  which would make the overlay cover the labels. The main line carries the animation; the overlay just
  reorders. Also build the overlay with **`isAnimate: false`**: it reuses `getLineMark` under a different
  mark name that has no `_hoverFractionData`, so an animated encoding on it would reference a data source
  that was only emitted for the base line's name (Vega "unrecognized data set"). Trendlines and the
  metric-range boundary line hit this same trap (both reuse `getLineMark`/`getLineOpacity` under a renamed
  mark by spreading the parent line's options, which also spreads `isAnimate: true`) and both now set
  `isAnimate: false` explicitly for the same reason — see §6.
- **Gate the data and the encoding with the *same resolved value*.** Compute `isAnimate` once (§6) and
  thread it to both the data-creation gate and the encoding functions. If the two are computed
  independently they can drift, and an animated encoding will reference a `_hoverFractionData` that was
  never created. Resolving once and threading also lets the encoding functions honor conditions their
  narrow type can't see on its own (e.g. `legendHighlightSignals`).
- **Positional indexing.** `hoverAnimStateData` rows, `hoverFractionData` rows, and the `hoverTargets`
  array are matched by position; all three must be built in the same series order.
- **Identity must match the data.** The series-id values used to seed `hoverAnimStateData` must byte-match
  the `rscSeriesId` the pipeline produces (here: facets joined by `" | "`). If they differ, `indexof`
  returns `-1`, the lookup falls back to neutral, and nothing animates.
- **Single-series marks don't animate** (no other series to compare against) — `seriesIds` is empty, so no
  animation rows are created.
- **`hoveredMatch` is a naming contract** — legend injection rebuilds `target` prioritizing a field named
  exactly `hoveredMatch`. Any mark wanting legend animation must name its primary interactive rule that.
- **Stroke-width delta**: `NORMAL + (HOVER - NORMAL) * ramp`, not `NORMAL + HOVER * ramp`.
- **The idle gate (§3f) must be wired in as a pair.** `hoverAnimating`'s update expression references
  `data('hoverAnimLastChangeData')[0]` by name, so if any mark calls into the signals that need it without
  something also calling `addHoverAnimLastChangeData` for that chart, Vega throws "Unrecognized data set"
  at runtime. Wire both from the same call site.
- **`hoverFractionData` reads the gated clock, not the raw timer.** If you add a new fraction-consuming
  data source, make sure its elapsed-time calc uses `hoverActiveTimer`, not `hoverTimer` directly — using
  the raw timer would keep recomputing that data source every tick even while idle, defeating the gate.

---

## 11. Rebuilding elsewhere / extending

**Build order (from scratch):**
1. Add constants (throttle, speed, low, neutral, signal names).
2. Build the engine module: `getHoverTargetData` (aggregate by identity + match rules → `target`,
   fallback neutral), `getHoverAnimStateData` (rows per identity + `on` triggers), `getHoverFractionData`
   (lerp, driven by the gated clock), `addHoverAnimationSignals` (timer + targets + the idle-gate signals),
   `addHoverAnimLastChangeData` (the shared idle-gate data source, called alongside
   `addHoverAnimationSignals` for every animated mark — §3f), `getHoverFractionSignal`, and the two ramp
   helpers. Keep it property-agnostic and parameterized by `keyField`.
3. Write the mark's match rules (`getLineHoverRules` analog).
4. Write consumers (opacity, stroke width, …) that map `getHoverFractionSignal` via the ramps.
5. Add the `usesHoverAnimation` gate and wire data/signals/registration + gate the encodings in lockstep.
6. Legend: `animatedMarks` UserMeta registry, `injectLegendHoverIntoHoverData`, `getLegendOpacity`.

**Extending to other marks (e.g. bar):** the engine is reusable. Choose the identity `keyField` = the
finest independently-animatable unit (series for line; `rscMarkId` for bar). Write mark-specific match
rules and consumers. For bars, carry both `rscMarkId` (animation identity) and `rscSeriesId`/group in the
target-data `groupby` so series/legend-level highlights can set the target for all bars of a series.
Everything downstream of `target` is generic.

**Adding a new animated property:** just add a consumer that maps `getHoverFractionSignal` (via
`getDeemphasisRamp`, `getEmphasisRamp`, or its own math). No engine change.

---

## 12. Status / not-yet-done

- **Opacity is wired for line (done); stroke width is intentionally deferred.** `getLineOpacity` branches
  on `isAnimate` (animated signal vs. `getLineOpacityRules` fallback) and is meant as the single reference
  example for how to wire a consumer. `getLineStrokeWidth` was deliberately left untouched — still the
  original unconditional instant production rules — so it remains a clean next-consumer exercise rather
  than being done alongside opacity in the same pass. The engine itself is not limited to these two
  properties; any property whose visual treatment maps onto the emphasize/deemphasize ramp (§2, §4) is a
  valid consumer, opacity and stroke width are just the two that have actually been built/tested.
- **Gate resolved via `isAnimate`** (§6): computed once in `addLine`, threaded to data/signals/encodings.
  This closed the earlier legend-only-highlight gap — legend-only lines now animate their strokes/opacity
  too, not just the legend.
- **`animations` toggle (done)** (§6): chart-level prop (default on) that swaps the whole chart between
  the animated system and the restored original production-rule highlight (`getLineOpacityRules`; there is
  no `getLineStrokeWidthRules` — `getLineStrokeWidth` only has the one, unconditional, implementation).
- **`hoverAnimationUtils` unit tests (done)**: engine + ramps covered in `hoverAnimationUtils.test.ts`.
- **Idle gating (§3f) — done, wired into `addLine`/`addData`/`addSignals`.** `addHoverAnimLastChangeData(data, name)`
  is called alongside `addHoverAnimationSignals(signals, name)`, both gated by `if (options.isAnimate)` in
  `addData`/`addSignals` respectively, so the pairing required by the §10 gotcha holds for every animated line.
- **`comboSiblingMatch`** semantics predate the 3-state target — review before relying on it.
- **Metric-range line and trendlines under an animated parent (fixed).** Like the overlay, both the
  metric-range boundary line (`getMetricRangeMark`) and trendline marks (`getLineMarkOptions` in
  `trendlineMarkUtils.ts`) reuse `getLineMark`/`getLineOpacity` under a renamed mark with no
  `_hoverFractionData` of its own. Both now explicitly set `isAnimate: false` — see §6/§10. (The
  `isAnimate` field is new in this branch; spreading the parent line's options into a renamed mark
  silently carries it along unless overridden, which is why these two needed the same fix already applied
  to the overlay.)
- **Other marks** (bar, area, …) don't use the system yet.