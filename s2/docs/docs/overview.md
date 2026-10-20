# React Spectrum Charts for Spectrum 2

`@spectrum-charts/react-spectrum-charts-s2` is React Spectrum Charts built on Spectrum 2. You describe a chart as a tree of components, like `Chart`, `Axis`, `Line`, and `Legend`, and the library draws it with Spectrum 2 colors, type, and interactions.

If you use `@adobe/react-spectrum-charts` today, see [Migrating from S1](/react-spectrum-charts/s2/docs/docs/guides/migrating-from-s1).

## Your first chart

`Chart` holds the data. Its children name the fields to draw: here, `visits` per `date`, with a line per `device`.

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

```bash
npm install @spectrum-charts/react-spectrum-charts-s2
```

See [Getting started](/react-spectrum-charts/s2/docs/docs/guides/getting-started) for peer dependencies and setup.

## Guides

-   [Getting started](/react-spectrum-charts/s2/docs/docs/guides/getting-started)
-   [Data](/react-spectrum-charts/s2/docs/docs/guides/data)
-   [Sizing](/react-spectrum-charts/s2/docs/docs/guides/sizing)
-   [Colors and theming](/react-spectrum-charts/s2/docs/docs/guides/colors-and-theming)
-   [Localization](/react-spectrum-charts/s2/docs/docs/guides/localization)
-   [Interactivity](/react-spectrum-charts/s2/docs/docs/guides/interactivity)
-   [Animation](/react-spectrum-charts/s2/docs/docs/guides/animation)
-   [Accessibility](/react-spectrum-charts/s2/docs/docs/guides/accessibility)
-   [Exporting](/react-spectrum-charts/s2/docs/docs/guides/exporting)
-   [Testing and troubleshooting](/react-spectrum-charts/s2/docs/docs/guides/testing-and-troubleshooting)
-   [Stages and lab](/react-spectrum-charts/s2/docs/docs/guides/stages-and-lab)

## Release notes

-   [0.10.0](/react-spectrum-charts/s2/docs/docs/release-notes/0-10-0)

## Migration

-   [Migrating from S1](/react-spectrum-charts/s2/docs/docs/guides/migrating-from-s1)
-   [Upgrading to 0.10.0](/react-spectrum-charts/s2/docs/docs/guides/upgrading-to-0-10-0)

## Components

-   [Chart](/react-spectrum-charts/s2/docs/docs/chart): the container for every chart.
-   Charts: [Line](/react-spectrum-charts/s2/docs/docs/line), [Bar](/react-spectrum-charts/s2/docs/docs/bar), and [Donut](/react-spectrum-charts/s2/docs/docs/donut).
-   Lab charts: [Area](/react-spectrum-charts/s2/docs/docs/area), [Bullet](/react-spectrum-charts/s2/docs/docs/bullet), [Combo](/react-spectrum-charts/s2/docs/docs/combo), and [Scatter](/react-spectrum-charts/s2/docs/docs/scatter).
-   [Axis](/react-spectrum-charts/s2/docs/docs/axis), [Legend](/react-spectrum-charts/s2/docs/docs/legend), and [Title](/react-spectrum-charts/s2/docs/docs/title).
-   [ChartInspect and ChartPopover](/react-spectrum-charts/s2/docs/docs/interaction): details on hover and click.
-   [ChartActionBar](/react-spectrum-charts/s2/docs/docs/chart-action-bar) (lab): actions for a selected point.
