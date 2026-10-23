# Bar

**Stage:** Alpha

Bars compare values across categories. Each category gets a bar sized by its `metric` value, and series within a category are stacked or placed side by side.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelDeviceData}>
  <Title text="Visits by channel" />
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device" />
  <Legend position="bottom" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.
-   `color` on `Bar`: `by device` or `single`. Shown: `by device`.
-   `type` on `Bar`: `stacked` or `dodged`. Shown: `stacked`.
-   `position` on `Legend`: `none`, `bottom`, `right`, `left` or `top`. Shown: `bottom`.
-   `text` on `Title`: any text. Shown: `Visits by channel`.

## Data

`data` goes on `Chart` as an array of objects, one per bar or bar segment. On `Bar`, `dimension` names the field for the categories (default `category`) and `metric` names the numeric field that sizes each bar (default `value`). Set `color` to a field to split each category into series; each row is one segment. Without a `color` field, every bar uses the first categorical color. Most examples on this page use `barChannelData` or `barChannelDeviceData`:

```ts
const barChannelData = [
  { channel: 'Search', visits: 12400 },
  { channel: 'Direct', visits: 9800 },
  { channel: 'Social', visits: 7300 },
  { channel: 'Email', visits: 5100 },
  { channel: 'Referral', visits: 3600 },
  { channel: 'Display', visits: 2200 },
];
```

```tsx
<Chart data={barChannelData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" />
</Chart>
```

```ts
const barChannelDeviceData = [
  { id: 'search-desktop', channel: 'Search', device: 'Desktop', visits: 6200, stackOrder: 3 },
  { id: 'search-mobile', channel: 'Search', device: 'Mobile', visits: 4800, stackOrder: 2 },
  { id: 'search-tablet', channel: 'Search', device: 'Tablet', visits: 1400, stackOrder: 1 },
  { id: 'direct-desktop', channel: 'Direct', device: 'Desktop', visits: 5100, stackOrder: 3 },
  { id: 'direct-mobile', channel: 'Direct', device: 'Mobile', visits: 3700, stackOrder: 2 },
  { id: 'direct-tablet', channel: 'Direct', device: 'Tablet', visits: 1000, stackOrder: 1 },
  { id: 'social-desktop', channel: 'Social', device: 'Desktop', visits: 1900, stackOrder: 3 },
  { id: 'social-mobile', channel: 'Social', device: 'Mobile', visits: 4600, stackOrder: 2 },
  { id: 'social-tablet', channel: 'Social', device: 'Tablet', visits: 800, stackOrder: 1 },
  { id: 'email-desktop', channel: 'Email', device: 'Desktop', visits: 2600, stackOrder: 3 },
  { id: 'email-mobile', channel: 'Email', device: 'Mobile', visits: 2000, stackOrder: 2 },
  { id: 'email-tablet', channel: 'Email', device: 'Tablet', visits: 500, stackOrder: 1 },
  { id: 'referral-desktop', channel: 'Referral', device: 'Desktop', visits: 2100, stackOrder: 3 },
  { id: 'referral-mobile', channel: 'Referral', device: 'Mobile', visits: 1200, stackOrder: 2 },
  { id: 'referral-tablet', channel: 'Referral', device: 'Tablet', visits: 300, stackOrder: 1 },
];
```

Categories appear in the order they first occur in the data. `Bar` has no sort prop, so sort your data before passing it in to change the order.

### Dates

To use dates as categories, set `dimensionDataType="time"` and give the category `Axis` `labelFormat="time"` and a `granularity`. Each date is still its own bar, evenly spaced; bars don't leave gaps for missing dates.

```ts
const barMonthlyData = [
  { month: '2025-01-01 00:00:00', visits: 11800 },
  { month: '2025-02-01 00:00:00', visits: 12600 },
  { month: '2025-03-01 00:00:00', visits: 14100 },
  { month: '2025-04-01 00:00:00', visits: 13400 },
  { month: '2025-05-01 00:00:00', visits: 15900 },
  { month: '2025-06-01 00:00:00', visits: 17200 },
];
```

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barMonthlyData}>
  <Axis
    position="bottom"
    baseline
    title="Month"
    labelFormat="time"
    granularity="month"
  />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="month" metric="visits" dimensionDataType="time" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.

