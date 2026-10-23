# Axis

**Stage:** Alpha

An `Axis` labels one side of the chart. Add one `Axis` per side you want labeled, alongside the mark, as a child of `Chart`. A chart with no `Axis` draws only the plot.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisVisitsData}>
  <Axis position="left" title="Visits" grid />
  <Axis position="bottom" labelFormat="time" />
  <Line metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `title` on `Axis` (Left axis): any text. Shown: `Visits`.
-   `grid` on `Axis` (Left axis): `true` or `false`. Shown: `true`.
-   `numberFormat` on `Axis` (Left axis): `shortNumber`, `standardNumber` or `shortCurrency`. Shown: `shortNumber`.
-   `title` on `Axis` (Bottom axis): any text. Shown: empty.
-   `baseline` on `Axis` (Bottom axis): `true` or `false`. Shown: `false`.
-   `ticks` on `Axis` (Bottom axis): `true` or `false`. Shown: `false`.
-   `labelFormat` on `Axis` (Bottom axis): `time` or `linear`. Shown: `time`.

## Data

Axes don't take data. Each axis reads the scale of the mark it sits beside, so its labels come from the mark's `dimension` and `metric` fields. Line charts on this page use `axisVisitsData`, one row per day with `datetime` in epoch milliseconds:

```ts
const axisVisitsData = [
  { datetime: 1741003200000, visits: 2300 },
  { datetime: 1741089600000, visits: 2490 },
  { datetime: 1741176000000, visits: 2400 },
  { datetime: 1741262400000, visits: 2580 },
  { datetime: 1741348800000, visits: 2490 },
  { datetime: 1741435200000, visits: 1780 },
  { datetime: 1741521600000, visits: 1690 },
  { datetime: 1741608000000, visits: 2500 },
  { datetime: 1741694400000, visits: 2680 },
  { datetime: 1741780800000, visits: 2590 },
  { datetime: 1741867200000, visits: 2780 },
  { datetime: 1741953600000, visits: 2690 },
  { datetime: 1742040000000, visits: 1980 },
  { datetime: 1742126400000, visits: 1880 },
  { datetime: 1742212800000, visits: 2690 },
  { datetime: 1742299200000, visits: 2880 },
  { datetime: 1742385600000, visits: 2790 },
  { datetime: 1742472000000, visits: 2980 },
  { datetime: 1742558400000, visits: 2880 },
  { datetime: 1742644800000, visits: 2170 },
  { datetime: 1742731200000, visits: 2080 },
];
```

Bar charts use `axisBrowserData`:

```ts
const axisBrowserData = [
  { browser: 'Chrome', downloads: 27000, thumbnail: 'https://opensource.adobe.com/react-spectrum-charts/chrome.png' },
  { browser: 'Firefox', downloads: 8000, thumbnail: 'https://opensource.adobe.com/react-spectrum-charts/firefox.png' },
  { browser: 'Safari', downloads: 7750, thumbnail: 'https://opensource.adobe.com/react-spectrum-charts/safari.png' },
  { browser: 'Edge', downloads: 7600, thumbnail: 'https://opensource.adobe.com/react-spectrum-charts/edge.png' },
  { browser: 'Explorer', downloads: 1000, thumbnail: 'https://opensource.adobe.com/react-spectrum-charts/explorer.png' },
];
```

```tsx
<Chart data={axisVisitsData}>
  <Axis position="left" grid title="Visits" />
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" />
</Chart>
```

## Scales

`position` decides which scale the axis labels. `bottom` and `top` label the x scale, and `left` and `right` label the y scale. The scale type comes from the mark:

-   **Time**: `Line` uses a time scale by default (`scaleType="time"`). Set `labelFormat="time"` on the axis. Without it, the axis shows a few long, truncated date strings such as `Wed Mar 05 2025 00:00:…`.
-   **Linear**: `Line` with `scaleType="linear"` and a numeric `dimension`, and every value (`metric`) axis.
-   **Point**: `Line` with `scaleType="point"` spaces categories evenly.
-   **Band**: `Bar` puts its `dimension` on a band scale, at the bottom by default or on the left with `orientation="horizontal"`.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **Chart**: `Line, time`, `Line, linear`, `Line, point`, `Bar, vertical` or `Bar, horizontal`. Shown: `Line, time`.

