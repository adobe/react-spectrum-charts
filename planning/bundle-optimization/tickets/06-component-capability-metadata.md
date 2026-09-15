# Ticket 06 — Add private component capability metadata

**Implementation order:** 6  
**Story points:** 2  
**Estimated duration:** About 1 AI-assisted day  
**Estimated bundle reduction:** 0 KB by itself  
**Prerequisites:** Ticket 04

## Goal

Give each chart component enough private metadata to identify and adapt itself
without requiring central files to import every component.

This ticket includes a small intentional architecture-optionality premium over
the minimum tree-shaking fix. Confirm that choice at the architecture investment
checkpoint in the packet README before implementation.

## Strategy

Define a private, typed component descriptor keyed by a shared symbol or other
collision-resistant internal property. It should distinguish:

- Top-level marks.
- Guides such as axes, legends, and titles.
- Mark-specific child/decorations.
- The adapter used to convert React props into current builder options.

Add descriptors to components without changing the existing sanitizer or
dispatcher yet.

Do not expose the descriptor as supported public API. Do not create a global
registry or perform import-time registration.

## Acceptance criteria

- Every supported S2 component has typed metadata.
- Existing `displayName` values remain unchanged.
- Existing rendering behavior remains unchanged.
- Tests verify representative mark, guide, and nested-child descriptors.
- No dispatcher consumes the metadata yet.

## Architecture relevance

Component-owned descriptors support explicit composition and avoid the global
registry pattern rejected in the architecture overview. See
[Prefer explicit composition](../architecture-overview.md#prefer-explicit-composition-over-import-time-registration).

## References

- `packages/react-spectrum-charts-s2/src/components/`
- `packages/react-spectrum-charts-s2/src/pre-alpha/components/`
- `packages/react-spectrum-charts-s2/src/rscToSbAdapter/childrenAdapter.ts`
