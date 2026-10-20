# Chart

**Stage:** Alpha

`Chart` is the container for every chart. It takes the data, size, colors, and locale, and holds state shared by its children, like hidden and highlighted series. Marks (`Line`, `Bar`, `Donut`, and others), `Axis`, `Legend`, and `Title` go inside it as children.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} title="Visits by channel">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

`Chart` needs at least one child, or a Vega spec in `UNSAFE_vegaSpec` (see [Advanced](#advanced)). It throws if it has neither, or both.

## Data

`data` is an array of objects, one per data point. Each mark reads the fields you name in its props. Every example on this page uses `chartTrafficData`:

```ts
const chartTrafficData = [
  { id: 1, datetime: 1772409600000, series: 'Organic search', value: 4210 },
  { id: 2, datetime: 1772496000000, series: 'Organic search', value: 4580 },
  { id: 3, datetime: 1772582400000, series: 'Organic search', value: 4390 },
  { id: 4, datetime: 1772668800000, series: 'Organic search', value: 4820 },
  { id: 5, datetime: 1772755200000, series: 'Organic search', value: 5160 },
  { id: 6, datetime: 1772841600000, series: 'Organic search', value: 4970 },
  { id: 7, datetime: 1772928000000, series: 'Organic search', value: 5340 },
  { id: 8, datetime: 1773014400000, series: 'Organic search', value: 5610 },
  { id: 9, datetime: 1773100800000, series: 'Organic search', value: 5480 },
  { id: 10, datetime: 1773187200000, series: 'Organic search', value: 5890 },
  { id: 11, datetime: 1772409600000, series: 'Paid search', value: 2840 },
  { id: 12, datetime: 1772496000000, series: 'Paid search', value: 3120 },
  { id: 13, datetime: 1772582400000, series: 'Paid search', value: 3460 },
  { id: 14, datetime: 1772668800000, series: 'Paid search', value: 3210 },
  { id: 15, datetime: 1772755200000, series: 'Paid search', value: 3580 },
  { id: 16, datetime: 1772841600000, series: 'Paid search', value: 3920 },
  { id: 17, datetime: 1772928000000, series: 'Paid search', value: 3740 },
  { id: 18, datetime: 1773014400000, series: 'Paid search', value: 3410 },
  { id: 19, datetime: 1773100800000, series: 'Paid search', value: 3650 },
  { id: 20, datetime: 1773187200000, series: 'Paid search', value: 3880 },
  { id: 21, datetime: 1772409600000, series: 'Email', value: 1620 },
  { id: 22, datetime: 1772496000000, series: 'Email', value: 1480 },
  { id: 23, datetime: 1772582400000, series: 'Email', value: 2390 },
  { id: 24, datetime: 1772668800000, series: 'Email', value: 1710 },
  { id: 25, datetime: 1772755200000, series: 'Email', value: 1560 },
  { id: 26, datetime: 1772841600000, series: 'Email', value: 1830 },
  { id: 27, datetime: 1772928000000, series: 'Email', value: 2610 },
  { id: 28, datetime: 1773014400000, series: 'Email', value: 1790 },
  { id: 29, datetime: 1773100800000, series: 'Email', value: 1680 },
  { id: 30, datetime: 1773187200000, series: 'Email', value: 1940 },
];
```

```tsx
<Chart data={chartTrafficData}>
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Axis position="left" grid />
  <Line color="series" />
</Chart>
```

Here `Line` draws a line for each `series`, plotting `value` against `datetime`. `Line` reads `datetime` and `value` by default, so the code only needs to name the `color` field.

### idKey

`idKey` names the field that uniquely identifies each row. The chart adds its own row ID by default, so you only need `idKey` to refer to rows from outside the chart, as with `highlightedItem`:

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} idKey="id" highlightedItem={4}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

### Empty and loading

When `data` is empty, the chart shows an icon and `emptyStateText` (default `No data found`) in place of the chart. `loading` shows a progress circle instead. Both fill the chart's height.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={emptyData} emptyStateText="No visits yet">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

`EmptyState` and `LoadingState` are the components the chart renders for these states. They're exported so you can show the same placeholders outside a chart, for example while fetching data before you render one.

```tsx
<EmptyState height={300} text="No visits yet" />
<LoadingState height={300} />
```

## Size

`width` is a number of pixels, `auto` (the default) to fill the parent's width, or a percentage of the parent's width, like `'75%'`. `height` is a number of pixels (default `300`) or a percentage of the parent's height. The chart resizes when its parent does.

`minWidth` and `maxWidth` clamp an `auto` or percentage width, and `minHeight` and `maxHeight` clamp a percentage height. They don't affect pixel values. In the example below the chart sits in a 512 × 360 `div`.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<div style={{ width: 512, height: 360 }}>
  <Chart data={chartTrafficData}>
    <Axis position="left" grid />
    <Axis position="bottom" labelFormat="time" baseline ticks />
    <Line color="series" />
  </Chart>
</div>
```

> **Note:**
> 
> A percentage `height` only works if the parent has an explicit height. Otherwise the chart has no height to measure against.

The size is the whole chart, including axes, legend, and title; the plot area gets what's left. Some marks also adapt to the chart's width: S below 400 px, M from 400 px, and L from 800 px. For example, line strokes are 1.5, 2, and 2.5 px wide at S, M, and L.

### Padding

`padding` adds space between the chart's edge and its contents, as one number or per side, like `{ top: 8, left: 16 }`. The default is `0`. The padding is inside `width` and `height`.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} padding={24} backgroundColor="gray-100">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

## Color and theme

### colorScheme and backgroundColor

`colorScheme` (`light` or `dark`, default `light`) picks the light or dark value of every Spectrum color token in the chart, including the mark colors, axes, and text. Set it to match your app's theme. `backgroundColor` fills the chart and is a Spectrum color token, like `gray-25`, or a CSS color. The default is `transparent`.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} colorScheme="dark" backgroundColor="gray-25">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

### colors

`colors` sets the palette for any mark's `color` field. It takes a named palette, or a list of Spectrum color tokens or CSS colors. The default palette is `s2Categorical20`; `s2Categorical6`, `s2Categorical12`, and `s2Categorical16` are its first 6, 12, and 16 colors. Colors are assigned to series in the order they appear in `data`, and repeat if there are more series than colors.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} colors={['blue-1000', 'blue-700', 'blue-400']}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

`colors` also takes a 2D list, like `[['blue-1000', 'blue-700'], ['red-1000', 'red-700']]`: a group of colors per series, for marks that encode color with two fields.

### Other scales

Marks can also use a field for line type or opacity. The chart's `lineTypes` and `opacities` set the values for those encodings, the same way `colors` does for color. In the example below, `Line` sets `lineType` and `opacity` to `series`, so each series gets the next line type and opacity in the lists.

```jsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart
  data={chartTrafficData}
  lineTypes={['solid', 'dashed', 'dotted']}
  opacities={[1, 0.6, 0.3]}
>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line lineType="series" opacity="series" />
</Chart>
```

`lineTypes` defaults to `['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash']` and `opacities` to `[1]`. `lineWidths`, `symbolShapes`, and `symbolSizes` work the same way for marks that encode those, like `Scatter`'s `lineWidth` and `size`, and for legend symbols.

### config

`config` is merged into the chart's [Vega config](https://vega.github.io/vega/docs/config/), so you can override styles the component props don't cover. Prefer props where they exist; config keys can change without notice.

## Locale

`locale` sets how numbers and dates are formatted in axes, labels, and default tooltip content. Pass a locale code, like `'de-DE'`, or separate number and time locales, like `{ number: 'de-DE', time: 'en-US' }`. You can also pass a Vega locale object. The default is `en-US`.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} locale="de-DE">
  <Axis position="left" grid numberFormat="standardNumber" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

The axis above uses `numberFormat="standardNumber"` so every tick shows the locale's grouping separator.

## Title and accessibility

`title` adds a title above the chart and is the default file name for `download()`. For more options, use a `Title` child instead. See [Title](/react-spectrum-charts/s2/docs/docs/title).

`description` sets the chart's accessible label (`aria-label`). Describe what the chart shows.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart
  data={chartTrafficData}
  title="Visits by channel"
  description="Daily visits from March 2 to 11 by channel. Organic search leads and grows; email stays lowest."
>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

## Hiding and highlighting

`hiddenSeries` and `highlightedSeries` hide or highlight series from outside the chart, for example to sync the chart with a table. They're controlled: the chart shows what you pass and doesn't change them itself. `highlightedItem` highlights rows by ID (see [idKey](#idkey)).

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} highlightedSeries="Paid search">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

See [Highlighting](/react-spectrum-charts/s2/docs/docs/interaction#highlighting) for how each mark shows highlighting.

## Tooltips

`tooltipAnchor` and `tooltipPlacement` set where `ChartInspect` content appears. By default it follows the cursor. With `tooltipAnchor="mark"` it attaches to the hovered mark, on the side given by `tooltipPlacement` (default `top`).

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData} tooltipAnchor="mark">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.series}: {datum.value.toLocaleString()} visits
        </div>
      )}
    </ChartInspect>
  </Line>
  <Legend />
</Chart>
```

See [ChartInspect and ChartPopover](/react-spectrum-charts/s2/docs/docs/interaction) for the content and behavior of tooltips and popovers.

## Animation

`animationTypes` lists the animations to play. The default, `['hover', 'drawIn']`, eases marks in and out of their faded state when the chart is hovered or highlighted, and animates marks in when the chart first renders. Set `animationTypes={['hover']}` to turn off draw-in only. `animations={false}` turns off every animation.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={chartTrafficData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.series}: {datum.value.toLocaleString()} visits
        </div>
      )}
    </ChartInspect>
  </Line>
  <Legend />
