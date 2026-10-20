# Area

**Stage:** Lab

Areas show how a value changes across a continuous dimension, usually time. With one `metric`, each series is stacked on the series below it, so the top edge shows the total. With `metricStart` and `metricEnd`, each series fills the range between two values instead.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={channelSessionsData}>
  <Title text="Sessions by channel" />
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.channel}: {datum.sessions} sessions
        </div>
      )}
    </ChartInspect>
  </Area>
  <Legend title="Channel" position="bottom" />
</Chart>
```

`Area` is a lab component. Import it from the `lab` subpath:

```tsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```

## Data

`data` goes on `Chart` as an array of objects, one per point. On `Area`:

-   `dimension` names the field for the x position (default `datetime`).
-   `metric` names the numeric field for the y position (default `value`).
-   `color` names the field that splits the data into series (default `series`). Each series gets its own color and legend entry.

Most examples on this page use `channelSessionsData`, three channels over eight weeks:

```ts
const channelSessionsData = [
  { datetime: 1736164800000, channel: 'Organic search', sessions: 4200, stackOrder: 3 },
  { datetime: 1736769600000, channel: 'Organic search', sessions: 4350, stackOrder: 3 },
  { datetime: 1737374400000, channel: 'Organic search', sessions: 4480, stackOrder: 3 },
  { datetime: 1737979200000, channel: 'Organic search', sessions: 4400, stackOrder: 3 },
  { datetime: 1738584000000, channel: 'Organic search', sessions: 4620, stackOrder: 3 },
  { datetime: 1739188800000, channel: 'Organic search', sessions: 4810, stackOrder: 3 },
  { datetime: 1739793600000, channel: 'Organic search', sessions: 4760, stackOrder: 3 },
  { datetime: 1740398400000, channel: 'Organic search', sessions: 4950, stackOrder: 3 },
  { datetime: 1736164800000, channel: 'Paid search', sessions: 2600, stackOrder: 2 },
  { datetime: 1736769600000, channel: 'Paid search', sessions: 2750, stackOrder: 2 },
  { datetime: 1737374400000, channel: 'Paid search', sessions: 2900, stackOrder: 2 },
  { datetime: 1737979200000, channel: 'Paid search', sessions: 3400, stackOrder: 2 },
  { datetime: 1738584000000, channel: 'Paid search', sessions: 3650, stackOrder: 2 },
  { datetime: 1739188800000, channel: 'Paid search', sessions: 3300, stackOrder: 2 },
  { datetime: 1739793600000, channel: 'Paid search', sessions: 3100, stackOrder: 2 },
  { datetime: 1740398400000, channel: 'Paid search', sessions: 2950, stackOrder: 2 },
  { datetime: 1736164800000, channel: 'Email', sessions: 1200, stackOrder: 1 },
  { datetime: 1736769600000, channel: 'Email', sessions: 1850, stackOrder: 1 },
  { datetime: 1737374400000, channel: 'Email', sessions: 1150, stackOrder: 1 },
  { datetime: 1737979200000, channel: 'Email', sessions: 1250, stackOrder: 1 },
  { datetime: 1738584000000, channel: 'Email', sessions: 1900, stackOrder: 1 },
  { datetime: 1739188800000, channel: 'Email', sessions: 1180, stackOrder: 1 },
  { datetime: 1739793600000, channel: 'Email', sessions: 1300, stackOrder: 1 },
  { datetime: 1740398400000, channel: 'Email', sessions: 2050, stackOrder: 1 },
];
```

```tsx
<Chart data={channelSessionsData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel" />
  <Legend />
</Chart>
```

The default time scale reads the dimension as a date, so it can be a timestamp or a date string. Every series should have a point at every dimension value. Missing points aren't filled in, so series with different dimension values don't stack cleanly.

### Missing values

A stacked area treats a missing `metric` value as 0 and drops to the baseline. A floating area leaves a gap instead, so missing data isn't mistaken for a value.

```ts
const temperatureGapData = [
  { datetime: 1740830400000, low: 41, high: 52 },
  { datetime: 1740916800000, low: 43, high: 55 },
  { datetime: 1741003200000, low: undefined, high: undefined },
  { datetime: 1741089600000, low: 42, high: 53 },
  { datetime: 1741176000000, low: 40, high: 50 },
  { datetime: 1741262400000, low: undefined, high: undefined },
  { datetime: 1741348800000, low: 42, high: 56 },
  { datetime: 1741435200000, low: 44, high: 58 },
];
```

```jsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={temperatureGapData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline />
  <Area metric="high" />
</Chart>
```

### Empty and loading

When `data` is an empty array, `Chart` shows `emptyStateText` instead. Set `loading` on `Chart` to show a spinner while data loads.

```jsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={emptyData} emptyStateText="No sessions in this range">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline />
  <Area metric="sessions" color="channel" />
</Chart>
```

## Stacking

With `metric`, series stack in data order: the first series sits on the baseline and each following series sits on top of the one before. The y axis always starts at 0. Negative values stack downward from 0, separately from positive values.

### order

To stack in a different order, set `order` to a numeric field. Series with higher values stack on top. In `channelSessionsData`, `stackOrder` puts Organic search on top and Email on the baseline.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={channelSessionsData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel" order="stackOrder" />
  <Legend />
</Chart>
```

### opacity

`opacity` sets the fill opacity, from 0 to 1. The default is `0.8`. Stacked series don't overlap, so lower opacity only lightens them; it matters most for floating areas.

## Floating areas

Set `metricStart` and `metricEnd` instead of `metric` to fill between two fields, such as a daily low and high. Each series starts at its own `metricStart` value, so floating areas don't stack and can overlap. Use a lower `opacity` so overlapping series stay visible.

```ts
const temperatureData = [
  { datetime: 1740830400000, city: 'Seattle', low: 41, high: 52 },
  { datetime: 1740916800000, city: 'Seattle', low: 43, high: 55 },
  { datetime: 1741003200000, city: 'Seattle', low: 44, high: 57 },
  { datetime: 1741089600000, city: 'Seattle', low: 42, high: 53 },
  { datetime: 1741176000000, city: 'Seattle', low: 40, high: 50 },
  { datetime: 1741262400000, city: 'Seattle', low: 39, high: 51 },
  { datetime: 1741348800000, city: 'Seattle', low: 42, high: 56 },
  { datetime: 1740830400000, city: 'Denver', low: 28, high: 54 },
  { datetime: 1740916800000, city: 'Denver', low: 31, high: 60 },
  { datetime: 1741003200000, city: 'Denver', low: 35, high: 64 },
  { datetime: 1741089600000, city: 'Denver', low: 30, high: 49 },
  { datetime: 1741176000000, city: 'Denver', low: 24, high: 41 },
  { datetime: 1741262400000, city: 'Denver', low: 27, high: 52 },
  { datetime: 1741348800000, city: 'Denver', low: 33, high: 61 },
];
```

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={temperatureData}>
  <Axis position="left" grid title="Temperature (°F)" />
  <Axis position="bottom" labelFormat="time" baseline />
  <Area metricStart="low" metricEnd="high" color="city" opacity={0.5}>
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.city}: {datum.low}° to {datum.high}°
        </div>
      )}
    </ChartInspect>
  </Area>
  <Legend />