> **Tip:**
> 
> Write dates without a time zone, like `'2025-01-01 00:00:00'`, so they're read in the viewer's local time. A date-only string like `'2025-01-01'` is read as UTC and can show as the previous day or month west of UTC.

### Zero, empty, and loading

When every value is 0, the categories still show on the axis with no bars. When `data` is an empty array, `Chart` shows `emptyStateText` instead. Set `loading` on `Chart` to show a spinner while data loads.

```ts
const barZeroData = [
  { channel: 'Search', visits: 0 },
  { channel: 'Direct', visits: 0 },
  { channel: 'Social', visits: 0 },
  { channel: 'Email', visits: 0 },
];
```

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barZeroData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **state**: `all zeros`, `empty` or `loading`. Shown: `all zeros`.
-   `emptyStateText` on `Chart`: any text. Shown: `No visits yet`.

With **state** set to `empty`:

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={emptyData} emptyStateText="No visits yet">
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" />
</Chart>
```

With **state** set to `loading`:

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelData} loading>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" />
</Chart>
```

## Orientation

Bars are vertical by default. Set `orientation="horizontal"` to draw them left to right, which leaves more room for long category names. Swap the `Axis` positions to match: the category axis goes on the left and the value axis on the bottom.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelData}>
  <Axis position="left" baseline title="Channel" />
  <Axis position="bottom" grid title="Visits" />
  <Bar dimension="channel" metric="visits" orientation="horizontal" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `horizontal`.

## Stacked and dodged

With more than one series, `type` controls how they share a category.

-   `stacked` (default) piles segments on top of each other, so the bar shows the category total.
-   `dodged` places one bar per series side by side, so series are easy to compare.

`order` names a numeric field that sets the stack order; segments with a higher value sit further from the baseline. Without it, segments stack in data order. Try `order="stackOrder"` to put Tablet at the bottom.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelDeviceData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device" />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `type` on `Bar`: `stacked` or `dodged`. Shown: `stacked`.
-   `order` on `Bar`: `none` or `stackOrder`. Shown: `none`.
-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.

### Dodged and stacked

Pass two fields to `color` to dodge by the first and stack by the second. Each dodged bar is then a stack. Give `Chart` a nested `colors` list, one list of shades per dodged group, so each group keeps its own hue. `groupedPadding` sets the space between bars in a group as a ratio of the bar width; it defaults to `paddingRatio`.

```ts
const barChannelVisitorData = [
  { channel: 'Search', device: 'Desktop', visitor: 'New', visits: 3900 },
  { channel: 'Search', device: 'Desktop', visitor: 'Returning', visits: 2300 },
  { channel: 'Search', device: 'Mobile', visitor: 'New', visits: 3100 },
  { channel: 'Search', device: 'Mobile', visitor: 'Returning', visits: 1700 },
  { channel: 'Direct', device: 'Desktop', visitor: 'New', visits: 1600 },
  { channel: 'Direct', device: 'Desktop', visitor: 'Returning', visits: 3500 },
  { channel: 'Direct', device: 'Mobile', visitor: 'New', visits: 1300 },
  { channel: 'Direct', device: 'Mobile', visitor: 'Returning', visits: 2400 },
  { channel: 'Social', device: 'Desktop', visitor: 'New', visits: 1200 },
  { channel: 'Social', device: 'Desktop', visitor: 'Returning', visits: 700 },
  { channel: 'Social', device: 'Mobile', visitor: 'New', visits: 3200 },
  { channel: 'Social', device: 'Mobile', visitor: 'Returning', visits: 1400 },
  { channel: 'Email', device: 'Desktop', visitor: 'New', visits: 600 },
  { channel: 'Email', device: 'Desktop', visitor: 'Returning', visits: 2000 },
  { channel: 'Email', device: 'Mobile', visitor: 'New', visits: 500 },
  { channel: 'Email', device: 'Mobile', visitor: 'Returning', visits: 1500 },
];
```

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart
  data={barChannelVisitorData}
  colors={[['blue-900', 'blue-500'], ['fuchsia-900', 'fuchsia-500']]}
