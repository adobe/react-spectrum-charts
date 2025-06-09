# Chart Basics

React Spectrum Charts provides a flexible and powerful way to create data visualizations. This guide will walk you through the fundamental concepts and components needed to create charts.

## Chart Structure

Every visualization starts with the `Chart` component, which serves as the container and configuration hub for your chart. Here's a basic example:

```tsx
import { Axis, Chart, Line } from '@adobe/react-spectrum-charts';

function BasicChart() {
  return (
    <Chart data={data}>
      <Line />
      <Axis position="bottom" />
      <Axis position="left" />
    </Chart>
  );
}
```

## Default Behavior

Notice that there are very few props in the code example above. This is because React Spectrum Charts sets defaults for the majority of pops so you awesome charts with minimal configuration. However, if you need to control the fine details, you can! React Spectrum Charts has a fully featured declarative API that strikes a great balance between simplicity and control.

## Core Components

### Chart Component

The `Chart` component is where you configure chart-wide settings such as:

- Size (width, height)
- Padding
- Color schemes
- Scales

### Visualization Components

Each chart requires at least one core visualization component. These include:

- `Area`
- `Bar`
- `Big Number`
- `Donut`
- `Line`
- `Scatter`

### Supporting Components

Charts can be enhanced with various supporting components:

#### Chart Components

- `Axis`
- `Legend`
- `Title`

#### Interactive Components

- `ChartTooltip`
- `ChartPopover`

#### Analyisis Components

- `Trendline`
- `MetricRange`

## Interactivity

React Spectrum Charts supports various interactive features:

- Hover effects
- Click handlers

Add interactive components to enable these features:

```tsx
<Chart data={data} height={400} colorScheme="light">
  <Line dimension="date" metric="value" color="series">
    <ChartTooltip>{dialogCallback}</ChartTooltip>
    <ChartPopover>{dialogCallback}</ChartPopover>
  </Line>
  <Axis position="bottom" />
  <Axis position="left" />
  <Legend
    highlight
    onClick={(series) => {
      console.log('Series clicked:', series);
    }}
  />
</Chart>
```

This example demonstrates:

- A line chart with multiple series colored by series name
- Interactive tooltips that appear on hover
- Popovers that appear on click
- A legend that highlights series on hover and handles click events
- Automatic axis configuration

For more detailed information about specific chart types and advanced features, check out our other guides in the documentation.
