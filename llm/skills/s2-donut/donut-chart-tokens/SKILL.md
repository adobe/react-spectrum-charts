---
name: donut-chart-tokens
description: Donut-chart-specific design tokens (colors, sizes, typography, spacing, hover/emphasize behavior, and validation rules), sourced from the Figma "S2 – Charts" file. Use when generating, styling, or reviewing a Donut chart to get exact values instead of inventing them. For feature-specific implementation guidance (Regular/Binary/Benchmark donut, Metric labels, Direct labels, Advanced labels), see the feature skills listed below.
---

# Donut Chart Tokens

Source: Figma "S2 – Charts" file (`a9LVueYspAHETtc1x9Cll8`, node `4395:47102`), cross-referenced with design notes. Values below are pulled directly from Figma fills/text/layout data. Where Figma's flattened export didn't expose a field, it's marked **⚠ not exposed — confirm with design** rather than guessed.

**When generating a Donut chart, use only the values below.** For anything marked ⚠, do not invent a replacement value — surface the gap to the user or flag it explicitly in output rather than guessing. See [`design-tokens`](../design-tokens/SKILL.md) for the base Spectrum 2 palette these color tokens alias.

This file is tokens only. Feature-specific implementation guidance lives in its own skill:

- [`donut-regular`](../donut-regular/SKILL.md) — the standard multi-segment donut
- [`donut-binary`](../donut-binary/SKILL.md) — the 2-segment variant
- [`donut-benchmark`](../donut-benchmark/SKILL.md) — the benchmark/reference-line variant
- [`donut-metric-labels`](../donut-metric-labels/SKILL.md) — the center-hole metric total/label
- [`donut-direct-labels`](../donut-direct-labels/SKILL.md) — direct (no-connector) labels
- [`donut-advanced-labels`](../donut-advanced-labels/SKILL.md) — advanced (swatch + connector-line) labels

---

## 1. Color tokens

Every donut color token below is a direct alias for an existing Spectrum 2 token (see the "S2 token" column) — confirmed by cross-referencing `packages/themes/src/spectrum2Colors.ts`. Resolve via the canonical S2 token name, not the raw hex, so these stay in sync with the base palette.

### Categorical palette (segment fills, 6-series max)

| Token | Hex | S2 token | Figma alias |
|---|---|---|---|
| `chart.donut.color.categorical-01` | `#5424DB` | `categorical-100` | `Palette/indigo/1100` |
| `chart.donut.color.categorical-02` | `#D92361` | `categorical-200` | `Palette/magenta/900` |
| `chart.donut.color.categorical-03` | `#E86A00` | `categorical-300` | `Palette/orange/700` |
| `chart.donut.color.categorical-04` | `#5D89FF` | `categorical-400` | `Palette/blue/700` |
| `chart.donut.color.categorical-05` | `#9A47E2` | `categorical-500` | `Palette/purple/900` |
| `chart.donut.color.categorical-06` | `#F24CB8` | `categorical-600` | `Palette/pink/700` |
| `chart.donut.color.categorical-other` | `#B272EB` | `purple-700` | `Palette/purple/700` (catch-all "Other" bucket) |

### Secondary / de-emphasis gray

| Token | Hex | S2 token | Figma alias | Used for |
|---|---|---|---|---|
| `chart.donut.color.secondary-gray` | `#C6C6C6` | `gray-400` | `Palette/gray/400` | Binary donut's unlabeled complementary segment; de-emphasized segments on hover/emphasize |

### Sentiment (benchmark only)

| Token | Hex | S2 token | Figma alias | Meaning |
|---|---|---|---|---|
| `chart.donut.color.sentiment-positive` | `#079355` | `green-800` | `Palette/green/800` | Value above benchmark |
| `chart.donut.color.sentiment-negative` | `#F03823` | `red-800` | `Palette/red/800` (`Alias/content/visual/semantic/negative`) | Value below benchmark |

### Text colors

| Token | Hex | S2 token | Figma alias | Used for |
|---|---|---|---|---|
| `chart.donut.color.text-primary` | `#292929` | `gray-800` (= `DEFAULT_FONT_COLOR`) | `Palette/gray/800` (`Alias/content/neutral/default`) | Metric total, metric label, advanced-label value/%, benchmark carat/line, benchmark single-line label, benchmark two-line value |
| `chart.donut.color.text-secondary` | `#505050` | `gray-700` | `Palette/gray/700` (`Alias/content/neutral-subdued/default`) | Direct-label segment name and value (at rest), advanced-label segment name/detail row, benchmark two-line label part |

