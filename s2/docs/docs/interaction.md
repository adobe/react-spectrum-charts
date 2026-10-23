# ChartInspect and ChartPopover

**Stage:** Alpha

`ChartInspect` shows a tooltip with details about the data point under the pointer. `ChartPopover` opens a popover when a data point is clicked, for content the user can interact with, like links or buttons. Neither renders anything itself: add them as children of a mark, and pass a function as children that returns the content for a data point.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
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

<Chart data={interactionVisitorsData}>
  <Axis position="left" grid title="Visitors" />
  <Axis position="bottom" baseline title="Month" />
  <Line dimension="month" metric="visitors" color="device" scaleType="point">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.device}, {datum.month}: {datum.visitors} visitors
        </div>
      )}
    </ChartInspect>
    <ChartPopover>
      {(datum, close) => (
        <>
          <Heading level={4}>{datum.device}</Heading>
          <Content>
            <Text>{datum.month}: {datum.visitors} visitors</Text>
          </Content>
          <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
            <Button variant="secondary" size="S" onPress={close}>Close</Button>
          </ButtonGroup>
        </>
      )}
    </ChartPopover>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **Mark** (Example): `Line` or `Bar`. Shown: `Line`.
-   `ChartInspect`: included or left out. Shown: included.
-   `highlightBy` on `ChartInspect`: `item`, `series` or `dimension`. Shown: `item`.
-   `ChartPopover`: included or left out. Shown: included.
-   `rightClick` on `ChartPopover`: `true` or `false`. Shown: `false`.

## Data

