# Scatter

**Stage:** Lab

Scatter plots show how two numeric values relate. Each data point becomes a point positioned by its `dimension` (x) and `metric` (y) values. Color, size, opacity, and outline can each encode another field.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Title text="Campaign revenue by spend" />
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel" />
  <Legend />
</Chart>
```

`Scatter`, `ScatterAnnotation`, `ScatterPath`, `Trendline`, and `TrendlineAnnotation` are lab components. Import them from the `lab` subpath:

```tsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter, Trendline } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```

## Data

`data` goes on `Chart` as an array of objects, one per point. On `Scatter`, `dimension` names the field for the x position (default `x`) and `metric` names the field for the y position (default `value`). Most examples on this page use `scatterCampaignData`, one row per marketing campaign:

```ts
const scatterCampaignData = [
  { id: 1, campaign: 'Brand terms', channel: 'Search', audience: 'Returning', spend: 12, revenue: 58, reach: 40, roi: 4.8 },
  { id: 2, campaign: 'Competitor terms', channel: 'Search', audience: 'New', spend: 18, revenue: 61, reach: 55, roi: 3.4 },
  { id: 3, campaign: 'Product terms', channel: 'Search', audience: 'New', spend: 25, revenue: 96, reach: 72, roi: 3.8 },
  { id: 4, campaign: 'Shopping ads', channel: 'Search', audience: 'Returning', spend: 31, revenue: 118, reach: 90, roi: 3.8 },
  { id: 5, campaign: 'Generic terms', channel: 'Search', audience: 'New', spend: 40, revenue: 132, reach: 120, roi: 3.3 },
  { id: 6, campaign: 'Spring video', channel: 'Social', audience: 'New', spend: 8, revenue: 19, reach: 150, roi: 2.4 },
  { id: 7, campaign: 'Influencer kit', channel: 'Social', audience: 'New', spend: 15, revenue: 41, reach: 210, roi: 2.7 },
  { id: 8, campaign: 'Retargeting', channel: 'Social', audience: 'Returning', spend: 22, revenue: 74, reach: 60, roi: 3.4 },
  { id: 9, campaign: 'Carousel ads', channel: 'Social', audience: 'New', spend: 29, revenue: 70, reach: 180, roi: 2.4 },
  { id: 10, campaign: 'Holiday promo', channel: 'Social', audience: 'Returning', spend: 36, revenue: 103, reach: 95, roi: 2.9 },
  { id: 11, campaign: 'Welcome series', channel: 'Email', audience: 'New', spend: 4, revenue: 22, reach: 30, roi: 5.5 },
  { id: 12, campaign: 'Cart reminder', channel: 'Email', audience: 'Returning', spend: 6, revenue: 35, reach: 25, roi: 5.8 },
  { id: 13, campaign: 'Newsletter', channel: 'Email', audience: 'Returning', spend: 9, revenue: 38, reach: 80, roi: 4.2 },
  { id: 14, campaign: 'Win-back', channel: 'Email', audience: 'Returning', spend: 14, revenue: 47, reach: 45, roi: 3.4 },
  { id: 15, campaign: 'Launch announce', channel: 'Email', audience: 'New', spend: 19, revenue: 66, reach: 110, roi: 3.5 },
];
```

```tsx
<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel" />
  <Legend />