>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar
    dimension="channel"
    metric="visits"
    color={['device', 'visitor']}
    type="dodged"
  />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `groupedPadding` on `Bar`: 0 to 0.9, in steps of 0.05. Shown: `0.4`.
-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.

`lineType` and `opacity` also accept two fields, and the same rule applies to them.

## Spacing

`paddingRatio` is the space between categories, as a share of each category's band: `0` makes bars touch and `0.9` makes them thin. The default is `0.4`. `paddingOuter` is the space before the first bar and after the last; it defaults to half of `paddingRatio`.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `paddingRatio` on `Bar`: 0 to 0.9, in steps of 0.05. Shown: `0.4`.
-   `paddingOuter` on `Bar`: `auto`, `0`, `0.2`, `0.5` or `1`. Shown: `auto`.

Bar width comes from the chart width, the number of categories, and the padding. There's no prop to set a fixed bar width.

## Appearance

-   Bars have rounded corners at their ends. Set `hasSquareCorners` to square them.
-   `opacity` takes `{ value }` for a static opacity, or a field name to vary it by series.
-   `lineWidth` adds a border in the bar's own color, and `lineType` makes that border `dashed` or `dotted`. The border is easiest to see with reduced `opacity`. Like `opacity`, `lineType` can be a field name to vary it by series.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `hasSquareCorners` on `Bar`: `true` or `false`. Shown: `false`.
-   `opacity` on `Bar`: 0.1 to 1, in steps of 0.1. Shown: `1`.
-   `lineWidth` on `Bar`: 0 to 6, in steps of 1. Shown: `0`.
-   `lineType` on `Bar`: `solid`, `dashed` or `dotted`. Shown: `solid`.

### colorOverride

`colorOverride` names a field that holds a CSS color for each row, like a status color. It sets the bar fill directly instead of going through the color scale. A `Legend` still uses the color scale, so if you show one, set `color` to the matching category field and pass the same colors to `Chart` `colors`.

```ts
const barGoalData = [
  { channel: 'Search', visits: 12400, status: 'Met goal', statusColor: '#0d7a55' },
  { channel: 'Direct', visits: 9800, status: 'Met goal', statusColor: '#0d7a55' },
  { channel: 'Social', visits: 7300, status: 'Missed goal', statusColor: '#d7373f' },
  { channel: 'Email', visits: 5100, status: 'Met goal', statusColor: '#0d7a55' },
  { channel: 'Referral', visits: 3600, status: 'Missed goal', statusColor: '#d7373f' },
  { channel: 'Display', visits: 2200, status: 'Missed goal', statusColor: '#d7373f' },
];
```

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barGoalData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" colorOverride="statusColor" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `colorOverride` on `Bar`: `true` or `false`. Shown: `true`.

## Diverging

For values that go both above and below zero, like a percent change, set `diverging`. The category axis moves to the zero line, and each label sits on the opposite side from its bar so labels never cover bars. Use `colorOverride` to color increases and decreases differently.

```ts
const barChangeData = [
  { channel: 'Search', change: 0.12, changeColor: '#0d7a55' },
  { channel: 'Direct', change: 0.05, changeColor: '#0d7a55' },
  { channel: 'Social', change: -0.08, changeColor: '#d7373f' },
  { channel: 'Email', change: 0.03, changeColor: '#0d7a55' },
  { channel: 'Referral', change: -0.11, changeColor: '#d7373f' },
  { channel: 'Display', change: -0.02, changeColor: '#d7373f' },
];
```

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChangeData}>
  <Axis position="left" baseline />
  <Axis position="bottom" grid title="Change" labelFormat="percentage" />
  <Bar
    dimension="channel"
    metric="change"
    colorOverride="changeColor"
    diverging
    orientation="horizontal"
  />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `diverging` on `Bar`: `true` or `false`. Shown: `true`.