With **Chart** set to `Line, linear`:

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisConversionData}>
  <Axis position="left" grid labelFormat="percentage" />
  <Axis position="bottom" baseline title="Week" />
  <Line dimension="week" metric="rate" scaleType="linear" />
</Chart>
```

With **Chart** set to `Line, point`:

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="browser" metric="downloads" scaleType="point" />
</Chart>
```

With **Chart** set to `Bar, vertical`:

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

With **Chart** set to `Bar, horizontal`:

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" baseline />
  <Axis position="bottom" grid />
  <Bar dimension="browser" metric="downloads" orientation="horizontal" />
</Chart>
```

Some props only apply to some scales. `range` works on linear and time scales, `tickMinStep` on linear scales, `granularity` on time scales, and `truncateLabels` and `AxisThumbnail` on band scales.

## Position and titles

Use two axes on the same scale, such as `left` and `right`, to repeat the labels on both sides. `title` takes a string, or an array of strings for a multi-line title.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" grid title="Downloads" />
  <Axis position="bottom" baseline />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `position` on `Axis` (Value axis): `left`, `right` or `both`. Shown: `left`.
-   `title` on `Axis` (Value axis): `none`, `Downloads` or `Downloads, Last 30 days`. Shown: `Downloads`.
-   `position` on `Axis` (Category axis): `bottom` or `top`. Shown: `bottom`.

## Gridlines, ticks, and baseline

-   `grid` draws a gridline at each tick across the plot. It also spaces ticks about 100px apart; without it, a value axis falls back to Vega's default tick count, which can crowd the labels.
-   `ticks` draws a short tick mark at each label.
-   `baseline` draws a solid line along the axis. When the opposite scale is linear, as with the bottom axis of a bar chart, the baseline is drawn at that scale's `baselineOffset` value (default `0`). `baselineOffset` is ignored when the opposite scale is categorical.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" grid />
  <Axis position="bottom" />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `grid` on `Axis` (Left axis): `true` or `false`. Shown: `true`.
-   `ticks` on `Axis` (Left axis): `true` or `false`. Shown: `false`.
-   `baseline` on `Axis` (Bottom axis): `true` or `false`. Shown: `false`.
-   `baselineOffset` on `Axis` (Bottom axis): 0 to 20000, in steps of 2500. Shown: `0`.
-   `ticks` on `Axis` (Bottom axis): `true` or `false`. Shown: `false`.

## Label formats

`labelFormat` sets how values are written:

| `labelFormat` | Values | Example |
| --- | --- | --- |
| `linear` (default) | Numbers, formatted with `numberFormat` | `1.2M` |
| `percentage` | Fractions, where `0.05` is 5% | `5%` |
| `duration` | Seconds, written as minutes and seconds or hours | `16:40`, `1:06:40` |
| `time` | Dates, labeled by `granularity` | `Mar`, `2025` |

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" grid title="Downloads" />
  <Axis position="bottom" baseline />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `labelFormat` on `Axis`: `linear`, `percentage` or `duration`. Shown: `linear`.

The data and charts used here are `axisConversionData` and `axisDurationData`:

```ts
const axisConversionData = [
  { week: 1, rate: 0.021 },
  { week: 2, rate: 0.024 },
  { week: 3, rate: 0.023 },
  { week: 4, rate: 0.028 },
  { week: 5, rate: 0.031 },
  { week: 6, rate: 0.029 },
  { week: 7, rate: 0.034 },
  { week: 8, rate: 0.036 },
  { week: 9, rate: 0.033 },
  { week: 10, rate: 0.038 },
];
```

```ts
const axisDurationData = [
  { page: 'Home', seconds: 95 },
  { page: 'Pricing', seconds: 210 },
  { page: 'Docs', seconds: 1260 },
  { page: 'Tutorials', seconds: 3020 },
  { page: 'Webinars', seconds: 4410 },
];
```

### Number formats

`numberFormat` formats `linear` labels. It takes a preset or any [d3-format](https://d3js.org/d3-format) specifier:

| `numberFormat` | Example |
| --- | --- |
| `shortNumber` (default) | `1.2M` |
| `standardNumber` | `1,200,000` |
| `shortCurrency` | `$1.2M` |
| `currency` | `$1,200,000.00` |
| `,.0f`, `.2s`, `$,.0f` | `1,200,000`, `1.2M`, `$1,200,000` |

`locale` on `Chart` changes the separators and currency symbol, so `de-DE` writes `1.200.000,00 €`.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisRevenueData}>
  <Axis position="left" baseline />
  <Axis position="bottom" grid title="Revenue" />
  <Bar dimension="region" metric="revenue" orientation="horizontal" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `numberFormat` on `Axis`: `shortNumber`, `standardNumber`, `shortCurrency`, `currency`, `,.0f`, `.2s` or `$,.0f`. Shown: `shortNumber`.
-   `currencyCode` on `Axis`: `none`, `USD`, `EUR`, `GBP` or `JPY`. Shown: `none`.
-   `currencyLocale` on `Axis`: `none`, `en-US`, `de-DE`, `fr-FR` or `ja-JP`. Shown: `none`.
-   `locale` on `Chart`: `en-US`, `de-DE` or `fr-FR`. Shown: `en-US`.

```ts
const axisRevenueData = [
  { region: 'North America', revenue: 1284500 },
  { region: 'Europe', revenue: 942300 },
  { region: 'Asia Pacific', revenue: 615800 },
  { region: 'Latin America', revenue: 238400 },
  { region: 'Middle East and Africa', revenue: 129900 },
];
```

> **Limited support:**
> 
> `currencyCode` and `currencyLocale` override the chart locale's currency symbol and its position. Both are required, and they only apply with `numberFormat="currency"` or a fixed-decimal specifier such as `,.0f`. Support for these props is limited; prefer the chart `locale` when it gives the right currency.

`numberFormat="percentage"` multiplies values by 100. For rates stored as fractions, use `labelFormat="percentage"` instead.

### Time and granularity

With `labelFormat="time"`, `granularity` sets the unit for each tick (default `day`). A bottom or top time axis shows two rows: the unit on the first row and the next larger unit on the second, written once each time it changes.

| `granularity` | First row | Second row |
| --- | --- | --- |
| `second` | `:05` | `9:00 AM` |
| `minute` | `9:10 AM` | `Mar 3` |
| `hour` | `6 PM` | `Mar 3` |
| `day` | `14` | `Mar` |
| `week` | `14` | `Mar` |
| `month` | `Mar` | `2025` |
| `quarter` | `Q1` | `2025` |
| `year` | `2025` |  |

Labels use the browser's time zone. A `Bar` with a `datetime` dimension gets the same labels on its band axis. A left or right time axis, as on a horizontal bar chart, uses one row, such as `Mar 3`, `4`, `5`.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `granularity` on `Axis`: `minute`, `hour`, `day`, `week`, `month`, `quarter` or `year`. Shown: `day`.
-   **mark** (Chart): `Line` or `Bar`. Shown: `Line`.

With **mark** set to `Bar`:

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" />
  <Bar dimension="datetime" metric="visits" />
</Chart>
```

