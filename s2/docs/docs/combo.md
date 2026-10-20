# Combo

**Stage:** Lab

Combos draw bars and a line against the same x-axis, for example daily sessions as bars with the conversion rate as a line. `Combo` has no styling of its own. It renders its `Bar` and `Line` children the way they render on their own, so see [Bar](/react-spectrum-charts/s2/docs/docs/bar) and [Line](/react-spectrum-charts/s2/docs/docs/line) for their full props.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Line,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={comboTrafficData}>
  <Title text="Sessions and conversion" />
  <Axis position="left" title="Sessions" grid />
  <Axis
    position="right"
    name="rate"
    title="Conversion rate"
    numberFormat=".1%"
  />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" />
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color={{ value: 'categorical-200' }}
      scaleType="point"
    />
  </Combo>
</Chart>
```

`Combo` is a lab component. Import it from the `lab` subpath. `Bar` and `Line` come from the main package:

```tsx
import { Axis, Bar, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```

## Data

`data` goes on `Chart` as an array of objects, one per x-axis value (or one per x-axis value and series). Each child reads its own `metric` from the same rows. Most examples on this page use `comboTrafficData`:

```ts
const comboTrafficData = [
  { datetime: 1772452800000, sessions: 4200, orders: 126, conversionRate: 0.03 },
  { datetime: 1772539200000, sessions: 4650, orders: 149, conversionRate: 0.032 },
  { datetime: 1772625600000, sessions: 5100, orders: 168, conversionRate: 0.033 },
  { datetime: 1772712000000, sessions: 4800, orders: 139, conversionRate: 0.029 },
  { datetime: 1772798400000, sessions: 5600, orders: 196, conversionRate: 0.035 },
  { datetime: 1772884800000, sessions: 3900, orders: 101, conversionRate: 0.026 },
  { datetime: 1772971200000, sessions: 3500, orders: 84, conversionRate: 0.024 },
];
```

```tsx
<Chart data={comboTrafficData}>
  <Axis position="left" grid />
  <Axis position="right" name="rate" numberFormat=".1%" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" />
    <Line metric="conversionRate" metricAxis="rate" color={{ value: 'categorical-200' }} scaleType="point" />
  </Combo>
</Chart>
```

### dimension

`dimension` on `Combo` names the x-axis field for every child. The default is `datetime`. A child that sets its own `dimension` uses that instead, but children should share a field so their marks line up.

### Empty and loading

When `data` is an empty array, `Chart` shows `emptyStateText` instead. Set `loading` on `Chart` to show a spinner while data loads.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={emptyData} emptyStateText="No traffic data">
  <Axis position="left" grid />
  <Axis position="right" name="rate" numberFormat=".1%" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" />
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color={{ value: 'categorical-200' }}
      scaleType="point"
    />
  </Combo>
</Chart>
```

## Axes

Bars always place each x value in a band, so the bottom axis shows one label per row. `labelFormat="time"` on that axis formats the timestamps as days, with the month as a sub-label.

By default, both children plot against the left axis. That works when the metrics are in the same units, like sessions and orders. When they aren't, set `metricAxis` on a child and add an `Axis` with a matching `name`, usually on the right. That child then gets its own scale and axis.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={comboTrafficData}>
  <Axis position="left" grid />
  <Axis position="right" name="secondary" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" />
    <Line
      metric="orders"
      metricAxis="secondary"
      color={{ value: 'categorical-200' }}
      scaleType="point"
    />
  </Combo>
</Chart>
```

> **Note:**
> 
> A child with `metricAxis` still counts toward the left axis's range. If the line's values are larger than the bars', the left axis grows to fit them and the bars get shorter.

Leave the left axis unnamed. It shows every child that doesn't set `metricAxis`.

## Bar and Line children

`Combo` accepts any number of `Bar` and `Line` children. Each child keeps its own props, including `metric`, `color`, `type`, `lineType`, `opacity`, and their own `ChartInspect` and `ChartPopover`. Children are named `combo0Bar0`, `combo0Line0`, and so on unless you set `name` on them.

Set `scaleType="point"` on each `Line`. That puts each point in the center of its bar's band. The `Line` default, `time`, spreads points across the full width instead, so they don't line up with the bars.

To show a series per category, set the same `color` field on both children. Bars stack by default; set `type="dodged"` on `Bar` to place them side by side. Lines still pass through the center of each band, not the center of each dodged bar.

```ts
const comboDeviceData = [
  { datetime: 1772452800000, device: 'Desktop', sessions: 2400, conversionRate: 0.034 },
  { datetime: 1772452800000, device: 'Mobile', sessions: 1500, conversionRate: 0.021 },
  { datetime: 1772452800000, device: 'Tablet', sessions: 300, conversionRate: 0.028 },
  { datetime: 1772539200000, device: 'Desktop', sessions: 2550, conversionRate: 0.036 },
  { datetime: 1772539200000, device: 'Mobile', sessions: 1700, conversionRate: 0.022 },
  { datetime: 1772539200000, device: 'Tablet', sessions: 400, conversionRate: 0.027 },
  { datetime: 1772625600000, device: 'Desktop', sessions: 2700, conversionRate: 0.037 },
  { datetime: 1772625600000, device: 'Mobile', sessions: 1900, conversionRate: 0.024 },
  { datetime: 1772625600000, device: 'Tablet', sessions: 500, conversionRate: 0.03 },
  { datetime: 1772712000000, device: 'Desktop', sessions: 2600, conversionRate: 0.033 },
  { datetime: 1772712000000, device: 'Mobile', sessions: 1800, conversionRate: 0.02 },
  { datetime: 1772712000000, device: 'Tablet', sessions: 400, conversionRate: 0.026 },
  { datetime: 1772798400000, device: 'Desktop', sessions: 2900, conversionRate: 0.039 },
  { datetime: 1772798400000, device: 'Mobile', sessions: 2200, conversionRate: 0.026 },
  { datetime: 1772798400000, device: 'Tablet', sessions: 500, conversionRate: 0.031 },
];
```

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={comboDeviceData}>
  <Axis position="left" grid />
  <Axis position="right" name="rate" numberFormat=".1%" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" color="device" type="stacked" />
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color="device"
      scaleType="point"
    />
  </Combo>
  <Legend />
</Chart>
```

Both children use the `categorical-100` color by default. When neither uses a `color` field, give the line a different static color, like `color={{ value: 'categorical-200' }}`, so it stands out from the bars.

## Legend

Add `Legend` as a sibling of `Combo` to list series. Entries come from the `color` field, so a legend appears only when the children use one. Bars and line share an entry when they use the same `color` field.

-   `isToggleable` lets users click an entry to hide or show that series in both the bars and the line.
-   `highlight` highlights the series in both marks while its entry is hovered.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={comboDeviceData}>
  <Axis position="left" grid />
  <Axis position="right" name="rate" numberFormat=".1%" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" color="device" />
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color="device"
      scaleType="point"
    />
  </Combo>
  <Legend position="bottom" isToggleable highlight />
</Chart>
```

### Hiding series

`hiddenSeries` on `Chart` hides series from outside the chart, for example from a filter control. It hides the matching bars and lines.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={comboDeviceData} hiddenSeries={['Desktop']}>
  <Axis position="left" grid />
  <Axis position="right" name="rate" numberFormat=".1%" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" color="device" />
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color="device"
      scaleType="point"
    />
  </Combo>
  <Legend />
</Chart>
```

### Highlighting

`highlightedSeries` on `Chart` highlights a series from outside the chart, for example from a table row. The bars and line for other series fade.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={comboDeviceData} highlightedSeries="Mobile">
  <Axis position="left" grid />
  <Axis position="right" name="rate" numberFormat=".1%" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" color="device" />
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color="device"
      scaleType="point"
    />
  </Combo>
  <Legend />
</Chart>
```

> **Note:**
> 
> When the line has `ChartInspect` or `ChartPopover`, `highlightedSeries` and `Legend` `highlight` only highlight the bars. `highlightedItem` only highlights bars, and only works when both children have `ChartInspect` or `ChartPopover`. Otherwise the chart fails to render.

## Interaction

### ChartInspect and ChartPopover

Add `ChartInspect` to show details on hover and `ChartPopover` to show details on click. Each goes inside the child it describes, so bars and line can show different content. Pass a function as children to render your own content. `rightClick` on `ChartPopover` opens it on right-click instead of click.

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartInspect,
  ChartPopover,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';
import { Content, Heading, Text } from '@react-spectrum/s2';

<Chart data={comboTrafficData}>
  <Axis position="left" title="Sessions" grid />
  <Axis
    position="right"
    name="rate"
    title="Conversion rate"
    numberFormat=".1%"
  />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions">
      <ChartInspect />
      <ChartPopover width="auto">
        {(datum) => (
          <>
            <Heading level={4}>Sessions</Heading>
            <Content>
              <Text>{datum.sessions.toLocaleString()}</Text>
            </Content>
          </>
        )}
      </ChartPopover>
    </Bar>
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color={{ value: 'categorical-200' }}
      scaleType="point"
    >
      <ChartInspect />
      <ChartPopover width="auto">
        {(datum) => (
          <>
            <Heading level={4}>Conversion rate</Heading>
            <Content>
              <Text>{(datum.conversionRate * 100).toFixed(1)}%</Text>
            </Content>
          </>
        )}
      </ChartPopover>
    </Line>
  </Combo>
</Chart>
```

Hovering a bar fades the other bars.

> **Warning:**
> 
> Give both children the same interactivity. If only one child has `ChartInspect` or `ChartPopover`, the chart fails to render.

## Locale

The chart's `locale` formats axis numbers and dates, along with `ChartInspect` and `ChartPopover` content. Use `numberFormat` on each `Axis` to choose the format.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={comboTrafficData} locale="de-DE">
  <Axis position="left" numberFormat="standardNumber" grid />
  <Axis position="right" name="rate" numberFormat=".1%" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo>
    <Bar metric="sessions" />
    <Line
      metric="conversionRate"
      metricAxis="rate"
      color={{ value: 'categorical-200' }}
      scaleType="point"
    />
  </Combo>
</Chart>
```

## Animation

The chart's `animationTypes` and `animations` apply to the bars and lines in a `Combo`. By default they draw in together, finishing at the same time, and bars and lines ease in and out of their faded state on hover. See [Animation](/react-spectrum-charts/s2/docs/docs/guides/animation).

## API

### Combo

`name` prefixes the names of the child marks and signals in the rendered Vega spec. It defaults to `combo0`.

| Prop | Type | Default |
| --- | --- | --- |
| `children` — Bar and Line marks to draw against the shared dimension. | `ComboChild` | – |
| `dimension` — Data field for the x-axis, used by child marks that don't set their own `dimension`. | `string` | `'datetime'` |
| `name` — Prefix for child mark names, like `combo0Bar0`. | `string` | `'combo0'` |

For child props, see [Bar](/react-spectrum-charts/s2/docs/docs/bar#api) and [Line](/react-spectrum-charts/s2/docs/docs/line#api).