-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `horizontal`.

> **Note:**
> 
> `diverging` only works on a single-series bar: no `color`, `lineType`, or `opacity` field and not `type="dodged"`. It has no effect on trellised bars or when the axis has `subLabels`.

## Dual metric axis

When two series have very different scales, like sessions and orders, set `dualMetricAxis` to scale the last series on its own axis. Add an `Axis` with `position="right"` for it. The right axis title and labels take the last series' color. The left axis takes the first series' color when only one series is on it.

```ts
const barSessionsOrdersData = [
  { channel: 'Search', series: 'Sessions', value: 12400 },
  { channel: 'Direct', series: 'Sessions', value: 9800 },
  { channel: 'Social', series: 'Sessions', value: 7300 },
  { channel: 'Email', series: 'Sessions', value: 5100 },
  { channel: 'Referral', series: 'Sessions', value: 3600 },
  { channel: 'Search', series: 'Orders', value: 310 },
  { channel: 'Direct', series: 'Orders', value: 420 },
  { channel: 'Social', series: 'Orders', value: 95 },
  { channel: 'Email', series: 'Orders', value: 260 },
  { channel: 'Referral', series: 'Orders', value: 120 },
];
```

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barSessionsOrdersData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Sessions" />
  <Axis position="right" title="Orders" />
  <Bar
    dimension="channel"
    metric="value"
    color="series"
    type="dodged"
    dualMetricAxis
  >
    <ChartInspect />
  </Bar>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `dualMetricAxis` on `Bar`: `true` or `false`. Shown: `true`.

`dualMetricAxis` only applies when `type="dodged"`, `color` is a single field, and there's no `trellis`.

## Trellis

`trellis` names a field to split the chart into small multiples, one per value. Each panel shares the same scales, so panels are easy to compare.

-   `trellisOrientation="horizontal"` (default) lays panels out in a row; `vertical` stacks them in a column.
-   `trellisPadding` is the space between panels as a ratio, `0.2` by default.

```ts
const barRegionData = [
  { region: 'Americas', channel: 'Search', device: 'Desktop', visits: 3400 },
  { region: 'Americas', channel: 'Search', device: 'Mobile', visits: 2600 },
  { region: 'Americas', channel: 'Direct', device: 'Desktop', visits: 2800 },
  { region: 'Americas', channel: 'Direct', device: 'Mobile', visits: 1900 },
  { region: 'Americas', channel: 'Social', device: 'Desktop', visits: 900 },
  { region: 'Americas', channel: 'Social', device: 'Mobile', visits: 2300 },
  { region: 'EMEA', channel: 'Search', device: 'Desktop', visits: 2500 },
  { region: 'EMEA', channel: 'Search', device: 'Mobile', visits: 1800 },
  { region: 'EMEA', channel: 'Direct', device: 'Desktop', visits: 1700 },
  { region: 'EMEA', channel: 'Direct', device: 'Mobile', visits: 1200 },
  { region: 'EMEA', channel: 'Social', device: 'Desktop', visits: 700 },
  { region: 'EMEA', channel: 'Social', device: 'Mobile', visits: 1600 },
];
```

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barRegionData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device" trellis="region" />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `trellisOrientation` on `Bar`: `horizontal` or `vertical`. Shown: `horizontal`.
-   `trellisPadding` on `Bar`: 0 to 0.6, in steps of 0.05. Shown: `0.2`.
-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.
-   `type` on `Bar`: `stacked` or `dodged`. Shown: `stacked`.

Trellised charts don't draw grid lines on the shared value axis.

## BarDirectLabel

Add `BarDirectLabel` as a child of `Bar` to print each bar's value on or next to it.

