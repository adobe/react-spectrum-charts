# Ticket 13 — Enforce bundle budgets in CI

**Implementation order:** 13  
**Story points:** 2  
**Estimated duration:** About 1 AI-assisted day  
**Estimated bundle reduction:** 0 KB immediate; prevents future regressions  
**Prerequisites:** Tickets 01, 04, and 10

## Goal

Turn the profiling harness into a regression gate after the new package and
capability boundaries have stabilized.

## Strategy

Define budgets for:

- Cold-consumer root entry.
- Shared-host root entry.
- Bar-family entry.
- Incremental Line-over-Bar cost.
- AI-catalog-only entry.
- Root plus AI catalog.

Allow a small documented tolerance for toolchain variance. Fail on meaningful
regressions and print both the changed size and likely contributing modules.

Keep `BENCHMARK_LOG.md` as the historical record; CI budgets are the automated
guardrail.

## Acceptance criteria

- CI runs the representative bundle fixtures.
- Budget failures show current size, allowed size, and delta.
- Updating a budget requires an intentional source-controlled change.
- The benchmark remains runnable locally with one command.
- Package-only raw-size changes are not confused with consumer gzip changes.

## Architecture relevance

Continuous bundle measurement is a mission requirement and must survive any
future engine decision. See [Mission connection](../architecture-overview.md#mission-connection).

## References

- `packages/bundle-profiling/`
- `packages/bundle-profiling/BENCHMARK_LOG.md`
- Ticket 00
