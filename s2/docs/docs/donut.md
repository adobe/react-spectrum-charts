# Donut

**Stage:** Alpha

Donuts show how categories contribute to a whole. Each data point becomes a segment sized by its `metric` value.

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
  Legend,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Title text="Visitors by browser" />
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
  <Legend title="Browsers" position="right" />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `variant` on `Donut`: `circle` or `semicircle`. Shown: `circle`.
-   `holeRatio` on `Donut`: 0 to 0.95, in steps of 0.05. Shown: `0.85`.
-   `DonutSummary`: included or left out. Shown: included.
-   `position` on `Legend`: `none`, `right`, `bottom`, `left` or `top`. Shown: `right`.
-   `text` on `Title`: any text. Shown: `Visitors by browser`.

## Data

`data` goes on `Chart` as an array of objects, one per segment. On `Donut`, `metric` names the numeric field that sizes each segment (default `value`) and `color` names the field that identifies it in the legend, labels, and tooltips (default `series`). Most examples on this page use `browserData`:

```ts
const browserData = [
  { count: 10390, browser: 'Chrome' },
  { count: 8281, browser: 'Firefox' },
  { count: 7045, browser: 'Safari' },
  { count: 6166, browser: 'Opera' },
  { count: 4201, browser: 'Other' },
];
```

```tsx
<Chart data={browserData}>
  <Donut metric="count" color="browser" />
</Chart>
```

### Boolean data

For a single rate, like a success rate, pass exactly two points whose values sum to 1 and set `isBoolean`. `DonutSummary` then shows the first point as a percentage instead of the total.

```ts
const booleanData = [
  { id: 'Success', value: 0.68 },
  { id: 'Failure', value: 0.32 },
];
```

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={booleanData} colors={['green-800', 'gray-200']}>
  <Donut metric="value" color="id" isBoolean>
    <DonutSummary label="Success rate" />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `label` on `DonutSummary`: any text. Shown: `Success rate`.
-   `hideValue` on `DonutSummary`: `true` or `false`. Shown: `false`.

### Zero, empty, and loading

When every value is 0, the donut draws an empty gray ring and `DonutSummary` shows 0. When `data` is an empty array, `Chart` shows `emptyStateText` instead. Set `loading` on `Chart` to show a spinner while data loads.

```ts
const zeroData = [
  { count: 0, browser: 'Chrome' },
  { count: 0, browser: 'Firefox' },
  { count: 0, browser: 'Safari' },
];
```

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={zeroData}>
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **state**: `all zeros`, `empty` or `loading`. Shown: `all zeros`.
-   `emptyStateText` on `Chart`: any text. Shown: `No browser data`.

With **state** set to `empty`:

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={emptyData} emptyStateText="No browser data">
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
</Chart>
```

With **state** set to `loading`:

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData} loading>
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
</Chart>
```

## Shape

### holeRatio

`holeRatio` is the inner radius as a fraction of the outer radius. The default is `0.85`; `0` renders a pie chart.

