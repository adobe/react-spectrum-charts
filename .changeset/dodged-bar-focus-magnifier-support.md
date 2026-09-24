---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

Improve S2 bar accessible navigation: 
Updated focus element position accuracy for screen magnifiers.

Added keyboard and focus ring support for dodged bars.

Added meaningful summaries of focused regions for screen readers while focusing elements in dodged and stacked bars. 
(e.g. "Browser: Chrome. Operating system: Windows, Downloads: 5. Operating system: Mac, Downloads: 3.")

Whole-chart focus provides a "metric by dimension" summary (e.g. "Downloads by Browser chart, grouped by Operating system. 3 groups.") instead of a raw field-name id.

Tabbing out of the chart now keeps the focused node so Shift+Tab returns to it (rather than resetting to the "Enter navigation area" button)

Leaving the chart reverts the focus dimming so the non-focused marks return to full opacity.
