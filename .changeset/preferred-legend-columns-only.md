---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
'@spectrum-charts/docs-s2': patch
---

Remove automatic full-width standalone legend columns in favor of measured preferred-column pagination.

Support measured preferred columns, multiline labels, and externally controlled two-row pagination for chart-internal S2 legends without changing chart marks or interactions.

Keep preferred standalone labels on one line when they fit, using matching font metrics and button spacing.
