---
name: donut-advanced-labels
description: Feature guidance for Donut chart advanced labels (swatch + segment name + value/% + optional detail row, connected to the slice by a leader line). Use when generating a Donut with advanced labels enabled. Token values referenced here are defined in donut-chart-tokens.
---

# Advanced Labels

Tokens referenced below are defined in [`donut-chart-tokens`](../donut-chart-tokens/SKILL.md) — this file covers feature behavior only, not token values.

- Column layout: swatch (`chart.donut.size.swatch`, shape: `roundedSquarePath` from [`design-tokens`](../design-tokens/SKILL.md) SVG Paths — reuse this path rather than inventing a new one) → name (`text-secondary`, same **size** as direct-label value, weight `400`) → value/% (`text-primary`) → optional exact-value detail row (`text-secondary`)
- Gap from the ring: `20px` (`chart.donut.spacing.label-ring-gap`, shared with direct labels) — the label block must **never overlap the ring**, same rule as direct labels. Measure against the whole block's real rendered bounding box (swatch + text together), not an anchor coordinate — see the implementation-direction note in [`donut-direct-labels`](../donut-direct-labels/SKILL.md); the same measurement mistake applies here
- Swatch and name are **always on the same line** (horizontal row, never stacked), gap: `8px` (`chart.donut.spacing.advanced-label-swatch-gap`) — distinct from the plain legend's `10px` swatch gap
- Gap between name and value/%: `4px` (`chart.donut.spacing.advanced-label-name-value-gap`)
- Gap between value/% and the detail row: `0px` (`chart.donut.spacing.advanced-label-value-detail-gap`) — directly adjacent
- The value/% row and the detail row are **left-aligned to the swatch's left edge** (not to the name, which starts to the right of the swatch) — both rows sit directly below the swatch, not below the name
- Sizes/weights: see [`donut-chart-tokens`](../donut-chart-tokens/SKILL.md) typography tokens
- **Alignment/anchoring — swatch is always the leftmost element.** The "swatch → name → value/% → detail" reading order in the column-layout bullet above holds on **both** hemispheres — do not flip it to keep the swatch nearest the connector line. This means the hemisphere-mirrored anchor-shift technique described in [`donut-direct-labels`](../donut-direct-labels/SKILL.md) (move the anchor point per hemisphere, don't flip the alignment property) extends here to the whole swatch+text block, not just the text lines: on the hemisphere where the label reads left-to-right as swatch-then-text with text growing *toward* the ring, the connector line's ring-side endpoint lands on the swatch (as the "Connector line" bullet below describes). On the hemisphere where text must grow *away* from the ring instead (to satisfy the never-overlap-the-ring rule), the swatch ends up farther from the ring than the text — so the connector line's ring-side endpoint lands on the text block's near edge instead, with the swatch riding outward beyond the text, connected only by the fixed 8px swatch-to-name gap above, not by the leader line itself.
- **Multiple labels colliding within the same hemisphere:** see [`donut-label-collision`](../donut-label-collision/SKILL.md) for the algorithm (including the ring re-anchor step required after adjustment). Block height for its `minGap` ≈ `58px` at M size — swatch/name row + value/% row + detail row, per the sizes/gaps above.
- Connector line from label to slice: `1.5px` stroke, `gray-700` (#505050), `stroke-linecap: round`. Only advanced labels have this line — direct labels never do. **The line must never cross over the donut ring itself** — route it outside the ring's outer edge. Gap between the line and the swatch: `10px` (`chart.donut.spacing.advanced-label-line-swatch-gap`). Two fixed shapes, both straight-segment (no free-form curves):
  - **Straight** (label beside the slice), `40px` wide — **the default; use this whenever possible**, which is most of the time, since advanced labels are usually positioned to the left or right of the donut:
    ```svg
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="2" viewBox="0 0 42 2" fill="none">
    <path d="M0.75 0.75H40.75" stroke="#505050" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    ```
  - **Longer** (label offset from the slice), `108px` wide × `17px` tall — horizontal run, then a fixed-radius corner curving down into a vertical drop. **Use only for smaller segments positioned at the top or bottom of the donut** (where a label to the left/right of the circle needs to reach a slice that isn't beside it):
    ```svg
    <svg xmlns="http://www.w3.org/2000/svg" width="110" height="19" viewBox="0 0 110 19" fill="none">
    <path d="M0.75 0.75H102.75C106.064 0.75 108.75 3.43629 108.75 6.75V17.75" stroke="#505050" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    ```
- Direct + advanced labels can be combined on the same chart to emphasize a state