</Chart>
```

`metricStart` and `metricEnd` must be set together. If only one is set, `Area` logs an error and falls back to `metric`.

### With a line

A floating area behind a [`Line`](/react-spectrum-charts/s2/docs/docs/line) shows a range around a value, like a forecast with its confidence band. Put `Area` before `Line` so the line draws on top.

```ts
const forecastData = [
  { datetime: 1736164800000, visits: 8000, low: 7040, high: 8960 },
  { datetime: 1736769600000, visits: 8950, low: 7880, high: 10020 },
  { datetime: 1737374400000, visits: 8530, low: 7510, high: 9550 },
  { datetime: 1737979200000, visits: 9050, low: 7960, high: 10140 },
  { datetime: 1738584000000, visits: 10170, low: 8950, high: 11390 },
  { datetime: 1739188800000, visits: 9290, low: 8180, high: 10400 },
  { datetime: 1739793600000, visits: 9160, low: 8060, high: 10260 },
  { datetime: 1740398400000, visits: 9950, low: 8760, high: 11140 },
  { datetime: 1741003200000, visits: 9420, low: 8290, high: 10550 },
  { datetime: 1741608000000, visits: 9630, low: 8470, high: 10790 },
];
```

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={forecastData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metricStart="low" metricEnd="high" opacity={0.3} />
  <Line metric="visits" />
</Chart>
```

