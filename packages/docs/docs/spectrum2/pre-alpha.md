---
sidebar_position: 6
---

# Pre-Alpha Components

Pre-alpha components are chart types and child components that are functional and available
for use, but don't yet have a finalized Spectrum 2 visual design. Their API and visual
behavior may undergo significant changes before they graduate to a stable, designed S2
component.

Pre-alpha components:
- **Are functional** — full prop support for the underlying chart type, ported from the base
  `@adobe/react-spectrum-charts` package
- **Have no finalized Spectrum 2 design** — visual styling may change once a design is available
- **May have breaking API changes** in future releases without following semver
- **Are open for feedback** — please report issues or suggest improvements

## Current pre-alpha components

- `Area` — area charts
- `Scatter` — scatter plots, with `ScatterPath`, `ScatterAnnotation`, and `Trendline`
  (+ `TrendlineAnnotation`) child components
- `Donut`, `DonutSummary`, `SegmentLabel` — donut charts

## Importing pre-alpha components

Pre-alpha components are imported from a separate `pre-alpha` export:

```jsx
import { Chart, Axis } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter, ScatterPath } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';

<Chart data={data}>
  <Axis position="bottom" />
  <Axis position="left" />
  <Scatter dimension="x" metric="y" color="series">
    <ScatterPath groupBy={['series']} />
  </Scatter>
</Chart>
```

## Providing feedback

If you use pre-alpha components and have feedback, please:
- Open an issue on GitHub
- Share your use case and requirements
- Report any bugs or unexpected behavior

Your feedback helps shape these components before they graduate to stable, designed S2
components.
