# Line

**Stage:** Alpha

Line charts show how values change over time. Each series becomes a line through its data points, plotted by `dimension` on the x-axis and `metric` on the y-axis.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Title text="Visits by channel" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series">
    <ChartInspect />
  </Line>
  <Legend position="bottom" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `interpolate` on `Line`: `linear`, `monotone` or `step`. Shown: `linear`.
-   `LineDirectLabel`: included or left out. Shown: left out.
-   `position` on `Legend`: `none`, `bottom`, `right`, `top` or `left`. Shown: `bottom`.
-   `text` on `Title`: any text. Shown: `Visits by channel`.

## Data

`data` goes on `Chart` as an array of objects, one per point. On `Line`, `dimension` names the x-axis field (default `datetime`), `metric` names the y-axis field (default `value`), and `color` names the field that splits the rows into series. Without `color`, every row belongs to one line. Time values are milliseconds since the epoch. Most examples on this page use `lineTrafficData`:

```ts
const lineTrafficData = [
  { datetime: 1772409600000, series: 'Organic search', value: 4210 },
  { datetime: 1772496000000, series: 'Organic search', value: 4580 },
  { datetime: 1772582400000, series: 'Organic search', value: 4390 },
  { datetime: 1772668800000, series: 'Organic search', value: 4820 },
  { datetime: 1772755200000, series: 'Organic search', value: 5160 },
  { datetime: 1772841600000, series: 'Organic search', value: 4970 },
  { datetime: 1772928000000, series: 'Organic search', value: 5340 },
  { datetime: 1773014400000, series: 'Organic search', value: 5610 },
  { datetime: 1773100800000, series: 'Organic search', value: 5480 },
  { datetime: 1773187200000, series: 'Organic search', value: 5890 },
  { datetime: 1772409600000, series: 'Paid search', value: 2840 },
  { datetime: 1772496000000, series: 'Paid search', value: 3120 },
  { datetime: 1772582400000, series: 'Paid search', value: 3460 },
  { datetime: 1772668800000, series: 'Paid search', value: 3210 },
  { datetime: 1772755200000, series: 'Paid search', value: 3580 },
  { datetime: 1772841600000, series: 'Paid search', value: 3920 },
  { datetime: 1772928000000, series: 'Paid search', value: 3740 },
  { datetime: 1773014400000, series: 'Paid search', value: 3410 },
  { datetime: 1773100800000, series: 'Paid search', value: 3650 },
  { datetime: 1773187200000, series: 'Paid search', value: 3880 },
  { datetime: 1772409600000, series: 'Email', value: 1620 },
  { datetime: 1772496000000, series: 'Email', value: 1480 },
  { datetime: 1772582400000, series: 'Email', value: 2390 },
  { datetime: 1772668800000, series: 'Email', value: 1710 },
  { datetime: 1772755200000, series: 'Email', value: 1560 },
  { datetime: 1772841600000, series: 'Email', value: 1830 },
  { datetime: 1772928000000, series: 'Email', value: 2610 },
  { datetime: 1773014400000, series: 'Email', value: 1790 },
  { datetime: 1773100800000, series: 'Email', value: 1680 },
  { datetime: 1773187200000, series: 'Email', value: 1940 },
];
```

```tsx
<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" />
</Chart>
```

### Empty and loading

When `data` is an empty array, `Chart` shows `emptyStateText` instead of the plot. Set `loading` on `Chart` to show a spinner while data loads.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={emptyData} emptyStateText="No visits yet">
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **state**: `empty` or `loading`. Shown: `empty`.
-   `emptyStateText` on `Chart`: any text. Shown: `No visits yet`.