Most examples on this page use a line chart of `interactionVisitorsData` or a stacked bar chart of `interactionDownloadsData`. Each row has an `id` field, used in [Highlighting](#highlighting).

```ts
const interactionVisitorsData = [
  { id: 'Desktop-Jan', month: 'Jan', device: 'Desktop', visitors: 4200 },
  { id: 'Desktop-Feb', month: 'Feb', device: 'Desktop', visitors: 4800 },
  { id: 'Desktop-Mar', month: 'Mar', device: 'Desktop', visitors: 4500 },
  { id: 'Desktop-Apr', month: 'Apr', device: 'Desktop', visitors: 5300 },
  { id: 'Desktop-May', month: 'May', device: 'Desktop', visitors: 5900 },
  { id: 'Desktop-Jun', month: 'Jun', device: 'Desktop', visitors: 6400 },
  { id: 'Mobile-Jan', month: 'Jan', device: 'Mobile', visitors: 2600 },
  { id: 'Mobile-Feb', month: 'Feb', device: 'Mobile', visitors: 3100 },
  { id: 'Mobile-Mar', month: 'Mar', device: 'Mobile', visitors: 3900 },
  { id: 'Mobile-Apr', month: 'Apr', device: 'Mobile', visitors: 3700 },
  { id: 'Mobile-May', month: 'May', device: 'Mobile', visitors: 4600 },
  { id: 'Mobile-Jun', month: 'Jun', device: 'Mobile', visitors: 5200 },
];
```

```ts
const interactionDownloadsData = [
  { id: 'Chrome-Windows', browser: 'Chrome', os: 'Windows', downloads: 5000 },
  { id: 'Chrome-Mac', browser: 'Chrome', os: 'Mac', downloads: 3000 },
  { id: 'Chrome-Linux', browser: 'Chrome', os: 'Linux', downloads: 1200 },
  { id: 'Firefox-Windows', browser: 'Firefox', os: 'Windows', downloads: 2700 },
  { id: 'Firefox-Mac', browser: 'Firefox', os: 'Mac', downloads: 1500 },
  { id: 'Firefox-Linux', browser: 'Firefox', os: 'Linux', downloads: 1800 },
  { id: 'Safari-Windows', browser: 'Safari', os: 'Windows', downloads: 300 },
  { id: 'Safari-Mac', browser: 'Safari', os: 'Mac', downloads: 4200 },
  { id: 'Safari-Linux', browser: 'Safari', os: 'Linux', downloads: 150 },
  { id: 'Edge-Windows', browser: 'Edge', os: 'Windows', downloads: 2400 },
  { id: 'Edge-Mac', browser: 'Edge', os: 'Mac', downloads: 600 },
  { id: 'Edge-Linux', browser: 'Edge', os: 'Linux', downloads: 200 },
];
```

```tsx
<Chart data={interactionVisitorsData}>
  <Line dimension="month" metric="visitors" color="device" scaleType="point">
    <ChartInspect>{(datum) => <div>{datum.visitors} visitors</div>}</ChartInspect>
    <ChartPopover>
      {(datum, close) => (
        <Button variant="secondary" size="S" onPress={close}>
          Close
        </Button>
      )}
    </ChartPopover>
  </Line>
</Chart>
```

## Content

`ChartInspect` children are a function that takes the hovered data point, `datum`, and returns React content. `ChartPopover` children take the clicked `datum` and a `close` function that closes the popover.

The content can be any React content. The popovers on this page use Spectrum 2 components from `@react-spectrum/s2`, like `Heading`, `Content`, `Text`, and `Button`, except the [Size](#size) example, which uses custom HTML.

`datum` is the row from `data`, plus fields the chart adds:

-   `rscComponentName`: the name of the mark that was hovered or clicked, like `line0` or `bar0`. Use it to tell marks apart when a chart has more than one.
-   `rscMarkId` and `rscSeriesId`: the row's ID and series.
-   `rscGroupData`: the rows in the highlighted group, when [`highlightBy`](#highlightby) isn't `'item'` or the inspect is over a [dimension area](#targets).

Other internal fields, like stack offsets on bars, may also appear. Use **raw datum** below to see everything a mark passes.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={interactionVisitorsData}>
  <Axis position="left" grid title="Visitors" />
  <Axis position="bottom" baseline title="Month" />
  <Line dimension="month" metric="visitors" color="device" scaleType="point">
    <ChartInspect>
      {(datum) => <pre>{JSON.stringify(datum, null, 2)}</pre>}
    </ChartInspect>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **Mark** (Example): `Line` or `Bar`. Shown: `Line`.
-   `children` on `ChartInspect`: `formatted`, `raw datum` or `none`. Shown: `raw datum`.

### Default content

Only [Donut](/react-spectrum-charts/s2/docs/docs/donut#chartinspect-and-chartpopover) has default content: without children, its inspect and popover show the segment's color, name, share of the total, and value. On other marks, an inspect or popover without children shows nothing, although the mark still responds to the pointer.

On `Line`, adding `ChartInspect` turns off the line's built-in hover label, which shows the hovered value on the axis.

## ChartInspect

### Placement

The inspect follows the cursor by default. Set `tooltipAnchor="mark"` on `Chart` to anchor it to the hovered mark instead, and `tooltipPlacement` to place it on the `top` (default), `bottom`, `left`, or `right` of the mark. `tooltipPlacement` only applies when the inspect is anchored to the mark.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={interactionVisitorsData} tooltipAnchor="mark">
  <Axis position="left" grid title="Visitors" />
  <Axis position="bottom" baseline title="Month" />
  <Line dimension="month" metric="visitors" color="device" scaleType="point">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.device}, {datum.month}: {datum.visitors} visitors
        </div>
      )}
    </ChartInspect>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **Mark** (Example): `Line` or `Bar`. Shown: `Line`.
-   `tooltipAnchor` on `Chart`: `cursor` or `mark`. Shown: `mark`.
-   `tooltipPlacement` on `Chart`: `top`, `bottom`, `left` or `right`. Shown: `top`.

### highlightBy

While the inspect is visible, the hovered point stays at full opacity and other points fade. `highlightBy` sets what stays highlighted:

-   `'item'` (default): the hovered point.
-   `'series'`: every point in the hovered point's series (the `color` field).
-   `'dimension'`: every point at the hovered dimension value, like a month or a browser.
-   A list of field names: every point that matches the hovered point on all of those fields, like `['browser', 'os']`.

With any value other than `'item'`, `datum.rscGroupData` holds the rows in the highlighted group, so the inspect can summarize them. The example below counts and totals the group.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={interactionVisitorsData}>
  <Axis position="left" grid title="Visitors" />
  <Axis position="bottom" baseline title="Month" />
  <Line dimension="month" metric="visitors" color="device" scaleType="point">
    <ChartInspect highlightBy="series">
      {(datum) => {
        const group = datum.rscGroupData ?? [datum];
        const total = group.reduce((sum, row) => sum + row.visitors, 0);
        return <div>{group.length} points, {total} visitors</div>;
      }}
    </ChartInspect>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   **Mark** (Example): `Line` or `Bar`. Shown: `Line`.
-   `highlightBy` on `ChartInspect`: `item`, `series` or `dimension`. Shown: `series`.

### targets

On stacked or dodged bars, `targets` sets what shows the inspect. `'item'` (default) is a single bar. `'dimensionArea'` is the whole column for a dimension value, including the padding around its bars; hovering the empty space in a column shows the inspect for that column, with its bars in `datum.rscGroupData`. Pass both to inspect bars and columns.

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={interactionDownloadsData}>
  <Axis position="left" grid title="Downloads" />
  <Axis position="bottom" baseline title="Browser" />
  <Bar dimension="browser" metric="downloads" color="os">
    <ChartInspect targets={['dimensionArea', 'item']}>
      {(datum) => {
        const group = datum.rscGroupData ?? [datum];
        const total = group.reduce((sum, row) => sum + row.downloads, 0);
        return <div>{group.length} bars, {total} downloads</div>;
      }}
    </ChartInspect>
  </Bar>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `targets` on `ChartInspect`: `item`, `dimensionArea` or `dimensionArea, item`. Shown: `dimensionArea, item`.

`targets` only applies to `Bar`. Hovering a bar shows its own inspect even when `targets` leaves out `'item'`.

### excludeDataKeys

`excludeDataKeys` lists fields that turn off the inspect for a row: rows with a truthy value in any of these fields don't show an inspect or fade the rest of the chart. Below, Linux downloads are estimates, flagged with `isEstimate`:

```ts
const interactionEstimatesData = [
  { id: 'Chrome-Windows', browser: 'Chrome', os: 'Windows', downloads: 5000, isEstimate: false },
  { id: 'Chrome-Mac', browser: 'Chrome', os: 'Mac', downloads: 3000, isEstimate: false },
  { id: 'Chrome-Linux', browser: 'Chrome', os: 'Linux', downloads: 1200, isEstimate: true },
  { id: 'Firefox-Windows', browser: 'Firefox', os: 'Windows', downloads: 2700, isEstimate: false },
  { id: 'Firefox-Mac', browser: 'Firefox', os: 'Mac', downloads: 1500, isEstimate: false },
  { id: 'Firefox-Linux', browser: 'Firefox', os: 'Linux', downloads: 1800, isEstimate: true },
  { id: 'Safari-Windows', browser: 'Safari', os: 'Windows', downloads: 300, isEstimate: false },
  { id: 'Safari-Mac', browser: 'Safari', os: 'Mac', downloads: 4200, isEstimate: false },
  { id: 'Safari-Linux', browser: 'Safari', os: 'Linux', downloads: 150, isEstimate: true },
  { id: 'Edge-Windows', browser: 'Edge', os: 'Windows', downloads: 2400, isEstimate: false },
  { id: 'Edge-Mac', browser: 'Edge', os: 'Mac', downloads: 600, isEstimate: false },
  { id: 'Edge-Linux', browser: 'Edge', os: 'Linux', downloads: 200, isEstimate: true },
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

<Chart data={interactionEstimatesData}>
  <Axis position="left" grid title="Downloads" />
  <Axis position="bottom" baseline title="Browser" />
  <Bar dimension="browser" metric="downloads" color="os">
    <ChartInspect excludeDataKeys={['isEstimate']}>
      {(datum) => (
        <div>
          {datum.browser} on {datum.os}: {datum.downloads} downloads
        </div>
      )}
    </ChartInspect>
  </Bar>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `excludeDataKeys` on `ChartInspect`: `none` or `isEstimate`. Shown: `isEstimate`.

## ChartPopover

### Opening and closing

Clicking a data point opens the popover above it. It closes when the user clicks outside it, presses `Escape`, or your content calls `close`. While a popover is open, the clicked point stays highlighted and `ChartInspect` doesn't show.

Set `rightClick` to open the popover on right-click instead of click, for example to show a context menu. A mark can have one click popover and one right-click popover.

> **Note:**
> 
> The popover always opens above the clicked point and moves only to stay on screen. There's no `placement` prop. `UNSAFE_highlightBy` sets what stays highlighted while the popover is open, like `highlightBy` on `ChartInspect`; it's incomplete and may change.

### Size

Without `width`, the popover fits its content. Set `width` to a number of pixels or `'auto'`, and limit it with `minWidth` (default `0`) and `maxWidth`. `height`, `minHeight`, and `maxHeight` work the same way. `contentMargin` (default `12`) is the space between the popover's edge and its content. `containerPadding` (default `12`) is the closest the popover gets to the edge of the window.

This example's popover content is custom HTML with inline styles rather than Spectrum 2 components, to show that the popover takes any React content.

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartPopover,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={interactionDownloadsData}>
  <Axis position="left" grid title="Downloads" />
  <Axis position="bottom" baseline title="Browser" />
  <Bar dimension="browser" metric="downloads" color="os">
    <ChartPopover width={320}>
      {(datum, close) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong>{datum.browser} on {datum.os}</strong>
          <span>{datum.downloads} downloads this quarter. …</span>
          <button onClick={close}>Close</button>
        </div>
      )}
    </ChartPopover>
  </Bar>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `width` on `ChartPopover` (Width): `none`, `auto`, `200` or `320`. Shown: `320`.
-   `minWidth` on `ChartPopover` (Width): 0 to 400, in steps of 20. Shown: `0`.
-   `maxWidth` on `ChartPopover` (Width): `none`, `240` or `400`. Shown: `none`.
-   `height` on `ChartPopover` (Height): `none`, `auto`, `120` or `200`. Shown: `none`.
-   `minHeight` on `ChartPopover` (Height): `none`, `160` or `240`. Shown: `none`.
-   `maxHeight` on `ChartPopover` (Height): `none`, `100` or `160`. Shown: `none`.
-   `contentMargin` on `ChartPopover` (Spacing): 0 to 32, in steps of 4. Shown: `12`.
-   `containerPadding` on `ChartPopover` (Spacing): 0 to 48, in steps of 4. Shown: `12`.

### Callbacks

`onOpenChange` is called with `true` when the popover opens and `false` when it closes. `onClick` on the mark is called with the clicked `datum`; on `Line` and `Bar` it fires along with the popover.

```tsx
<Chart data={interactionDownloadsData}>
  <Bar
    dimension="browser"
    metric="downloads"
    color="os"
    onClick={(datum) => setSelected(datum.id)}
  >
    <ChartPopover onOpenChange={(isOpen) => setIsPopoverOpen(isOpen)}>
      {(datum, close) => <DownloadsDetails datum={datum} onDone={close} />}
    </ChartPopover>
  </Bar>
</Chart>
```

### Legend popovers

`Legend` can have a `ChartPopover` too. Clicking an entry opens it, with the entry's series name in `datum.value` and `datum.rscSeriesId`. A legend with a click popover can't hide series on click.

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

<Chart data={interactionVisitorsData}>
  <Axis position="left" grid title="Visitors" />
  <Axis position="bottom" baseline title="Month" />
  <Line dimension="month" metric="visitors" color="device" scaleType="point" />
  <Legend>
    <ChartPopover>
      {(datum, close) => (
        <>
          <Heading level={4}>{datum.value}</Heading>
          <Content>
            <Text>Open the {datum.value} report</Text>
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

The interactive example has these controls. The code above uses the shown values.

-   `rightClick` on `ChartPopover`: `true` or `false`. Shown: `false`.

## Using both together

A mark can have a `ChartInspect` and a `ChartPopover`. The inspect shows on hover, and clicking opens the popover and hides the inspect until the popover closes. Use the inspect for a quick read of the value and the popover for details and actions.

On `Line`, a click `ChartPopover` can't be combined with a [`ChartActionBar`](/react-spectrum-charts/s2/docs/docs/chart-action-bar): only the action bar renders. Use `rightClick` on the popover to have both.

## Supported marks

| Mark | ChartInspect | ChartPopover |
| --- | --- | --- |
| [Line](/react-spectrum-charts/s2/docs/docs/line) | Yes | Yes |
| [Bar](/react-spectrum-charts/s2/docs/docs/bar) | Yes | Yes |
| [Donut](/react-spectrum-charts/s2/docs/docs/donut#chartinspect-and-chartpopover) | Yes, with default content | Yes, with default content |
| [Legend](/react-spectrum-charts/s2/docs/docs/legend) | No | Yes |
| Area (lab) | Yes | Yes |
| Scatter (lab) | Yes | Yes |
| Bullet (lab) | Yes | No |
| Trendline (lab) | Yes | No |

Lab components are imported from `@spectrum-charts/react-spectrum-charts-s2/lab`. Some marks change how hovering works, like `interactionMode` on `Line`; see each chart's page.

## Highlighting

`ChartInspect` highlights what's under the pointer. To highlight from outside the chart, for example from a table row, use these `Chart` props:

-   `highlightedSeries`: a series value, like `'Mac'`. Other series fade.
-   `highlightedItem`: one row ID or a list of them. Other rows fade.
-   `idKey`: the field that uniquely identifies each row, used by `highlightedItem`. Set it to a field in your data, like `id`.

Hovering the chart overrides these while the pointer is over a mark. The controlled highlight returns when the pointer leaves.

In the example below, the table and the chart share state. Hovering a table row or selecting rows sets `highlightedItem` to that browser's bars. Hovering a bar calls `onMouseOver`, which bolds its value in the table, and clicking a bar calls `onClick`, which selects its browser's row. While a bar is hovered, the chart highlights that bar instead of `highlightedItem`.

```jsx
import {
  Axis,
  Bar,
  Chart,
  ChartInspect,
  Legend,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart
  data={interactionDownloadsData}
  idKey="id"
  highlightedItem={['Safari-Windows', 'Safari-Mac', 'Safari-Linux']}
>
  <Axis position="left" grid title="Downloads" />
  <Axis position="bottom" baseline title="Browser" />
  <Bar
    dimension="browser"
    metric="downloads"
    color="os"
    onMouseOver={(datum) => setHoveredId(datum.id)}
    onMouseOut={() => setHoveredId(undefined)}
    onClick={(datum) => toggleBrowser(datum.browser)}
  >
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.browser} on {datum.os}: {datum.downloads} downloads
        </div>
      )}
    </ChartInspect>
  </Bar>
  <Legend />
