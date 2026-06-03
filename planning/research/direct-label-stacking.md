# Direct Label Auto-Stacking

## Problem

When multiple line series share a similar metric value at the end of the chart, their direct labels render at nearly the same y-position and overlap. The goal is to push each label down just enough to avoid collisions — a "cascade" — without hardcoding anything for a fixed number of series.

---

## The Cascade Rule

Labels are ranked by metric value, highest first (rank 1 = highest). The effective y-position of each label must satisfy:

```
effectiveY[k] >= effectiveY[k-1] + LABEL_LINE_HEIGHT
```

Working recursively from the top:

```
effectiveY[1] = scaledY[1] - 12          (nudge the top label up 12px)
effectiveY[k] = max(scaledY[k] - 12, effectiveY[k-1] + LABEL_LINE_HEIGHT)
```

The offset applied to the Vega mark is:

```
offset[k] = effectiveY[k] - scaledY[k]
```

---

## The Key Insight

Unrolling the recurrence reveals that `effectiveY[k]` can be expressed as a **single max over all preceding rows** rather than a chain of recursive lookups:

```
effectiveY[k] = max over j ≤ k of (scaledY[j] + (k - j) × h - 12)
```

where `h = LABEL_LINE_HEIGHT = 16`.

Factoring out the constant `k × h - 12`:

```
effectiveY[k] = ( max over j ≤ k of (scaledY[j] - j × h) ) + k × h - 12
```

Define:

```
_adjustedY[j] = scaledY[j] - j × h
```

Then:

```
effectiveY[k] = cummax(_adjustedY, 1..k) + k × h - 12
offset[k]     = effectiveY[k] - scaledY[k]
              = cummax(_adjustedY, 1..k) + k × h - 12 - scaledY[k]
```

The cumulative max is a standard window operation — Vega computes it natively with `frame: [null, 0]`.

---

## Worked Example

Three labels at pixel positions `scaledY = [100, 104, 108]`, `h = 16`:

| rank | `scaledY` | `_adjustedY` (scaledY − rank×16) | `_cumMaxAdjusted` | `effectiveY` | `offset` |
|------|-----------|----------------------------------|-------------------|--------------|---------|
| 1    | 100       | 84                               | 84                | 88           | −12     |
| 2    | 104       | 72                               | 84                | 104          | 0       |
| 3    | 108       | 60                               | 84                | 120          | +12     |

Labels land at pixels 88, 104, 120 — exactly 16px apart, no overlap.

---

## Vega Implementation

### Data transforms (in `getLineDirectLabelData`)

```
1. joinaggregate → _extremeDim          (find the last data point per series)
2. filter                               (keep only rows at _extremeDim)
3. window rank (desc by metric)         (assign _metricRank: 1 = highest)
4. formula: _scaledY = scale('yLinear', datum[metric])
5. formula: _adjustedY = _scaledY − _metricRank × 16
6. window max, frame [null, 0]          (_cumMaxAdjusted = running max of _adjustedY)
```

Step 6 uses `frame: [null, 0]`, which means "from the start of the sorted sequence up to the current row" — this is how Vega expresses a cumulative (running) aggregation.

### Offset signal (in `getLineDirectLabelMarks`)

```
datum._cumMaxAdjusted + datum._metricRank * 16 - 12 - datum._scaledY
```

This single expression replaces what was previously 19 separate lag fields and a 19-term `max(...)` call.

---

## Why the Old Approach Was Verbose

Vega signal expressions cannot loop or iterate — they evaluate on one datum with no access to other rows. The only way to reference preceding series' values was to pre-materialize them as named fields at spec-build time: `_lag1`, `_lag2`, … `_lag19`. The offset signal then listed all 19 terms explicitly. Both the window transform arrays and the signal string grew linearly with `MAX_LABEL_OFFSET_SERIES`, making the Vega spec large and capping the feature at 20 series.

The cumulative max reformulation moves the multi-row aggregation into Vega's engine (where looping is native), keeping the spec constant-size for any number of series.
