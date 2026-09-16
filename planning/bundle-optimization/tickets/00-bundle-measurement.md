# Ticket 00 — Complete the bundle measurement matrix

**Implementation order:** 0  
**Story points:** 2  
**Estimated duration:** About 1 AI-assisted day  
**Estimated bundle reduction:** 0 KB  
**Prerequisites:** None  
**Status:** Prototype available on branch `bundle`

## Goal

Make every later optimization measurable before implementation starts.

## Strategy

Review and productionize the prototype profiling workspace. Preserve the useful
cold-consumer and shared-React scenarios, then add fixtures for:

- `ai-catalog` alone.
- Root package plus `ai-catalog`.
- A minimal `Chart + Bar + Axis` consumer.
- Packed-package imports rather than workspace-source resolution.
- Future chart-family subpaths as they are introduced.

Add module-attribution output or assertions so a result can answer both:

1. How many bytes changed?
2. Which dependency or chart capability caused the change?

Record a fresh baseline before Ticket 01.

## Acceptance criteria

- One command runs all standard scenarios.
- Output includes raw and gzip size per fixture.
- Cold and shared-host scenarios remain separate.
- The benchmark can consume an `npm pack` artifact.
- Results can identify whether `vega-lite`, `vega-embed`, and unrelated mark
  builders are present.
- A baseline row is appended to `BENCHMARK_LOG.md`.
- Prototype scripts are reviewed for portability, deterministic output, and
  suitability for eventual CI use.

## Architecture relevance

Continuous per-mark and per-capability measurement is a mission requirement.
See [Architecture context: Measure incremental cost](../architecture-overview.md#measure-incremental-cost-not-only-artifact-size).

## References

- `packages/bundle-profiling/`
- `packages/bundle-profiling/BENCHMARK_LOG.md`
- `planning/research/bundle-optimization.md`
