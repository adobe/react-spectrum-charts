# Interactivity

Hover and click behavior comes from the interaction components you add to a mark. This guide explains which one to use, how highlighting and hiding work, and how to drive them from your own state. For props and examples, see [ChartInspect and ChartPopover](/react-spectrum-charts/s2/docs/docs/interaction), [ChartActionBar](/react-spectrum-charts/s2/docs/docs/chart-action-bar), and [Legend](/react-spectrum-charts/s2/docs/docs/legend).

## Choosing an interaction

Interaction components are children of a mark. They render nothing in the chart; they add behavior to the mark they're in.

| Use | When |
| --- | --- |
| [`ChartInspect`](/react-spectrum-charts/s2/docs/docs/interaction#chartinspect) | Show details on hover. Content is read-only. |
| [`ChartPopover`](/react-spectrum-charts/s2/docs/docs/interaction#chartpopover) | Show content on click that users interact with, like links or buttons. |
| [`ChartActionBar`](/react-spectrum-charts/s2/docs/docs/chart-action-bar) | Show a toolbar of actions for a clicked point on a `Line`. |
| Mark callbacks, like `onClick` | Run your own code, like navigating or selecting a row elsewhere. |

A mark can have a `ChartInspect` and a `ChartPopover`: the inspect gives a quick read on hover, and clicking opens the popover. On `Line`, a click popover and an action bar can't share the click; set `rightClick` on the popover to open it on right-click instead.

```tsx
import { Bar, Chart, ChartInspect, ChartPopover } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={data}>
  <Bar dimension="browser" metric="downloads" color="os">
    <ChartInspect>{(datum) => <div>{datum.downloads} downloads</div>}</ChartInspect>
    <ChartPopover>{(datum, close) => <DownloadDetails datum={datum} onDone={close} />}</ChartPopover>
  </Bar>
</Chart>;
```

See [Supported marks](/react-spectrum-charts/s2/docs/docs/interaction#supported-marks) for which marks take each component.

## Highlighting

Highlighting keeps some data at full opacity and fades the rest. The chart highlights on its own in these cases:

-   **Hovering a mark with `ChartInspect`.** By default the hovered point stays highlighted; `highlightBy` widens it to the series, the dimension value, or rows that share fields. See [highlightBy](/react-spectrum-charts/s2/docs/docs/interaction#highlightby).
-   **Hovering a legend entry with `highlight`.** The entry's series stays highlighted. See [Legend highlighting](/react-spectrum-charts/s2/docs/docs/legend#highlighting).
-   **Hovering a category axis label** on an interactive `Bar`. See [Label clicks and hover](/react-spectrum-charts/s2/docs/docs/axis#label-clicks-and-hover).
-   **Opening a `ChartPopover`.** The clicked point stays highlighted until it closes.

The legend follows the chart: when a series is highlighted, the other legend entries fade too.

## Hiding series

Users can hide a series by clicking its legend entry. There are two ways to set this up:

-   **Uncontrolled:** `isToggleable` on `Legend`. The legend tracks hidden series itself, starting from `defaultHiddenSeries`. Use this when nothing outside the chart needs to know.
-   **Controlled:** `hiddenSeries` on `Chart`. Your app owns the list, and the legend's `onClick` updates it. Use this to keep the chart in sync with filters, URLs, or other charts.

Don't combine them: a toggleable legend ignores `hiddenSeries`. See [Hiding series](/react-spectrum-charts/s2/docs/docs/legend#hiding-series).

## Controlled state

These `Chart` props let your app decide what's hidden and highlighted:

-   `hiddenSeries`: series to hide.
-   `highlightedSeries`: a series to highlight.
-   `highlightedItem`: one row ID, or a list of them, to highlight. Set `idKey` to a field that uniquely identifies each row, like `id`.

They're controlled: the chart shows what you pass and never changes them. To respond to the user, update your state from a callback and pass it back in. Below, hovering a table row highlights the matching bar, and clicking a bar selects the row:

```tsx
import { useState } from 'react';
import { Axis, Bar, Chart, ChartInspect } from '@spectrum-charts/react-spectrum-charts-s2';

function DownloadsReport({ data }) {
  const [highlightedId, setHighlightedId] = useState<number | undefined>();
  const [selectedId, setSelectedId] = useState<number | undefined>();

  return (
    <>
      <Chart data={data} idKey="id" highlightedItem={highlightedId}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Bar dimension="browser" metric="downloads" color="os" onClick={(datum) => setSelectedId(datum.id)}>
          <ChartInspect>{(datum) => <div>{datum.downloads} downloads</div>}</ChartInspect>
        </Bar>
      </Chart>
      <table>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              aria-selected={row.id === selectedId}
              onMouseEnter={() => setHighlightedId(row.id)}
              onMouseLeave={() => setHighlightedId(undefined)}
            >
              <td>{row.browser}</td>
              <td>{row.os}</td>
              <td>{row.downloads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

Each mark shows highlighting a little differently; see [Highlighting](/react-spectrum-charts/s2/docs/docs/interaction#highlighting) for the details and known limits.

## Callbacks

Callbacks tell your app what the user did. They don't change the chart themselves.

| Component | Callbacks | Receives |
| --- | --- | --- |
| `Line` | `onClick`, `onContextMenu` | The data point (`onContextMenu`: event first) |
| `Bar` | `onClick`, `onContextMenu`, `onMouseOver`, `onMouseOut` | The data point (`onContextMenu`: event first) |
| `Legend` | `onClick`, `onMouseOver`, `onMouseOut` | The series name |
| `Axis` | `onClick` | The event, label value, and label index |
| `ChartPopover` | `onOpenChange` | Whether the popover is open |
| `ChartActionBar` | `onClearSelection` | Nothing; called when the bar closes |

The data point passed to mark callbacks is the row from `data`, plus fields the chart adds, like `rscSeriesId`. See [Content](/react-spectrum-charts/s2/docs/docs/interaction#content).

## Linking charts

Charts don't share state with each other, but they can share yours. Keep the highlighted series in a parent component, set it from one chart's callbacks, and pass it to every chart:

```tsx
import { useState } from 'react';
import { Axis, Bar, Chart, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';

function LinkedCharts({ trafficData, totalsData }) {
  const [highlightedSeries, setHighlightedSeries] = useState<string | undefined>();

  return (
    <>
      <Chart data={trafficData} highlightedSeries={highlightedSeries}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Line dimension="month" metric="visits" color="device" scaleType="point" />
        <Legend
          onMouseOver={(series) => setHighlightedSeries(series)}
          onMouseOut={() => setHighlightedSeries(undefined)}
        />
      </Chart>
      <Chart data={totalsData} highlightedSeries={highlightedSeries}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Bar dimension="device" metric="visits" color="device" />
      </Chart>
    </>
  );
}
```

Both charts must use the same values in their `color` field (here `device`) so the series names match. Use `hiddenSeries` the same way to hide a series in every chart at once.