</Chart>
```

Add `Axis` siblings to label the x and y scales. Both scales are linear and fit the data, so they don't have to start at 0. Use `range` on `Axis` to fix a scale's domain.

### Time dimension

To plot points over time, put timestamps (milliseconds) in the `dimension` field and set `dimensionScaleType="time"`. Pair it with `labelFormat="time"` and a `granularity` on the bottom `Axis`. With the default `linear` scale, the axis shows raw timestamps.

```ts
const scatterSignupData = [
  { datetime: 1767571200000, signups: 42, platform: 'Web' },
  { datetime: 1767571200000, signups: 30, platform: 'Mobile' },
  { datetime: 1767657600000, signups: 48, platform: 'Web' },
  { datetime: 1767657600000, signups: 34, platform: 'Mobile' },
  { datetime: 1767744000000, signups: 45, platform: 'Web' },
  { datetime: 1767744000000, signups: 31, platform: 'Mobile' },
  { datetime: 1767830400000, signups: 51, platform: 'Web' },
  { datetime: 1767830400000, signups: 37, platform: 'Mobile' },
  { datetime: 1767916800000, signups: 58, platform: 'Web' },
  { datetime: 1767916800000, signups: 40, platform: 'Mobile' },
  { datetime: 1768003200000, signups: 36, platform: 'Web' },
  { datetime: 1768003200000, signups: 44, platform: 'Mobile' },
  { datetime: 1768089600000, signups: 33, platform: 'Web' },
  { datetime: 1768089600000, signups: 47, platform: 'Mobile' },
  { datetime: 1768176000000, signups: 55, platform: 'Web' },
  { datetime: 1768176000000, signups: 39, platform: 'Mobile' },
  { datetime: 1768262400000, signups: 61, platform: 'Web' },
  { datetime: 1768262400000, signups: 43, platform: 'Mobile' },
  { datetime: 1768348800000, signups: 64, platform: 'Web' },
  { datetime: 1768348800000, signups: 46, platform: 'Mobile' },
];
```

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterSignupData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" granularity="day" />
  <Scatter
    dimension="datetime"
    dimensionScaleType="time"
    metric="signups"
    color="platform"
  />
  <Legend />
</Chart>
```

### Empty and loading

When `data` is an empty array, `Chart` shows `emptyStateText` instead. Set `loading` on `Chart` to show a spinner while data loads.

```jsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={emptyData}>
  <Axis position="left" grid />
  <Axis position="bottom" grid />
  <Scatter dimension="spend" metric="revenue" color="channel" />
</Chart>
```

## Encodings

`color`, `size`, `opacity`, `lineType`, `lineWidth`, and `stroke` each take either a field name in the data, which maps each value through a scale, or a static value like `{ value: 'L' }`.

### Color

By default every point uses one static color, `categorical-100`. Set `color` to a field name to color points by category; each value gets the next color in the chart's `colors` and an entry in the `Legend`. Use `{ value: 'gray-700' }` for a different static color.

For a numeric field, set `colorScaleType="linear"` and pass a sequential scheme such as `sequentialViridis5` to `colors` on `Chart`. `Legend` then shows a gradient.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel" />
  <Legend title="Channel" />
</Chart>
```

### Size

`size` sets the width of each point. It accepts `XS` (6px), `S` (8px), `M` (10px, default), `L` (12px), `XL` (16px), or a number of pixels.

Set `size` to a numeric field to size points by value, as in a bubble chart. Sizes range linearly from the smallest to the largest value, between the two sizes in `symbolSizes` on `Chart` (default `['XS', 'XL']`). `Legend` shows a size legend for the field.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel" />
  <Legend position="right" />
</Chart>
```

### Opacity

`opacity` sets point opacity from 0 to 1 (default `1`). Set it to a field name to give each value its own opacity. Opacities are evenly spaced unless you list them in `opacities` on `Chart`.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter
    dimension="spend"
    metric="revenue"
    color="channel"
    size={{ value: 'L' }}
  />
  <Legend />
</Chart>
```

### Outline

Points have no outline by default (`lineWidth` is `0`). `lineWidth` takes `XS` (1px), `S` (1.5px), `M` (2px), `L` (3px), `XL` (4px), or a number of pixels. `lineType` sets the outline dash pattern, and `stroke` sets its color, which defaults to the point's `color`. A translucent fill with a solid outline keeps overlapping points readable.

Each of these can also be a field name. A `lineWidth` field maps through `lineWidths` on `Chart`, a `lineType` field through `lineTypes`, and a `stroke` field through the color scale.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter
    dimension="spend"
    metric="revenue"
    color="channel"
    size={{ value: 'XL' }}
    opacity={{ value: 0.4 }}
  />
  <Legend />
</Chart>
```

