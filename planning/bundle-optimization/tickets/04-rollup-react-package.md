# Ticket 04 — Migrate `react-spectrum-charts-s2` to Rollup

**Implementation order:** 4  
**Story points:** 5  
**Estimated duration:** 2-3 AI-assisted days  
**Estimated bundle reduction:** 0-10 KB initially  
**Prerequisites:** Ticket 03

## Goal

Publish real ESM and CJS output for the S2 React package without changing its
runtime behavior or public imports.

## Strategy

- Replace the Webpack library build with Rollup.
- Preserve the root, `pre-alpha`, and `ai-catalog` entries.
- Emit `.mjs` and `.cjs` outputs with correct conditional exports.
- Use PostCSS injection to preserve automatic CSS behavior.
- Preserve source maps and declaration output.
- Keep React, React DOM, Vega, Spectrum packages, and internal packages external
  according to their package contracts.
- Test the packed artifact in minimal ESM and CJS consumers.

Do not add chart-family subpaths or change dispatcher behavior in this ticket.

## Acceptance criteria

- All existing entries resolve from the packed package.
- CSS remains automatic with no consumer import change.
- ESM consumers receive ESM and CJS consumers receive CJS.
- Tests and representative Storybook stories remain unchanged.
- Benchmark results are recorded.

## Architecture relevance

This establishes the distribution foundation for chart-family capabilities
while preserving the compatibility barrel. See
[Preserve the compatibility barrel](../architecture-overview.md#preserve-the-compatibility-barrel).

## References

- `packages/react-spectrum-charts-s2/webpack.config.js`
- `packages/react-spectrum-charts-s2/package.json`
- `packages/react-spectrum-charts-s2/index.ts`
- `packages/react-spectrum-charts-s2/src/index.ts`