-   `position` places the label: `end-outside` (default) outside the tip, `end` inside near the tip, `middle` centered in the bar, or `start` inside near the baseline.
-   `overflow` sets what happens to an inside label that doesn't fit in its bar: `hide` it, or `spill` it outside the tip. The default is `spill` for `start` and `hide` otherwise.
-   `dataKey` labels only the rows where that field is truthy, for example to call out one bar.
-   `format` formats the value. It accepts `shortNumber`, `standardNumber`, `currency`, `shortCurrency`, `percentage`, or a [d3-format](https://d3js.org/d3-format) specifier. The default is `,.2~f`.

Labels outside the bar use the bar's color; labels inside use the background color. Labels outside the bar are hidden if they would overlap a bar or another label. For negative values, labels flip to the other side of the baseline. Numbers follow the chart's `locale`, like axis labels do.

```jsx
import {
  Axis,
  Bar,
  BarDirectLabel,
  Chart,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits">
    <BarDirectLabel />
  </Bar>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `position` on `BarDirectLabel`: `end-outside`, `end`, `middle` or `start`. Shown: `end-outside`.
-   `format` on `BarDirectLabel`: `,.2~f`, `.3~s` or `,.1f`. Shown: `,.2~f`.
-   `overflow` on `BarDirectLabel`: `default`, `hide` or `spill`. Shown: `default`.
-   `dataKey` on `BarDirectLabel`: `none` or `callout`. Shown: `none`.
-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.

## Axis and ReferenceLine

Bars need two `Axis` children on `Chart`: one for the categories and one for the values. Typical settings are `baseline` on the category axis and `grid` on the value axis. Hovering a category label on an interactive bar highlights that category.

To mark a target or threshold, add a `ReferenceLine` as a child of the value `Axis`. For more axis options, see [Axis](/react-spectrum-charts/s2/docs/docs/axis).

```jsx
import {
  Axis,
  Bar,
  Chart,
  ReferenceLine,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits">
    <ReferenceLine value={8000} label="Goal" />
  </Axis>
  <Bar dimension="channel" metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `value` on `ReferenceLine`: `5000`, `8000` or `10000`. Shown: `8000`.
-   `label` on `ReferenceLine`: any text. Shown: `Goal`.
-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.

## Legend

Add `Legend` as a sibling of `Bar` to list the series. The plot shrinks to make room for it.

-   `isToggleable` lets users click an entry to hide or show its series. Stacks and value scales update to fit what's visible.
-   `highlight` highlights a series while its entry is hovered.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelDeviceData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device" />
  <Legend title="Device" isToggleable />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `position` on `Legend`: `bottom`, `right`, `left` or `top`. Shown: `bottom`.
-   `isToggleable` on `Legend`: `true` or `false`. Shown: `true`.
-   `highlight` on `Legend`: `true` or `false`. Shown: `false`.

See [Legend](/react-spectrum-charts/s2/docs/docs/legend) for more options.

### Hiding series

`hiddenSeries` on `Chart` hides series from outside the chart, for example from a filter control. To start with series hidden but let users toggle them, set `defaultHiddenSeries` on a toggleable `Legend` instead.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelDeviceData} hiddenSeries={['Mobile']}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device" />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `hiddenSeries` on `Chart`: `none`, `Mobile` or `Mobile, Tablet`. Shown: `Mobile`.
-   `type` on `Bar`: `stacked` or `dodged`. Shown: `stacked`.

## Interaction

### ChartInspect and ChartPopover

Add `ChartInspect` to show details on hover and `ChartPopover` to show details on click. Pass a function as children that takes the bar's data row and returns the content; without children, neither shows anything, although the bar still responds to the pointer. `rightClick` on `ChartPopover` opens it on right-click instead. The bar with an open popover gets a selection ring.

-   `highlightBy` on `ChartInspect` sets what stays highlighted while the pointer is over a bar: `item` (default) for the bar, `series` for every bar in its series, or `dimension` for every bar in its category.
-   `targets={['dimensionArea', 'item']}` also shows the inspect when the pointer is in the empty space of a category's column.

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartInspect,
  ChartPopover,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Button,
  ButtonGroup,
  Content,
  Heading,
  Text,
} from '@react-spectrum/s2';