> **Caution:**
> 
> `tickCountLimit` and `tickCountMinimum` on a time axis replace the granularity's tick interval and can repeat labels, such as `Q1 Q1 Q2`. Match the tick count to the data if you set them.

## Range

`range` fixes the minimum and maximum of a linear or time axis, such as `[0, 0.05]`, instead of fitting the data. It is ignored on band scales.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisConversionData}>
  <Axis position="left" grid labelFormat="percentage" />
  <Axis position="bottom" baseline title="Week" />
  <Line dimension="week" metric="rate" scaleType="linear" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `range` on `Axis`: `none`, `0, 0.05`, `0, 0.1` or `0.02, 0.04`. Shown: `none`.

## Tick count

These props apply when ticks are spaced automatically:

-   `tickCountMinimum` sets the minimum number of ticks.
-   `tickCountLimit` sets the maximum, not counting the base tick: `0, 1, 2, 3` counts as 3.
-   `tickMinStep` sets the smallest step between ticks in data units, so `1` keeps a week axis on whole weeks. It only applies to linear scales.

Vega rounds to readable values, so the final count can differ slightly.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisConversionData}>
  <Axis position="left" grid labelFormat="percentage" />
  <Axis position="bottom" baseline ticks title="Week" />
  <Line dimension="week" metric="rate" scaleType="linear" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `tickCountMinimum` on `Axis` (Left axis): 0 to 12, in steps of 1. Shown: `0`.
