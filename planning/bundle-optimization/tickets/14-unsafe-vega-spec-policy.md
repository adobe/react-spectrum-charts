# Ticket 14 — Define the `UNSAFE_vegaSpec` compatibility policy

**Implementation order:** 14 for the current bundle project; before any Direct D3 migration  
**Story points:** 1  
**Estimated duration:** Up to half an AI-assisted day  
**Estimated bundle reduction:** 0 KB immediate  
**Prerequisites:** None for the decision

## Goal

Record how the public `UNSAFE_vegaSpec?: Spec` escape hatch behaves if RSC moves
away from a Vega runtime.

This is a decision ticket. It should not silently remove or change the prop
during bundle optimization.

## Context

The prop exposes a raw Vega spec through the public React API:

- Existing RSC refactor can continue to support it.
- Lean Vega can likely continue to support it.
- Direct D3 cannot execute it without retaining a Vega compatibility path.

The `UNSAFE_` prefix communicates risk but does not remove the compatibility
obligation for existing consumers.

## Decision options

### Option A — Deprecate before engine migration

Announce deprecation, collect usage evidence, provide supported component or
definition alternatives, and remove it only through the normal breaking-change
process.

### Option B — Lazy Vega compatibility runtime

Keep the prop but load a separate Vega runtime only when it is used. Normal D3
charts would not pay for Vega, while unsafe-spec consumers retain behavior.

### Option C — Legacy RSC fallback

Route charts using the prop through the legacy implementation during a gradual
migration. Remove the fallback only after usage reaches an acceptable level.

Do not attempt general Vega-to-D3 translation.

## Recommended decision

Prefer Option C during migration, paired with an Option A deprecation process.
Option B is viable if real usage requires longer compatibility, but it keeps a
second runtime and lifecycle path in the product.

## Acceptance criteria

- The chosen policy is documented in the public migration plan.
- Known internal and public usage is inventoried.
- Ticket 02 remains limited to rejecting Vega-Lite input after
  `vega-embed` removal; valid Vega specs retain current behavior.
- Any future Direct D3 plan includes the selected compatibility mechanism.
- No bundle savings are attributed until an implementation actually removes or
  lazily isolates Vega.

## Architecture relevance

This resolves the current exception to the packet's rule that engine programs
remain opaque. See
[`UNSAFE_vegaSpec` compatibility debt](../architecture-overview.md#unsafe_vegaspec-compatibility-debt).

## References

- `packages/vega-spec-builder-s2/src/types/chartSpec.types.ts`
- `packages/react-spectrum-charts-s2/src/hooks/useSpec.tsx`
- `packages/react-spectrum-charts-s2/src/Chart.tsx`
