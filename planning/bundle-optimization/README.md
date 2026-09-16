# RSC bundle optimization implementation packet

This folder is a self-contained handoff for implementing the Spectrum 2 bundle
optimization work while preserving useful seams for the longer-term RSC
architecture decision.

Start with [architecture-overview.md](./architecture-overview.md), then implement
the tickets in numeric order unless a ticket explicitly says it may run in
parallel.

## Estimation scale

Story points are paired with an approximate AI-assisted implementation duration:

| Points | Expected duration |
|---:|---|
| 1 | Up to half a day |
| 2 | About 1 day |
| 3 | 1-2 days |
| 5 | 2-3 days |
| 8 | 4-5 days |

Estimates include targeted tests and benchmark runs but not extended manual
release coordination.

## Ordered ticket list

Bundle estimates are incremental and should not be added blindly. In particular,
removing `vega-embed` is expected to remove Vega-Lite from the runtime graph;
the following metadata cleanup does not claim the same savings again.

| Order | Ticket | Points | Days | Estimated incremental gzip reduction | Prerequisites |
|---:|---|---:|---:|---:|---|
| 0 | [Complete the bundle measurement matrix](./tickets/00-bundle-measurement.md) | 2 | ~1 | 0 KB | Existing profiling workspace |
| 1 | [Replace `vega-embed` with direct Vega runtime usage](./tickets/01-direct-vega-runtime.md) | 5 | 2-3 | 70-110 KB | Ticket 0 |
| 2 | [Remove the Vega-Lite package contract](./tickets/02-remove-vega-lite-contract.md) | 1 | <=0.5 | 0 KB runtime; install reduction | Ticket 1 |
| 3 | [Migrate `vega-spec-builder-s2` to Rollup](./tickets/03-rollup-vega-spec-builder.md) | 3 | 1-2 | 0-5 KB initially | Ticket 0 |
| 4 | [Migrate `react-spectrum-charts-s2` to Rollup](./tickets/04-rollup-react-package.md) | 5 | 2-3 | 0-10 KB initially | Ticket 3 |
| 5 | [Re-externalize and validate `@react-spectrum/s2`](./tickets/05-spectrum-externalization.md) | 2 | ~1 | Up to 38 KB in shared-host scenario | Ticket 4 |
| 6 | [Add component capability metadata](./tickets/06-component-capability-metadata.md) | 2 | ~1 | 0 KB by itself | Ticket 4 |
| 7 | [Remove eager component sanitizer imports](./tickets/07-sanitizer-dispatch.md) | 2 | ~1 | 0-3 KB | Ticket 6 |
| 8 | [Remove eager React adapter imports](./tickets/08-react-adapter-dispatch.md) | 3 | 1-2 | 0-8 KB before compiler isolation | Tickets 6-7 |
| 9 | [Split the Vega compiler core from mark dispatch](./tickets/09-compiler-dispatch.md) | 5 | 2-3 | 0-15 KB before subpaths | Ticket 3 |
| 10 | [Add a complete Bar-family subpath](./tickets/10-bar-family-subpath.md) | 5 | 2-3 | 5-30 KB versus root import | Tickets 8-9 |
| 11 | [Add remaining chart-family subpaths](./tickets/11-chart-family-subpaths.md) | 5 | 2-3 | Consumer-dependent; avoids unrelated families | Ticket 10 |
| 12 | [Deduplicate Rollup entry output](./tickets/12-entry-deduplication.md) | 2 | ~1 | ~340 KB raw package duplication; 0-60 KB gzip per multi-entry consumer | Ticket 4 |
| 13 | [Enforce bundle budgets in CI](./tickets/13-bundle-budgets.md) | 2 | ~1 | 0 KB immediate; prevents regressions | Tickets 1, 4, 10 |
| 14 | [Define the `UNSAFE_vegaSpec` compatibility policy](./tickets/14-unsafe-vega-spec-policy.md) | 1 | <=0.5 | 0 KB immediate | None for documentation; required before a D3 migration |

## Parallel work

- Ticket 3 can begin while Ticket 1 is in progress once Ticket 0 is complete.
- Ticket 12 may begin immediately after Ticket 4.
- Tickets 6-8 and Ticket 9 touch separate packages and may be implemented in
  parallel after their prerequisites.
- Ticket 13 should be finalized only after the first major reductions establish
  realistic budgets.
- Ticket 14 can be decided at any time and does not block the current Vega-based
  optimization work.

## Architecture investment checkpoint

Tickets 0-5 are direct bundle/runtime infrastructure work. Tickets 6-10 include
an intentional optionality investment:

- The strict minimum bundle fix would replace eager imports with the smallest
  local dispatch mechanism that tree-shakes.
- The proposed implementation instead uses component-owned descriptors and
  separates compiler selection from serialized chart options.

That additional structure is expected to be small, but it is not free. It buys
a cleaner path to a lean-Vega compiler or Direct D3 runtime. The owner of the
long-term architecture should confirm that trade before Ticket 6 begins.

## Existing prototype work on the `bundle` branch

The branch contains prototype implementations and measurements that should be
reviewed, corrected where necessary, and incorporated into the tickets rather
than treated as finished production work:

- A cold-consumer and shared-React profiling prototype at
  `packages/bundle-profiling`.
- An initial measurement in `packages/bundle-profiling/BENCHMARK_LOG.md`.
- Proposed JavaScript/CSS side-effect metadata.
- A prototype `vega-tooltip` resolution change.
- Proposed removal of dead `alpha` and `beta` exports.
- A narrowed component import in `Chart.tsx`.

None of these changes should be assumed complete merely because they exist on
the branch. Each relevant ticket must validate the prototype against its
acceptance criteria before the work is considered done.
