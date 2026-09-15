# Bundle Size Benchmark Log

Paper trail for the bundle-optimization work described in
`planning/research/bundle-optimization.md`. Each row is the output of `yarn benchmark`
(run from this package), pasted verbatim, immediately before and after each change lands.
`cold` = every dependency treated as a literal cost (the priority metric). `shared` =
react/react-dom/@react-spectrum/s2 already supplied by the host.

| # | Step | cold min | cold max | shared min | shared max |
|---|---|---|---|---|---|
| 0 | Baseline — after the 4 cheap fixes (`sideEffects`, `vega-tooltip` dedup, dead `alpha`/`beta` exports removed, `Chart.tsx` barrel fix). Commit `7c427ad5f`. | 662.6 KB | 663.9 KB | 604.6 KB | 606.0 KB |
| 1 | Ticket 00 — added `ai-catalog`, `root-and-ai-catalog`, and `minimal` fixtures; pinned dependency versions exactly (no more loose `>=` ranges); added packed-artifact resolution (`yarn profile:packed`) and text-grep-based attribution (`yarn attribution`). `root-and-ai-catalog` is now the max fixture (was `everything`) — this is a new, bigger fixture being added, not a regression. | 662.6 KB | 764.7 KB | 604.5 KB | 706.9 KB |

<!-- Append one row per landed change. Run `yarn benchmark` before starting a change to
confirm the baseline still matches the last row, then again after, and add a new row with
a one-line description of what changed and its commit hash. -->
