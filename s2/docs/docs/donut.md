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

> **Note:**
> 
> Semicircles don't support `SegmentLabel`.

### Size

`Chart` fills the width of its container and is 300px tall by default. The donut grows to fit the smaller of the two, so a semicircle in a wide container can be much larger than a full circle at the same height. Use `width`, `height`, `minWidth`, and `maxWidth` on `Chart` to constrain it. `DonutSummary` text scales with the donut.

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
