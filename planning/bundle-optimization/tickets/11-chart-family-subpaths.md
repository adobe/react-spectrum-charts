# Ticket 11 — Add remaining chart-family subpaths

**Implementation order:** 11  
**Story points:** 5  
**Estimated duration:** 2-3 AI-assisted days  
**Estimated bundle reduction:** Consumer-dependent; prevents unrelated family costs  
**Prerequisites:** Ticket 10

## Goal

Apply the proven Bar-family entry pattern to the remaining stable and
pre-alpha chart families.

## Strategy

- Add one entry per meaningful chart family rather than one entry per tiny
  component.
- Reuse shared axes, legends, titles, interactions, and runtime code.
- Include only child/decorations supported by that family.
- Keep the root and `pre-alpha` compatibility entries.
- Update package exports, declarations, and `typesVersions`.

Suggested order:

1. Line
2. Scatter
3. Donut
4. Area
5. Combo
6. Bullet
7. Remaining specialized families

Line should go first because it is the second-family proof required by the
long-term architecture research.

## Acceptance criteria

- Every family entry works from the packed package.
- Each entry excludes unrelated family adapters and compilers.
- Shared guide/runtime code is not duplicated unnecessarily.
- Root-package behavior remains unchanged.
- Per-family benchmark rows are recorded.

## Architecture relevance

Multiple families prove that the Bar solution is a shared architecture rather
than a Bar-specific fork. See [Three possible long-term outcomes](../architecture-overview.md#three-possible-long-term-outcomes).

## References

- Ticket 10
- `packages/react-spectrum-charts-s2/src/components/`
- `packages/react-spectrum-charts-s2/src/pre-alpha/components/`
- `packages/vega-spec-builder-s2/src/`
