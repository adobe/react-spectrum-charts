# Axis `tickValues` Prop (S2)

## What it enables

Explicit control over which tick values appear on an axis, overriding Vega's automatic tick generation. Without this, Vega picks tick positions algorithmically from the scale domain — useful in most cases, but it can't be relied on to produce clean round numbers when the data range doesn't align with the desired interval. For example, a scale that runs to 11.5M with `tickCountLimit={4}` might produce 0 / 3M / 6M / 9M instead of the intended 0 / 4M / 8M / 12M.

`tickValues` lets you specify the exact values you want, making the axis predictable regardless of the data range.

## Scope

S2 only (`vega-spec-builder-s2`). The s1 package already has this prop; this change brings S2 to parity.

## Files

### `packages/vega-spec-builder-s2/src/types/axis/axisSpec.types.ts`

Add `tickValues` to `AxisOptions`:

```ts
/**
 * Explicitly sets the tick values to display on the axis.
 * When provided, overrides automatic tick generation entirely.
 * Values should be in scale domain units (e.g. `[0, 4000000, 8000000, 12000000]`).
 */
tickValues?: number[];
```

### `packages/vega-spec-builder-s2/src/axis/axisUtils.ts`

In `getDefaultAxis`, destructure `tickValues` and wire it through to Vega. When `tickValues` is present, suppress `tickCount` — Vega ignores `values` if `tickCount` is also set:

```ts
// destructure alongside existing fields
tickValues,

// in the returned axis object
tickCount: tickValues ? undefined : getTickCount(position, tickCountMinimum, tickCountLimit, grid),
values: tickValues,
```
