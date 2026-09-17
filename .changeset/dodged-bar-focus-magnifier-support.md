---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

Improve S2 bar accessible navigation: the focused element is now sized/positioned to the real bar, stack, or axis label it represents (instead of overlaying the whole chart), so screen magnifiers can center on the actual focused region. Dodged and dual-metric-axis bars also gain a focus ring around the whole dimension group when it receives keyboard focus, matching the existing stacked-bar behavior, and a navigation regression that broke drill-in/Escape for dodged and dual-metric-axis bars has been fixed. Focusing a stacked or dodged group now announces a meaningful, itemized summary of its segments (e.g. "Browser: Chrome. Operating system: Windows, Downloads: 5. Operating system: Mac, Downloads: 3.") instead of a bare internal node id.
