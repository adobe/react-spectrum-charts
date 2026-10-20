# Legend

**Stage:** Alpha

A legend names each series in a chart and shows the color and symbol that represents it. Add `Legend` as a child of `Chart`, next to the marks. The plot shrinks to make room for it. `isToggleable` lets users click an entry to hide or show its series, and `highlight` fades the other series while an entry is hovered.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend title="Channel" isToggleable highlight />
</Chart>
```

## Data

The legend reads its entries from the chart's data and marks, so it has no data of its own. Most examples on this page draw one line per marketing channel from `legendVisitsData`:

```ts
const legendVisitsData = [
  { day: 'Mon', channel: 'Search', visits: 820 },
  { day: 'Tue', channel: 'Search', visits: 932 },
  { day: 'Wed', channel: 'Search', visits: 901 },
  { day: 'Thu', channel: 'Search', visits: 934 },
  { day: 'Fri', channel: 'Search', visits: 1290 },
  { day: 'Mon', channel: 'Social', visits: 620 },
  { day: 'Tue', channel: 'Social', visits: 732 },
  { day: 'Wed', channel: 'Social', visits: 701 },
  { day: 'Thu', channel: 'Social', visits: 834 },
  { day: 'Fri', channel: 'Social', visits: 1090 },
  { day: 'Mon', channel: 'Email', visits: 320 },
  { day: 'Tue', channel: 'Email', visits: 332 },
  { day: 'Wed', channel: 'Email', visits: 401 },
  { day: 'Thu', channel: 'Email', visits: 334 },
  { day: 'Fri', channel: 'Email', visits: 390 },
  { day: 'Mon', channel: 'Direct', visits: 220 },
  { day: 'Tue', channel: 'Direct', visits: 282 },
  { day: 'Wed', channel: 'Direct', visits: 191 },
  { day: 'Thu', channel: 'Direct', visits: 234 },
  { day: 'Fri', channel: 'Direct', visits: 290 },
];
```

```tsx
<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend />
</Chart>
```

Donut legends work the same way; see [Donut legends](/react-spectrum-charts/s2/docs/docs/donut#legend) for how they interact with `DonutSummary` and segment hiding.

## Position and alignment

`position` puts the legend on the `bottom` (default), `top`, `left`, or `right` of the plot. Bottom and top legends lay their entries out in rows and wrap onto more rows when they don't fit. Left and right legends stack their entries in a column.

`align` anchors the legend along its edge. Its meaning depends on `position`:

| `position` | `align: 'start'` | `align: 'middle'` | `align: 'end'` |
| --- | --- | --- | --- |
| `'bottom'` / `'top'` | left-aligned (default) | centered | right-aligned |
| `'left'` / `'right'` | top-aligned | centered (default) | bottom-aligned |

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend />
</Chart>
```

## Title

`title` adds a heading above the entries. Long titles widen a side legend, which narrows the plot; `titleLimit` caps the title's width in pixels and truncates it with an ellipsis.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend
    position="right"
    title="Marketing channel (last 7 days)"
    titleLimit={120}
  />
</Chart>
```

## Entries

The legend has one entry for each unique value of the fields the marks use for color, line type, opacity, or symbol shape. When a mark uses more than one of these fields, each combination gets an entry, named with the values joined by `|`, for example `Search | This week`.

### Hiding entries

`hiddenEntries` removes entries from the legend by name. The series still draws in the chart. To hide the series itself, see [Hiding series](#hiding-series).

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend hiddenEntries={['Direct']} />
</Chart>
```

### Labels

Entries show the series name by default. `legendLabels` replaces it with a display label, matched by `seriesName`. Series without a label keep their name.

```ts
const legendChannelLabels = [
  { seriesName: 'Search', label: 'Organic and paid search' },
  { seriesName: 'Social', label: 'Social media referrals' },
  { seriesName: 'Email', label: 'Email campaigns' },
  { seriesName: 'Direct', label: 'Direct traffic' },
];
```

