# Issue: S2 Chart Title Wrapping Causes Flicker/Shrink on Resize (and Hover)

**Status:** Open — WIP attempt exists on `bug/s2-chart-title-wrap-solution-2` but does not fully
resolve the bug and relies on a solution (`view._resizeView`) considered invalid; needs a different
approach before landing.

## Symptom

Charts with a `title` prop would flicker or visibly shrink when resized, and in the original
manifestation, even on hover events unrelated to layout. The chart's `width` would bounce or
collapse rather than staying stable. The same underlying bug independently affected legend column
layout (see below).

---

## Root Cause

Vega's `autosize: { type: 'fit', contains: 'padding', resize: true }` recomputes the plot `width`
signal from the rendered bounding boxes of the title, axes, and legends every time it re-lays-out
(`vega-view-transforms/src/ViewLayout.js`'s `layoutGroup`/`viewSizeLayout`). Two elements bound
their own sizing decisions reactively to that same live `width` signal, creating unbounded feedback
loops:

1. **Title wrap limit** — `rscTitleLimit` was bound via a reactive `update:` expression to `width`.
   Since `width` is itself recomputed from the title's own rendered bbox once wrapped, this
   oscillates: wrap → bbox changes → autosize repads → `width` changes → rewrap → ...
2. **Legend column count** — `getColumns()` in `legendUtils.ts` read raw `width` directly with the
   same structural problem: fewer columns → taller/wider legend → autosize shrinks `width` → even
   fewer columns → ... runs away on any dataflow pulse (including unrelated ones like hover).

Additionally, Vega's autosize negotiation can commit a new `width`/`height` via the internal
(undocumented) `view._resizeView` on *any* dataflow pulse that dirties the mark group — not just
explicit resizes — which is why the flicker could be triggered by hover alone, independent of the
title/legend bugs.

A secondary, now-fixed issue: the initial default (`rscWrappedTitleText: [title]`, i.e. the full
unwrapped title) could be wider than the container on first paint. Autosize would shrink `width`
toward 0 to make room for it, and `wrapTitleText`'s own `maxWidth<=0` guard echoes the unwrapped
title straight back — a permanent deadlock at initial mount.

### Why the legend's fix doesn't transfer cleanly to the title

The legend's column count only needs a rough, stable *estimate* of available width, so switching it
to `rscContainerWidth(width)` (a custom expression function reading `view._viewWidth` + padding —
the container's real DOM size, immune to autosize renegotiation) was a clean, fully declarative fix.

The title cannot use the same trick as cleanly: its default `frame` is `'group'`, and — confirmed by
reading `vega-view-transforms/src/ViewLayout.js:142` and `viewSizeLayout` (lines 154-208) — the
title's rendered bounding box is unioned into `viewBounds` and directly subtracted from `viewWidth`
to produce the negotiated `width`, *regardless of `frame`*. `frame: 'bounds'` only changes where the
title is horizontally anchored (relative to the group vs. the full view bounds); it does not change
what feeds the autosize computation. So the title's truly-available width is intrinsically the
value autosize is still negotiating — an `rscContainerWidth`-style stable estimate was tried and
caused real overflow bugs at some breakpoints (it ignores axis/legend space carved out of the raw
container width).

---

## Known Remaining Bugs in the Current WIP Attempt

- **Title clipped at top at certain breakpoints (~550px)** — at some chart widths, the title is cut
  off at the top rather than wrapping/shrinking cleanly. Not yet root-caused; likely the settled-
  `width`-based `correctTitleWrap()` computing a wrap that still doesn't leave Vega enough vertical
  room for the title's own height in that layout pass, or a stale margin being used before the gate
  lets a new size commit. Needs investigation before this is usable.
- **`_resizeView` patching is not an acceptable long-term fix.** It's an undocumented, unstable
  internal Vega API — relying on it as the mechanism for correctness (not just a defensive/no-op
  fallback) is fragile and was called out as invalid. This needs a different approach; see
  "Why we didn't just disable Vega's autosize" below for the alternative considered.

---

## Fix Attempted (WIP, `bug/s2-chart-title-wrap-solution-2`, commit `87fd9f720`, needs rebase onto current `main`)

**Note:** this does not fully resolve the issue (see "Known Remaining Bugs" above) and should not be
merged as-is.

- **Non-reactive title signals** — `rscTitleLimit`/`rscWrappedTitleText` are plain value signals
  (`chartSpecBuilder.ts`'s `addTitleSignals`), not `update:` bindings. `VegaChart.tsx`'s
  `correctTitleWrap()` computes and pushes the correct wrap imperatively, once per settle, using
  Vega's real settled `width` signal — after layout has actually finished, not while still being
  negotiated.
- **Legend fix** — `getColumns()` in `legendUtils.ts` switched from raw `width` to
  `rscContainerWidth(width)`.
- **Pre-embed initial guess** — before the very first `embed()` call, `VegaChart.tsx` patches the
  spec's title signals using the known `width` prop, to avoid the initial-mount deadlock.
- **Autosize gate (the core, most invasive fix)** — `gateAutosizeToExplicitResizes(view)` monkey-
  patches `view._resizeView` so it only commits a new width/height while a window opened via
  `openAutosizeWindow`/`closeAutosizeWindow` is open. Those windows are opened only around our own
  explicit `.resize()` calls (initial embed, and `resizeView()` on prop-width changes), closing off
  the general class of "autosize shrinks the chart on an unrelated pulse" bugs. Reference-counted
  (not a boolean) so overlapping `resizeView()` calls from rapid resize-drag ticks can't have one
  call's completion prematurely close a window a later, still-in-flight call needs open. No-ops if
  `_resizeView` isn't present, so a future Vega upgrade that renames/removes it degrades gracefully
  instead of throwing.
- **Storybook harness fix** — `ResizableChart` (`stories/storyUtils.tsx`) was recreating its
  `<Chart>` child on every drag tick, forcing a full re-embed instead of an in-place resize (which
  doesn't match real production resize behavior). Rewritten to render a static child inside a
  resizable `<div>`, so `Chart.tsx`'s own `ResizeObserver` drives it like a real container resize.

Confirmed via Storybook that the original sawtooth flicker is gone in most cases, and a residual
flicker specifically while actively dragging the resize handle was addressed by the reference-count
fix above. However, this does **not** fully resolve the bug — see "Known Remaining Bugs" above
(title clipped at top around ~550px) — and the `_resizeView` patch itself is not considered an
acceptable long-term solution regardless.

### Why we didn't just disable Vega's autosize

Patching an undocumented internal API (`_resizeView`) is inherently fragile. The alternative that
avoids touching Vega internals entirely is switching `autosize` to `type: 'none'` and computing all
layout (axis/legend/title sizing) ourselves in React — a much larger rearchitecture, out of scope
for a bug fix. `resize: true/false` on the existing `autosize.fit` config was tried and confirmed
ineffective (per `vega-view-transforms/src/ViewLayout.js`, it only controls an extra subsequent
`.resize()` call, not the core commit logic in `viewSizeLayout`).

---

## Relevant Files

| File | Role |
|---|---|
| `react-spectrum-charts-s2/src/VegaChart.tsx` | `resizeView()`, `correctTitleWrap()`, `gateAutosizeToExplicitResizes()`, `openAutosizeWindow`/`closeAutosizeWindow`, pre-embed initial-guess patch |
| `vega-spec-builder-s2/src/chartSpecBuilder.ts` | `addTitleSignals()` — non-reactive title signals |
| `vega-spec-builder-s2/src/legend/legendUtils.ts` | `getColumns()` — `rscContainerWidth(width)` fix |
| `vega-spec-builder-s2/src/specUtils.ts` | `wrapTitleText()` |
| `react-spectrum-charts-s2/src/stories/storyUtils.tsx` | `ResizableChart` — realistic resize-drag test harness |
| `node_modules/vega-view-transforms/src/ViewLayout.js` | `layoutGroup`, `viewSizeLayout` — where title/legend bounds feed into the `width` recompute |
| `node_modules/vega-view-transforms/src/layout/title.js` | `titleLayout` — confirms `frame` only affects anchor position, not the bounds fed back into autosize |

---

## Next Steps

1. Root-cause the title-clipped-at-top bug around the ~550px breakpoint.
2. Find an alternative to patching `view._resizeView` — e.g. scope out the `autosize: 'none'` +
   self-managed layout rearchitecture mentioned above, or another mechanism that doesn't depend on
   an undocumented internal Vega API for correctness.
3. Once a valid approach is settled on, rebase `bug/s2-chart-title-wrap-solution-2` (or a fresh
   branch) onto current `main` (it's several months behind — picked up legend pagination,
   hover-animation, and other legend work touching the same files).
4. Re-run full test suite, `tsc --noEmit`, and `yarn build:s2`.
5. Re-confirm in Storybook (drag-resize test, and the ~550px clipping case) before opening a PR.

