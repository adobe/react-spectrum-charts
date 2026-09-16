# Ticket 02 — Remove the Vega-Lite package contract

**Implementation order:** 2  
**Story points:** 1  
**Estimated duration:** Up to half an AI-assisted day  
**Estimated bundle reduction:** 0 KB incremental runtime reduction; smaller install graph  
**Prerequisites:** Ticket 01

## Goal

Remove the obsolete requirement that RSC consumers install `vega-lite`.

Ticket 01 should already remove Vega-Lite from the runtime bundle graph. This
ticket cleans up package metadata, documentation, and unsupported-input
behavior without claiming the same bundle savings twice.

## Strategy

- Remove `vega-lite` from the S2 React package peer dependencies.
- Remove it from the S2 bundle-profiling fixture dependencies if no scenario
  intentionally measures it.
- Update S2 installation instructions.
- If S1 parity is intentionally included, make the equivalent S1 metadata and
  documentation changes in the same release but track them explicitly.
- Detect a Vega-Lite `$schema` passed through `UNSAFE_vegaSpec` and throw a
  clear unsupported-input error.

Do not remove or deprecate `UNSAFE_vegaSpec` itself in this ticket. Its
long-term engine compatibility is handled separately by Ticket 14.

## Compatibility note

`UNSAFE_vegaSpec` is typed as Vega `Spec`, and repository stories use Vega
schemas. Local installation documentation nevertheless tells consumers to
install `vega-lite`, so removal should be called out in release notes.

## Acceptance criteria

- S2 installs and runs without `vega-lite`.
- Documentation no longer instructs S2 consumers to install it.
- Vega-Lite-shaped unsafe specs fail with an actionable message.
- Normal Vega unsafe specs continue to work.
- No new runtime bundle reduction is attributed to this ticket.

## Architecture relevance

Removing Vega-Lite narrows RSC to the engine it actually uses and reduces
accidental public commitment to a second grammar. See
[Keep engine programs opaque](../architecture-overview.md#keep-engine-programs-opaque).

## References

- `packages/react-spectrum-charts-s2/package.json`
- `packages/react-spectrum-charts-s2/README.md`
- `packages/vega-spec-builder-s2/src/types/chartSpec.types.ts`
- `packages/react-spectrum-charts-s2/src/hooks/useSpec.tsx`
- Ticket 14