> **Note:**
> 
> `lineWidths` defaults to `['M']`, so a `lineWidth` field gives every point the same 2px outline until you set `lineWidths` on `Chart`.

### Blend

Overlapping points blend so dense areas look darker: `multiply` in light mode and `screen` in dark mode. Set `blend="normal"` to turn blending off so later points cover earlier ones, or pass another [Vega blend mode](https://vega.github.io/vega/docs/marks/#blend).

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData} symbolSizes={['S', 48]}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel" size="reach" />
  <Legend position="right" />
</Chart>
```

### Clip

When an `Axis` `range` is smaller than the data, points outside the range still draw past the plot edge. Set `clip` to hide them.

```jsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" range={[0, 100]} />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter
    dimension="spend"
    metric="revenue"
    color="channel"
    size={{ value: 'XL' }}
  />
</Chart>
```

## ScatterPath

`ScatterPath` connects points that share the same values, in data order, to show how something moved over time. By default it groups points by the fields used for `color`, `size`, `opacity`, and `lineType`; set `groupBy` to a list of fields to group differently.

Paths draw behind the points in `gray-500` at 50% opacity. A static `pathWidth` takes a line width from `XS` (1px) to `XL` (4px), defaulting to `M` (2px), or a number of pixels. A numeric field varies the width from point to point, scaled between the chart's `symbolSizes`.

```ts
const scatterTrajectoryData = [
  { product: 'Analytics', month: 'Jan', share: 12, growth: 4 },
  { product: 'Analytics', month: 'Feb', share: 15, growth: 9 },
  { product: 'Analytics', month: 'Mar', share: 19, growth: 12 },
  { product: 'Analytics', month: 'Apr', share: 21, growth: 7 },
  { product: 'Analytics', month: 'May', share: 20, growth: 2 },
  { product: 'Commerce', month: 'Jan', share: 30, growth: 11 },
  { product: 'Commerce', month: 'Feb', share: 28, growth: 6 },
  { product: 'Commerce', month: 'Mar', share: 25, growth: 1 },
  { product: 'Commerce', month: 'Apr', share: 27, growth: 5 },
  { product: 'Commerce', month: 'May', share: 31, growth: 10 },
  { product: 'Design', month: 'Jan', share: 6, growth: 14 },
  { product: 'Design', month: 'Feb', share: 9, growth: 16 },
  { product: 'Design', month: 'Mar', share: 13, growth: 15 },
  { product: 'Design', month: 'Apr', share: 16, growth: 11 },
  { product: 'Design', month: 'May', share: 17, growth: 13 },
];
```

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  ScatterAnnotation,
  ScatterPath,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterTrajectoryData}>
  <Axis position="left" grid title="Growth (%)" />
  <Axis position="bottom" grid title="Market share (%)" />
  <Scatter dimension="share" metric="growth" color="product">
    <ScatterPath />
    <ScatterAnnotation textKey="month" />
  </Scatter>
  <Legend />
</Chart>
```

## ScatterAnnotation