## Scale types

`scaleType` sets how `dimension` values map to the x axis:

-   `time` (default): dates and timestamps, spaced by time. Use `labelFormat="time"` on the bottom `Axis`.
-   `linear`: numbers, spaced by value.
-   `point`: categories, spaced evenly in data order.

```ts
const installsData = [
  { day: 1, platform: 'iOS', installs: 1200 },
  { day: 2, platform: 'iOS', installs: 1850 },
  { day: 3, platform: 'iOS', installs: 2300 },
  { day: 7, platform: 'iOS', installs: 3100 },
  { day: 14, platform: 'iOS', installs: 3900 },
  { day: 30, platform: 'iOS', installs: 4600 },
  { day: 1, platform: 'Android', installs: 900 },
  { day: 2, platform: 'Android', installs: 1500 },
  { day: 3, platform: 'Android', installs: 2100 },
  { day: 7, platform: 'Android', installs: 2900 },
  { day: 14, platform: 'Android', installs: 3500 },
  { day: 30, platform: 'Android', installs: 4300 },
];
```

```ts
const weekdayVisitsData = [
  { day: 'Mon', device: 'Desktop', visits: 5200 },
  { day: 'Tue', device: 'Desktop', visits: 5600 },
  { day: 'Wed', device: 'Desktop', visits: 5400 },
  { day: 'Thu', device: 'Desktop', visits: 5800 },
  { day: 'Fri', device: 'Desktop', visits: 5100 },
  { day: 'Sat', device: 'Desktop', visits: 2300 },
  { day: 'Sun', device: 'Desktop', visits: 2100 },
  { day: 'Mon', device: 'Mobile', visits: 3100 },
  { day: 'Tue', device: 'Mobile', visits: 3300 },
  { day: 'Wed', device: 'Mobile', visits: 3200 },
  { day: 'Thu', device: 'Mobile', visits: 3500 },
  { day: 'Fri', device: 'Mobile', visits: 3900 },
  { day: 'Sat', device: 'Mobile', visits: 4800 },
  { day: 'Sun', device: 'Mobile', visits: 4600 },
];
```

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={channelSessionsData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel" />
  <Legend />
</Chart>
```

> **Note:**
> 
> `scaleType="band"` isn't supported for areas yet and draws a broken chart. Use `point` for categories.

### padding

`padding` adds space between the plot edges and the first and last points. Its unit depends on `scaleType`:

-   `point`: a ratio of the step between points, from 0 to 1. The default is `0.5`.
-   `time` and `linear`: pixels. The default is `0`, so the area touches both edges.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={weekdayVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Area dimension="day" metric="visits" color="device" scaleType="point" />
  <Legend />
</Chart>
```

## Axis

Add an `Axis` for each edge that needs labels. Use `labelFormat="time"` and `granularity` on the bottom axis for time data; `granularity` sets the tick interval and label format. On the left axis, `numberFormat` formats values and `grid` adds horizontal grid lines. Add a `ReferenceLine` as a child of `Axis` to mark a value, like a goal.

Axis labels follow the chart's `locale`.

```jsx
import {
  Axis,
  Chart,
  ReferenceLine,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={channelSessionsData}>
  <Axis position="left" grid title="Sessions">
    <ReferenceLine value={9000} label="Goal" />
  </Axis>
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel" />
</Chart>
```

## Legend

Add `Legend` as a sibling of `Area` to list the series.

-   `isToggleable` lets users click an entry to hide or show its series. The remaining series restack to close the gap.
-   `highlight` highlights a series while its entry is hovered.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={channelSessionsData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel" />
  <Legend title="Channel" position="bottom" isToggleable highlight />
</Chart>
```

### Hiding series

`hiddenSeries` on `Chart` hides series from outside the chart, for example from a filter control. The remaining series restack from the baseline. To start with series hidden but let users toggle them, set `defaultHiddenSeries` on a toggleable `Legend` instead.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={channelSessionsData} hiddenSeries={['Organic search']}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel" />
  <Legend />
</Chart>
```

## Interaction

### ChartInspect and ChartPopover

Add `ChartInspect` as a child of `Area` to show details on hover and `ChartPopover` to show details on click. Both take a function as children that receives the hovered point and returns the content. Without children, they highlight the area but show no content.

Hovering follows the nearest dimension value: it adds a point on the top edge of the hovered series, draws a vertical rule, and fades the other series. `highlightBy` on `ChartInspect` changes what stays highlighted:

-   `item` (default): the hovered point, with a rule.
-   `series`: the whole hovered series, without a rule.
-   `dimension`: a point on every series at the hovered x value, with a rule.
-   A list of data keys: every series that matches the hovered point on those keys.

Clicking a series with `ChartPopover` outlines it and fades the others. `rightClick` opens the popover on right-click instead.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  ChartPopover,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';
import { Content, Heading, Text } from '@react-spectrum/s2';

<Chart data={channelSessionsData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.channel}: {datum.sessions} sessions
        </div>
      )}
    </ChartInspect>
    <ChartPopover width="auto">
      {(datum) => (
        <>
          <Heading level={4}>{datum.channel}</Heading>
          <Content>
            <Text>{datum.sessions.toLocaleString()} sessions</Text>
          </Content>
        </>
      )}
    </ChartPopover>
  </Area>
  <Legend />