With **state** set to `loading`:

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData} loading>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" />
</Chart>
```

## Lines

### Series

`color`, `lineType`, and `opacity` each take either a data field or a fixed value such as `{ value: 'dashed' }`. A field gives each series its own color, dash pattern, or opacity from the chart's `colors`, `lineTypes`, and `opacities` lists. `color` defaults to a single categorical color and `lineType` to solid.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `lineType` on `Line`: `none` or `series`. Shown: `none`.
-   `opacity` on `Line`: `none` or `series`. Shown: `none`.

### interpolate

`interpolate` sets the curve between points. The default, `linear`, draws straight segments.

-   `monotone` draws a smooth curve that never overshoots the data.
-   `basis`, `cardinal`, `catmull-rom`, and `natural` draw other kinds of splines. `basis` doesn't pass through the data, so it draws no points.
-   `step`, `step-before`, and `step-after` draw horizontal and vertical steps, with the vertical step centered between points, at the start of each interval, or at the end.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineMilestoneData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line interpolate="monotone" staticPoint="isMilestone" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `interpolate` on `Line`: `linear`, `monotone`, `basis`, `cardinal`, `catmull-rom`, `natural`, `step`, `step-before` or `step-after`. Shown: `monotone`.

### gradient

`gradient` fills the area under the line with its color, fading to transparent at the bottom. The gradient only draws when the chart has a single line. `opacity` fades the line and its gradient together.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineVisitsData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line gradient />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `gradient` on `Line`: `true` or `false`. Shown: `true`.
-   `opacity` on `Line`: 0.2 to 1, in steps of 0.1. Shown: `1`.

### Size

Stroke width, point size, and hover rings scale with the chart's width: a chart under 400px wide uses the small size, one under 800px the medium size, and anything wider the large size. Use `width`, `height`, `minWidth`, and `maxWidth` on `Chart` to constrain it. Drag the width below 400 to see the small size.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineMilestoneData} width={480} height={300}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line staticPoint="isMilestone" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `width` on `Chart`: 240 to 500, in steps of 20. Shown: `480`.

## Points

### staticPoint

Points are hidden until hovered. `staticPoint` names a boolean field; rows where it's exactly `true` always show a point. Points scale with the chart; set `pointSize` to fix their area in square pixels.

```ts
const lineMilestoneData = [
  { datetime: 1772409600000, value: 4210 },
  { datetime: 1772496000000, value: 4580 },
  { datetime: 1772582400000, value: 4390 },
  { datetime: 1772668800000, value: 4820, isMilestone: true, annotation: 'Launch' },
  { datetime: 1772755200000, value: 5160 },
  { datetime: 1772841600000, value: 4970 },
  { datetime: 1772928000000, value: 5340 },
  { datetime: 1773014400000, value: 5960, isMilestone: true, annotation: 'Record high' },
  { datetime: 1773100800000, value: 5480 },
  { datetime: 1773187200000, value: 5710 },
];
```

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineMilestoneData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line staticPoint="isMilestone" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `staticPoint` on `Line`: `none` or `isMilestone`. Shown: `isMilestone`.
-   `pointSize` on `Line`: `auto`, `36`, `100` or `196`. Shown: `auto`.

### Sparklines

`isSparkline` with `isMethodLast` draws a point on the last row of the data. The sparkline shown has no axes and is 200 × 60px.

```jsx
import { Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineVisitsData}>
  <Line isSparkline isMethodLast gradient />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `isMethodLast` on `Line`: `true` or `false`. Shown: `true`.
-   `gradient` on `Line`: `true` or `false`. Shown: `true`.

## Segments

### Alternate segments

`alternateSegmentKey` names a boolean field. Rows where it's truthy draw in `alternateSegmentLineType` (default `dotted`), for example to mark estimated or incomplete values.

