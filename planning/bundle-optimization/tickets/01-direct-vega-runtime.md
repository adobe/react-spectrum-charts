# Ticket 01 — Replace `vega-embed` with direct Vega runtime usage

**Implementation order:** 1  
**Story points:** 5  
**Estimated duration:** 2-3 AI-assisted days  
**Estimated bundle reduction:** 70-110 KB gzip  
**Prerequisites:** Ticket 00

## Goal

Replace `vega-embed` in the S2 rendering path with direct Vega APIs while
preserving current rendering, tooltip, locale, resize, interaction, and cleanup
behavior.

The estimate includes transitive code that becomes unreachable when
`vega-embed` no longer imports Vega-Lite and its supporting utilities.

## Strategy

Refactor `packages/react-spectrum-charts-s2/src/VegaChart.tsx` to:

1. Clone and populate the spec exactly as today.
2. Resolve locale and expression functions.
3. Apply `usermeta` config patches before parsing.
4. Parse the Vega spec directly.
5. Construct and initialize `View` with the requested renderer and container.
6. Apply width, height, and padding.
7. Call `onNewView` so existing tooltip and interaction handlers are installed.
8. Run and settle the view.
9. Finalize the view during replacement or unmount.

Audit every option currently returned by `getVegaEmbedOptions`. Preserve its
behavior explicitly or document why an embed-only option is no longer needed.

Guard asynchronous initialization so a stale promise cannot install a View
after props change or the component unmounts.

## Required behavior coverage

- SVG and Canvas.
- Initial dimensions of zero followed by a valid resize.
- Subsequent resize without recreating the View.
- Number and time locales.
- Custom expression functions.
- Tooltip delay and custom tooltip rendering.
- Config and `usermeta` patches.
- Controlled signal initialization.
- View callback and imperative handle behavior.
- Cleanup on unmount and spec replacement.
- Parse and initialization errors remain visible.

## Acceptance criteria

- No runtime import of `vega-embed` remains in the S2 package.
- Existing unit and Storybook behavior remains unchanged.
- Targeted lifecycle tests cover initialization, resize, replacement, and
  cleanup.
- `vega-lite` is absent from the benchmark module graph.
- Before/after results are recorded in `BENCHMARK_LOG.md`.

## Architecture relevance

This creates direct ownership of the runtime lifecycle needed by both an RSC
refactor and lean Vega. It also defines a host/runtime boundary a future D3
implementation can replace. See [Current RSC architecture](../architecture-overview.md#current-rsc-architecture).

## References

- `packages/react-spectrum-charts-s2/src/VegaChart.tsx`
- `packages/react-spectrum-charts-s2/src/hooks/useNewChartView.tsx`
- `packages/vega-spec-builder-s2/src/vegaEmbedUtils.ts`
- `node_modules/vega-embed/src/embed.ts`
