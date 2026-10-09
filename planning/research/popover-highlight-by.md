# Finishing ChartPopover's highlightBy

- Status: Ready for RFC
- Date: 2026-10-09
- Issues: #374

## Question

`ChartPopover` has an undocumented `UNSAFE_highlightBy` prop (`'item'` by default,
`'dimension'`, `'series'`, or `string[]` of group keys). It already selects popover content
by group, but not every mark highlights the selected group. What's left before the prop can
lose its `UNSAFE_` prefix?

## Findings

- The plumbing exists: the `SELECTED_GROUP` signal and a groupId transform
  (`getGroupIdTransform` in `chartPopoverUtils.ts`).
- Already group-aware: Bar, Donut, and Venn through the shared `getMarkOpacity`
  (`markUtils.ts`); Line through its own check in `linePointUtils.ts`.
- Not group-aware:
  - **Area:** `getAreaHighlightedData` (`areaSpecBuilder.ts`) only checks `SELECTED_ITEM`.
    A group branch has to join an existing OR-chain that also handles
    `CONTROLLED_HIGHLIGHTED_ITEM` and tooltip hover, without changing their precedence.
  - **Scatter:** its opacity signal (`scatterMarkUtils.ts`) only checks `SELECTED_ITEM`, and
    its data pipeline has no groupId formula.
- **Donut** forces `'dimension'` off (`chartPopoverUtils.ts`) and silently falls back to item
  grouping. A donut segment's dimension is already unique, so this may be intentional, but
  it isn't documented.
- **Combo** has no specific handling; behavior across constituent marks is unverified.
- A `string[]` key naming a field missing from the data evaluates `datum.undefined`. It
  doesn't throw, but there's no defined fallback.
- The prop isn't documented in `packages/docs/docs/api/interactivity/ChartPopover.md`.
- S2's Area and Scatter have the same gap.
- Cross-cutting: touches controlled highlight (Area's OR-chain) and popover selection, and
  needs S1/S2 parity. Reuses existing signals; nothing new.

## Options

1. Bring Area and Scatter to parity, document Donut's exclusion, then drop `UNSAFE_` and
   document the prop.
2. Scope group modes (especially `string[]`) to marks where they make sense, and document the
   rest as unsupported.

## Recommendation

Write an RFC that settles:

- Whether Donut's `'dimension'` exclusion is permanent (and documented) or gets real meaning.
- Whether `string[]` works identically on every mark or only where grouped selection makes
  sense (e.g. stacked/dodged bars).
- How Combo resolves `highlightBy`: per constituent mark, or unsupported.
- How popover group selection and legend hover highlighting interact when both are active.
