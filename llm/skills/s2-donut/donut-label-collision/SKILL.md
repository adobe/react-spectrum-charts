---
name: donut-label-collision
description: Shared collision-avoidance algorithm for donut chart labels (Direct or Advanced) that stack vertically within the same hemisphere. Use whenever multiple small/adjacent segments produce overlapping label positions.
---

# Label collision avoidance

Applies independently per hemisphere (left/right split — see the alignment rule in [`donut-direct-labels`](../donut-direct-labels/SKILL.md) or [`donut-advanced-labels`](../donut-advanced-labels/SKILL.md)). No token caps how close two slices' angles can be, so this is a routine case whenever several small segments cluster near the top or bottom of the ring.

**Algorithm:** sort a hemisphere's labels by ideal Y (their ring-anchored position before any adjustment). Walk top to bottom, pushing each label down only as far as needed so it's at least `minGap` below the previous *already-adjusted* label — don't re-sort mid-walk, so a run of several crowded labels cascades correctly instead of only resolving one collision at a time.

`minGap` = the rendered label block's height + a stacking buffer of ~16px. The buffer isn't a sourced token — it's a deliberate default (roughly double the other inter-element gaps of 8–10px) chosen so adjacent labels get breathing room instead of touching edge-to-edge. Block height itself is feature-specific (line count/sizes) — see the calling skill.

**Closed-form shortcut** (for engines without iteration, e.g. Vega): sort labels ascending by ideal Y, let `rank` = 0-indexed position within the hemisphere:

```
adjustedY = runningMax(idealY − minGap·rank) + minGap·rank
```

`runningMax` is a cumulative max over the current + all preceding rows in that sort order. This is exactly equivalent to the iterative push (each label lands at `max(its own ideal Y, previous adjusted Y + minGap)`) in a single pass — no bounded pass-count loop needed.

**⚠ Re-anchor horizontally after adjusting Y.** The ring is circular, so a horizontal gap that clears it at a label's original angle won't necessarily clear it at the collision-shifted Y (the ring is wider near its vertical center, narrower near the top/bottom). After computing `adjustedY`, recompute the ring's horizontal half-width there — `sqrt(outerRadius² − (adjustedY − cy)²)` (or `0` if `|adjustedY − cy| ≥ outerRadius`) — then place the label's near-ring edge at that half-width plus the ring gap. Reusing the pre-collision, angle-derived anchor is a real, observed failure mode: labels visibly overlap the ring after collision-adjustment even though the uncollided geometry was correct.