<Chart data={barChannelDeviceData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.channel}, {datum.device}: {datum.visits} visits
        </div>
      )}
    </ChartInspect>
    <ChartPopover>
      {(datum, close) => (
        <>
          <Heading level={4}>{datum.channel}</Heading>
          <Content>
            <Text>{datum.device}: {datum.visits} visits</Text>
          </Content>
          <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
            <Button variant="secondary" size="S" onPress={close}>Close</Button>
          </ButtonGroup>
        </>
      )}
    </ChartPopover>
  </Bar>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `ChartInspect`: included or left out. Shown: included.
-   `highlightBy` on `ChartInspect`: `item`, `series` or `dimension`. Shown: `item`.
-   `targets` on `ChartInspect`: `item` or `dimensionArea, item`. Shown: `item`.
-   `ChartPopover`: included or left out. Shown: included.
-   `rightClick` on `ChartPopover`: `true` or `false`. Shown: `false`.
-   `type` on `Bar`: `stacked` or `dodged`. Shown: `stacked`.

Hovering an interactive bar fades the other bars. A bar without `ChartInspect`, `ChartPopover`, `onClick`, `onContextMenu`, or highlighting doesn't respond to the pointer. See [Interaction](/react-spectrum-charts/s2/docs/docs/interaction) for more about inspects and popovers.

### Callbacks

`Bar` calls `onClick` with the bar's data row when a bar is clicked, and `onMouseOver` and `onMouseOut` when the pointer enters and leaves a bar. `onContextMenu` is called on right-click with the native event and the row, so you can show your own menu.

```tsx
<Bar
  dimension="channel"
  metric="visits"
  onClick={(datum) => openReport(datum.channel)}
  onContextMenu={(event, datum) => showMenu(event.clientX, event.clientY, datum)}
/>
```

### Highlighting

`highlightedSeries` on `Chart` highlights a series from outside the chart, for example from a table row. `highlightedItem` does the same by row ID and can take a list; set `idKey` on `Chart` to the field that uniquely identifies each row. `Legend` with `highlight` highlights a series when its entry is hovered.

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelDeviceData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device">
    <ChartInspect />
  </Bar>
  <Legend highlight />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `highlightedSeries` on `Chart`: `none`, `Desktop`, `Mobile` or `Tablet`. Shown: `none`.
-   `highlightedItem` on `Chart`: `none`, `social-mobile` or `search-desktop, email-desktop`. Shown: `none`.

## Animation

The chart's `animationTypes` lists which animations play. By default, `hover` eases bars in and out of their faded state, and `drawIn` grows bars from the baseline over 700ms. Stacked segments fill in order from the baseline outward, and direct labels fade in as their own segment finishes.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={barChannelDeviceData}>
  <Axis position="bottom" baseline title="Channel" />
  <Axis position="left" grid title="Visits" />
  <Bar dimension="channel" metric="visits" color="device" />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `animationTypes` on `Chart`: `true` or `false`. Shown: `true`.
-   `type` on `Bar`: `stacked` or `dodged`. Shown: `stacked`.
-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.

Draw-in plays once when the chart mounts. Set `animationTypes={['hover']}` to turn off draw-in only, or `animations={false}` to turn off all animation. When the user prefers reduced motion, draw-in is skipped. See [Animation](/react-spectrum-charts/s2/docs/docs/guides/animation).

## Not supported yet

> **Note:**
> 
> `Bar` doesn't take `BarAnnotation` or `Trendline` children yet. Use `BarDirectLabel` for value labels.

## API

### Bar

`name` identifies the bar's marks and signals in the rendered Vega spec. It defaults to `bar0`, `bar1`, and so on. `metricAxis` gives the bar its own value scale, for combining it with other marks; see [Combo](/react-spectrum-charts/s2/docs/docs/combo).