`labelLimit` caps a label's width in pixels (default 184) and truncates longer labels with an ellipsis. In bottom and top legends it also sets the column width, so a smaller limit fits more entries per row.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend legendLabels={legendChannelLabels} />
</Chart>
```

### keys

`keys` limits the entries to the fields you list. Here, `legendPeriodData` has a line for each channel and week: `color` is set by channel and `lineType` by week. Without `keys` the legend lists all four combinations. `keys={['channel']}` lists only the channels, and `keys={['period']}` lists only the weeks.

```ts
const legendPeriodData = [
  { day: 'Mon', channel: 'Search', period: 'This week', visits: 820 },
  { day: 'Tue', channel: 'Search', period: 'This week', visits: 932 },
  { day: 'Wed', channel: 'Search', period: 'This week', visits: 901 },
  { day: 'Thu', channel: 'Search', period: 'This week', visits: 934 },
  { day: 'Fri', channel: 'Search', period: 'This week', visits: 1290 },
  { day: 'Mon', channel: 'Search', period: 'Last week', visits: 760 },
  { day: 'Tue', channel: 'Search', period: 'Last week', visits: 810 },
  { day: 'Wed', channel: 'Search', period: 'Last week', visits: 845 },
  { day: 'Thu', channel: 'Search', period: 'Last week', visits: 880 },
  { day: 'Fri', channel: 'Search', period: 'Last week', visits: 1010 },
  { day: 'Mon', channel: 'Email', period: 'This week', visits: 320 },
  { day: 'Tue', channel: 'Email', period: 'This week', visits: 332 },
  { day: 'Wed', channel: 'Email', period: 'This week', visits: 401 },
  { day: 'Thu', channel: 'Email', period: 'This week', visits: 334 },
  { day: 'Fri', channel: 'Email', period: 'This week', visits: 390 },
  { day: 'Mon', channel: 'Email', period: 'Last week', visits: 290 },
  { day: 'Tue', channel: 'Email', period: 'Last week', visits: 305 },
  { day: 'Wed', channel: 'Email', period: 'Last week', visits: 350 },
  { day: 'Thu', channel: 'Email', period: 'Last week', visits: 318 },
  { day: 'Fri', channel: 'Email', period: 'Last week', visits: 342 },
];
```

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendPeriodData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line
    dimension="day"
    metric="visits"
    color="channel"
    lineType="period"
    scaleType="point"
  />
  <Legend keys={['channel']} />
</Chart>
```

## Symbols

Each entry's symbol matches its series: the color, line type, and opacity of the mark it represents. Symbol props on `Legend` override that for the legend only. Each takes a field name from the data or a static value such as `{ value: 'circle' }`:

-   `symbolShape` sets the shape. The default is a rounded square. A field name picks shapes from the chart's `symbolShapes` list, in order; set `symbolShapes` on `Chart` to use more than one shape.
-   `color` sets the fill color, for example `{ value: 'gray-700' }`.
-   `opacity` sets the fill opacity. A low opacity makes the outline easier to see.
-   `lineType` and `lineWidth` set the symbol's outline.

To change the colors, line types, or shapes for the whole chart, use `colors`, `lineTypes`, and `symbolShapes` on `Chart` instead.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend symbolShape={{ value: 'circle' }} />
</Chart>
```

## Hiding series

### Toggleable legends

With `isToggleable`, clicking an entry hides its series and clicking again shows it. The hidden entry's symbol turns into a crossed-out eye icon and its label stays at full strength, so the entry still reads clearly. `defaultHiddenSeries` lists series to hide when the chart first renders; after that, the legend tracks hidden series itself.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend isToggleable defaultHiddenSeries={['Email']} />
</Chart>
```

### Controlled hidden series

`hiddenSeries` on `Chart` hides series from outside the chart, for example from a filter control. The legend shows the eye icon and grays the label for each hidden series. Don't combine it with `isToggleable`: a toggleable legend tracks its own hidden series and ignores `hiddenSeries`.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData} hiddenSeries={['Email']}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend />
</Chart>
```

To let users toggle series from the legend while your app owns the state, handle `onClick` and pass the result to `hiddenSeries`:

```tsx
const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

const toggleSeries = (seriesName: string) =>
  setHiddenSeries((hidden) =>
    hidden.includes(seriesName) ? hidden.filter((name) => name !== seriesName) : [...hidden, seriesName]
  );

<Chart data={legendVisitsData} hiddenSeries={hiddenSeries}>
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend onClick={toggleSeries} />
</Chart>;
```

## Highlighting

`highlight` fades the other series and their entries while an entry is hovered. The legend also follows highlighting from elsewhere:

-   `highlightedSeries` on `Chart` highlights a series from outside the chart, for example from a table row.
-   With `ChartInspect` on a mark, hovering a series fades the other legend entries.

In this example the table below the chart drives `highlightedSeries`: hover a row to highlight that channel, or select a row to keep it highlighted. Hovering a legend entry bolds its row, using the legend's `onMouseOver` and `onMouseOut`. The code panel shows only the chart.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend
    highlight
    onMouseOver={(seriesName) => setHoveredSeries(seriesName)}
    onMouseOut={() => setHoveredSeries(undefined)}
  />
</Chart>
```

## Descriptions

`descriptions` shows a tooltip when an entry is hovered. Each description is matched by `seriesName` and can have an optional `title`, which replaces the series name as the tooltip heading.

```ts
const legendChannelDescriptions = [
  { seriesName: 'Search', description: 'Visits from search engine results.' },
  { seriesName: 'Social', title: 'Social media', description: 'Visits from links shared on social networks.' },
  { seriesName: 'Email', description: 'Visits from newsletter and campaign links.' },
  { seriesName: 'Direct', description: 'Visits with no referrer, like typed URLs and bookmarks.' },
];
```

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend descriptions={legendChannelDescriptions} />
</Chart>
```

> **Note:**
> 
> Give every entry a description. An entry without one shows an empty tooltip ([#1011](https://github.com/adobe/react-spectrum-charts/issues/1011)).

## Events

`onClick`, `onMouseOver`, and `onMouseOut` receive the entry's series name. Use them to sync the legend with other parts of your app. Entries show a pointer cursor when the legend has `onClick`, a popover, or `isToggleable`. With `isToggleable`, `onClick` fires in addition to the toggle.

In this example the table below the chart shows the last event each entry received. Clicking an entry selects its row and sets `highlightedSeries`; selecting a row does the same from the table side. Turn the event controls off to see which events stop reaching the table.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend
    onClick={(seriesName) => setSelectedSeries(seriesName)}
    onMouseOver={(seriesName) => setHoveredSeries(seriesName)}
    onMouseOut={() => setHoveredSeries(undefined)}
  />
</Chart>
```