</Chart>
```

If the user prefers reduced motion, draw-in is skipped; hover animation still plays.

> **Note:**
> 
> Line draws in on `time`, `linear`, and `point` scales only.

## Exporting images

Pass a `ref` to get a handle with these methods. Each returns a promise, and rejects if there's no chart to export, for example while loading or when there's no data.

-   `download(fileName?)`: downloads a PNG. The file is named `fileName`, or the `title` if you don't pass one, or `chart_export`, followed by `.png`.
-   `copy()`: copies a PNG to the clipboard.
-   `getBase64Png()`: resolves to the PNG as a base64 data URL.
-   `getSvg()`: resolves to the chart as an SVG string.

```tsx
import { useRef } from 'react';
import { ActionButton } from '@react-spectrum/s2';
import { Axis, Chart, ChartHandle, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';

const ref = useRef<ChartHandle>(null);

<Chart ref={ref} data={chartTrafficData} title="Visits by channel">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
<ActionButton onPress={() => ref.current?.download()}>Download PNG</ActionButton>
<ActionButton onPress={() => ref.current?.copy()}>Copy PNG</ActionButton>
<ActionButton onPress={async () => setSvg(await ref.current?.getSvg())}>Get SVG</ActionButton>
```

## Advanced

-   `renderer`: `svg` (default) or `canvas`. Canvas is faster for large datasets.
-   `debug`: logs the generated Vega spec and inspect data to the console.
-   `onVegaViewReady(view)`: called with the [Vega view](https://vega.github.io/vega/docs/api/view/) whenever it's created or recreated, for example after data changes.
-   `UNSAFE_vegaSpec`: renders a Vega spec you write instead of building one from children. `data` can then also be a list of Vega datasets. You lose the Spectrum defaults the components apply.
-   `dataTestId`: sets `data-testid` on the chart's container.

## API

### Chart

| Prop | Type | Default |
| --- | --- | --- |
| `accessibleNavigation` — Experimental keyboard navigation. Only basic bar charts are supported. | `boolean` | `false` |
| `animations` — Set to `false` to turn off every animation, including hover and draw-in. Draw-in is skipped for users who prefer reduced motion. | `boolean` | – |
| `animationTypes` — Animations to play: `hover`, `drawIn`, or both. | `AnimationType[]` | `['hover', 'drawIn']` |
| `backgroundColor` — Background color of the chart, as a Spectrum color token or CSS color. | `string` | `'transparent'` |
| `children` — Supported child components. | `ChartChild` | – |
| `colors` — Colors for series: a named palette, a list of Spectrum color tokens or CSS colors, or a list of lists when a mark's `color` uses two fields. | `ChartColors` | `'s2Categorical20'` |
| `colorScheme` — Light or dark colors. Set it to match your app, since the chart doesn't read your app's theme. | `"light" \| "dark"` | `'light'` |
| `config` — Vega config for low-level style overrides. @see https://vega.github.io/vega/docs/config/ | `Config` | – |
| `data`required — Rows of data to chart. | `ChartData[]` | – |
| `dataTestId` — Value for the chart container's `data-testid` attribute. | `string` | – |
| `debug` — Logs the generated Vega spec and inspected rows to the console. | `boolean` | `false` |
| `description` — Accessible name for the chart, read by screen readers. Describe what the chart shows. | `string` | – |
| `emptyStateText` — Text to display when the data set is empty and loading is complete. | `string` | `'No data found'` |
| `height` — Chart height in pixels, or a percentage of the container height. | `Height` | `300` |
| `hiddenSeries` — Names of series to hide. | `string[]` | `[]` |
| `highlightedItem` — ID or IDs of rows to highlight. Set `idKey` to a field with a unique value for each row. | `HighlightedItem` | – |
| `highlightedSeries` — Name of the series to highlight. | `string \| number` | – |
| `idKey` — Field with a unique ID for each row. Defaults to an ID the chart adds to each row. | `string` | – |
| `lineTypes` — Line types assigned to series when a mark's `lineType` uses a field. | `LineTypes` | `['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash']` |
| `lineWidths` — Line widths assigned to series when a mark's `lineWidth` uses a field. | `LineWidth[]` | `['M']` |
| `loading` — Shows a loading spinner in place of the chart. | `boolean` | `false` |
| `locale` — Number and time locales for formatting, as a locale code, separate number and time locales, or a Vega locale. | `Locale \| "ar-EG" \| "ar-SY" \| "ca-ES" \| …` | `'en-US'` |
| `maxHeight` — Maximum chart height in pixels when `height` is a percentage. | `number` | – |
| `maxWidth` — Maximum chart width in pixels when `width` is `auto` or a percentage. | `number` | – |
| `minHeight` — Minimum chart height in pixels when `height` is a percentage. | `number` | `100` |
| `minWidth` — Minimum chart width in pixels when `width` is `auto` or a percentage. | `number` | `100` |
| `onVegaViewReady` — Called with the Vega view each time the chart creates one, such as after data or props change. | `((view: View) => void)` | – |
| `opacities` — Opacities assigned to series when a mark's `opacity` uses a field. | `Opacities` | `[1]` |
| `padding` — Space around the chart contents in pixels, as one number or per side. | `Padding` | `0` |
| `ref` — Handle for exporting the chart with `copy`, `download`, `getBase64Png` and `getSvg`. | `Ref<ChartHandle>` | – |
| `renderer` — Draws the chart as `svg` or `canvas`. `canvas` is faster for large data sets but exposes less to screen readers. | `"svg" \| "canvas"` | `'svg'` |
| `symbolShapes` — Shapes assigned to series when a mark's `symbolShape` uses a field. | `SymbolShapes` | `['rounded-square']` |
| `symbolSizes` — Smallest and largest symbol size when a mark's `size` uses a field. | `[SymbolSize, SymbolSize]` | `['XS', 'XL']` |
| `title` — Title shown above the chart. A `Title` child replaces it. | `string` | – |
| `tooltipAnchor` — Whether `ChartInspect` content follows the cursor or anchors to the hovered mark. | `"cursor" \| "mark"` | `'cursor'` |
| `tooltipPlacement` — Where `ChartInspect` content sits relative to the mark when `tooltipAnchor` is `mark`. | `"top" \| "bottom" \| "left" \| "right"` | `'top'` |
| `UNSAFE_vegaSpec` — Vega spec to render instead of building one from children. Can't be combined with children. | `Spec` | – |
| `width` — Chart width in pixels, `auto` to fill the container, or a percentage of the container width. | `Width` | `'auto'` |

### EmptyState

| Prop | Type | Default |
| --- | --- | --- |
| `height` — Height of the empty state in pixels. | `number` | – |
| `text` — Message shown under the icon. | `string` | – |

### LoadingState

| Prop | Type | Default |
| --- | --- | --- |
| `height` — Height of the loading state in pixels. | `number` | – |
