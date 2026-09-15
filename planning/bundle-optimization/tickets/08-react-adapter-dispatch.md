# Ticket 08 — Remove eager React adapter imports

**Implementation order:** 8  
**Story points:** 3  
**Estimated duration:** 1-2 AI-assisted days  
**Estimated bundle reduction:** 0-8 KB gzip before compiler isolation  
**Prerequisites:** Tickets 06 and 07

## Goal

Remove the static imports of every component and adapter from
`childrenAdapter.ts`.

## Strategy

- Read the component descriptor from each sanitized React element.
- Invoke the descriptor's adapter.
- Route the result into the correct current `ChartOptions` collection.
- Preserve recursive handling for nested mark, axis, legend, inspect, popover,
  annotation, and decoration children.
- Preserve errors for unknown or malformed component descriptors.

Avoid a shared mutable registry. The imported React element type should carry
the adapter metadata needed for its own conversion.

## Acceptance criteria

- `childrenAdapter.ts` does not import individual mark components.
- `childrenAdapter.ts` does not import every adapter function.
- Existing adapter and chart integration tests pass.
- Nested child behavior remains unchanged.
- A Bar fixture no longer includes unrelated React adapter modules.
- Benchmark results are recorded.

## Architecture relevance

This creates a component-owned adaptation boundary that can remain in a
refactored RSC or be replaced by serializable definitions later. See
[Three possible long-term outcomes](../architecture-overview.md#three-possible-long-term-outcomes).

## References

- `packages/react-spectrum-charts-s2/src/rscToSbAdapter/childrenAdapter.ts`
- `packages/react-spectrum-charts-s2/src/rscToSbAdapter/*Adapter.ts`
- Tickets 06-07