`ScatterAnnotation` labels each point. `textKey` names the field to show (default: the scatter's `metric`).

`anchor` sets where the label sits relative to its point. With a list, each position is tried in order until one fits inside the chart without overlapping another label or point. Labels that don't fit anywhere are hidden. The default tries `right`, `top`, `bottom`, then `left`.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  ScatterAnnotation,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel">
    <ScatterAnnotation />
  </Scatter>
  <Legend />
</Chart>
```

## Trendline

`Trendline` draws a statistical trend through the scatter's points, one per color series. Its `method` sets the calculation (default `linear`):

-   `average` and `median` draw a flat line at that value.
-   `linear`, `quadratic`, `polynomial-N` (for example `polynomial-3`), `exponential`, `logarithmic`, and `power` fit a regression curve.
-   `movingAverage-N` averages each point with the N - 1 points before it.

Trendlines are dashed, `M` width, and the color of their series. `lineType`, `lineWidth`, `opacity`, and `color` change that. `orientation="vertical"` calculates the trend of the dimension across the metric instead, for example a vertical line at the average x.

`dimensionRange` limits the calculation to points between two dimension values; `null` leaves a side unbounded. `dimensionExtent` sets how far the line draws and defaults to `dimensionRange`. Use `'domain'` to extend the line to the edge of the axis.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  Trendline,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel">
    <Trendline />
  </Scatter>
  <Legend />
</Chart>
```

### Moving averages

Moving averages work best on evenly spaced data like a time series. Set `hidePartialWindows` to hide the first points, which average fewer than N values.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  Trendline,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterSignupData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" granularity="day" />
  <Scatter
    dimension="datetime"
    dimensionScaleType="time"
    metric="signups"
    color="platform"
  >
    <Trendline method="movingAverage-3" />
  </Scatter>
  <Legend />
</Chart>
```

### Excluding points

`excludeDataKeys` leaves out rows where any of the listed fields is truthy, so known outliers don't skew the trend. The points still draw.

```ts
const scatterOutlierData = [
  { day: 1, visits: 120, isBotTraffic: false },
  { day: 2, visits: 135, isBotTraffic: false },
  { day: 3, visits: 128, isBotTraffic: false },
  { day: 4, visits: 410, isBotTraffic: true },
  { day: 5, visits: 152, isBotTraffic: false },
  { day: 6, visits: 160, isBotTraffic: false },
  { day: 7, visits: 149, isBotTraffic: false },
  { day: 8, visits: 171, isBotTraffic: false },
  { day: 9, visits: 455, isBotTraffic: true },
  { day: 10, visits: 182, isBotTraffic: false },
  { day: 11, visits: 190, isBotTraffic: false },
  { day: 12, visits: 186, isBotTraffic: false },
];
```

```jsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  Trendline,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterOutlierData}>
  <Axis position="left" grid title="Visits" />
  <Axis position="bottom" grid title="Day" />
  <Scatter dimension="day" metric="visits">
    <Trendline color="gray-700" excludeDataKeys={['isBotTraffic']} />
  </Scatter>
</Chart>
```

### Trendline interaction

Add `ChartInspect` as a child of `Trendline` to show its value on hover. The hovered datum has the trend's value in `rscTrendlineValue`. `highlightRawPoint` also highlights the data point at the hovered position.

`displayOnHover` hides the trendline until a point in its series is hovered. It needs a `ChartInspect` on the `Scatter`.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  Trendline,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.campaign}: ${datum.revenue}K revenue on ${datum.spend}K spend
        </div>
      )}
    </ChartInspect>
    <Trendline>
      <ChartInspect>
        {(datum) => <div>Trend: ${datum.rscTrendlineValue.toFixed(1)}K</div>}
      </ChartInspect>
    </Trendline>
  </Scatter>
  <Legend highlight />
</Chart>
```

## TrendlineAnnotation