-   `tickCountLimit` on `Axis` (Left axis): 0 to 12, in steps of 1. Shown: `0`.
-   `tickMinStep` on `Axis` (Bottom axis): 0 to 5, in steps of 1. Shown: `0`.

## Label layout

-   `labelOrientation="vertical"` rotates labels 90° to fit long category names.
-   `labelAlign` sets the label's alignment to its tick (default `center`). On a band axis, `start` and `end` move labels to the edges of the band.
-   `labelFontWeight` sets `normal` or `bold`.
-   `truncateLabels` cuts category labels that are wider than their band, ending them with an ellipsis. It works on bottom and top band axes with horizontal labels.
-   `labelLimit` sets the maximum label length in pixels (default `180`).

Labels that would overlap are hidden, so long names without truncation can lose every other label.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisRevenueData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Bar dimension="region" metric="revenue" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `labelOrientation` on `Axis`: `horizontal` or `vertical`. Shown: `horizontal`.
-   `labelAlign` on `Axis`: `start`, `center` or `end`. Shown: `center`.
-   `labelFontWeight` on `Axis`: `normal` or `bold`. Shown: `normal`.
-   `truncateLabels` on `Axis`: `true` or `false`. Shown: `false`.
-   `labelLimit` on `Axis`: 40 to 180, in steps of 20. Shown: `180`.

## Custom labels

`labels` replaces the automatic labels with your own list. Pass values to label specific ticks, or `{ value, label, align, fontWeight }` objects to also change the text and style. `numberFormat` isn't applied to custom labels, so write the text you want in `label`.

`hideDefaultLabels` hides an axis's labels while keeping its gridlines and title.

`subLabels` adds a second row under specific labels as `{ value, subLabel, align, fontWeight }` objects. Labels with no sublabel show nothing on the second row. Sublabels only appear when labels are horizontal.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" grid />
  <Axis
    position="bottom"
    baseline
    subLabels={[{ value: 'Chrome', subLabel: 'Blink' }, { value: 'Edge', subLabel: 'Blink' }, { value: 'Firefox', subLabel: 'Gecko' }, { value: 'Safari', subLabel: 'WebKit' }, { value: 'Explorer', subLabel: 'Trident' }]}
  />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `labels` on `Axis` (Left axis): `none`, `values` or `label objects`. Shown: `none`.
-   `hideDefaultLabels` on `Axis` (Left axis): `true` or `false`. Shown: `false`.
-   `subLabels` on `Axis` (Bottom axis): `true` or `false`. Shown: `true`.

> **Note:**
> 
> `hideDefaultLabels` also hides labels set with `labels`. Use one or the other.

## ReferenceLine

`ReferenceLine` is a child of a value `Axis`, such as a line chart's left axis. It draws a line across the plot at a `value`, with an optional `label`, to mark a threshold like a target. The line has carets at both ends.

-   `size` sets the stroke and caret size: `XS`, `S`, `M`, or `L`. When it isn't set, the size follows the chart width.
-   `secondary` draws a thin 1px line without carets. With `size="XS"`, its line and label are also a lighter gray.