```ts
const lineEstimatedData = [
  { datetime: 1772409600000, series: 'Organic search', value: 4210, isEstimated: false },
  { datetime: 1772496000000, series: 'Organic search', value: 4580, isEstimated: false },
  { datetime: 1772582400000, series: 'Organic search', value: 4390, isEstimated: false },
  { datetime: 1772668800000, series: 'Organic search', value: 4820, isEstimated: false },
  { datetime: 1772755200000, series: 'Organic search', value: 5160, isEstimated: false },
  { datetime: 1772841600000, series: 'Organic search', value: 4970, isEstimated: false },
  { datetime: 1772928000000, series: 'Organic search', value: 5340, isEstimated: false },
  { datetime: 1773014400000, series: 'Organic search', value: 5610, isEstimated: true },
  { datetime: 1773100800000, series: 'Organic search', value: 5480, isEstimated: true },
  { datetime: 1773187200000, series: 'Organic search', value: 5890, isEstimated: true },
  { datetime: 1772409600000, series: 'Paid search', value: 2840, isEstimated: false },
  { datetime: 1772496000000, series: 'Paid search', value: 3120, isEstimated: false },
  { datetime: 1772582400000, series: 'Paid search', value: 3460, isEstimated: false },
  { datetime: 1772668800000, series: 'Paid search', value: 3210, isEstimated: false },
  { datetime: 1772755200000, series: 'Paid search', value: 3580, isEstimated: false },
  { datetime: 1772841600000, series: 'Paid search', value: 3920, isEstimated: false },
  { datetime: 1772928000000, series: 'Paid search', value: 3740, isEstimated: false },
  { datetime: 1773014400000, series: 'Paid search', value: 3410, isEstimated: true },
  { datetime: 1773100800000, series: 'Paid search', value: 3650, isEstimated: true },
  { datetime: 1773187200000, series: 'Paid search', value: 3880, isEstimated: true },
];
```

