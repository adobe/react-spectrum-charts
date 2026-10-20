# Animation

Charts have two animations: `hover` eases marks in and out of their faded state when a user hovers or you highlight a series, and `drawIn` animates marks in when the chart renders. Both are set on `Chart`. See [Animation](/react-spectrum-charts/s2/docs/docs/chart#animation) on the Chart page for a playground with both.

## Choosing animations

`animationTypes` lists the animations to play. The default is `['hover', 'drawIn']`. To turn off draw-in only, list just `hover`.

```tsx
import { Axis, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={data} animationTypes={['hover']}>
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
  <Line dimension="datetime" metric="value" color="series" />
</Chart>
```

`animations={false}` turns off every animation, whatever `animationTypes` says.

## Draw-in

Draw-in plays once each time the chart mounts. Re-renders, data updates, and resizing don't replay it; an update in the middle of draw-in continues from where it was. A chart draws in again when data arrives after a loading or empty state. Use **Replay** below to watch it again.

```jsx
import {
  Axis,
  Chart,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={lineTrafficData}>
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
```

The chart fades in over 150ms on first paint. Draw-in then waits until the page is rendering frames on time, for at most 300ms, so it doesn't start while other content is still loading. When a chart draws in more than one mark type, every mark uses the longest duration so they finish together.

## Which marks animate

| Mark | Hover | Draw-in |
| --- | --- | --- |
| [Line](/react-spectrum-charts/s2/docs/docs/line#animation) | Yes | Sweeps in from left to right over 850ms. `time`, `linear`, and `point` scales only. |
| [Bar](/react-spectrum-charts/s2/docs/docs/bar#animation) | Yes | Bars grow from the baseline over 700ms. |
| [Donut](/react-spectrum-charts/s2/docs/docs/donut#animation) | Yes | Segments sweep in over 750ms. |
| [Combo](/react-spectrum-charts/s2/docs/docs/combo#animation) | Yes | Bars and lines draw in together over 850ms. |
| [Area](/react-spectrum-charts/s2/docs/docs/area#animation), [Scatter](/react-spectrum-charts/s2/docs/docs/scatter#animation), [Bullet](/react-spectrum-charts/s2/docs/docs/bullet#animation) | No | No |

Hover animation applies to marks that respond to hover or highlighting: for example, a mark with a `ChartInspect` or `ChartPopover`, a chart with a `Legend` that has `highlight`, or a chart with `highlightedSeries` or `highlightedItem`. See [Highlighting](/react-spectrum-charts/s2/docs/docs/interaction#highlighting).

## Reduced motion

When the user's system asks for reduced motion (`prefers-reduced-motion: reduce`), the chart drops draw-in, because it moves and grows marks. Hover animation fades marks in place, so it still plays.

To turn off hover easing too, set `animations={false}`.