```jsx
import {
  Axis,
  Chart,
  Line,
  ReferenceLine,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisVisitsData}>
  <Axis position="left" grid>
    <ReferenceLine value={2500} label="Target" />
  </Axis>
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `value` on `ReferenceLine`: 0 to 3000, in steps of 100. Shown: `2500`.
-   `label` on `ReferenceLine`: any text. Shown: `Target`.
-   `size` on `ReferenceLine`: `auto`, `XS`, `S`, `M` or `L`. Shown: `auto`.
-   `secondary` on `ReferenceLine`: `true` or `false`. Shown: `false`.

## AxisThumbnail

`AxisThumbnail` is a child of `Axis` that shows an image next to each label on a band axis. The image URL comes from the data field named by `urlKey` (default `thumbnail`). Images are up to 42px square, shrink with the band, and are hidden when the band is narrower than 16px. Combine with `hideDefaultLabels` to show images only.

```jsx
import {
  Axis,
  AxisThumbnail,
  Bar,
  Chart,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline>
    <AxisThumbnail />
  </Axis>
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `orientation` on `Bar`: `vertical` or `horizontal`. Shown: `vertical`.
-   `hideDefaultLabels` on `Axis`: `true` or `false`. Shown: `false`.

## Interaction

### Label tooltips

`hasTooltip` shows a tooltip with the full label value when a label is hovered, which helps with `truncateLabels` or `labelLimit`. `tooltipText` overrides the text for listed values as `{ value, text }` objects; set `text` to `null` to show no tooltip for a value.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisRevenueData}>
  <Axis position="left" grid />
  <Axis
    position="bottom"
    baseline
    truncateLabels
    hasTooltip
    tooltipText={[{ value: 'Middle East and Africa', text: 'Middle East and Africa (EMEA South)' }, { value: 'Europe', text: null }]}
  />
  <Bar dimension="region" metric="revenue" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `hasTooltip` on `Axis`: `true` or `false`. Shown: `true`.
-   `tooltipText` on `Axis`: `none` or `custom`. Shown: `custom`.

### Label clicks and hover

`onClick` runs when a label is clicked, with the mouse event, the label's value, and its index. It doesn't run when `hideDefaultLabels` is set.

When a `Bar` is interactive, for example with `ChartInspect`, hovering a label on its category axis highlights that category's bars and fades the other labels.

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartInspect,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={axisBrowserData}>
  <Title text="Selected: none" />
  <Axis position="left" grid />
  <Axis
    position="bottom"
    baseline
    onClick={(event, value) => setSelected(value)}
  />
  <Bar dimension="browser" metric="downloads">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.browser}: {datum.downloads.toLocaleString()} downloads
        </div>
      )}
    </ChartInspect>
  </Bar>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `onClick` on `Axis`: `true` or `false`. Shown: `true`.
-   `ChartInspect`: included or left out. Shown: included.

> **Note:**
> 
> Time axes (`labelFormat="time"`) don't support `labels`, `hasTooltip`, or `onClick`.

## API

### Axis

> **Caution:**
> 
> Don't set `name` on `Axis`. It's currently used as the axis's scale name, which stops the chart from rendering.

