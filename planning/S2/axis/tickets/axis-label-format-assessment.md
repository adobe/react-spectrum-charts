---
type: research
status: new
priority: P2
story_points: 2pt spike
epic: axis
figma_node_id: "2125:108913"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:108913"
---

# Axis Label Format Assessment (Line + Bar)

## Type

Research spike (2 points)

## Problem

The S2 Figma designs show axis label formatting patterns that may not all be implemented correctly or consistently in the current S2 spec builder. Examples observed in the designs include:

- Abbreviated month labels (JFMAM) with the full year shown in bold below the first label of each year (e.g., "J" above "2024" in bold)
- Bold emphasis on the first label of a new time period
- Specific date/time format conventions per scale type
- Label density thinning (not all ticks shown at high densities)

It's unclear whether the current implementation matches these formatting rules across all scale types and chart sizes. The goal of this spike is to do a systematic comparison and produce a gap list.

## Requirements (spike deliverables)

1. Go through the S2 Figma designs for **line and bar** charts and catalog every distinct axis label format pattern observed.
2. For each pattern, check the current S2 spec builder implementation and classify: ✅ matches / ⚠️ partial / ❌ missing.
3. Document the gaps with file references and Figma node IDs.
4. Write follow-up implementation tickets for each confirmed gap.

## Plan

From the transcript (Connor, ~1:29:09–1:29:47):
> Connor: "We kind of do a lot of this stuff, but I don't know if it's exactly the same the way we handle it today. And so we would need to do a pass through on that."
> Connor: "A two-point research spike on going over all the different chart types, line and bar, and looking at all the access labels and all the examples and putting together like an assessment of: do our access labels calculate values this way and display this way, and are there things we're missing in those feature sets that we need to account for?"
> Connor: "There's these ones that are like, okay, well, how do we have a JFMAM for months with 2025 below? Like, can we do that? Probably, I think we can do that. I'm not sure."

## Scope

- Line chart axis labels (time scale, linear scale, categorical scale)
- Bar chart axis labels (same scale types)
- Both x-axis and y-axis
- All chart sizes (XS, S, M, L) — label density and formatting may differ
