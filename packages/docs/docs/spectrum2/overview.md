---
sidebar_position: 1
---

# Spectrum 2 Overview

:::caution Work in progress
Spectrum 2 support in React Spectrum Charts is actively under development. The S2 package still has some Spectrum 1 dependencies that are being incrementally migrated. We will make an effort not to introduce breaking API changes to Spectrum 2 features prior to **Adobe Summit**.
:::

React Spectrum Charts offers two paths for Spectrum 2 support. This page explains the difference between them, how to install the full S2 package, and how theming works.

## S2 prop vs. the S2 package

### `s2` prop (partial S2 support)

The `@adobe/react-spectrum-charts` package includes an `s2` prop on the `Chart` component. When set to `true`, it enables Spectrum 2 styling for **supported chart types**. Currently supported: **Line**, **Bar**, and **Donut**.

```jsx
import { Chart, Bar } from '@adobe/react-spectrum-charts';

<Chart data={data} s2>
  <Bar color="series" />
</Chart>
```

Use this approach if you are already using `@adobe/react-spectrum-charts` and only need S2 theming for supported chart types.

### `@spectrum-charts/react-spectrum-charts-s2` package (full S2 support)

The S2 package is a **separate alpha package** built entirely on Spectrum 2. It provides a full S2-native implementation of the chart library with additional features not available in the base package. All components are imported from this package instead of `@adobe/react-spectrum-charts`.

Use this approach when you need access to S2-exclusive features such as line gradients, line labels, line interpolation, or S2 reference lines.

---

## Installing the S2 package

The S2 package is published under the `alpha` tag on npm.

```bash
npm install @spectrum-charts/react-spectrum-charts-s2
# or
yarn add @spectrum-charts/react-spectrum-charts-s2
```

Import components from the S2 package instead of the base package:

```jsx
import { Chart, Axis, Line, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
```

The S2 package has these peer dependencies, which your app must install:

| Package | Version |
| --- | --- |
| `@react-spectrum/s2` | `>=1.0.0` |
| `react`, `react-dom` | `>=19.0.0` |
| `react-aria-components` | `^1.14.0`, matching the version your `@react-spectrum/s2` depends on |
| `vega` | `^6.2.0` |
| `vega-lite` | `^6.4.2` |

Since 1.3.0, `@react-spectrum/s2` pins an exact `react-aria-components` version. Install that same version so your app has one copy and charts share React Aria context with S2:

```bash
npm install @react-spectrum/s2 react react-dom vega vega-lite
npm ls react-aria-components   # shows the version @react-spectrum/s2 uses
npm install react-aria-components@<that version>
```

### Module format

The S2 packages ship ES modules only, one file per module, so bundlers include only what you import. `require()` and the UMD global are not supported, and Node.js 20.19 or later is required.

#### Jest

Jest runs CommonJS, so it must transform the package and its ES module dependencies (Vega and d3), and stub CSS. Works with Jest 29 and 30:

```js
// jest.config.js — transforms use your babel.config.js; a .babelrc does not apply to node_modules.
module.exports = {
  testEnvironment: './jest.environment.js',
  transformIgnorePatterns: [
    'node_modules/(?!(@spectrum-charts|vega|vega-[^/]+|d3-[^/]+|internmap|delaunator|robust-predicates|json-stringify-pretty-compact)/)',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/styleStub.js',
    // Jest 30 otherwise loads vega-canvas's Node build, which uses top-level await.
    '^vega-canvas$': '<rootDir>/node_modules/vega-canvas/build/vega-canvas.browser.js',
  },
};
```

```js
// jest.environment.js — jsdom does not provide structuredClone, which Vega-Lite uses.
const { TestEnvironment } = require('jest-environment-jsdom');

module.exports = class extends TestEnvironment {
  async setup() {
    await super.setup();
    this.global.structuredClone = structuredClone;
  }
};
```

```js
// test/styleStub.js
module.exports = {};
```

#### Vitest

Vitest runs ES modules natively. Inline this package and `@react-spectrum/s2` so Vite handles their CSS imports:

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    server: {
      deps: { inline: ['@spectrum-charts/react-spectrum-charts-s2', '@react-spectrum/s2'] },
    },
  },
});
```

---

## Theming

### Color scheme

The `Chart` component accepts a `colorScheme` prop to switch between light and dark mode. This controls both the chart's visual theme and the styling of tooltips and popovers.

```jsx
<Chart data={data} colorScheme="dark">
  <Line color="series" />
