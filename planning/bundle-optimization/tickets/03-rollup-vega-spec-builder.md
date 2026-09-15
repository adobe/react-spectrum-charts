# Ticket 03 — Migrate `vega-spec-builder-s2` to Rollup

**Implementation order:** 3  
**Story points:** 3  
**Estimated duration:** 1-2 AI-assisted days  
**Estimated bundle reduction:** 0-5 KB initially  
**Prerequisites:** Ticket 00  
**May run in parallel with:** Ticket 01

## Goal

Replace the package's single UMD artifact with real ESM and CJS outputs while
preserving module boundaries for downstream tree-shaking.

## Strategy

- Replace `webpack.config.js` with a Rollup configuration.
- Emit `.mjs` for ESM and `.cjs` for CommonJS.
- Preserve source maps and declarations.
- Keep dependencies external according to package ownership.
- Update `main`, `module`, and conditional `exports`.
- Verify the `files` allowlist includes every required output.
- Keep the current public root API unchanged.

Do not refactor `chartSpecBuilder.ts` in this ticket. This ticket changes the
distribution format only.

## Acceptance criteria

- ESM and CJS consumers import the packed package successfully.
- Existing tests pass without behavior changes.
- Source maps and declaration paths resolve.
- No UMD wrapper remains.
- Benchmark results are recorded and expected to be approximately flat.

## Architecture relevance

Real ESM is required before compiler capabilities can be independently removed
from a consumer bundle. See [Priority order](../architecture-overview.md#current-measured-baseline).

## References

- `packages/vega-spec-builder-s2/webpack.config.js`
- `packages/vega-spec-builder-s2/package.json`
- `packages/vega-spec-builder-s2/src/index.ts`