</Chart>
```

`excludeDataKeys` on `ChartInspect` turns off hover details for rows with a truthy value in any of the listed fields. See [Interaction](/react-spectrum-charts/s2/docs/docs/interaction) for more about `ChartInspect` and `ChartPopover`.

### Highlighting

`highlightedSeries` on `Chart` highlights a series from outside the chart, for example from a table row, by fading the others. `Legend` with `highlight` does the same when its entry is hovered.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={channelSessionsData} highlightedSeries="Paid search">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="sessions" color="channel">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.channel}: {datum.sessions} sessions
        </div>
      )}
    </ChartInspect>
  </Area>
  <Legend highlight />
</Chart>
```

`highlightedItem` highlights a single point by row ID. Set `idKey` on `Chart` to the field that uniquely identifies each row. Hovering the chart replaces the controlled highlight.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={forecastData} idKey="datetime" highlightedItem={1739188800000}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" granularity="week" baseline />
  <Area metric="visits">
    <ChartInspect />
  </Area>
</Chart>
```

## Animation

Areas don't animate yet. `animationTypes` and `animations` on `Chart` have no effect on `Area`.

## API

### Area

`name` identifies the area's marks and signals in the rendered Vega spec. It defaults to `area0`, `area1`, and so on.

| Prop | Type | Default |
| --- | --- | --- |
| `children` — `ChartInspect` and `ChartPopover` children that add hover and click details. | `AreaChild` | – |
| `color` — Data field that splits the data into series, each with its own color. | `string` | `'series'` |
| `dimension` — Data field plotted along the x-axis. | `string` | `'datetime'` |
| `metric` — Data field for each series' value; series stack from zero. | `string` | `'value'` |
| `metricEnd` — Data field for the top edge of a floating area; requires `metricStart` and replaces `metric`. | `string` | – |
| `metricStart` — Data field for the bottom edge of a floating area; requires `metricEnd` and replaces `metric`. | `string` | – |
| `name` — Name used for the area's marks and signals in the Vega spec. Defaults to `area0`, `area1`, and so on. | `string` | – |
| `opacity` — Fill opacity of the areas, from 0 to 1. | `number` | `0.8` |
| `order` — Data field that sets the stack order; higher values stack on top. Defaults to data order. | `string` | – |
| `padding` — Space before the first and after the last x value: a ratio from 0 to 1 for `point` scales (default `0.5`), pixels for `time` and `linear` (default `0`). | `number` | – |
| `scaleType` — Scale for `dimension`: `time`, `linear`, or `point`. | `"linear" \| "time" \| "point" \| "band"` | `'time'` |
