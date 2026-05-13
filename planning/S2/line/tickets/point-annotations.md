---
type: research
status: new
priority: P3 — implement last
story_points: spike → TBD
figma_node_id: "2125:109093"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109093"
---

# Point Annotations (Event Callout Labels)

## Images

- `point-annotations-single-series.png` — Design reference: "Monthly active users (MAU) trend recovered in Q4" (third chart in single series section). Shows a single line with two callout annotations: a filled black circle at each annotated data point, an arrow extending from the point, and a multi-line text label beside it describing the event.
- `point-annotations-behaviors.png` — Design reference: behaviors section. Shows an "Annotated data" state with the same callout pattern on a multi-series chart.

## Type

Research ticket — **requires dedicated design meeting before implementation begins**

## Prerequisites

This is the last feature to implement after all other line tickets are complete. No other ticket is a prerequisite, but this ticket should not be started until:
- All P1 and P2 tickets are complete or in progress
- A design meeting with Alan has been held to answer the open questions below

## Problem

The Figma shows a pattern for annotating specific interior data points with contextual event labels: a circle marker at the data point, an arrow pointing away from the point, and a text block with an event description (e.g., "June 2024: New feature release drove engagement"). This is architecturally distinct from `<LineDirectLabel>` (which labels series at the end) and has substantial open design and implementation questions.

The primary unknowns are:
1. **Arrow placement**: what determines which direction the arrow points? The design shows one annotation pointing up-left and another down-right. Is this automatic (avoid overlap) or explicit?
2. **Text overflow**: how are line breaks handled? The design shows multi-line labels. Is this a `\n` convention, rich text, or auto-wrapped?
3. **Center-of-line points**: the design only shows annotations near chart edges. What happens if a developer annotates a point in the middle of the series where both sides are occupied?
4. **Multi-series**: if the chart has multiple series, how does an annotation target a specific series at an ambiguous x-position?
5. **Architecture**: should this be a Vega mark inside the chart, or an overlay positioned outside the Vega embed on top of the rendered SVG?

## Architectural Consideration

From the transcript (Connor, ~39:00):
> Connor: "This may not belong inside React Spectrum Charts at all. The right approach could be an overlay rendered on top of the Vega embed as a separate part of the codebase — giving consumers full control over the annotation UI."

> Madeline: "Building this into RSC would require treating it as a custom label placed on specific points and positioned by the library. It feels more like how a commenting system works — the user interacts with the chart, adds a comment, and the badge is placed."

> Connor: "A separate package in the monorepo that consumes RSC, provides full pass-through to the chart API, and adds an annotation manager component as a parent wrapper."

Connor's proposal: a **separate package** in the monorepo (to keep it open source) that wraps RSC and adds the annotation overlay. This would be `react-spectrum-charts-annotations` or similar, not a feature inside the core library.

## Plan

From the transcript (Connor, ~38:33):
> Connor: "Custom point annotations are the last feature to implement for line support, no matter what. A design meeting is required first to work through the full set of scenarios."

From the transcript (~35:07):
> Connor: "This is a research spike. It looks simple but raises many questions: text limits, line break handling, arrow placement. In the Figma example, the arrow extends into the text block. Arrow size and text distance from the point appear to be based on the x-domain. Text starts at the y-position of the targeted point."

From the transcript (~37:16):
> Connor: "A set of default behaviors will handle common cases, and developers can control text formatting — `\n` for line breaks, potentially rich text. The arrow mark can be managed by the library and automatically aligned to whichever side the annotation is on."

## Spike Deliverables

1. A design meeting summary resolving: arrow direction (auto vs. explicit), text overflow behavior, center-of-chart annotation, multi-series targeting
2. Architecture decision: Vega mark inside RSC vs. SVG overlay in a separate package
3. If separate package: a proposed package name, directory structure, and API sketch
4. Story point estimate for implementation

## Open Questions

- Is this a Vega mark (hard, but integrated) or an SVG overlay package (easier, but separate dependency)?
- What triggers the arrow direction — distance from chart edge, explicit `direction` prop, or auto-collision detection?
- What is the text anchor alignment for left-side vs. right-side annotations?
- Does the annotation point to the actual SVG coordinates of the data point, or to a fixed position?