`TrendlineAnnotation` labels a trendline with its value. `dimensionValue` sets where along the line: `end` (default), `start`, or a dimension value. `numberFormat` takes a [d3-format](https://d3js.org/d3-format) specifier and follows the chart's `locale`; `prefix` adds text before the value. `badge` draws the label in a filled badge in the trendline's color.

```jsx
import { Axis, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  Trendline,
  TrendlineAnnotation,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue">
    <Trendline method="average" dimensionExtent={['domain', 'domain']}>
      <TrendlineAnnotation numberFormat=",.1f" />
    </Trendline>
  </Scatter>
</Chart>
```

> **Note:**
> 
> `TrendlineAnnotation` only works with the `average` and `median` methods. With regression or moving-average methods the chart fails to render.

## Legend

Add `Legend` as a sibling of `Scatter` to list its series. The plot shrinks to make room for it.

-   `highlight` highlights a series, including its trendline and paths, while its entry is hovered.
-   `isToggleable` lets users click an entry to hide or show its series. To start with series hidden, set `defaultHiddenSeries`.
-   `legendLabels` replaces the label shown for a series.

When a scatter encodes several fields, such as `color` and `opacity`, one legend lists every combination.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  Trendline,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel">
    <Trendline method="average" />
  </Scatter>
  <Legend title="Channel" highlight />
</Chart>
```

### Size, gradient, and opacity legends

A numeric `size` field gets a size legend, listed after any category entries, and a linear `color` field gets a gradient legend. When points share one color and `opacity` is a field, set `opacity` on `Legend` to that field so the legend symbols match.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" size="reach" />
  <Legend position="right" title="Reach (K)" />
</Chart>
```

### Hiding series

`hiddenSeries` on `Chart` hides series from outside the chart, for example from a filter control. Their trendlines hide too.

```jsx
import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  Trendline,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData} hiddenSeries={['Social']}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel">
    <Trendline />
  </Scatter>
  <Legend />
</Chart>
```

## Interaction

### ChartInspect and ChartPopover

Add `ChartInspect` to show details on hover and `ChartPopover` to show details on click. Pass a function as children to render content from the hovered point's datum; `Scatter` has no default content.

Hovering highlights the nearest point and fades the rest. `highlightBy` on `ChartInspect` highlights more: `series` highlights the hovered point's series, `dimension` highlights points with the same x value, and a list of fields highlights points that share those values. `excludeDataKeys` skips rows where any of the listed fields is truthy.

`ChartPopover` rings the clicked point. `rightClick` opens it on right-click instead.

`tooltipAnchor="mark"` on `Chart` places inspect content next to the hovered point instead of following the cursor; `tooltipPlacement` picks the side.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  ChartPopover,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';
import { Content, Heading, Text } from '@react-spectrum/s2';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.campaign}: ${datum.revenue}K revenue on ${datum.spend}K spend
        </div>
      )}
    </ChartInspect>
    <ChartPopover width="auto">
      {(datum) => (
        <>
          <Heading level={4}>{datum.campaign}</Heading>
          <Content>
            <Text>{datum.channel}, {datum.reach}K reach</Text>
          </Content>
        </>
      )}
    </ChartPopover>
  </Scatter>
  <Legend />
</Chart>
```

> **Note:**
> 
> `Scatter` doesn't support `onClick`, `onContextMenu`, `onMouseOver`, or `onMouseOut` yet.

### Highlighting

`highlightedSeries` on `Chart` highlights a series from outside the chart, for example from a table row. `highlightedItem` does the same by row ID and can take a list; set `idKey` on `Chart` to the field that uniquely identifies each row. `Legend` with `highlight` highlights a series when its entry is hovered.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={scatterCampaignData}>
  <Axis position="left" grid title="Revenue ($K)" />
  <Axis position="bottom" grid title="Spend ($K)" />
  <Scatter dimension="spend" metric="revenue" color="channel">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.campaign}: ${datum.revenue}K revenue on ${datum.spend}K spend
        </div>
      )}
    </ChartInspect>
  </Scatter>
  <Legend highlight />
</Chart>
```

## Animation

`Scatter` doesn't animate yet: `animationTypes` on `Chart` has no effect on points, paths, or trendlines.

## API

### Scatter

`name` identifies the scatter's marks and signals in the rendered Vega spec. It defaults to `scatter0`, `scatter1`, and so on.