| Prop | Type | Default |
| --- | --- | --- |
| `axisAnnotations` | `AxisAnnotationOptions[]` | – |
| `baseline` — Draws a solid baseline along the axis. | `boolean` | `false` |
| `baselineOffset` — Value on the opposite linear scale where the baseline is drawn; ignored without `baseline` or when that scale is categorical. | `number` | `0` |
| `children` — Child components that add supplemental content to the axis | `AxisChild` | – |
| `currencyCode` — Limited support: currency code, such as `EUR`, that overrides the chart locale's symbol; requires `currencyLocale`. | `string` | – |
| `currencyLocale` — Limited support: locale for the currency symbol's position, such as `de-DE`; requires `currencyCode` and `numberFormat="currency"` or a `,.Nf` specifier. | `string` | – |
| `granularity` — Time unit for the ticks and labels of a time axis; ignored on other axes. | `Granularity` | `'day'` |
| `grid` — Draws a gridline across the plot at each tick. | `boolean` | `false` |
| `hasTooltip` — Shows a tooltip with the full label value when a label is hovered; not supported on time axes. | `boolean` | `false` |
| `hideDefaultLabels` — Hides the axis labels, including any set with `labels`. | `boolean` | `false` |
| `labelAlign` — Alignment of each label relative to its tick. | `"center" \| "start" \| "end"` | `'center'` |
| `labelFontWeight` — Font weight of the axis labels. | `FontWeight` | `'normal'` |
| `labelFormat` — How label values are written: `linear` numbers, `percentage` fractions, `duration` seconds, or `time` dates. | `"duration" \| "linear" \| "percentage" \| "time"` | `'linear'` |
| `labelLimit` — Maximum label length in pixels; longer labels end with an ellipsis. | `number` | `180` |
| `labelOrientation` — Orientation of the axis labels; `vertical` rotates them 90°. | `"vertical" \| "horizontal"` | `'horizontal'` |
| `labels` — Labels to show instead of the automatic ones, as values or `{ value, label, align, fontWeight }` objects; not supported on time axes. | `(string \| number \| Label)[]` | – |
| `name` — Sets the name of the component. | `string` | – |
| `numberFormat` — Format for `linear` labels: `shortNumber`, `standardNumber`, `currency`, `shortCurrency`, or a d3-format specifier. | `string` | `'shortNumber'` |
| `onClick` — Called with the mouse event, label value, and label index when an axis label is clicked; not supported on time axes. | `AxisLabelClickCallback` | – |
| `position`required — Side of the chart the axis is drawn on; bottom and top label the x scale, left and right the y scale. | `"top" \| "bottom" \| "left" \| "right"` | – |
| `range` — Fixed minimum and maximum axis values, such as `[-10, 10]`; only for linear and time scales. | `[number, number]` | `'undefined'` |
| `subLabels` — Second row of labels under specific values, as `{ value, subLabel, align, fontWeight }` objects; horizontal labels only. | `SubLabel[]` | – |
| `tickCountLimit` — Maximum number of ticks, not counting the base tick; on time axes it replaces the granularity interval and can repeat labels. | `number` | `'undefined'` |
| `tickCountMinimum` — Minimum number of ticks when ticks are spaced automatically. | `number` | `'undefined'` |
| `tickMinStep` — Smallest step between ticks in data units, such as `1` for whole numbers; only for linear scales. | `number` | `'undefined'` |
| `ticks` — Draws a tick mark at each label. | `boolean` | `false` |
| `title` — Axis title; an array of strings makes a multi-line title. | `string \| string[]` | `'undefined'` |
| `tooltipText` — Tooltip text for specific values as `{ value, text }` objects; `text: null` hides that value's tooltip. | `AxisTooltip[]` | `'undefined'` |
| `truncateLabels` — Cuts category labels wider than their band on bottom and top band axes. | `boolean` | `false` |

### ReferenceLine

| Prop | Type | Default |
| --- | --- | --- |
| `label` — Label shown below the line at the right edge. | `string` | – |
| `position` — Places the line on a category's center, or before or after it; only for band scales. | `"center" \| "before" \| "after"` | `'center'` |
| `secondary` — Draws the line without carets, in a lighter color at `XS` size. | `boolean` | `false` |
| `size` — Stroke and caret size; when omitted, the size follows the chart width. | `"XS" \| "S" \| "M" \| "L"` | – |
| `value`required — The value on the axis where the reference line should be drawn. | `string \| number` | – |

### AxisThumbnail

| Prop | Type | Default |
| --- | --- | --- |
| `urlKey` — Data field that holds each category's image URL. | `string` | `'thumbnail'` |

> **Note:**
> 
> `AxisAnnotation` from the Spectrum 1 package isn't available in Spectrum 2.