```jsx
import {
  Axis,
  Chart,
  ChartPopover,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Content, Heading, Text } from '@react-spectrum/s2';

<Chart data={lineEstimatedData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" alternateSegmentKey="isEstimated">
    <ChartPopover width="auto">
      {(datum) => (
        <Content>
          <Heading level={4} UNSAFE_style={{ margin: 0 }}>
            {datum.series}
          </Heading>
          <Text>{datum.value.toLocaleString()} visits</Text>
        </Content>
      )}
    </ChartPopover>
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `alternateSegmentKey` on `Line`: `none` or `isEstimated`. Shown: `isEstimated`.
-   `alternateSegmentLineType` on `Line`: `dotted`, `dashed` or `shortDash`. Shown: `dotted`.

### primarySeries

`primarySeries` keeps some series in color and draws the rest in gray. Pass a number N to keep the first N series in color order (`2` keeps the first two), or a list of series names. `otherSeriesColor` changes the gray (default `gray-400`) to another Spectrum 2 color token. Gray series don't get `LineDirectLabel` labels.

```jsx
import {
  Axis,
  Chart,
  Line,
  LineDirectLabel,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" primarySeries={1}>
    <LineDirectLabel value="series" />
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `primarySeries` on `Line`: `none`, `1`, `2` or `Email`. Shown: `1`.
-   `otherSeriesColor` on `Line`: `gray-400`, `gray-300` or `gray-600`. Shown: `gray-400`.

> **Note:**
> 
> Don't combine `alternateSegmentKey` with `LineForecast`. The line then ignores the forecast's `metric` field and dashes only the rows flagged by `alternateSegmentKey`, though the forecast's boundary rule and label still draw. `primarySeries` works with either one.

## Scales

### scaleType

`scaleType` sets the x scale. `time` (the default) is for timestamps, and `linear` for other numeric values such as minutes. Both keep the gaps between values to scale. `point` spaces ordered categories such as weekdays evenly; use it only when the x values aren't times or numbers.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" baseline ticks labelFormat="time" />
  <Axis position="left" grid />
  <Line color="series" dimension="datetime" scaleType="time" />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `scaleType` on `Line`: `time`, `linear` or `point`. Shown: `time`.

### padding

`padding` adds space between the plot edges and the first and last points. Its unit depends on `scaleType`:

-   `time` and `linear`: pixels. The default is `0`, so the line touches both edges.
-   `point`: a ratio of the step between points, from 0 to 1. The default is `0.5`.

This example uses a time scale.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" baseline ticks labelFormat="time" />
  <Axis position="left" grid />
  <Line color="series" dimension="datetime" scaleType="time" padding={24} />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `padding` on `Line`: 0 to 48, in steps of 4. Shown: `24`.

### dualMetricAxis

`dualMetricAxis` compares the trends of two series whose values are far apart. On a shared y-axis, the smaller series, here purchases, is flattened near zero. `dualMetricAxis` plots the last series against its own y-scale, shown by an `Axis` with `position="right"`, so you can see purchases fall while visits rise. Turn it off to see the shared scale, where the right axis isn't needed.

The right axis labels take the color of the last series. When there are only two series, the left axis labels take the color of the first.

```ts
const lineDualAxisData = [
  { datetime: 1772409600000, series: 'Visits', value: 4210 },
  { datetime: 1772496000000, series: 'Visits', value: 4580 },
  { datetime: 1772582400000, series: 'Visits', value: 4390 },
  { datetime: 1772668800000, series: 'Visits', value: 4820 },
  { datetime: 1772755200000, series: 'Visits', value: 5160 },
  { datetime: 1772841600000, series: 'Visits', value: 4970 },
  { datetime: 1772928000000, series: 'Visits', value: 5340 },
  { datetime: 1773014400000, series: 'Visits', value: 5610 },
  { datetime: 1773100800000, series: 'Visits', value: 5480 },
  { datetime: 1773187200000, series: 'Visits', value: 5890 },
  { datetime: 1772409600000, series: 'Purchases', value: 142 },
  { datetime: 1772496000000, series: 'Purchases', value: 138 },
  { datetime: 1772582400000, series: 'Purchases', value: 131 },
  { datetime: 1772668800000, series: 'Purchases', value: 127 },
  { datetime: 1772755200000, series: 'Purchases', value: 119 },
  { datetime: 1772841600000, series: 'Purchases', value: 114 },
  { datetime: 1772928000000, series: 'Purchases', value: 106 },
  { datetime: 1773014400000, series: 'Purchases', value: 101 },
  { datetime: 1773100800000, series: 'Purchases', value: 94 },
  { datetime: 1773187200000, series: 'Purchases', value: 88 },
];
```

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineDualAxisData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Axis position="right" />
  <Line color="series" dualMetricAxis>
    <ChartInspect />
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `dualMetricAxis` on `Line`: `true` or `false`. Shown: `true`.

## Hover

Lines respond to the pointer when they have `ChartInspect`, `ChartPopover`, `ChartActionBar`, `onClick`, or `onContextMenu`. Hovering fades the other series, rings the hovered point, and shows its value next to it.

-   `interactionMode="nearest"` (the default) picks the point closest to the pointer anywhere in the plot. `item` picks a point only when the pointer is over it.
-   `dimensionHover` highlights every series at the hovered x value and labels each of them.
-   `showHoverLabel={false}` hides the value label. `ChartInspect` always hides it, since the inspect dialog shows the value. Set `hoverLabelKey` to show another field, such as a pre-formatted string.

```jsx
import {
  Axis,
  Chart,
  ChartPopover,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Content, Heading, Text } from '@react-spectrum/s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series">
    <ChartPopover width="auto">
      {(datum) => (
        <Content>
          <Heading level={4} UNSAFE_style={{ margin: 0 }}>
            {datum.series}
          </Heading>
          <Text>{datum.value.toLocaleString()} visits</Text>
        </Content>
      )}
    </ChartPopover>
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `interactionMode` on `Line`: `nearest` or `item`. Shown: `nearest`.
-   `dimensionHover` on `Line`: `true` or `false`. Shown: `false`.
-   `showHoverLabel` on `Line`: `true` or `false`. Shown: `true`.

## Metric ranges

`metricRanges` shades a band between two fields, such as the confidence interval of a forecast. Each object needs `metricStart` and `metricEnd`, and draws its own dashed line through `metric` (default `value`). This example pairs a range with [`LineForecast`](#lineforecast): the range's `metric` is the forecast field, and the band starts at the last actual value, where `low` and `high` equal `value`.

-   `rangeOpacity` sets the band's opacity (default `0.2`).
-   `lineType` and `lineWidth` style the range's line (default `dashed` and `S`).
-   `displayOnHover` shows the range only while its series is hovered.
-   `scaleAxisToFit` stretches the y-axis to include the whole band.

```ts
const lineRangeData = [
  { datetime: 1772409600000, value: 4210, forecast: 4210 },
  { datetime: 1772496000000, value: 4580, forecast: 4580 },
  { datetime: 1772582400000, value: 4390, forecast: 4390 },
  { datetime: 1772668800000, value: 4820, forecast: 4820 },
  { datetime: 1772755200000, value: 5160, forecast: 5160 },
  { datetime: 1772841600000, value: 4970, forecast: 4970 },
  { datetime: 1772928000000, value: 5340, forecast: 5340 },
  { datetime: 1773014400000, value: 5610, forecast: 5610 },
  { datetime: 1773100800000, value: 5480, forecast: 5480 },
  { datetime: 1773187200000, value: 5890, forecast: 5890, low: 5890, high: 5890 },
  { datetime: 1773273600000, value: null, forecast: 6020, low: 5780, high: 6260 },
  { datetime: 1773360000000, value: null, forecast: 6150, low: 5760, high: 6540 },
  { datetime: 1773446400000, value: null, forecast: 6240, low: 5700, high: 6780 },
  { datetime: 1773532800000, value: null, forecast: 6380, low: 5660, high: 7100 },
];
```

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Line,
  LineForecast,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineRangeData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line
    metricRanges={[{ metric: 'forecast', metricStart: 'low', metricEnd: 'high', scaleAxisToFit: true }]}
  >
    <LineForecast metric="forecast" start={1773187200000} />
    <ChartInspect />
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **rangeOpacity** (metricRanges): 0 to 1, in steps of 0.1. Shown: `0.2`.
-   **lineType** (metricRanges): `dashed`, `solid` or `dotted`. Shown: `dashed`.
-   **displayOnHover** (metricRanges): `true` or `false`. Shown: `false`.
-   **scaleAxisToFit** (metricRanges): `true` or `false`. Shown: `true`.

With **lineType** set to `solid`:

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Line,
  LineForecast,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineRangeData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line
    metricRanges={[{ metric: 'forecast', metricStart: 'low', metricEnd: 'high', lineType: 'solid', scaleAxisToFit: true }]}
  >
    <LineForecast metric="forecast" start={1773187200000} />
    <ChartInspect />
  </Line>
</Chart>
```

With **lineType** set to `dotted`:

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Line,
  LineForecast,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineRangeData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line
    metricRanges={[{ metric: 'forecast', metricStart: 'low', metricEnd: 'high', lineType: 'dotted', scaleAxisToFit: true }]}
  >
    <LineForecast metric="forecast" start={1773187200000} />
    <ChartInspect />
  </Line>
</Chart>
```

With **displayOnHover** set to `true`:

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Line,
  LineForecast,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineRangeData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line
    metricRanges={[{ metric: 'forecast', metricStart: 'low', metricEnd: 'high', displayOnHover: true, scaleAxisToFit: true }]}
  >
    <LineForecast metric="forecast" start={1773187200000} />
    <ChartInspect />
  </Line>
</Chart>
```

With **scaleAxisToFit** set to `false`:

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Line,
  LineForecast,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineRangeData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line
    metricRanges={[{ metric: 'forecast', metricStart: 'low', metricEnd: 'high', scaleAxisToFit: false }]}
  >
    <LineForecast metric="forecast" start={1773187200000} />
    <ChartInspect />
  </Line>
</Chart>
```

> **Note:**
> 
> A metric range's `metric` defaults to `value`, not to the parent line's `metric`. Set it when your line uses another field.

## LineDirectLabel

`LineDirectLabel` labels each line at the right edge of the plot, which can replace a legend. Labels are colored like their series and spread apart when they would overlap.

-   `value` chooses the text: the `last` value (the default), the `average`, or the `series` name.
-   `position="start"` moves labels to the left edge and labels the first value instead.
-   `format` is a [d3-format](https://d3js.org/d3-format) specifier for numeric values (default `,.2~f`). `prefix` adds text before the value.
-   `excludeSeries` skips the listed series.

```jsx
import {
  Axis,
  Chart,
  Line,
  LineDirectLabel,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series">
    <LineDirectLabel />
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `value` on `LineDirectLabel`: `last`, `average` or `series`. Shown: `last`.
-   `position` on `LineDirectLabel`: `end` or `start`. Shown: `end`.
-   `format` on `LineDirectLabel`: `,.2~f`, `,.1f` or `.2s`. Shown: `,.2~f`.
-   `prefix` on `LineDirectLabel`: any text. Shown: empty.
-   `excludeSeries` on `LineDirectLabel`: `none` or `Email`. Shown: `none`.

## LineForecast

`LineForecast` continues a line with forecast values. Put the forecast in its own field, `metric`, and leave the line's `metric` empty for those rows. `start` is the x value (a timestamp on a time scale) where the forecast begins. From there on the line uses `alternateSegmentLineType` (default `dotted`), and a vertical rule marks the boundary with `label` (default `Forecast`).

```ts
const lineForecastData = [
  { datetime: 1772409600000, value: 4210 },
  { datetime: 1772496000000, value: 4580 },
  { datetime: 1772582400000, value: 4390 },
  { datetime: 1772668800000, value: 4820 },
  { datetime: 1772755200000, value: 5160 },
  { datetime: 1772841600000, value: 4970 },
  { datetime: 1772928000000, value: 5340 },
  { datetime: 1773014400000, value: 5610 },
  { datetime: 1773100800000, value: 5480 },
  { datetime: 1773187200000, value: 5890 },
  { datetime: 1773273600000, value: null, forecast: 6020 },
  { datetime: 1773360000000, value: null, forecast: 6150 },
  { datetime: 1773446400000, value: null, forecast: 6240 },
];
```

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Line,
  LineForecast,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineForecastData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line>
    <LineForecast metric="forecast" start={1773187200000} />
    <ChartInspect />
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `start` on `LineForecast`: `Mar 9`, `Mar 10`, `Mar 11` or `Mar 12`. Shown: `Mar 11`.
-   `label` on `LineForecast`: any text. Shown: `Forecast`.

## Axes

Line charts usually have a bottom `Axis` with `labelFormat="time"` and a left `Axis` with `grid`. Time labels follow the axis `granularity`, and number labels follow `numberFormat` (default `shortNumber`). Both use the chart's `locale`, which also applies to `ChartInspect`.

Add `ReferenceLine` inside the left `Axis` to mark a value, such as a target. See [Axis](/react-spectrum-charts/s2/docs/docs/axis) for every axis and reference line option.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Line,
  ReferenceLine,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid>
    <ReferenceLine value={5000} label="Target" />
  </Axis>
  <Line color="series">
    <ChartInspect />
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `title` on `Axis`: `true` or `false`. Shown: `false`.
-   `granularity` on `Axis`: `day` or `week`. Shown: `day`.
-   `numberFormat` on `Axis`: `shortNumber` or `standardNumber`. Shown: `shortNumber`.
-   `ReferenceLine`: included or left out. Shown: included.
-   `locale` on `Chart`: `en-US`, `de-DE` or `fr-FR`. Shown: `en-US`.

## Legend

Add `Legend` as a sibling of `Line` to list the series.

-   `isToggleable` lets users click an entry to hide or show its series.
-   `highlight` highlights a series while its entry is hovered.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" />
  <Legend title="Channel" isToggleable highlight />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `position` on `Legend`: `bottom`, `right`, `top` or `left`. Shown: `bottom`.
-   `isToggleable` on `Legend`: `true` or `false`. Shown: `true`.
-   `highlight` on `Legend`: `true` or `false`. Shown: `true`.

### Hiding series

`hiddenSeries` on `Chart` hides series from outside the chart, for example from a filter control. To start with series hidden but let users toggle them, set `defaultHiddenSeries` on a toggleable `Legend` instead.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData} hiddenSeries={['Email']}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `hiddenSeries` on `Chart`: `none`, `Email` or `Paid search, Email`. Shown: `Email`.

## Interaction

### ChartInspect and ChartPopover

Add `ChartInspect` to show details on hover and `ChartPopover` to show details on click. Pass a function as children to render your own content.

-   `highlightBy` on `ChartInspect` sets what stays in color while inspecting: the hovered `item` (the default), its whole `series`, or every point at the same x value (`dimension`).
-   `rightClick` on `ChartPopover` opens it on right-click instead of click.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  ChartPopover,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Content, Heading, Text } from '@react-spectrum/s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series">
    <ChartInspect />
    <ChartPopover width="auto">
      {(datum) => (
        <Content>
          <Heading level={4} UNSAFE_style={{ margin: 0 }}>
            {datum.series}
          </Heading>
          <Text>{datum.value.toLocaleString()} visits</Text>
        </Content>
      )}
    </ChartPopover>
  </Line>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `ChartInspect`: included or left out. Shown: included.
