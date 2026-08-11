---
name: donut-benchmark
description: Feature guidance for the Benchmark Donut variant (2-segment donut with a reference line/target marker). Use when generating a Donut with a benchmark comparison line. Token values referenced here are defined in donut-chart-tokens.
---

# Benchmark Donut (2-segment only)

Tokens referenced below are defined in [`donut-chart-tokens`](../donut-chart-tokens/SKILL.md) — this file covers feature behavior only, not token values.

- `Benchmark=True` variant property
- **This reuses S2's `reference-line` feature** (see [`chart-features`](../chart-features/SKILL.md) and `packages/vega-spec-builder-s2/src/axis/axisReferenceLineUtils.ts`) — don't re-derive its geometry/rotation/path-origin handling from scratch; follow that existing implementation. Only two things differ from a standard reference line:
  1. **Only one cap is drawn** (a standard reference line can have a cap at each end; the benchmark mark uses just one, at the outer end — no cap at the inner end)
  2. **The cap is smaller than any of `ReferenceLine`'s standard XS–L size tiers**: `10×10` (`Polygon 1`), using `referenceLineCaretPath` from [`design-tokens`](../design-tokens/SKILL.md) SVG Paths rather than a new shape
- Line (`Line 154`, 14–21px tall) and cap both filled `chart.donut.color.text-primary` (#292929). Stroke width `2px`, `stroke-linecap: round` — rounded, unlike the slices (see [`donut-regular`](../donut-regular/SKILL.md)), which are never rounded
- **Don't scale the cap via a squared "size"/"footprint area" parameter.** Its dimension is `10`, not `100`. Some rendering APIs size marks by area rather than by linear dimension, which renders the wrong scale if `10×10` gets naively squared into an area value of `100` — draw the raw path at its authored linear scale instead
- Cap-to-line gap: `1px` (`spacing.referenceLine.capRuleGap` in [`design-tokens`](../design-tokens/SKILL.md)), same as a standard reference line
- Geometry: the line's inner endpoint sits at the ring's inner-edge radius (crossing the full slice band), extending outward past the outer radius. The cap sits at the outer end — always outside the ring, never inside it
- Sentiment: `Semantic=Positive/Negative` variant property → `chart.donut.color.sentiment-positive` / `-negative`, applied **only** when `Benchmark=True`
- Legend shown in center hole (co-located with Metric total/label, not a separate swatch legend)
- Benchmark label position: **always at the lower-left of the benchmark line**, left-aligned, anchored near the line's outer endpoint. Use the same anchor-offset technique as [`donut-direct-labels`](../donut-direct-labels/SKILL.md) rather than an arbitrary pixel nudge: keep both lines' horizontal alignment set to start-from-the-near-edge (`text-align`/`text-anchor`/equivalent = left/start, so the two lines stay left-aligned to each other), but set the shared anchor's horizontal position to the line's outer-endpoint x **minus** the rendered text-block width (approximated the same way as direct labels: `characterCount × fontSize × k`, `k≈0.52` regular / `≈0.6` bold, `blockWidth = max(nameWidth, valueWidth)`) — so the block's right edge lands at the endpoint and the whole label reads to its left, not fixed-offset padding that can drift onto the line or the ring depending on label content length
  - **Vertical anchor**: anchor both lines' *top* edge (a top/hanging text baseline, not middle/center) at the line's outer-endpoint y, stacking the second line directly below the first (tight, no extra gap). A middle/center baseline with the ± half-offsets used for direct labels makes the block straddle the endpoint (half above, half below), which reads as centered-on-the-line rather than "lower"
  - **Buffer beyond the computed edge**: because `blockWidth` is a character-count approximation, not a real text measurement, text can still render slightly wider/taller than estimated and touch the caret. Add a small fixed buffer (**~8px**, ⚠ not a sourced Figma value — a practical rendering safeguard, tune per font/size if it still touches) subtracted from the anchor's horizontal position and added to its vertical position, on top of the `blockWidth` subtraction, so the label clears the caret rather than just grazing it