| Prop | Type | Default |
| --- | --- | --- |
| `children` — Supported child components. | `BarAnnotation \| BarDirectLabel \| ChartPopover \| ChartInspect` | – |
| `color` — Bar color or key in the data that is used as the color facet; a two-key list dodges by the first key and stacks by the second. | `ColorFacet \| DualFacet` | `{ value: 'categorical-100' }` |
| `colorOverride` — Data field whose value is the CSS color for each bar; overrides the color scale for the bar fill. | `string` | – |
| `dimension` — Data field used for the bar categories (x-axis for a vertical bar). | `string` | `'category'` |
| `dimensionDataType` — Set to `time` when the dimension values are dates, so the axis can format them with `labelFormat="time"`. | `string` | – |
| `diverging` — Diverging bar chart (metric spans positive and negative): moves the dimension axis to the zero baseline and flips each label to the opposite side of its bar. Single-series bars only; a no-op on dodged or faceted bars. | `boolean` | `false` |
| `dualMetricAxis` — Whether to scale the last series separately on a secondary metric axis. Only applies to dodged bars with a single facet key and no trellis. | `boolean` | `false` |
| `groupedPadding` — Inner padding between dodged bars in a group, as a ratio between 0 and 1. | `number` | `'paddingRatio'` |
| `hasSquareCorners` — Whether the corners at the end of each bar are square instead of rounded. | `boolean` | `false` |
| `lineType` — Border line type or key in the data that is used as the line type facet. Only visible when `lineWidth` is greater than 0. | `DualFacet \| LineTypeFacet` | `{ value: 'solid' }` |
| `lineWidth` — Border width of the bar, drawn in the bar's color. | `LineWidth` | `0` |
| `metric` — Key in the data that is used as the metric. | `string` | `'value'` |
| `metricAxis` — Axis that the metric is trended against (y-axis for a vertical bar) | `string` | – |
| `name` — Name used for the bar's marks and signals in the Vega spec. Defaults to `bar0`, `bar1`, and so on. | `string` | – |
| `onClick` — Called with the row's data when a bar is clicked. | `MarkCallback` | – |
| `onContextMenu` — Called with the event and the row's data when a bar is right-clicked. Use it to show a custom context menu. | `ContextMenuCallback` | – |
| `onMouseOut` — Called with the row's data when the pointer leaves a bar. | `MarkCallback` | – |
| `onMouseOver` — Called with the row's data when the pointer enters a bar. | `MarkCallback` | – |
| `opacity` — Bar opacity, or a data field that assigns an opacity to each series. | `DualFacet \| OpacityFacet` | `{ value: 1 }` |
| `order` — Data field that sets the stack order; higher values stack on top. Defaults to data order. | `string` | – |
| `orientation` — Direction of the bars. | `"vertical" \| "horizontal"` | `'vertical'` |
| `paddingOuter` — Space before the first bar and after the last, as a share of each category's width. Defaults to half of `paddingRatio`. | `number` | – |
| `paddingRatio` — Space between bars, as a share of each category's width from 0 to 1. | `number` | `0.4` |
| `trellis` — Data field that splits the chart into small multiples, one per value. | `string` | – |
| `trellisOrientation` — Whether trellis groups sit side by side or stacked. Only applies with `trellis`. | `"vertical" \| "horizontal"` | `'horizontal'` |
| `trellisPadding` — Space between trellis groups, from 0 to 1. Only applies with `trellis`. | `number` | `0.2` |
| `trendlines` | `TrendlineOptions[]` | – |
| `type` — Whether series stack on top of each other or sit side by side (dodged). | `"dodged" \| "stacked"` | `'stacked'` |

### BarDirectLabel

| Prop | Type | Default |
| --- | --- | --- |
| `dataKey` — Data key that selects which bars get a label; only rows where this field is truthy are labeled. | `string` | – |
| `format` — Number format for the label value — a named preset or custom d3-format specifier. | `string` | `'',.2~f''` |
| `overflow` — Inside positions: `hide` hides labels that don't fit inside the bar, `spill` moves them outside the bar tip. Outside labels are hidden if they would overlap a bar or another label. | `"hide" \| "spill"` | ``''spill' for `start`, otherwise 'hide''`` |
| `position` — Where to place the label: outside the tip (`end-outside`), inside near the tip (`end`), centered (`middle`), or inside near the baseline (`start`). | `"start" \| "end" \| "middle" \| "end-outside"` | `''end-outside''` |