</Chart>
```

| Value | Description |
|-------|-------------|
| `'light'` | Light mode (default) |
| `'dark'` | Dark mode |

### Colors

The S2 package uses Spectrum 2 categorical color scales by default. You can override the color scale using the `colors` prop on `Chart`.

Available S2 color scales: `s2Categorical6`, `s2Categorical12`, `s2Categorical16`, `s2Categorical20`.

```jsx
<Chart data={data} colors="s2Categorical12">
  <Line color="series" />
</Chart>
```

### Inspect panels

Inspect panels in the S2 package are styled automatically to match the Spectrum 2 design specification — including the correct font (`adobe-clean`), text colors, border, and elevated box shadow. No additional configuration is required.

Add a `ChartInspect` as a child of a mark component to enable inspect panels:

```jsx
<Line color="series">
  <ChartInspect>
    {(datum) => (
      <div>
        <div>Series: {datum.series}</div>
        <div>Value: {datum.value}</div>
      </div>
    )}
  </ChartInspect>
</Line>
```

### Popovers

Popovers are styled to match the Spectrum 2 elevated surface style (border, box shadow, font). Add a `ChartPopover` as a child of a mark component to enable click-to-open popovers:

```jsx
<Line color="series">
  <ChartPopover width={200}>
    {(datum, close) => (
      <div>
        <div>Series: {datum.series}</div>
        <div>Value: {datum.value}</div>
        <button onClick={close}>Close</button>
      </div>
    )}
  </ChartPopover>
</Line>
```

#### ChartInspect props

<table>
    <thead>
        <tr>
            <th>name</th>
            <th>type</th>
            <th>default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>children</td>
            <td>(datum: Datum) =&gt; ReactNode</td>
            <td>–</td>
            <td>Callback that returns the content to render inside the inspect panel. Optional inside a <code>Donut</code>, which renders <a href="./donut#tooltips-and-popovers">default content</a> when omitted.</td>
        </tr>
        <tr>
            <td>excludeDataKeys</td>
            <td>string[]</td>
            <td>–</td>
            <td>Keys in the data that, if they have truthy values, will suppress the inspect panel for that data point.</td>
        </tr>
        <tr>
            <td>highlightBy</td>
            <td>'series' | 'dimension' | 'item' | string[]</td>
            <td>'item'</td>
            <td>Controls which marks are highlighted when an inspect panel is visible.</td>
        </tr>
        <tr>
            <td>targets</td>
            <td>('dimensionArea' | 'item')[]</td>
            <td>['item']</td>
            <td>The hit targets that trigger the inspect panel.</td>
        </tr>
    </tbody>
</table>

#### ChartPopover props

<table>
    <thead>
        <tr>
            <th>name</th>
            <th>type</th>
            <th>default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>children</td>
            <td>(datum: Datum, close: () =&gt; void) =&gt; ReactNode</td>
            <td>–</td>
            <td>Callback that returns the content to render inside the popover. The second argument is a function that closes the popover. Optional inside a <code>Donut</code>, which renders <a href="./donut#tooltips-and-popovers">default content</a> when omitted.</td>
        </tr>
        <tr>
            <td>width</td>
            <td>number | 'auto'</td>
            <td>250</td>
            <td>Width of the popover in pixels, or <code>'auto'</code> to size to content.</td>
        </tr>
        <tr>
            <td>minWidth</td>
            <td>number</td>
            <td>0</td>
            <td>Minimum width of the popover in pixels.</td>
        </tr>
        <tr>
            <td>maxWidth</td>
            <td>number</td>
            <td>–</td>
            <td>Maximum width of the popover in pixels.</td>
        </tr>
        <tr>
            <td>height</td>
            <td>number | 'auto'</td>
            <td>–</td>
            <td>Height of the popover in pixels.</td>
        </tr>
        <tr>
            <td>minHeight</td>
            <td>number</td>
            <td>–</td>
            <td>Minimum height of the popover in pixels.</td>
        </tr>
        <tr>
            <td>maxHeight</td>
            <td>number</td>
            <td>–</td>
            <td>Maximum height of the popover in pixels.</td>
        </tr>
        <tr>
            <td>contentMargin</td>
            <td>number</td>
            <td>12</td>
            <td>Inner margin applied around the popover content in pixels.</td>
        </tr>
        <tr>
            <td>onOpenChange</td>
            <td>(isOpen: boolean) =&gt; void</td>
            <td>–</td>
            <td>Callback fired when the popover opens or closes.</td>
        </tr>
        <tr>
            <td>rightClick</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true, the popover opens on right-click instead of left-click.</td>
        </tr>
        <tr>
            <td>containerPadding</td>
            <td>number</td>
            <td>12</td>
            <td>Minimum distance between the popover and the edges of its container.</td>
        </tr>
    </tbody>
</table>