**Rule:** apply sentiment colors (positive/negative) *only* when a benchmark is present. Non-benchmark donuts stay categorical + gray.

---

## 2. Size tokens

| Token | Diameter | Guidance (from Figma size-guide frame) |
|---|---|---|
| `chart.donut.size.xs` | `60px` | Compact view, small trellis, mini-viz — no center label |
| `chart.donut.size.s` | `120px` | Small–medium widget, medium trellis — 1-line center label |
| `chart.donut.size.m` | `160px` | Medium–large chart — 2-line center label |
| `chart.donut.size.l` | `200px` | Large chart — 3-line center label |
| `chart.donut.size.xl` | `400px` | Large-screen presentation — 3-line center label, scaled up |

`chart.donut.size.slice-gap` — gap between adjacent segments, per size tier (not a flat value across all sizes):

| Size | Slice gap |
|---|---|
| XS | `1px` |
| S | `2px` |
| M | `2px` |
| L | `2px` |
| XL | `4px` |

Ring width is a fixed px value per size tier — **not** a proportion of the outer diameter (there is no `chart.donut.size.hole-ratio` token). Note the diameters jump 120→160→200 while ring width only moves 18→20→22 — a completely different rate of change, so don't derive one from the other.

| Size | Outer diameter | Ring width |
|---|---|---|
| XS | `60px` | `16px` |
| S | `120px` | `18px` |
| M | `160px` | `20px` |
| L | `200px` | `22px` |
| XL | `400px` | `24px` |

Only **S / M / L** have true component-set variant matrices (`Donut (S)`, `Donut (M)`, `Donut (L)`); XS and XL are scaled instances, not their own variant sets — build from the derived values in this doc.

---

## 3. Typography tokens

These are specific to the donut chart's own text elements, not the general Spectrum 2 type-scale (`Title/S`, `Body/XS`, etc.) — the donut has its own fixed px values below.

Sizes marked "derived" were computed rather than individually measured. S/L (relative to a given M) use the metric-label ratio `×0.875 / ×1 / ×1.25`. XS/XL extend each row's own local step size by one more increment in each direction (`XS = S − (M−S)`, `XL = L + (L−M)`) — the same *method* applied consistently to every row, even though the resulting deltas differ row to row since the underlying S/M/L values aren't a single clean ratio. Confirm all derived values in Figma before treating them as final.

| Requirement | XS | S | M | L | XL | Weight | Color |
|---|---|---|---|---|---|---|---|
| Metric total | `18px` (derived) | `20px` | `22px` | `36px` | `50px` (derived) | `800` | `text-primary` |
| Metric label | `12px` (derived) | `14px` | `16px` | `20px` | `24px` (derived) | `700` | `text-primary` |
| Metric delta line | `12px` (derived) | `14px` | `16px` | `20px` | `24px` (derived) | `800` | `sentiment-positive` / `sentiment-negative` |
| Direct label — segment name | `9px` (derived) | `10.5px` (derived) | `12px` | `15px` (derived) | `18px` (derived) | `400` | `gray-700` |
| Direct label — value | `12px` (derived) | `14px` (derived) | `16px` | `20px` (derived) | `24px` (derived) | `700` | `gray-700` at rest → segment's own categorical color on hover (see §5) |
| Advanced label — segment name | `8px` (derived) | `10px` (derived) | `12px` (derived) | `14px` (derived) | `16px` (derived) | `400` | `gray-700` |
| Advanced label — value/% | `11.25px` (derived) | `13.5px` (derived) | `15.75px` (derived) | `18px` (derived) | `22.5px` (derived) | `800` | `gray-800` at rest → segment's own categorical color on hover (see §5) |
| Advanced label — detail row | `6.9px` (derived) | `8.25px` (derived) | `9.6px` (derived) | `11px` (derived) | `13.75px` (derived) | `400` | `gray-700` |
| Benchmark label — single-line ("Target" only) | `12px` (derived) | `14px` | `16px` | `20px` | `24px` (derived) | `700` | `gray-800` |
| Benchmark label — two-line, label part | same as Direct label — segment name | | | | | `400` | `gray-700` |
| Benchmark label — two-line, value part | same size as Direct label — value | | | | | `700` | `gray-800` at rest → segment's own categorical color on hover (see §5) |

**Advanced label correction:** the Advanced label rows are no longer "same size as Direct label — X" aliases (that equivalence was wrong). Each has its own dedicated array, with values one tier below what the alias produced — e.g. the segment name's L-tier size (`14px`) equals Direct label — value's own M-tier size, not L's. `XS` for each row is derived by extending its own S→M step one increment further down.

