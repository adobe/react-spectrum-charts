# ChartActionBar

**Stage:** Lab

`ChartActionBar` shows a toolbar of actions, like annotating or bookmarking, when a user clicks a point on a `Line`. Add it as a child of `Line`; click a point in the chart below to open it.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { ChartActionBar } from '@spectrum-charts/react-spectrum-charts-s2/lab';
import { ActionButton, Text } from '@react-spectrum/s2';
import StickyNote from '@react-spectrum/s2/icons/StickyNote';
import Comment from '@react-spectrum/s2/icons/Comment';
import Bookmark from '@react-spectrum/s2/icons/Bookmark';

<Chart data={deviceVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" color="device">
    <ChartActionBar>
      {(datum, close) => [
        <ActionButton key="annotate" isQuiet onPress={close}>
          <StickyNote />
          <Text>Annotate</Text>
        </ActionButton>,
        <ActionButton key="comment" isQuiet onPress={close}>
          <Comment />
          <Text>Comment</Text>
        </ActionButton>,
        <ActionButton key="bookmark" isQuiet onPress={close}>
          <Bookmark />
          <Text>Bookmark</Text>
        </ActionButton>,
      ]}
    </ChartActionBar>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `children` on `ChartActionBar`: 1 to 5, in steps of 1. Shown: `3`.
-   `maxActions` on `ChartActionBar`: 1 to 5, in steps of 1. Shown: `4`.
-   `isEmphasized` on `ChartActionBar`: `true` or `false`. Shown: `false`.

`ChartActionBar` is a lab component. Import it from the `lab` subpath:

```tsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';
import { ChartActionBar } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```

## Data

`ChartActionBar` doesn't need any data fields of its own. It passes the clicked point to your actions as `datum`, which holds every field of that row (here `datetime`, `device`, and `visits`). The examples on this page use `deviceVisitsData`:

```ts
const deviceVisitsData = [
  { datetime: 1791158400000, device: 'Desktop', visits: 4120 },
  { datetime: 1791158400000, device: 'Mobile', visits: 2980 },
  { datetime: 1791244800000, device: 'Desktop', visits: 4385 },
  { datetime: 1791244800000, device: 'Mobile', visits: 3105 },
  { datetime: 1791331200000, device: 'Desktop', visits: 4250 },
  { datetime: 1791331200000, device: 'Mobile', visits: 3340 },
  { datetime: 1791417600000, device: 'Desktop', visits: 4610 },
  { datetime: 1791417600000, device: 'Mobile', visits: 3220 },
  { datetime: 1791504000000, device: 'Desktop', visits: 4480 },
  { datetime: 1791504000000, device: 'Mobile', visits: 3560 },
  { datetime: 1791590400000, device: 'Desktop', visits: 2910 },
  { datetime: 1791590400000, device: 'Mobile', visits: 3890 },
  { datetime: 1791676800000, device: 'Desktop', visits: 2640 },
  { datetime: 1791676800000, device: 'Mobile', visits: 4010 },
];
```

## Actions

`children` is a function that takes the clicked `datum` and a `close` function and returns an array of action elements. Use React Spectrum `ActionButton`s with `isQuiet`, and give each one a `key`. Call `close` when an action finishes to dismiss the bar.

```tsx
import { ActionButton, Text } from '@react-spectrum/s2';
import StickyNote from '@react-spectrum/s2/icons/StickyNote';

<Chart data={deviceVisitsData}>
  <Line metric="visits" color="device">
    <ChartActionBar>
      {(datum, close) => [
        <ActionButton
          key="annotate"
          isQuiet
          onPress={() => {
            addNote(datum.device, datum.datetime);
            close();
          }}
        >
          <StickyNote />
          <Text>Annotate</Text>
        </ActionButton>,
      ]}
    </ChartActionBar>
  </Line>
</Chart>;
```

Actions can be any element, such as a `MenuTrigger` for a menu of related actions or a `ContextualHelp` with details about the point. If `children` isn't set, clicking a point doesn't open a bar.

### maxActions

The bar shows up to `maxActions` actions inline (default `4`). The rest move to a **More actions** (`···`) menu at the end of the bar. The bar is at most 800px wide, so it also moves actions into the menu when they don't fit.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { ChartActionBar } from '@spectrum-charts/react-spectrum-charts-s2/lab';
import { ActionButton, Text } from '@react-spectrum/s2';
import StickyNote from '@react-spectrum/s2/icons/StickyNote';
import Comment from '@react-spectrum/s2/icons/Comment';
import Bookmark from '@react-spectrum/s2/icons/Bookmark';
import Export from '@react-spectrum/s2/icons/Export';
import Flag from '@react-spectrum/s2/icons/Flag';

<Chart data={deviceVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" color="device">
    <ChartActionBar maxActions={2}>
      {(datum, close) => [
        <ActionButton key="annotate" isQuiet onPress={close}>
          <StickyNote />
          <Text>Annotate</Text>
        </ActionButton>,
        <ActionButton key="comment" isQuiet onPress={close}>
          <Comment />
          <Text>Comment</Text>
        </ActionButton>,
        <ActionButton key="bookmark" isQuiet onPress={close}>
          <Bookmark />
          <Text>Bookmark</Text>
        </ActionButton>,
        <ActionButton key="export" isQuiet onPress={close}>
          <Export />
          <Text>Export</Text>
        </ActionButton>,
        <ActionButton key="flag" isQuiet onPress={close}>
          <Flag />
          <Text>Flag</Text>
        </ActionButton>,
      ]}
    </ChartActionBar>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `maxActions` on `ChartActionBar`: 1 to 5, in steps of 1. Shown: `2`.

### isEmphasized

`isEmphasized` gives the bar an accent background. Set `staticColor="white"` on the actions so they stay readable on it.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { ChartActionBar } from '@spectrum-charts/react-spectrum-charts-s2/lab';
import { ActionButton, Text } from '@react-spectrum/s2';
import StickyNote from '@react-spectrum/s2/icons/StickyNote';
import Comment from '@react-spectrum/s2/icons/Comment';
import Bookmark from '@react-spectrum/s2/icons/Bookmark';

<Chart data={deviceVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" color="device">
    <ChartActionBar isEmphasized>
      {(datum, close) => [
        <ActionButton key="annotate" isQuiet staticColor="white" onPress={close}>
          <StickyNote />
          <Text>Annotate</Text>
        </ActionButton>,
        <ActionButton key="comment" isQuiet staticColor="white" onPress={close}>
          <Comment />
          <Text>Comment</Text>
        </ActionButton>,
        <ActionButton key="bookmark" isQuiet staticColor="white" onPress={close}>
          <Bookmark />
          <Text>Bookmark</Text>
        </ActionButton>,
      ]}
    </ChartActionBar>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `isEmphasized` on `ChartActionBar`: `true` or `false`. Shown: `true`.

## Placement and dismissing

The bar opens just above the clicked point. When there isn't room above, it opens below, and it always stays inside the window. Users can move the bar by dragging the handle at its left end, or by focusing the handle and pressing the arrow keys.

Focus moves into the bar when it opens. The bar closes when the user presses Escape, clicks outside it, or runs an action that calls `close`. Focus then returns to where it was. `onClearSelection` is called each time the bar closes, for example to clear selection state you keep outside the chart.

```tsx
<ChartActionBar onClearSelection={() => setSelectedPoint(undefined)}>{actions}</ChartActionBar>
```

## Line

`ChartActionBar` works as a child of `Line` and opens on click; right-clicking a point doesn't open it. The clicked point stays marked while the bar is open.

### ChartInspect and ChartPopover

`ChartInspect` works alongside the action bar. Its tooltip is hidden while the bar is open.

A `Line` can't open both a `ChartPopover` and a `ChartActionBar` on click. To use both, set `rightClick` on `ChartPopover` so it opens on right-click and the action bar opens on click.

```jsx
import {
  Axis,
  Chart,
  ChartInspect,
  ChartPopover,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { ChartActionBar } from '@spectrum-charts/react-spectrum-charts-s2/lab';
import { ActionButton, Content, Heading, Text } from '@react-spectrum/s2';
import StickyNote from '@react-spectrum/s2/icons/StickyNote';
import Comment from '@react-spectrum/s2/icons/Comment';
import Bookmark from '@react-spectrum/s2/icons/Bookmark';

<Chart data={deviceVisitsData}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline labelFormat="time" />
  <Line metric="visits" color="device">
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.device}: {datum.visits.toLocaleString()} visits
        </div>
      )}
    </ChartInspect>
    <ChartPopover rightClick width="auto">
      {(datum) => (
        <>
          <Heading level={4}>{datum.device}</Heading>
          <Content>
            <Text>{datum.visits.toLocaleString()} visits</Text>
          </Content>
        </>
      )}
    </ChartPopover>
    <ChartActionBar>
      {(datum, close) => [
        <ActionButton key="annotate" isQuiet onPress={close}>
          <StickyNote />
          <Text>Annotate</Text>
        </ActionButton>,
        <ActionButton key="comment" isQuiet onPress={close}>
          <Comment />
          <Text>Comment</Text>
        </ActionButton>,
        <ActionButton key="bookmark" isQuiet onPress={close}>
          <Bookmark />
          <Text>Bookmark</Text>
        </ActionButton>,
      ]}
    </ChartActionBar>
  </Line>
  <Legend />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `ChartInspect`: included or left out. Shown: included.
-   `ChartPopover`: included or left out. Shown: included.

> **Note:**
> 
> `ChartActionBar` is only supported on `Line`.

## API

### ChartActionBar

| Prop | Type | Default |
| --- | --- | --- |
| `children` — Function that receives the clicked datum and a `close` callback and returns the action elements to show. | `((datum: Datum, close: () => void) => React<unknown, string \| JSXElementConstructor<any>>[])` | – |
| `isEmphasized` — Gives the bar an accent background; pair it with `staticColor="white"` on the actions. | `boolean` | `false` |
| `maxActions` — Most actions shown inline before the rest move to a "More actions" menu. | `number` | `4` |
| `onClearSelection` — Called when the action bar closes and the clicked point is deselected. | `(() => void)` | – |
