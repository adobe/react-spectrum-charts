---
type: feature
status: new
priority: P1
figma_node_id: "2125:109150"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109150"
---

# Series Overflow — Legend Bucketing

## Images

- `series-overflow-best-selling.png` — Design reference: "Best-selling video games" chart. Shows named series (Minecraft, Tetris) with their own legend entries and a single "Other" bucket entry representing remaining series.

## Type

Feature ticket

## Prerequisites

- `series-overflow-lines.md` — the `seriesLimit` prop and the primary/other tagging mechanism must be implemented first, since this ticket depends on that data transform.

## Problem

When series overflow bucketing is active (`seriesLimit` set), the chart legend needs to reflect the bucket structure: named series each get their own legend entry with their series color, while all other-bucket series are represented by a single consolidated entry (e.g., "Other") with the gray bucket color.

The current legend implementation shows one entry per series — it has no concept of a consolidated "other" entry.

Additionally, open questions about interaction (clicking a legend entry to show/hide a series or promote an other-bucket series) have no current design spec and must be deferred for a follow-up design discussion.

## Requirements

1. Add a `hiddenSeriesLabel` (or `otherLabel`) prop to `<Line>` for customizing the bucket entry name (default: `"Other"`). Consumers may want to localize or rename it (e.g., "Other video games").
2. When `seriesLimit` is set, the legend renders:
   - One entry per primary series (normal color swatch + name)
   - One consolidated entry for the other bucket (gray swatch + `hiddenSeriesLabel` text)
3. In v1: legend entries are display-only. No expand/collapse or series promotion from the bucket.
4. Design check required before adding any interactive legend behavior for the bucket entry.

## Plan

From the transcript (Connor, ~10:30):
> "We'd want the user to be able to define the name of that category so they could call it something else, like 'other video games,' whatever they'd want to call it."

From the transcript (Connor, ~13:16 on legend interact):
> "For the first pass, implement the consolidated legend entry without interactive behavior. Mark for a follow-up design review before adding expand/collapse or series promotion."

### Implementation approach

- Add `hiddenSeriesLabel?: string` to `LineOptions`
- In the legend spec builder (wherever the color scale domain is built), detect when `seriesLimit` is active and inject a consolidated "other" entry with the `hiddenSeriesColor` value and `hiddenSeriesLabel` text
- The other-bucket legend entry should not be clickable / not trigger hover state in v1

## Design Check Required

- Interactive legend behavior: if a developer or user clicks a named series entry (e.g., "Tetris") to hide it, does an other-bucket series get promoted to primary to maintain the count? Or does the hidden series just disappear?
- Does clicking the "Other" bucket entry expand to show individual series within it, or is that out of scope?

## Open Questions

- Prop name: `hiddenSeriesLabel` vs. `otherLabel` vs. `seriesOverflowLabel`?
- Where in the visual order does the "Other" entry appear in the legend — always last, or sorted by value?
