---
type: research
status: new
priority: P3 — deferred, implement on consumer request
story_points: 2pt spike
figma_node_id: "2125:109488"
figma_url: "https://www.figma.com/design/a9LVueYspAHETtc1x9Cll8?node-id=2125:109488"
---

# No-Data Empty State Notification

## Images

None colocated — visible in the Figma behaviors section. The design shows a toast-style popup inside the chart when an entire series has no data.

## Type

Research spike (2 points)

## Prerequisites

None. Deferred — implement when a consumer requests it.

## Problem

The Figma behaviors section shows a toast/notification element rendered within the chart when an entire series has no data — the popup explains that the series cannot be displayed. Currently, when all values in a series are null/missing, the line simply doesn't render and no explanation is provided.

The core open question is whether this belongs in RSC at all. The notification content is business-logic specific — the consuming application knows why data is absent. RSC inserting a hardcoded message would require localization support and would conflict with application-level error handling.

## Requirements (to be decided during spike)

1. Read the Figma behaviors section to get the full visual spec for the notification element (placement, dismissal, content).
2. Determine scope: should RSC handle this, or provide hooks for the consuming application to render its own notification?
   - **RSC-owned option**: RSC renders the notification when a series has all-null values; a callback fires on dismiss; a prop controls whether to show it.
   - **Consumer-owned option**: RSC provides a signal/callback when a series has no data; the consumer renders whatever notification UI they want externally.
3. If RSC-owned: design the callback and prop API surface. Consider localization — RSC cannot provide a default string.
4. Assess Vega feasibility: can a DOM-level toast element be rendered within the Vega embed boundary, or does it require a React overlay?

## Plan

From the transcript (Connor and Tanu, ~38:28–40:43):
> Connor: "When all data in a series is missing, don't show a line — a flat line at 0 can mislead. The preferred approach is consumer-owned: handled externally by the consuming application."
> Tanu: "Since it is on the chart, RSC may need to handle it at some point. Either design moves the popup outside the chart, or it stays on the axis — either way, that's a layout concern."
> Connor: "That's a good point. The research spike should determine whether RSC should own this, given the business logic requirements it would introduce."
> Connor: "This is last priority in the implementation timeline — after all other chart types."
> Connor: "Deferred — implement when a consumer requests it."

## Open Questions

- Is this a Vega overlay mark, a React DOM element outside the Vega embed, or a combination?
- If RSC owns it: how does the consumer provide localized copy for the notification message?
- Does the notification persist until dismissed, or auto-dismiss after a timeout?
- What is the placement when multiple series are missing data simultaneously?
