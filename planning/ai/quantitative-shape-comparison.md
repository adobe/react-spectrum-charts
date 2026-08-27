# Feature: Quantitative shape comparison for verify-chart-story

## Problem

When a line/curve shape doesn't match the reference, the `verify-chart-story` skill has no
objective basis for deciding whether to keep iterating on data or stop and classify the gap.
The agent makes a subjective visual call ("close enough"), which has proven unreliable — it
repeatedly declares partial matches as good and continues tweaking data past the point of
diminishing returns.

There is no stopping condition tied to actual fidelity. The loop cap of 3 iterations is the
only guard.

---

## Proposed solution

Extend `extract-structure.mjs` (or add a new `compare-shapes.mjs` script) to produce a
quantitative per-tick shape fidelity score.

### Algorithm

1. Extract `line-open` path y-coordinates from both the reference SVG and the result SVG.
2. Normalize both paths to the same coordinate space: x and y as fractions of their
   respective plot bounding boxes (0–1 each), so different chart sizes don't inflate the
   error.
3. Sample both normalized paths at N evenly-spaced x positions (N=20 recommended).
4. Compute the mean absolute error (MAE) between the two sampled y-value sequences.
5. Write results to `./tmp/ai/shape-comparison.json`:

```json
{
  "mae": 0.08,
  "samples": [
    { "x": 0.0, "referenceY": 0.12, "resultY": 0.15, "error": 0.03 },
    { "x": 0.05, "referenceY": 0.14, "resultY": 0.19, "error": 0.05 }
  ],
  "worstTick": { "x": 0.3, "error": 0.18, "xLabel": "Aug" }
}
```

### Thresholds (to be calibrated with real examples)

| MAE | Classification |
|-----|---------------|
| < 0.05 | Shape match — color/style gaps only |
| 0.05–0.15 | Partial match — investigate specific ticks |
| > 0.15 | Poor shape match — classify as gap, stop data tweaking |

### Integration with verify-chart-story

- `verify-chart-story` reads `shape-comparison.json` after the pixel diff step.
- If MAE > 0.15 after a data fix has already been applied, classify the shape mismatch as
  a non-retryable gap rather than looping again.
- Report the MAE and worst-tick in `verification-report.json`.

## Acceptance criteria

- [ ] `shape-comparison.json` is written on every verify run
- [ ] `verification-report.json` includes `shapeMae` and `worstShapeTick`
- [ ] The verify skill uses MAE > 0.15 as a hard stop for data-tweak retries
- [ ] The worst-tick label (e.g. "Aug") appears in the gap description when shape is poor