</Chart>
```

The code panel shows only the chart. The table is a Spectrum 2 `TableView` that shares state with it:

```tsx
const [selectedBrowsers, setSelectedBrowsers] = useState(new Set(['Safari']));
const [hoveredBrowser, setHoveredBrowser] = useState();
const browsers = hoveredBrowser ? [hoveredBrowser] : [...selectedBrowsers];
const getIds = (browser) => ['Windows', 'Mac', 'Linux'].map((os) => `${browser}-${os}`);

<Chart
  data={interactionDownloadsData}
  idKey="id"
  highlightedItem={browsers.length ? browsers.flatMap(getIds) : undefined}
>
  …
</Chart>

<TableView
  aria-label="Downloads by browser"
  selectionMode="multiple"
  selectedKeys={selectedBrowsers}
  onSelectionChange={setSelectedBrowsers}
>
  <TableHeader>…</TableHeader>
  <TableBody>
    <Row
      id="Chrome"
      onMouseEnter={() => setHoveredBrowser('Chrome')}
      onMouseLeave={() => setHoveredBrowser(undefined)}
    >
      …
    </Row>
    …
  </TableBody>
</TableView>
```

> **Note:**
> 
> On `Line`, `highlightedItem` with a custom `idKey` marks the highlighted point but doesn't fade the other series.

## API

### ChartInspect

| Prop | Type | Default |
| --- | --- | --- |
| `children` — Function that returns the inspect content for the hovered `datum`. | `InspectHandler` | – |
| `excludeDataKeys` — Data keys that turn off the inspect for rows with a truthy value in any of them. | `string[]` | – |
| `highlightBy` — What stays highlighted while the inspect is visible: the item, its series, its dimension value, or rows matching a list of keys. | `string[] \| "dimension" \| "series" \| "item"` | `'item'` |
| `targets` — What shows the inspect on stacked or dodged bars: single bars (`'item'`) and/or whole columns (`'dimensionArea'`). | `("item" \| "dimensionArea")[]` | `['item']` |

### ChartPopover

| Prop | Type | Default |
| --- | --- | --- |
| `children` — Function that returns the popover content for the clicked `datum`; call `close` to close the popover. | `PopoverHandler` | – |
| `containerPadding` — Minimum space in pixels between the popover and the edge of the window. | `number` | `12` |
| `contentMargin` — Space in pixels between the popover's edge and its content. | `number` | `12` |
| `height` — Height of the popover in pixels, or `'auto'`; fits its content when unset. | `number \| "auto"` | – |
| `maxHeight` — Maximum height of the popover in pixels. | `number` | – |
| `maxWidth` — Maximum width of the popover in pixels. | `number` | – |
| `minHeight` — Minimum height of the popover in pixels. | `number` | – |
| `minWidth` — Minimum width of the popover in pixels. | `number` | `0` |
| `onOpenChange` — Called with `true` when the popover opens and `false` when it closes. | `((isOpen: boolean) => void)` | – |
| `rightClick` — Opens the popover on right-click instead of click. | `boolean` | `false` |
| `UNSAFE_highlightBy` — What stays highlighted while the popover is open, like `highlightBy` on ChartInspect; incomplete. | `string[] \| "dimension" \| "series" \| "item"` | `'item'` |
| `width` — Width of the popover in pixels, or `'auto'`; fits its content when unset. | `number \| "auto"` | `250` |
