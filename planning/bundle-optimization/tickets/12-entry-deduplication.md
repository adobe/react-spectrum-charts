# Ticket 12 — Deduplicate Rollup entry output

**Implementation order:** 12  
**Story points:** 2  
**Estimated duration:** About 1 AI-assisted day  
**Estimated bundle reduction:** About 340 KB raw package duplication; 0-60 KB gzip for consumers importing multiple entries  
**Prerequisites:** Ticket 04

## Goal

Ensure the root, AI catalog, pre-alpha, and chart-family entries share common
code without duplicating it into each emitted entry.

## Strategy

Use Rollup multi-entry code splitting and deliberate chunk ownership.

Avoid a shared chunk that contains every chart-family implementation. Shared
chunks should be limited to code genuinely used by multiple entries, such as
the host, selected guides, or runtime infrastructure.

This replaces the previously considered temporary Webpack `splitChunks`
change. Do not add throwaway Webpack optimization if Rollup migration is
proceeding.

## Acceptance criteria

- Root and AI-catalog output no longer duplicate the same large implementation
  body.
- Each entry works when imported alone.
- All shared chunks are included in the packed package.
- Bar-family consumers do not receive an all-families shared chunk.
- Package raw size and multi-entry consumer gzip are recorded separately.

## Architecture relevance

Code sharing should follow capability ownership rather than force unrelated
families back together. See
[Measure incremental cost](../architecture-overview.md#measure-incremental-cost-not-only-artifact-size).

## References

- `packages/react-spectrum-charts-s2/src/ai-catalog/`
- `packages/react-spectrum-charts-s2/webpack.config.js`
- Ticket 04
