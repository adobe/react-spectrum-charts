# Ticket 09 — Split the Vega compiler core from mark dispatch

**Implementation order:** 9  
**Story points:** 5  
**Estimated duration:** 2-3 AI-assisted days  
**Estimated bundle reduction:** 0-15 KB gzip before chart-family entries  
**Prerequisites:** Ticket 03  
**May run in parallel with:** Tickets 06-08

## Goal

Allow a build to include only the mark compiler functions needed by a
particular chart-family entry.

This ticket intentionally spends more effort than a Vega-only lookup-table
optimization. Keeping compiler selection outside serialized chart options
preserves a migration path to a different compiler/runtime.

## Strategy

Refactor the current `buildSpec` into:

1. A shared compiler core containing common initialization, data, signals,
   scales, guides, post-processing, and validation.
2. An explicit map of mark-type compiler functions.
3. The existing `buildSpec(options)` compatibility wrapper, pre-bound to every
   currently supported mark compiler.

The core must not import every mark implementation. The compatibility wrapper
may do so because it represents the full root package.

Do not store compiler functions inside serialized `ChartOptions`. Compiler
selection is runtime wiring and must remain separate from data definitions.

## Acceptance criteria

- Existing `buildSpec` callers and behavior remain compatible.
- The shared core has no static imports of unrelated mark builders.
- A Bar-only compiler can be constructed without importing Line, Donut,
  Scatter, Area, Combo, Bullet, or Venn builders.
- Unknown mark types produce the existing explicit error behavior.
- Existing builder tests pass.
- Module attribution confirms the new boundary.

## Architecture relevance

This is the first engine-side capability boundary. It must keep compiled Vega
specs internal rather than creating a public universal engine format. See
[Keep engine programs opaque](../architecture-overview.md#keep-engine-programs-opaque).

## References

- `packages/vega-spec-builder-s2/src/chartSpecBuilder.ts`
- `packages/vega-spec-builder-s2/src/*/*SpecBuilder.ts`
- Ticket 03
