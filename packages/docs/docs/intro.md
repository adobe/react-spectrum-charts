# Introduction to React Spectrum Charts

React Spectrum Charts is a declarative library for composing Spectrum visualizations in React. It provides a set of React components that make it easy to create beautiful, accessible, and interactive charts that follow Adobe's Spectrum design system.

## Features

- 🎨 **Spectrum Design System**: Built on Adobe's Spectrum design system for consistent and beautiful visualizations
- ⚛️ **React-First**: Fully integrated with React's component model and lifecycle
- 📊 **Declarative API**: Create complex visualizations with simple, declarative components
- ♿️ **Accessibility**: Built-in accessibility features following WCAG guidelines
- 🎯 **Interactive**: Rich interaction capabilities with events and animations
- 🛠️ **Customizable**: Extensive theming and customization options

## Quick Start

Install React Spectrum Charts in your project:

```bash
# Using npm
npm install @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite

# Using yarn
yarn add @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite

# Using pnpm
pnpm add @adobe/react-spectrum-charts @adobe/react-spectrum vega vega-lite
```


Create your first chart:

```jsx
import { Axis, Bar, Chart } from '@adobe/react-spectrum-charts';

function MyChart() {
  const data = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 15 },
  ];

  return (
    <Chart data={data}>
      <Bar />
      <Axis position="bottom" baseline/>
      <Axis position="left" grid/>
    </Chart>
  );
}
```

## Next Steps

- Check out the [Installation](installation) guide for detailed setup instructions
- Learn about basic chart types in the [Basic Charts](guides/basic-charts) guide
- Explore the [API Reference](api/Chart) for detailed component documentation 