---

## 4. Spacing tokens

| Token | Value                                       | Context |
|---|---------------------------------------------|---|
| `chart.donut.spacing.card-padding` | `32px` (S) / `80px` (L)                     | Chart card container padding |
| `chart.donut.spacing.title-to-chart` | `24px`                                      | Gap between chart title and donut |
| `chart.donut.spacing.legend-swatch-gap` | `10px`                                      | ⚠ **Not yet implemented for donut.** Only the swatch shape itself (`chart.donut.size.swatch`, `roundedSquarePath`) is currently used (by Advanced labels) — the full Legend feature (a plain swatch+label list) isn't built for donut yet. This token is reserved for that future implementation; don't treat its presence as confirmation Legend already works |
| `chart.donut.spacing.legend-swatch-padding` | `8px 0` (swatch), `4px 0 7px 0` (label)     | ⚠ Same caveat as `legend-swatch-gap` above — reserved for a not-yet-implemented Legend feature |
| `chart.donut.spacing.label-ring-gap` | `20px`                                      | Gap between the ring's outer edge and a label — shared by both direct and advanced labels |
| `chart.donut.spacing.small-multiple-title-gap` | `8px`                                       | Gap between a small-multiple donut and its title |
| `chart.donut.spacing.direct-label-name-value-gap` | `0px`                                       | Gap between the segment name and the value in a direct label — tight, no overlap |
| `chart.donut.spacing.advanced-label-name-value-gap` | `4px`                                       | Gap between the segment name and the value/% in an advanced label |
| `chart.donut.spacing.advanced-label-value-detail-gap` | `0px`                                       | Gap between the value/% row and the detail row in an advanced label — directly adjacent, no space |
| `chart.donut.spacing.advanced-label-swatch-gap` | `8px`                                       | Gap between the swatch and the name in an advanced label — distinct from the plain legend's `10px` swatch gap |
| `chart.donut.spacing.advanced-label-line-swatch-gap` | `10px`                                      | Gap between the connector line and the swatch in an advanced label |
| `chart.donut.size.swatch` | `16px`                                      | Color swatch dimensions — one fixed size, no compact variant |

---

## 5. Behavior tokens

| State | Rule | Token / value |
|---|---|---|
| Hover | Hovered segment | Stays at full opacity (`1.0`) |
| Hover | Non-hovered segments | Keep their own categorical color, opacity `0.2` (not a gray swap) |
| Hover | Hovered segment's direct-label value, advanced-label value/%, **and benchmark two-line value** | Value text switches to the segment's own categorical color |
| Hover | Legend item (if present) | Highlights in sync with the hovered segment |
| Emphasize | Emphasized segment | Full categorical color, value label in that color |
| Emphasize | Non-emphasized segments | Solid color swap to `chart.donut.color.secondary-gray` (#C6C6C6), full opacity, not a fade. Labels: `text-secondary` |

---

## 6. Usage guideline tokens (non-visual / logic rules)

These aren't visual tokens but should be encoded as validation rules or lint checks in the component API:

- `maxSegments: 6` — warn/block above 6 segments
- `sortOrder: "value-desc-from-12"` — default sort unless data is `ordinal` (natural order) or `sequential` (defined order)
- `paletteType: "categorical"` — donuts default to the categorical palette (§1), not sequential/diverging gradients (those exist as separate color styles in the library but aren't used by donuts)
- `benchmarkRequiresBinary: true` — benchmark feature is only valid when `Segment=2`
- `sentimentRequiresBenchmark: true` — sentiment colors are gated on benchmark presence

---

## 7. Component variant reference (as named in Figma)

| Component set | Variant properties |
|---|---|
| `Donut (S)` / `Donut (M)` / `Donut (L)` | `Segment=2..6`, `Metric value=Bool`, `Metric label=Bool`, `Emphasize=Bool`, `Semantic=–/Positive/Negative`, `Benchmark=Bool` |
| `Semicircle donut (S/M/L)` | `Segment=N`, `Metric value=Bool`, `Metric label=Bool`, `Emphasize=Bool`, `Diverging=Bool` |
| `Small multiple donuts (S/M/L)` | `Multiple count=N`, `Segment=N`, `Emphasize=Bool` |
| `Donut chart (S/M/L)` (full card) | `Variant=1..7`: 1 Binary standard · 2 Binary + benchmark positive · 3 Binary + benchmark negative · 4 Direct labels · 5 Legend on top · 6 Legend on left · 7 Emphasized segment |

Note: XS and XL sizes aren't first-class variants in any of the above sets today — only scaled instances exist.
