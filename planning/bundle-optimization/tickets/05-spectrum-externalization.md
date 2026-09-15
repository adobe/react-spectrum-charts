# Ticket 05 — Re-externalize and validate `@react-spectrum/s2`

**Implementation order:** 5  
**Story points:** 2  
**Estimated duration:** About 1 AI-assisted day  
**Estimated bundle reduction:** Up to 38 KB gzip in the shared-host scenario  
**Prerequisites:** Ticket 04

## Goal

Ensure Rollup preserves `@react-spectrum/s2` as an external ESM dependency
without recreating the cold-consumer regression observed with UMD output.

## Strategy

- Add or confirm `@react-spectrum/s2` in the Rollup external configuration.
- Preserve it as a peer dependency.
- Confirm emitted ESM contains a normal import rather than an opaque bundled
  wrapper reference.
- Run both cold and shared-host benchmark scenarios.
- Inspect module attribution to ensure downstream bundlers tree-shake the
  Spectrum imports RSC actually uses.

## Acceptance criteria

- Cold-consumer gzip does not regress from the Ticket 04 baseline.
- Shared-host gzip improves or remains neutral.
- Package installation reports no missing peer.
- Both ESM and CJS consumers resolve the dependency.
- Benchmark results are recorded.

## Architecture relevance

External ownership should follow stable package boundaries rather than bundler
accidents. This ticket does not define the future rendering engine.

## References

- `packages/react-spectrum-charts-s2/package.json`
- Ticket 04
- `planning/research/bundle-optimization.md`
