# Ticket 07 — Remove eager component sanitizer imports

**Implementation order:** 7  
**Story points:** 2  
**Estimated duration:** About 1 AI-assisted day  
**Estimated bundle reduction:** 0-3 KB gzip  
**Prerequisites:** Ticket 06

## Goal

Remove the all-components imports used solely to build `displayName` allowlists
in `src/utils/utils.ts`.

## Strategy

Rewrite the sanitizers to inspect the private component descriptor introduced
by Ticket 06.

Preserve the existing distinctions between:

- Valid direct children of `Chart`.
- Valid children of marks.
- Valid children of axes.
- Invalid React or non-React values.

Preserve current filtering and error behavior. Do not broaden accepted child
placement accidentally.

## Acceptance criteria

- `utils.ts` no longer imports every chart component.
- Each sanitizer accepts the same valid elements as before.
- Invalid and misplaced children remain rejected.
- Nested chart-child behavior remains covered by tests.
- Bundle results are recorded even if the reduction is negligible.

## Architecture relevance

This removes one centralized knowledge list and lets imported capabilities
describe themselves. See [Current RSC architecture](../architecture-overview.md#current-rsc-architecture).

## References

- `packages/react-spectrum-charts-s2/src/utils/utils.ts`
- `packages/react-spectrum-charts-s2/src/RscChart.tsx`
- Ticket 06
