# Feature: Interpolation gap detection in verify-chart-story

## Problem

When a line shape doesn't match the reference, the `verify-chart-story` skill currently
treats all shape mismatches as potentially fixable via data changes (Category 1). In practice,
many shape mismatches are caused by differences in curve interpolation algorithm — the
reference may use linear segments while RSC defaults to monotone cubic, or vice versa.

These are not fixable by tweaking data values. They require either changing the `interpolate`
prop on the Line component (Category 1, if the right algorithm is available in RSC) or
accepting that RSC's interpolation options don't match the design (Category 2/3). Without
detecting this root cause, the agent wastes iterations on data tweaks that can never converge.

---

## Proposed solution

Add an interpolation detection step to `verify-chart-story` that distinguishes interpolation
mismatches from data mismatches before deciding whether to retry.

### Detection heuristic

After computing `shape-comparison.json` (see quantitative-shape-comparison feature), examine
the error distribution:

- **Data mismatch signature**: errors are concentrated at specific x-ticks (e.g. high error
  in Aug, low elsewhere) — the shape is wrong at specific points, not systematically.
- **Interpolation mismatch signature**: errors are distributed evenly across x-ticks, or the
  result curve is consistently smoother/flatter than the reference — the shape is
  systematically different everywhere.

A standard deviation of per-tick errors that is low relative to the MAE (i.e. errors are
uniformly distributed) is a strong signal of an interpolation mismatch.

### Decision logic

1. If the shape MAE is above threshold AND the error distribution is uniform (stddev/MAE < 0.5):
   - Check the current `interpolate` prop on the Line component in the story.
   - If `interpolate` is `'monotone'` and the reference SVG shows straight segments between
     points (linear), suggest switching to `interpolate: 'linear'` as a one-time Category 1 fix.
   - If already `'linear'` or the suggestion was already tried: classify as Category 3
     ("interpolation algorithm mismatch — RSC curve type doesn't match design") and stop retrying.
2. If the error distribution is non-uniform (errors concentrated at specific ticks): treat as
   a data shape issue and apply the normal retry logic.

### Integration with verify-chart-story

- Run interpolation detection after `shape-comparison.json` is available.
- Add `interpolationMismatch: true/false` to `verification-report.json`.
- When `interpolationMismatch` is true, the gap classification label should be
  "Curve interpolation type" with category 1 (if a prop switch hasn't been tried) or
  category 3 (if it has).

## Acceptance criteria

- [ ] `verification-report.json` includes `interpolationMismatch` boolean and `errorStddev`
- [ ] When interpolation mismatch is detected, the suggested action is to change the
      `interpolate` prop before any data tweaking
- [ ] If the interpolate prop change was already tried and shape still doesn't match,
      the gap is classified as Category 3 with no further retries
- [ ] Detection works for both line and area chart types