-   `highlightBy` on `ChartInspect`: `item`, `series` or `dimension`. Shown: `item`.
-   `children` on `ChartInspect`: `default` or `custom`. Shown: `default`.
-   `ChartPopover`: included or left out. Shown: included.
-   `rightClick` on `ChartPopover`: `true` or `false`. Shown: `false`.

`onClick` and `onContextMenu` on `Line` run a callback with the clicked point's data. `ChartActionBar` shows actions for a selected point; see [ChartActionBar](/react-spectrum-charts/s2/docs/docs/chart-action-bar). See [Interaction](/react-spectrum-charts/s2/docs/docs/interaction) for every `ChartInspect` and `ChartPopover` option.

### Highlighting

`highlightedSeries` on `Chart` highlights a series from outside the chart, for example from a table row. `highlightedItem` highlights points by row ID and can take a list; set `idKey` on `Chart` to the field it matches. In this example `idKey` is `datetime`, so one date highlights a point on every series.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series">
    <ChartInspect />
  </Line>
  <Legend highlight />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `highlightedSeries` on `Chart`: `none`, `Organic search`, `Paid search` or `Email`. Shown: `none`.
-   `highlightedItem` on `Chart`: `none` or `Mar 8`. Shown: `none`.

## Animation

The chart's `animationTypes` lists which animations play. By default, `hover` eases the other lines in and out of their faded state when you hover a line, and `drawIn` sweeps the lines in from left to right over 850ms when the chart mounts; static points appear as the sweep passes them. Draw-in works on time, linear, and point scales.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series">
    <ChartInspect />
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `animationTypes` on `Chart`: `true` or `false`. Shown: `true`.
-   `animationTypes` on `Chart`: `true` or `false`. Shown: `true`.