| Prop | Type | Default |
| --- | --- | --- |
| `blend` — CSS blend mode where points overlap. `normal` turns blending off. Defaults to `multiply` in light mode and `screen` in dark mode. | `"normal" \| Blend` | – |
| `children` — Supported child components. | `ScatterChild` | – |
| `clip` — Restricts scatter plot contents to the plot boundaries. | `boolean` | – |
| `color` — Point fill color: a data key mapped to the color scale, or a static color. | `ColorFacet` | `'series'` |
| `colorScaleType` — Color scale type: `ordinal` for category keys, `linear` for numeric keys. | `"linear" \| "ordinal"` | `'ordinal'` |
| `dimension` — Data key for the x position. | `string` | `'x'` |
| `dimensionScaleType` — Scale type for the x position; use `time` for timestamps. | `"linear" \| "time" \| "point" \| "band"` | `'linear'` |
| `lineType` — Outline dash pattern: a data key mapped to the chart's `lineTypes`, or a static line type. | `LineTypeFacet` | `{ value: 'solid' }` |
| `lineWidth` — Outline width: a data key mapped to the chart's `lineWidths`, or a static width. | `LineWidthFacet` | `{ value: 0 }` |
| `metric` — Key in the data that is used as the metric | `string` | `'value'` |
| `name` — Sets the name of the component. | `string` | – |
| `opacity` — Point opacity: a data key mapped to the chart's `opacities`, or a static value. | `OpacityFacet` | `{ value: 1 }` |
| `size` — Point width: a numeric data key scaled between the chart's `symbolSizes`, or a static size. | `SymbolSizeFacet` | `{ value: DEFAULT_SYMBOL_SIZE }` |
| `stroke` — Outline color: a data key mapped to the color scale, or a static color. | `ColorFacet` | `'color'` |

### ScatterPath

| Prop | Type | Default |
| --- | --- | --- |
| `color` — The color of the links. | `string` | `'gray-500'` |
| `groupBy` — Data fields that group points; each group's points are connected by a path. | `string[]` | – |
| `opacity` — The opacity of the links. | `number` | `0.5` |
| `pathWidth` — The width on the links. Link width can vary by point. | `PathWidthFacet` | `{ value: 'M' }` |

### ScatterAnnotation

| Prop | Type | Default |
| --- | --- | --- |
| `anchor` — Specifies where to position the annotation relative to the data point. When an array is provided, each position is tried in order until one fits within the chart bounds and doesn't overlap with other annotations or points. If no position fits, the annotation is not displayed. | `LabelAnchor \| LabelAnchor[]` | `['right', 'top', 'bottom', 'left']` |
| `textKey` — Data field with the label text. | `string` | `'annotation'` |

### Trendline

| Prop | Type | Default |
| --- | --- | --- |
| `children` — Supported child components. | `TrendlineChild` | – |
| `color` — Trendline color. Defaults to the color of its series. | `string` | – |
| `dimensionExtent` — Range of `dimension` to draw the trendline over. `domain` extends it to the edge of the chart; `null` stops at the first or last row. | `[number \| "domain" \| null, number \| "domain" \| null]` | `'dimensionRange'` |
| `dimensionRange` — Range of `dimension` the trendline is calculated from; `null` leaves that end unbounded. | `[number \| null, number \| null]` | `[null, null]` |
| `displayOnHover` — Whether the trendline should only be visible when hovering over the parent line | `boolean` | `false` |
| `excludeDataKeys` — Data points where these keys have truthy values will not be included in the trendline calculation | `string[]` | – |
| `hidePartialWindows` — Hides the first points of a moving average, which are calculated from less than a full window. | `boolean` | `false` |
| `highlightRawPoint` — If there is an inspect on this trendline, then this will highlight the raw point in addition to the hovered trendline point. | `boolean` | `false` |
| `lineType` — Line type of the trendline. | `LineType` | `'dashed'` |
| `lineWidth` — Line width of the trendline. | `LineWidth` | `'M'` |
| `method` — Statistical method used to calculate the trendline. | `TrendlineMethod` | `'linear'` |
| `opacity` — Opacity of the trendline. | `number` | `1` |
| `orientation` — Orientation of the trendline; `vertical` calculates the dimension across the metric. Only supported on scatter plots. | `"vertical" \| "horizontal"` | `'horizontal'` |

### TrendlineAnnotation

| Prop | Type | Default |
| --- | --- | --- |
| `badge` — Adds a badge around the annotation | `boolean` | `false` |
| `dimensionValue` — Where along the trendline to place the label: `start`, `end`, or a `dimension` value. | `number \| "start" \| "end"` | `'end'` |
| `numberFormat` — d3 number format specifier. Only valid if labelFormat is linear or undefined. @see https://d3js.org/d3-format#locale\_format | `string` | `''` |
| `prefix` — Text shown before the trendline value. | `string` | `''` |
