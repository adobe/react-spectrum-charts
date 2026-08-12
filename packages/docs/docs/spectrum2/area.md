---
sidebar_position: 8
---

# Area (S2)

:::note Pre-alpha component
`Area` is a [pre-alpha component](./pre-alpha) — it has no finalized Spectrum 2 design yet
and is imported from the `pre-alpha` subpath.
:::

The `Area` component displays area charts. Areas are most useful for showing how a metric
changes over a continuous dimension, such as time, and stack by default when multiple series
share the same dimension value.

```jsx
import { Chart, Axis, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
```

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" baseline />
  <Axis position="left" grid />
  <Area dimension="datetime" metric="value" color="series" />
  <Legend />
</Chart>
```

---

## Tooltips and popovers

`Area` supports `ChartInspect` and `ChartPopover` like other S2 chart mark components.
Unlike the base package, S2 does not have a `ChartTooltip` component — use `ChartInspect`
instead.

```jsx
<Area dimension="datetime" metric="value" color="series">
  <ChartInspect>
    {(datum) => (
      <div>
        <div>Series: {datum.series}</div>
        <div>Value: {datum.value}</div>
      </div>
    )}
  </ChartInspect>
</Area>
```

---

## Floating areas

Pass `metricStart` and `metricEnd` instead of `metric` to draw a "floating" area between two
data fields (for example, a min/max range) rather than a stacked area from zero. Both must be
provided together — if only one is set, `Area` logs an error and falls back to `metric`.

```jsx
<Area dimension="datetime" metricStart="minTemperature" metricEnd="maxTemperature" />
```

---

## Area props (S2)

<table>
    <thead>
        <tr>
            <th>name</th>
            <th>type</th>
            <th>default</th>
            <th>description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>children</td>
            <td>ChartInspect | ChartPopover</td>
            <td>–</td>
            <td>Optional child components for inspect panels and popovers.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>Key in the data used as the color facet.</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'datetime'</td>
            <td>Key in the data that the metric is trended against (x-axis).</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>Key in the data used as the metric (y-axis). Ignored if <code>metricStart</code>/<code>metricEnd</code> are provided.</td>
        </tr>
        <tr>
            <td>metricEnd</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data for the end of a floating area. Must be paired with <code>metricStart</code>.</td>
        </tr>
        <tr>
            <td>metricStart</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data for the start of a floating area. Must be paired with <code>metricEnd</code>.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Name of the area component. Useful when referencing the area marks programmatically.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number</td>
            <td>0.8</td>
            <td>The fill opacity of the area.</td>
        </tr>
        <tr>
            <td>order</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data used to set the stack order of the area (higher order stacks on top).</td>
        </tr>
        <tr>
            <td>padding</td>
            <td>number</td>
            <td>–</td>
            <td>Horizontal padding — a ratio from 0 to 1 for categorical (point) scales, or a pixel value for continuous (time, linear) scales.</td>
        </tr>
        <tr>
            <td>scaleType</td>
            <td>'time' | 'linear' | 'point'</td>
            <td>'time'</td>
            <td>The type of scale used for the dimension.</td>
        </tr>
    </tbody>
</table>