Set `animationTypes={['hover']}` to turn off draw-in only, or `animations={false}` to turn off all animation. See [Animation](/react-spectrum-charts/s2/docs/docs/guides/animation) for when draw-in replays.

## API

### Line

`name` identifies the line's marks and signals in the rendered Vega spec. It defaults to `line0`, `line1`, and so on.

| Prop | Type | Default |
| --- | --- | --- |
| `alternateSegmentKey` — Data field key whose truthy value marks a point as part of an alternate segment. Alternate segments render with a different line type (see `alternateSegmentLineType`). | `string` | – |
| `alternateSegmentLabel` — Text appended to the hover value label for alternate-segment points (e.g. `'(Estimated)'`). No default — omitting means no append. | `string` | – |
| `alternateSegmentLineType` — Line type used for alternate segments identified by `alternateSegmentKey`. | `LineType` | `''dotted''` |
| `children` — Supported child components. | `LineChild` | – |
| `color` — Line color or key in the data that is used as the color facet | `ColorFacet` | `{ value: 'categorical-100' }` |
| `contextMenuMode` — Controls which marks can trigger `onContextMenu`. | `"dimension" \| "item" \| "interaction"` | `'interaction'` |
| `dimension` — Data field that the value is trended against (x-axis) | `string` | `'datetime'` |
| `dimensionHover` — If `true`, all series at the hovered x-dimension highlight simultaneously instead of only the nearest series. Hover value labels show for every series at that dimension. | `boolean` | `false` |
| `dualMetricAxis` — Enables dual metric axis mode where the last series uses a secondary axis with independent scale | `boolean` | – |
| `gradient` — Fills the area under the line with its color, fading to transparent. Use on charts with a single line. | `boolean` | – |
| `hoverLabelKey` — Data field key to display in the hover value label. Defaults to the `metric` field. Use this to show a pre-formatted or alternate field (e.g. `'displayValue'`) instead of the raw metric. | `string` | – |
| `interactionMode` — Sets how hovering picks a point: `'nearest'` uses the closest point, `'item'` only the point under the pointer. | `"dimension" \| "item" \| "nearest"` | `'nearest'` |
| `interpolate` — Sets the interpolation method for the line. `basis` doesn't pass through the data, so it draws no points. | `InterpolationType` | – |
| `isMethodLast` — With `isSparkline`, draws a static point on the last row of the chart data. | `boolean` | – |
| `isSparkline` — Renders the line as a sparkline. With `isMethodLast`, draws a static point on the last data point. | `boolean` | – |
| `lineCap` — Sets the stroke line cap style for the line ends and gap boundaries. | `"square" \| "round"` | `'round'` |
| `lineType` — Line type or key in the data that is used as the line type facet | `LineTypeFacet` | `{ value: 'solid' }` |
| `metric` — Key in the data that is used as the metric | `string` | `'value'` |
| `metricAxis` — Axis that the metric is trended against (y-axis) | `string` | – |
| `metricRanges` — Shaded ranges drawn around the line, each between two data fields. | `MetricRangeOptions[]` | – |
| `name` — Sets the name of the component. | `string` | `'line0'` |
| `onClick` — Called with the row's data when a point is clicked. | `MarkCallback` | – |
| `onContextMenu` — Called with the event and the row's data when a point is right-clicked. Use it to show a custom context menu. Use `contextMenuMode` to control which marks can trigger it. | `ContextMenuCallback` | – |
| `opacity` — Opacity or key in the data that is used as the opacity facet | `OpacityFacet` | – |
| `otherSeriesColor` — Color for series outside `primarySeries`, as a Spectrum color token or CSS color. | `string` | – |
| `padding` — Sets the chart area padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) | `number` | – |
| `pointSize` — Area of static points in square pixels. When omitted, points scale with chart width. | `number` | – |
| `primarySeries` — Series to keep in color; the rest turn gray and lose their direct labels. Pass a number N for the first N series, or a list of series names. | `number \| string[]` | – |
| `scaleType` — Sets the x scale type: `'time'`, `'linear'`, or `'point'`. | `"linear" \| "time" \| "point" \| "band"` | `'time'` |
| `showHoverLabel` — If `true`, shows the metric value as a label adjacent to the hovered data point. Suppressed when a `<ChartInspect>` child is present. | `boolean` | `true` |
| `staticPoint` — Data field that marks rows to highlight; a point is drawn on the line for each row where it's true. | `string` | – |
| `trendlines` | `TrendlineOptions[]` | – |

### LineDirectLabel

| Prop | Type | Default |
| --- | --- | --- |
| `excludeSeries` — Series values to exclude from labeling. | `string[]` | – |
| `fontSize` — Override font size in pixels. When omitted, font size scales automatically with chart size. | `number` | – |
| `format` — d3 number format for the value. | `string` | `'',.2~f''` |
| `position` — Where to place the label along the line. - 'end': right side of the chart, y-positioned at the last data point - 'start': left side of the chart, y-positioned at the first data point | `"start" \| "end"` | `'end'` |
| `prefix` — Text prepended to the value, separated by a space. | `string` | – |
| `value` — Value to display. - 'last': value at last data point - 'average': average of all values in the line - 'series': series key/name | `"series" \| "last" \| "average"` | `'last'` |

### LineForecast

| Prop | Type | Default |
| --- | --- | --- |
| `label` — Label text shown at the forecast boundary. | `string` | `'Forecast'` |
| `metric`required — Data field containing the forecasted metric values | `string` | – |
| `start`required — Dimension value (timestamp for time scale, number for linear) where the forecast begins | `number` | – |
