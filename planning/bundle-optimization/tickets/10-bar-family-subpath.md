# Ticket 10 — Add a complete Bar-family subpath

**Implementation order:** 10  
**Story points:** 5  
**Estimated duration:** 2-3 AI-assisted days  
**Estimated bundle reduction:** 5-30 KB gzip versus the optimized root import  
**Prerequisites:** Tickets 08 and 09

## Goal

Prove that a consumer can render a complete Bar chart without loading unrelated
chart-family adapters or compilers.

## Strategy

Add one public family entry, for example:

```ts
import {
  Chart,
  Bar,
  Axis,
  Legend,
  BarDirectLabel
} from '@spectrum-charts/react-spectrum-charts-s2/bar';
```

The entry should bind:

- The shared React chart host.
- Bar and its supported child components.
- Shared guides required by Bar.
- The Bar adapter capability.
- A Bar-capable Vega compiler.
- Required runtime and CSS.

The root entry remains unchanged and continues to support all chart types.

## Acceptance criteria

- A packed-package Bar consumer renders successfully.
- The fixture supports SVG and Canvas.
- Relevant interactions, tooltips, axes, legends, and nested Bar children work.
- Module attribution excludes unrelated chart-family adapters and compilers.
- The Bar-family entry is measurably smaller than the root entry.
- Types resolve for ESM and CJS consumers.
- Benchmark results are recorded.

## Architecture relevance

This is the decisive proof that RSC has a real capability boundary rather than
component-only aliases. See
[A subpath must be a complete usable capability](../architecture-overview.md#a-subpath-must-be-a-complete-usable-capability).

## References

- `packages/react-spectrum-charts-s2/src/Chart.tsx`
- `packages/react-spectrum-charts-s2/src/components/Bar/`
- `packages/react-spectrum-charts-s2/src/rscToSbAdapter/barAdapter.ts`
- `packages/vega-spec-builder-s2/src/bar/`
- Tickets 08-09