```jsx
import {
  Chart,
  Donut,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser" holeRatio={0} />
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `holeRatio` on `Donut`: 0 to 0.95, in steps of 0.05. Shown: `0`.

### Semicircle

`variant="semicircle"` draws the top half of the circle, from 9 o'clock to 3 o'clock. Full circles start at 12 o'clock.

Both variants sort segments largest-first by default. For ordered categories like survey responses, set `sortOrder="data"` to keep the source order. Boolean donuts always use the source order.

```ts
const surveyData = [
  { response: 'Strongly agree', count: 18 },
  { response: 'Agree', count: 32 },
  { response: 'Neutral', count: 24 },
  { response: 'Disagree', count: 16 },
  { response: 'Strongly disagree', count: 10 },
];
```

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={surveyData}>
  <Donut metric="count" color="response" variant="semicircle" sortOrder="data">
    <DonutSummary label="Responses" />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `sortOrder` on `Donut`: `data` or `valueDescending`. Shown: `data`.

> **Note:**
> 
> Semicircles don't support `SegmentLabel`.

### Size

`Chart` fills the width of its container and is 300px tall by default. The donut grows to fit the smaller of the two, so a semicircle in a wide container can be much larger than a full circle at the same height. Use `width`, `height`, `minWidth`, and `maxWidth` on `Chart` to constrain it. Ring width and `DonutSummary` text change with the donut's size; see [Responsive](#responsive).

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData} width={400} height={300}>
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `width` on `Chart`: 120 to 520, in steps of 10. Shown: `400`.
-   `height` on `Chart`: 80 to 400, in steps of 10. Shown: `300`.
-   `variant` on `Donut`: `circle` or `semicircle`. Shown: `circle`.

## DonutSummary

`DonutSummary` shows a label and the sum of all segments in the center of the donut.

-   `numberFormat` formats the value. It accepts `shortNumber`, `standardNumber`, or a [d3-format](https://d3js.org/d3-format) specifier.
-   `delta` adds a change below the label, green when zero or positive and red when negative (`0.025` shows as `+2.5%`).
-   `hideValue` shows only the label.

Numbers follow the chart's `locale`, which also applies to segment labels, `ChartInspect`, and `ChartPopover`.

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `label` on `DonutSummary`: any text. Shown: `Visitors`.
-   `numberFormat` on `DonutSummary`: `shortNumber`, `standardNumber` or `,.2f`. Shown: `shortNumber`.
-   `delta` on `DonutSummary`: `none`, `0.025` or `-0.04`. Shown: `none`.
-   `hideValue` on `DonutSummary`: `true` or `false`. Shown: `false`.
-   `locale` on `Chart`: `en-US`, `de-DE` or `fr-FR`. Shown: `en-US`.

## SegmentLabel

`SegmentLabel` labels each segment with its name and value.

-   `value` and `percent` choose what follows the name; format them with `valueFormat` and `percentFormat`.
-   `swatch` adds the segment color before the name.
-   `showValueRow` adds a smaller row below with the segment's value, and `showTotal` adds the total to that row, like `10,390 / 36,083`.

```jsx
import {
  Chart,
  Donut,
  SegmentLabel,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser">
    <SegmentLabel />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `value` on `SegmentLabel`: `true` or `false`. Shown: `true`.
-   `percent` on `SegmentLabel`: `true` or `false`. Shown: `false`.
-   `swatch` on `SegmentLabel`: `true` or `false`. Shown: `false`.
-   `showValueRow` on `SegmentLabel`: `true` or `false`. Shown: `false`.
-   `showTotal` on `SegmentLabel`: `true` or `false`. Shown: `false`.
-   `valueFormat` on `SegmentLabel`: `standardNumber`, `shortNumber` or `,.0f`. Shown: `standardNumber`.
-   `percentFormat` on `SegmentLabel`: `.0%` or `.1%`. Shown: `.0%`.

Labels sit at the middle of each segment. A label is hidden when it would overlap a label for a larger segment or when its segment is narrower than about 17°. Hovering a segment always shows its label and hides any labels that overlap it.

### labelKey

Labels show the `color` field by default. To show different text, such as a longer display name, set `labelKey` to another field in the data.

```ts
const browserLabelData = [
  { count: 10390, browser: 'Chrome', label: 'Chrome' },
  { count: 8281, browser: 'Firefox', label: 'Mozilla Firefox' },
  { count: 7045, browser: 'Safari', label: 'Apple Safari' },
  { count: 6166, browser: 'Opera', label: 'Opera' },
  { count: 4201, browser: 'Other', label: 'Other browsers' },
];
```

```jsx
import {
  Chart,
  Donut,
  SegmentLabel,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserLabelData}>
  <Donut metric="count" color="browser">
    <SegmentLabel labelKey="label" />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `labelKey` on `SegmentLabel`: `none` or `label`. Shown: `label`.

### Emphasized segments

`emphasizedItems` on `Donut` keeps the listed segments in color and grays out the rest. Add two `SegmentLabel` children with `labelMode="emphasized"` and `labelMode="deemphasized"` to label each group differently, or set `hideDeemphasizedLabels` to label only the emphasized segments.

```jsx
import {
  Chart,
  Donut,
  SegmentLabel,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser" emphasizedItems={['Chrome']}>
    <SegmentLabel labelMode="emphasized" percent value={false} showValueRow />
    <SegmentLabel labelMode="deemphasized" value />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `emphasizedItems` on `Donut`: `Chrome`, `Chrome, Firefox` or `Safari, Opera`. Shown: `Chrome`.
-   `hideDeemphasizedLabels` on `Donut`: `true` or `false`. Shown: `false`.

## Responsive

The Spectrum 2 donut comes in five sizes: XS, S, M, L, and XL. You don't pick a size directly. The chart picks it from the space you give it, and updates it as the chart resizes. Each size changes the ring thickness, the gap between segments, the text sizes, and how much label detail is shown.

The example is this chart in a resizable container. Change `width` and `height` to see each size, and remove `SegmentLabel` to see the sizes without segment labels.

```ts
const browserLongTailData = [
  { count: 10390, browser: 'Chrome' },
  { count: 8281, browser: 'Firefox' },
  { count: 7045, browser: 'Safari' },
  { count: 6166, browser: 'Opera' },
  { count: 4201, browser: 'Other' },
  { count: 3261, browser: 'Brave' },
  { count: 1021, browser: 'Unknown' },
];
```

```jsx
import { Chart, Donut, DonutSummary, SegmentLabel } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserLongTailData} width={472} height={472}>
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
    <SegmentLabel percent value={false} swatch showValueRow />
  </Donut>
</Chart>
```

### How size affects the donut

The size is set by the chart's shorter side. To show a donut at a given size, make the chart at least this tall and this wide:

| Size | Donut diameter | Chart size without segment labels | Chart size with segment labels |
| --- | --- | --- | --- |
| XS | Under 120px | Under 140px | Under 206px |
| S | 120–200px | 140px | 206px |
| M | 200–280px | 220px | 344px |
| L | 280–400px | 300px | 472px |
| XL | 400px and up | 420px | 674px |

-   Without segment labels, the donut has 10px of padding on every side.
-   With segment labels, the donut leaves room on each side for its labels: the size's label gap (see [Segment labels](#segment-labels)) plus 30% of the donut's diameter. The donut stops growing once it reaches the next size's diameter, and stays there until the chart is large enough to switch sizes. Room is reserved even at XS, where labels are hidden.
-   A semicircle only needs half the height, because it's half as tall as a full donut. A semicircle that's 300px wide and 150px tall is size L.
-   Semicircles and boolean donuts don't show segment labels, so they always use the sizes without labels.

### Ring

| Size | Ring thickness | Gap between segments |
| --- | --- | --- |
| XS | 16px | 1px |
| S | 18px | 2px |
| M | 20px | 2px |
| L | 22px | 2px |
| XL | 40px | 2px |

-   These ring thicknesses apply at the default `holeRatio` of `0.85`. With another `holeRatio`, the ring stays proportional to the donut instead.
-   Pies (`holeRatio={0}`) always use a 1px gap.

### DonutSummary

| Size | Value (extra bold) | Label | Delta | Delta on a semicircle |
| --- | --- | --- | --- | --- |
| XS | 18px | 12px | 12px | Hidden |
| S | 20px | 14px | 14px | Hidden |
| M | 22px | 16px | 16px | 16px |
| L | 36px | 20px | 20px | 20px |
| XL | 50px | 24px | 24px | 24px |

-   The summary is hidden when the hole is under 80px across. At the default `holeRatio`, that's a chart under 132px without segment labels, or under 194px with them.
-   Text that doesn't fit in the hole is truncated with an ellipsis.

### Segment labels

Labels appear at size S and show more detail as the donut grows.

| Size | Gap to ring | Name / value (default) | Name / value / value row (`swatch` or `showValueRow`) | Swatch | Value row |
| --- | --- | --- | --- | --- | --- |
| XS | — | Hidden | Hidden | Hidden | Hidden |
| S | 5px | 9 / 12px | 10 / 13.5px | Hidden | Hidden |
| M | 10px | 10.5 / 14px | 12 / 15.75px | 16px | Hidden |
| L | 10px | 12 / 16px | 14 / 18 / 11px | 16px | Shown |
| XL | 15px | 15 / 20px | 16 / 22.5 / 13.75px | 16px | Shown |

-   **Default labels** show the name (regular) above the percent or value (bold), both gray-700.
-   **With `swatch` or `showValueRow`**, labels use larger text: the name (regular, gray-700), then 4px below it the percent or value (extra bold, gray-800). The swatch is a 16px rounded square, 8px from the name. The value row shows the segment's value (extra bold, gray-700), followed by the total (regular) with `showTotal`. If a label is too tall for the donut, the space between its lines shrinks but the text sizes don't.
-   When a segment is hovered, its label's percent or value takes the segment's color.
-   Segments smaller than about 17° of the ring aren't labeled until they're hovered.
-   Labels stay at least 4px apart. When labels would overlap, the hovered segment's label is kept first, then labels for larger segments.
-   Labels stay at least 10px from the chart's left and right edges, and are truncated with an ellipsis if needed.

## Legend

Add `Legend` as a sibling of `Donut` to list the segments. The donut shrinks to make room for it.

-   `isToggleable` lets users click an entry to hide or show its segment. The remaining segments fill the circle and `DonutSummary` updates its total.
-   `highlight` highlights a segment while its entry is hovered.

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
  <Legend title="Browsers" position="right" isToggleable />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `position` on `Legend`: `right`, `bottom`, `left` or `top`. Shown: `right`.
-   `isToggleable` on `Legend`: `true` or `false`. Shown: `true`.
-   `highlight` on `Legend`: `true` or `false`. Shown: `false`.

### Hiding segments

`hiddenSeries` on `Chart` hides segments from outside the chart, for example from a filter control. The remaining segments fill the circle and `DonutSummary` totals only what's visible. To start with segments hidden but let users toggle them, set `defaultHiddenSeries` on a toggleable `Legend` instead.

```jsx
import {
  Chart,
  Donut,
  DonutSummary,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData} hiddenSeries={['Chrome']}>
  <Donut metric="count" color="browser">
    <DonutSummary label="Visitors" />
  </Donut>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `hiddenSeries` on `Chart`: `none`, `Chrome` or `Chrome, Firefox`. Shown: `Chrome`.

## Interaction

### ChartInspect and ChartPopover

Add `ChartInspect` to show details on hover and `ChartPopover` to show details on click. Without children, both show the segment's color, name, share of the total, and value (for Chrome, `28.8% (10.4K)`), formatted with the chart's `locale`. Pass a function as children to render your own content.

`rightClick` on `ChartPopover` opens it on right-click instead of click.

```jsx
import {
  Chart,
  ChartInspect,
  ChartPopover,
  Donut,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Content, Heading, Text } from '@react-spectrum/s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser">
    <ChartInspect />
    <ChartPopover width="auto">
      {(datum) => (
        <>
          <Heading level={4}>{datum.browser}</Heading>
          <Content>
            <Text>{datum.count.toLocaleString()} visitors</Text>
          </Content>
        </>
      )}
    </ChartPopover>
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `ChartInspect`: included or left out. Shown: included.
-   `ChartPopover`: included or left out. Shown: included.
-   `children` on `ChartPopover`: `default` or `custom`. Shown: `custom`.
-   `rightClick` on `ChartPopover`: `true` or `false`. Shown: `false`.

Hovering an interactive segment fades the other segments and their labels. A donut without `ChartInspect`, `ChartPopover`, `SegmentLabel`, or a `Legend` with `highlight` doesn't respond to the pointer.

### Highlighting

`highlightedSeries` on `Chart` highlights a segment from outside the chart, for example from a table row. `highlightedItem` does the same by row ID and can take a list; set `idKey` on `Chart` to the field that uniquely identifies each row. `Legend` with `highlight` highlights a segment when its entry is hovered.

```jsx
import {
  Chart,
  ChartInspect,
  Donut,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser">
    <ChartInspect />
  </Donut>
  <Legend highlight />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `highlightedSeries` on `Chart`: `none`, `Chrome`, `Firefox`, `Safari`, `Opera` or `Other`. Shown: `none`.
-   `highlightedItem` on `Chart`: `none`, `Safari` or `Chrome, Safari`. Shown: `none`.

## Animation

The chart's `animationTypes` lists which animations play. By default, `hover` eases segments in and out of their faded state on hover, and `drawIn` sweeps the segments in over 750ms when the chart mounts. Labels fade in as their segment finishes; `DonutSummary` stays visible throughout.

```jsx
import {
  Chart,
  ChartInspect,
  Donut,
  SegmentLabel,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Donut metric="count" color="browser">
    <ChartInspect />
    <SegmentLabel value />
  </Donut>
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `animationTypes` on `Chart`: `true` or `false`. Shown: `true`.
-   `animationTypes` on `Chart`: `true` or `false`. Shown: `true`.
-   `variant` on `Donut`: `circle` or `semicircle`. Shown: `circle`.
-   `SegmentLabel`: included or left out. Shown: included.

Draw-in plays once when the chart mounts; re-renders, data updates, and resizing don't replay it. Set `animationTypes={['hover']}` to turn off draw-in only, or `animations={false}` to turn off all animation. See [Animation](/react-spectrum-charts/s2/docs/docs/guides/animation).

## API

### Donut

| Prop | Type | Default |
| --- | --- | --- |
| `children` — Supported child components. | `ChartPopover \| ChartInspect \| DonutSummary \| SegmentLabel` | – |
| `color` — Key in the data that is used as the color facet | `string` | `'series'` |
| `emphasizedItems` — Designates which segments (by their `color` facet value) render with full categorical color. Remaining segments render as a solid color swap to gray at full opacity. Their labels stay fully visible and normally colored, unlike Line's `primarySeries` which suppresses non-primary direct labels entirely. | `(string \| number)[]` | – |
| `hideDeemphasizedLabels` — Hides labels for segments not in `emphasizedItems`. | `boolean` | `false` |
| `holeRatio` — Inner radius as a share of the outer radius. `0` draws a pie. | `number` | `0.85` |
| `isBoolean` — Shows the first row's value as a percent in the center. Use with two rows whose values sum to 1. | `boolean` | `false` |
| `metric` — Key in the data that is used as the metric | `string` | `'value'` |
| `name` — Sets the name of the component. | `string` | – |
| `sortOrder` — Categorical segment ordering. Use `data` to preserve source order; boolean donuts always preserve source order. | `"data" \| "valueDescending"` | `'valueDescending'` |
| `variant` — Renders a top-half arc instead of a full circle. Data is automatically sorted descending by `metric` so the largest segment always renders leftmost. `segmentLabels` are not supported and are silently omitted when set to `'semicircle'`. | `"circle" \| "semicircle"` | `'circle'` |

### DonutSummary

| Prop | Type | Default |
| --- | --- | --- |
| `delta` — Sentiment-colored delta (e.g. 0.025 renders as "+2.5%") shown below the label; hidden at XS/S for semicircles. | `number` | – |
| `hideValue` — Hides the value portion of the donut summary, only showing the label | `boolean` | `false` |
| `label` — Label for the metric summary | `string` | – |
| `numberFormat` — d3 number format specifier. Sets the number format for the summary value. see {@link https://d3js.org/d3-format#locale\_format} | `string` | `'shortNumber'` |

### SegmentLabel

| Prop | Type | Default |
| --- | --- | --- |
| `labelKey` — Data field with the segment label text. Defaults to the `Donut` `color` field. | `string` | – |
| `labelMode` — Selects whether the label applies to emphasized or de-emphasized segments. | `"emphasized" \| "deemphasized"` | – |
| `percent` — Shows the donut segment percentage | `boolean` | `false` |
| `percentFormat` — d3 format specifier for the percentage value displayed when `percent` is true. | `string` | `'.0%'` |
| `showTotal` — Appends the total value to the segment value row | `boolean` | `false` |
| `showValueRow` — Shows an additional segment value row below the label | `boolean` | `false` |
| `swatch` — Shows a color swatch before the segment label | `boolean` | `false` |
| `value` — Shows the donut segment metric value | `boolean` | `true` |
| `valueFormat` — d3 number format specifier. Sets the number format for the segment metric value. | `string` | `'standardNumber'` |