## ChartPopover

Add a `ChartPopover` as a child of `Legend` to open a popover from an entry. Its children function receives a datum whose `value` is the series name, and a `close` function. Clicking an entry with a popover opens the popover instead of toggling the series; set `rightClick` on `ChartPopover` to open it on right-click and keep left-click for `isToggleable`. Build the content from Spectrum 2 components such as `Heading`, `Content`, `Text`, and `Button`.

```jsx
import {
  Axis,
  Chart,
  ChartPopover,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Button,
  ButtonGroup,
  Content,
  Heading,
  Text,
} from '@react-spectrum/s2';

<Chart data={legendVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="day" metric="visits" color="channel" scaleType="point" />
  <Legend>
    <ChartPopover width="auto">
      {(datum, close) => (
        <>
          <Heading level={4}>{datum.value}</Heading>
          <Content>
            <Text>Open the {datum.value} channel report</Text>
          </Content>
          <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
            <Button variant="secondary" size="S" onPress={close}>Close</Button>
          </ButtonGroup>
        </>
      )}
    </ChartPopover>
  </Legend>
</Chart>
```

## Sizing

The legend takes its space from the chart, so the plot gets smaller as the legend grows. Long labels, titles, and extra rows all shrink the plot. On small charts, keep labels short, set `labelLimit` and `titleLimit`, or move the legend to the bottom. Very small charts can still clip the legend or leave little room for the plot ([#1010](https://github.com/adobe/react-spectrum-charts/issues/1010)).

> **Note:**
> 
> The S2 `Legend` doesn't support these S1 props yet: `_preferredColumns` and `_maxRows` (row limits with pagination) and `_labelWrap`.

## API

| Prop | Type | Default |
| --- | --- | --- |
| `align` — Alignment along the legend's edge: left to right for bottom/top legends, top to bottom for left/right legends. Defaults to `'start'` for bottom/top and `'middle'` for left/right. | `"start" \| "end" \| "middle"` | – |
| `chartPopovers` | `ChartPopoverOptions[]` | – |
| `children` — `ChartPopover` to open when an entry is clicked. | `ChartPopover` | – |
| `color` — Symbol color: a data field to facet by, or a static value like `{ value: 'gray-700' }`. Defaults to the marks' color. | `ColorFacet` | – |
| `defaultHiddenSeries` — Series hidden when the chart first renders, for a toggleable legend (uncontrolled). | `string[]` | – |
| `descriptions` — Tooltip text for each entry, matched by `seriesName`; `title` replaces the series name as the heading. | `LegendDescription[]` | – |
| `hiddenEntries` — Series names to leave out of the legend. Their marks still render. | `string[]` | – |
| `highlight` — Fades the other series while an entry is hovered. | `boolean` | `false` |
| `isToggleable` — Lets users click an entry to hide or show its series (uncontrolled). | `boolean` | `false` |
| `keys` — Data fields to generate entries from. Defaults to every field the marks facet by. | `string[]` | – |
| `labelLimit` — Max label width in pixels before truncating; also sets the column width of bottom/top legends. | `number` | `184` |
| `legendLabels` — Display labels for entries, matched by `seriesName`. | `LegendLabel[]` | – |
| `lineType` — Symbol outline line type: a data field to facet by, or a static value like `{ value: 'dashed' }`. | `LineTypeFacet` | – |
| `lineWidth` — Symbol outline width: a data field to facet by, or a static value like `{ value: 'L' }`. | `LineWidthFacet` | – |
| `name` — Sets the name of the component. | `string` | – |
| `onClick` — Called with the entry's series name when an entry is clicked. | `((seriesName: string) => void)` | – |
| `onMouseOut` — Called with the entry's series name when the pointer leaves an entry. | `((seriesName: string) => void)` | – |
| `onMouseOver` — Called with the entry's series name when the pointer enters an entry. | `((seriesName: string) => void)` | – |
| `opacity` — Symbol fill opacity: a data field to facet by, or a static value like `{ value: 0.5 }`. | `OpacityFacet` | – |
| `position` — Side of the plot the legend is placed on. | `"top" \| "bottom" \| "left" \| "right"` | `'bottom'` |
| `symbolShape` — Symbol shape: a data field that picks from the chart's `symbolShapes`, or a static value like `{ value: 'circle' }`. Defaults to a rounded square. | `SymbolShapeFacet` | – |
| `title` — Heading shown above the entries. | `string` | – |
| `titleLimit` — Max title width in pixels before truncating. | `number` | – |
