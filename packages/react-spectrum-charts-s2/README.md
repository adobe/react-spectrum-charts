# @spectrum-charts/react-spectrum-charts-s2

Declarative library for composing Spectrum 2 visualizations in React.

This is the full Spectrum 2 variant of [react-spectrum-charts](https://github.com/adobe/react-spectrum-charts). It provides a native S2 implementation with features not available in the base package.

## Installation

```bash
npm install @spectrum-charts/react-spectrum-charts-s2@alpha @adobe/react-spectrum vega vega-lite
# or
yarn add @spectrum-charts/react-spectrum-charts-s2@alpha @adobe/react-spectrum vega vega-lite
```

## Usage

```jsx
import { Chart, Axis, Line, Legend } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid />
  <Line color="series" />
  <Legend />
</Chart>
```

## Documentation

[Spectrum 2 docs](https://opensource.adobe.com/react-spectrum-charts/docs/spectrum2/overview)

## License

Apache-2.0
