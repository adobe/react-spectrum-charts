# Getting started

## Install

Install the package and its peer dependencies:

**npm:**

```bash
npm install @spectrum-charts/react-spectrum-charts-s2 @react-spectrum/s2 react-aria-components vega vega-lite
```

**yarn:**

```bash
yarn add @spectrum-charts/react-spectrum-charts-s2 @react-spectrum/s2 react-aria-components vega vega-lite
```

**pnpm:**

```bash
pnpm add @spectrum-charts/react-spectrum-charts-s2 @react-spectrum/s2 react-aria-components vega vega-lite
```

### Requirements

| Package | Version |
| --- | --- |
| `react`, `react-dom` | `>= 19.0.0` |
| `@react-spectrum/s2` | `>= 1.0.0` |
| `react-aria-components` | `^1.14.0`, the same version `@react-spectrum/s2` uses |
| `vega` | `^6.2.0` |
| `vega-lite` | `^6.4.2` |

Since version 1.3.0, `@react-spectrum/s2` depends on an exact `react-aria-components` version. Install that same version so your app has a single copy, which charts need to share React Aria context with Spectrum 2 components. To find the version `@react-spectrum/s2` uses:

**npm:**

```bash
npm ls react-aria-components
npm install react-aria-components@<that version>
```

**yarn:**

```bash
yarn why react-aria-components
yarn add react-aria-components@<that version>
```

**pnpm:**

```bash
pnpm why react-aria-components
pnpm add react-aria-components@<that version>
```

## ES modules

The package is published as ES modules only (`"type": "module"` in its `package.json`), with one file per source module, so your bundler includes only the components you import.

-   Load it with `import`. There's no CommonJS build, so `require()` and UMD script-tag globals aren't supported.
-   There are two entry points: `@spectrum-charts/react-spectrum-charts-s2` and `@spectrum-charts/react-spectrum-charts-s2/lab`. The package's `exports` map blocks deep imports into `dist`.
-   Type declarations are included for both entry points.
-   Like Spectrum 2, the modules import their own CSS files, so your bundler needs to handle CSS imports. Vite and Parcel do by default; webpack needs a CSS loader.
-   Node.js 22.12.0 or later is required.
-   Jest runs CommonJS by default, so it has to transform the package and stub its CSS. Vitest needs the package inlined. See [Testing and troubleshooting](/react-spectrum-charts/s2/docs/docs/guides/testing-and-troubleshooting#testing).

## Dark mode

`Chart` renders its own Spectrum 2 `Provider` and loads its own styles, so charts don't need any Spectrum 2 setup in your app. It also means `Chart` doesn't read the color scheme from your app. Its `colorScheme` prop defaults to `light`; if your app supports dark mode, pass the current color scheme to every chart:

```tsx
<Chart data={data} colorScheme={isDark ? 'dark' : 'light'}>
  {/* ... */}
</Chart>
```

See [Colors and theming](/react-spectrum-charts/s2/docs/docs/guides/colors-and-theming).

## Your first chart

`Chart` takes the data as an array of objects, one per data point:

```ts
const guideVisitsData = [
  { date: '2026-03-02T00:00:00', device: 'Desktop', visits: 3120 },
  { date: '2026-03-03T00:00:00', device: 'Desktop', visits: 3480 },
  { date: '2026-03-04T00:00:00', device: 'Desktop', visits: 3360 },
  { date: '2026-03-05T00:00:00', device: 'Desktop', visits: 3710 },
  { date: '2026-03-06T00:00:00', device: 'Desktop', visits: 3940 },
  { date: '2026-03-02T00:00:00', device: 'Mobile', visits: 2280 },
  { date: '2026-03-03T00:00:00', device: 'Mobile', visits: 2410 },
  { date: '2026-03-04T00:00:00', device: 'Mobile', visits: 2650 },
  { date: '2026-03-05T00:00:00', device: 'Mobile', visits: 2590 },
  { date: '2026-03-06T00:00:00', device: 'Mobile', visits: 2870 },
];
```

Its children describe what to draw. In the chart below, `Line` plots `visits` for each `date`, with one line for each `device`. The two `Axis` components label the x and y scales, and `Legend` names each line.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={guideVisitsData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line dimension="date" metric="visits" color="device" />
  <Legend />
</Chart>
```

`Chart` fills the width of its container and is 300px tall by default. See [Sizing](/react-spectrum-charts/s2/docs/docs/guides/sizing).

## Imports

Import most components from the package root:

```tsx
import { Axis, Bar, Chart, Donut, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';
```

Lab components come from `@spectrum-charts/react-spectrum-charts-s2/lab`: `Area`, `Bullet`, `Combo`, `Scatter`, `ScatterAnnotation`, `ScatterPath`, `Trendline`, and `TrendlineAnnotation`.

```tsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```

Lab components are experimental, so their APIs may change. See [Stages and lab](/react-spectrum-charts/s2/docs/docs/guides/stages-and-lab).

## Next steps

-   [Data](/react-spectrum-charts/s2/docs/docs/guides/data): field names, dates, missing values, and updates.
-   [Sizing](/react-spectrum-charts/s2/docs/docs/guides/sizing): responsive charts and size-dependent styles.
-   [Chart](/react-spectrum-charts/s2/docs/docs/chart): every `Chart` prop.
-   Chart types: [Line](/react-spectrum-charts/s2/docs/docs/line), [Bar](/react-spectrum-charts/s2/docs/docs/bar), and [Donut](/react-spectrum-charts/s2/docs/docs/donut).
