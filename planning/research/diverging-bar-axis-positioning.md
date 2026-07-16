# Diverging Bar Axis Positioning — Research Notes (AN-456581)

> **Status: Implemented (S2 only).**
> Ticket AN-456581 started as a research spike; the recommendation below was implemented directly
> in the same pass rather than handed off to a follow-up ticket. The `<Axis diverging>` prop now
> exists in `vega-spec-builder-s2` — see [Implementation Summary](#implementation-summary) for
> what shipped and what's still open.

---

## The Ask

For diverging horizontal bar charts (bars that can go negative), research:

1. Positioning the *dimension* axis (category labels) at the zero baseline instead of the chart edge.
2. Whether axis labels can flip sides (left ↔ right) as their bar crosses zero.
3. What Vega gives us for free vs. what needs custom work.
4. The risk of replacing the native Vega axis with custom text marks.

Reference story: `MixedValuesHorizontal` in
[`BarDirectLabel.story.tsx`](../../packages/react-spectrum-charts-s2/src/stories/components/Bar/BarDirectLabel.story.tsx)
— bar layout already supports negative values (`orientation="horizontal"` + `mixedBarData`); the
gap is purely in how the dimension axis (`<Axis position="left" baseline title="Browser" />`) is
positioned.

**Figma:** could not be fetched in this session (no Figma access configured here). The ticket
comment from Nathenael Dereb describes three visual patterns to design against:

- **Matching Signals (Positive)** — a regular bar chart (all bars positive).
- **Matching Signals (Negative)** — the same shape, mirrored to the other side (all bars negative).
- **Diverging Signals** — two bars on opposite sides of the axis for the same category (e.g.
  population-pyramid style: one series positive, another negative).

Pull the Figma frame directly (or attach exported images to the ticket) before scoping the
follow-up implementation ticket — the pixel-level offset math below needs to be checked against it.

---

## Current State (S1; S2 is a structural port, see below)

Two separate mechanisms already exist and are easy to conflate:

**1. The zero-baseline *rule mark* already exists.**
When `<Axis baseline>` is set and the *opposing* scale is linear (i.e. this is the categorical/dimension
axis and the metric axis is linear — exactly the horizontal-bar-with-negatives case), the builder
skips the normal axis-domain-line handling and instead draws a separate rule mark at the metric
scale's zero point, spanning the full plot:

- Branch point: [`axisSpecBuilder.ts:454-457`](../../packages/vega-spec-builder/src/axis/axisSpecBuilder.ts#L454-L457)
  and [`axisSpecBuilder.ts:567-569`](../../packages/vega-spec-builder/src/axis/axisSpecBuilder.ts#L567-L569)
  (`if (baseline && opposingScaleType === 'linear') addBaseline(...)`)
- Rule geometry: [`getBaselineRule`](../../packages/vega-spec-builder/src/axis/axisUtils.ts#L406-L433) —
  `x: { scale: 'xLinear', value: baselineOffset }` (or `y` for vertical), spanning `width`/`height`.

This is genuinely correct today — it's why the Jira description says "bar layout already supports
negatives; axis positioning is the gap."

**2. The Vega *axis itself* (ticks + labels + domain line) still renders at the fixed edge.**
`getDefaultAxis` sets `orient: position` and nothing else positional:
[`axisUtils.ts:51-75`](../../packages/vega-spec-builder/src/axis/axisUtils.ts#L51-L75). There's no
`offset` or `position` override, so Vega places the whole axis group at its default edge (`orient:
'left'` → x=0 of the plot), regardless of where the zero-rule from (1) lands. For a chart that's
mostly-or-fully negative, this produces a big visual gap between the category labels (pinned to the
left edge) and the bars themselves (which now grow leftward from the zero line near the right edge).

So: **the fix is to make the axis group itself track the same zero position the baseline rule
already computes** — not to invent a new positioning concept.

---

## What Vega Gives Us for Free vs. What Needs Custom Work

> Updated after implementation — the original pass (below, kept for record) was more optimistic
> about `encode.labels` overrides than reality turned out to be. The mechanism is free; making the
> flip look *correct* pixel-for-pixel was not.

**Free:**

- **`Axis.offset`** (`NumberValue`, accepts a signal) — *"The orthogonal offset in pixels by which to
  displace the axis from its position along the edge of the chart."* This is the primitive that
  relocates the *entire* axis group (ticks, domain line, labels together) from the edge to the zero
  baseline in one shot, for all three of Nathenael's cases (positive/negative/mixed), with one
  expression and no extra branching. Confirmed do-not-confuse-with-`Axis.position` (that one moves
  the axis *along* its own scale, not orthogonally — wrong property, easy to reach for by name alone).

- **Native label truncation/limit/overlap stay fully intact.** `labelLimit`, `labelOverlap`, number/
  time formatting, tooltip-on-label, sub-labels, thumbnails — none of it needed to be touched or
  reimplemented, because the real `Axis` object was never replaced, only relocated + layered with
  extra encode. This was the central bet of the "don't replace the axis" recommendation, and it held.

- **`Axis.encode.labels` supporting per-tick conditional (`test`/`value`) rules**, and the general
  **`data('name')[indexof(pluck(...), datum.value)]` cross-dataset join idiom** for looking up a
  category's paired bar value — both pre-existing Vega/codebase capabilities we reused rather than
  invented (the join idiom already existed for stacked-bar corner-radius selection).

**Custom — and more custom than expected going in:**

- **The `offset` sign convention is undocumented and non-obvious.** Vega's docs don't state which
  direction is positive. Verified empirically (a live `vega`-package runtime script in Node, not
  guesswork): positive `offset` always moves an axis *away* from the plot, negative always *toward*
  it — uniformly across all four orientations. See `getDivergingAxisOffset` in
  [`axisUtils.ts`](../../packages/vega-spec-builder-s2/src/axis/axisUtils.ts).

- **Label anchor/gap compensation — the finding the original pass below missed entirely.**
  Overriding `align`/`baseline` per-tick via `encode.labels.update` is necessary but *not sufficient*.
  Vega computes each label's default perpendicular offset from the tick **once**, based on the axis
  position's static natural alignment (e.g. `align:'right'` for a `'left'`-position axis) — it does
  **not** recompute that offset when `align` is overridden per-tick. A flipped label keeps its
  un-flipped anchor and ends up overlapping the bar instead of mirroring to the empty side (observed
  directly: a category label rendered so far into the bar that only its last few characters were
  visible). Fixing this required deriving and hardcoding a compensating `dx`/`dy` — empirically,
  `2 × labelPadding` (defaults to the theme's `axis.labelPadding: 8`, verified via the same Node/Vega
  runtime technique, but reads each axis's own effective `labelPadding` when set — needed once
  sub-labels, which use a larger padding, went through the same code path). See
  `getDivergingLabelEncode` / `DEFAULT_AXIS_LABEL_PADDING` in the same file.

- **The per-tick sign lookup expression** — `data('<barDataName>')[indexof(pluck(data('<barDataName>'),
  '<dimensionField>'), datum.value)]['<metric>'] < 0` — is composed from generic Vega functions but is
  fully custom-authored for this feature (`getDivergingTickIsNegativeTest`). It's only valid when
  there's one unambiguous sign per category — the "Diverging Signals" case (two series pointing
  opposite directions from the same category) has no single sign to test and is out of scope; see
  below.

- **The single-bar-mark detection/plumbing** (`getDivergingBarContext` in
  [`chartSpecBuilder.ts`](../../packages/vega-spec-builder-s2/src/chartSpecBuilder.ts)) is pure
  application logic — Vega has no built-in concept of "which mark feeds this axis." It only activates
  when the chart has exactly one bar mark whose orientation matches this axis as the dimension axis;
  multi-bar charts (including the population-pyramid-style dual-series divergence) fall back to
  default positioning rather than guessing.

---

## Implementation Summary

The recommendation was carried out directly rather than handed off: **the native Vega `Axis` was
not replaced.** A new opt-in `<Axis diverging>` prop (S2 only) layers two additive changes on top of
the real `Axis` object:

1. `offset` set to a signal that relocates the whole axis group to the opposing linear scale's zero
   point — [`getDivergingAxisOffset`](../../packages/vega-spec-builder-s2/src/axis/axisUtils.ts).
2. `encode.labels` overrides (`align`/`baseline` **and** the compensating `dx`/`dy`, see above) driven
   by a per-category sign lookup against the paired bar's data —
   [`getDivergingLabelEncode`](../../packages/vega-spec-builder-s2/src/axis/axisUtils.ts) /
   [`getDivergingTickIsNegativeTest`](../../packages/vega-spec-builder-s2/src/axis/axisUtils.ts).

Both are wired together in `addAxes` in
[`axisSpecBuilder.ts`](../../packages/vega-spec-builder-s2/src/axis/axisSpecBuilder.ts), gated on
`diverging && divergingContext && opposingScaleType === 'linear'`. `divergingContext` (the paired
bar's `dataName`/`dimension`/`metric`) is detected in
[`chartSpecBuilder.ts`](../../packages/vega-spec-builder-s2/src/chartSpecBuilder.ts)'s
`getDivergingBarContext`, which only returns a context when the chart has exactly one bar mark —
matching the single-series/single-stack scope boundary below.

Story: `DivergingConversionRates` in
[`BarExamples.story.tsx`](../../packages/react-spectrum-charts-s2/src/stories/components/Bar/BarExamples.story.tsx).

**Still open / not done in this pass:**

- **"Diverging Signals" (opposite-direction dual-series per category)** — explicitly out of scope, as
  planned. Falls back to default axis positioning; no centered-label treatment implemented either
  (question 1 in "Questions for Alan" above). Tracked in
  **[AN-462749](https://jira.corp.adobe.com/browse/AN-462749)**.
- **Figma pixel-check** — the Figma frame was never actually fetched/viewed in any session; spacing
  is verified against Vega's real behavior, not against the design spec's exact values. Tracked in
  **[AN-462749](https://jira.corp.adobe.com/browse/AN-462749)**.
- **`AxisThumbnail`** — crash fixed, but the thumbnail image mark itself doesn't move with the
  diverging axis offset (question 5 in "Questions for Alan" above). Tracked in
  **[AN-462759](https://jira.corp.adobe.com/browse/AN-462759)**.
- **`labelFormat="time"` axes** — fixed (primary/secondary row stacking direction now sign-aware),
  see `WorkingTimeAxis` story.
- **Sub-labels** — fixed (`getPriorityMergedSignal` resolves the align/baseline conflict), see
  `WithSubLabelsFixed` story; open question on vertical-axis overlap remains (question 3 above).
  Tracked in **[AN-462760](https://jira.corp.adobe.com/browse/AN-462760)**.
- **Trellis charts** — fixed (root axis suppressed, panel axes get facet-scoped diverging context),
  see `TrellisDiverging` story. Whether this combination should be supported at all is still open
  (question 4 above). Tracked in **[AN-462755](https://jira.corp.adobe.com/browse/AN-462755)**.
- **No unit tests** — intentionally out of scope for AN-456581 (a research task); the Storybook
  stories in `DivergingRisks.story.tsx` serve as the verification/regression record for this pass
  instead of a unit test suite. Adding tests is in scope for
  **[AN-462749](https://jira.corp.adobe.com/browse/AN-462749)**.

**Follow-up implementation tickets** (all under Epic
[AN-455181](https://jira.corp.adobe.com/browse/AN-455181)):

| Ticket | Scope | Status |
| --- | --- | --- |
| [AN-462749](https://jira.corp.adobe.com/browse/AN-462749) | Land the core `<Axis diverging>` feature: unit tests, Figma validation, extend label-flip to two-series always-opposite-sign bars | Ready |
| [AN-462755](https://jira.corp.adobe.com/browse/AN-462755) | Research spike: should trellis + diverging be a supported combination? | Blocked on Alan's final call |
| [AN-462759](https://jira.corp.adobe.com/browse/AN-462759) | `AxisThumbnail` position should follow the diverging axis offset | Ready |
| [AN-462760](https://jira.corp.adobe.com/browse/AN-462760) | Long-label handling (adaptive truncation + wrapping) on diverging axes, including vertical-axis sub-label wrapping | Blocked on design input |

---

## Risks of the Custom-Text-Mark Alternative (documented per the ticket's ask)

Not recommended, but per the ticket's explicit ask to document this risk: replacing the axis with
hand-built text marks would mean reimplementing, by hand, everything Vega's `Axis` currently gives
for free — `labelLimit` truncation/ellipsis, `labelOverlap` resolution, `labelFlush` edge alignment,
locale-aware number/time formatting, tooltip-on-label (`hasTooltip`), sublabels, axis thumbnails, and
any future axis feature added to this codebase would need to be transcribed a second time into the
custom mark path and kept in sync forever. High ongoing maintenance cost for a feature (offset +
conditional encode) that doesn't require it.

---

## Known Limitation: No RTL Support

`diverging`'s flip logic (`getDivergingTickIsNegativeTest`, `getDivergingAxisOffset`,
`getDivergingLabelEncode`) branches on physical `position` (`'left' | 'right' | 'top' | 'bottom'`),
not a logical/bidi-aware direction. This is not a gap specific to `diverging`, though — RTL/bidi
awareness is absent from the axis and chart layers entirely today: no `direction`/`dir`/RTL flag
exists anywhere in `vega-spec-builder`/`vega-spec-builder-s2`/`react-spectrum-charts*`, the
`locale` prop threaded through `RscChart.tsx` only drives D3 number/time formatting
(`packages/locales`), and no Spectrum `Provider`/`dir` integration was found. Since there's no
existing RTL baseline to be consistent (or inconsistent) with, this isn't called out as a question
for Alan — it's a pre-existing, codebase-wide limitation that `diverging` simply inherits.

---

## Verified Safe: Scale Domains Always Include Zero

`getDivergingAxisOffset` relies on `scale('<opposingScaleName>', 0)` resolving to an in-range pixel
position. Confirmed via `getDefaultScale` in
[`scaleSpecBuilder.ts:189-192`](../../packages/vega-spec-builder-s2/src/scale/scaleSpecBuilder.ts)
that any linear scale that isn't the dimension axis (i.e. the bar's metric/opposing scale)
unconditionally gets `zero: true, nice: true` — no branch on stacked/dodged/grouped, and no exposed
`Axis`/`Chart`/`Bar` prop can override it (same in S1). So the scale-extrapolation failure mode
(axis rendered off-canvas because 0 falls outside the domain) cannot happen today.

One minor, harmless residual: `getDivergingBarContext` only declines when a single *category* has
conflicting signs, not when the *entire dataset* is all-positive or all-negative. So `diverging`
still "activates" on non-diverging data — it just resolves to an offset of ~0 (no visible change),
a no-op rather than a bug. Not worth a fix or an Alan question.

---

## Questions for Alan (answered)

Drafted for the user to send via Slack — not posted to Jira. Replies received 2026-07-16; none of
these answers are implemented yet — captured here as direction for a follow-up pass.

**1. Diverging Signals (two-series, always-opposite-sign) label treatment**
Two bars sharing a category, one series always positive and one always negative (e.g. "New" vs
"Churned" per channel, population-pyramid style) — how should the category axis label be
positioned? One option: centered in the gutter between the two bars, since there's no single empty
side to lean into. (Distinct from single-series diverging, which flips the label, and stacked
multi-series diverging, e.g. monthly cohorts, where the axis stays at the edge with no
repositioning.)

> **Alan's reply:** "This should function the same as the other cases in my opinion. The label is
> on the opposite side of the axis from its bar." — i.e. no separate centered-in-the-gutter
> treatment; extend the same opposite-side-of-its-bar flip logic already used for the single-series
> case to this one instead of leaving it as a decline/fallback. **Follow-up:** `getDivergingBarContext`
> currently declines outright whenever a category has sign-conflicting rows
> (`DodgedTwoSeriesFallback` story) — this reply means that guard should be relaxed for this shape,
> with the sign test resolved per-row (each bar's own sign) rather than per-category.

**2. Long category labels on diverging bar charts**
`diverging` moves the category axis to the zero-value line, which can land close to or far from the
chart edge depending on the data's positive/negative split — so available space for long labels
varies per chart. Currently labels always truncate to the same fixed ~180px width regardless of
available space. Should that stay fixed, adapt to available space, or should a minimum margin
always be reserved instead?

> **Alan's reply:** Maximize visible text — likely different truncation per label rather than one
> fixed width, and there are upcoming shared utilities that may make this easier. Open sub-question
> he flagged for further design input: whether a label should be allowed to extend/wrap all the way
> across the viz when it falls to the right of the axis — his intuition is wrapping would look
> cleanest, but variable/thin bar widths make that tricky to implement cleanly. **Follow-up:**
> treat as a two-part item — (a) per-label adaptive truncation using the upcoming utilities, (b)
> a separate, harder wrapping investigation gated on bar-width variability, still needing design
> sign-off.

**3. `subLabels` behavior on a left/right (vertical) axis**
`subLabels` on a bottom/top axis naturally stacks as a second row (works for any text length). On a
left/right axis, the separation is a small horizontal offset instead, so long sub-label text (e.g.
"Instagram"/"Facebook" grouping labels) overlaps the main label. Should sub-labels on a vertical
axis stack as a second row like bottom/top does, or is `subLabels` only intended for short content
(single digits/glyphs) in that orientation?

> **Alan's reply:** Sub-labels should wrap — same bar-width-variability challenge as question 2
> applies here too. **Follow-up:** blocked on the same open wrapping-implementation question as #2;
> should likely be solved together rather than as two separate efforts.

**4. Is trellis + diverging an expected combination?**
Now works correctly (took two rounds of fixes), and panels align consistently since they share the
same metric scale. But is this combination something the design system actually expects to
support, or a low-priority edge case? Useful to know before investing in further refinement (e.g.
`subLabels`/`AxisThumbnail` *inside* a trellis panel, untested).

> **Reply:** "I don't think we should support diverging trellises but curious on Alan's input" —
> this reply leans toward *not* supporting the combination, but explicitly defers to Alan's own
> input, so **this question is still genuinely open**, unlike 1/2/3/5. No follow-up action until a
> final call comes back.

**5. Diverging axis + `AxisThumbnail` — thumbnails don't move with the axis**
When `diverging` repositions a categorical axis to the zero baseline, the thumbnail images
(`AxisThumbnail`) stay fixed at the original chart edge — they don't follow the axis. So for any
diverging chart where bars actually split positive/negative, the thumbnails end up visually
detached from the labels/axis they're supposed to annotate (see `WithThumbnailConflict` story in
`DivergingRisks.story.tsx`). Should axis thumbnails move to sit next to the axis at the zero line
(following each row), stay anchored at the chart edge as-is, or should `diverging` +
`AxisThumbnail` just not be supported together for now?

> **Alan's reply:** "Anything tied to the axis label should move with it." — thumbnails should move
> in lockstep with the axis's `offset`. **Follow-up:** fix `getAxisThumbnailPosition`
> (`axisThumbnailUtils.ts`) so the thumbnail image mark's position incorporates the axis's diverging
> `offset` signal, since today it's a fixed-pixel, top-level sibling mark with no reference to it.

---

## S1/S2 Parity Note

`vega-spec-builder-s2`'s `axisSpecBuilder.ts`/`axisUtils.ts` are structural ports of S1 — same
`getDefaultAxis`/`addBaseline`/`getBaselineRule` shape, just offset by a couple of lines. The
`diverging` prop was implemented in S2 only (the ticket carries the `rsc-s2-p1` label), and has
**not** been ported to S1's `vega-spec-builder`/`react-spectrum-charts`. Confirmed with the user:
S1 parity is not needed — this is an S2-only feature by design, not an oversight. CLAUDE.md's usual
S1/S2 parity rule is written for bug fixes in shared behavior, not new feature work, so no S1 port
is planned.
