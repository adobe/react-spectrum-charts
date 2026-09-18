---
sidebar_position: 9
---

# Combo (S2)

:::note Pre-alpha component
`Combo` is a [pre-alpha component](./pre-alpha) — it has no finalized Spectrum 2 design yet
and is imported from the `pre-alpha` subpath.
:::

The `Combo` component overlays a `Bar` mark and a `Line` mark in the same chart — for
example, a bar metric and a trended rate metric sharing a dimension. `Combo` itself has no
visual styling of its own; it routes its `Bar` and `Line` children to the same rendering
logic those components use standalone, so all of their props are fully supported.

```jsx
import { Chart, Axis } from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
import { Bar, Line } from '@spectrum-charts/react-spectrum-charts-s2';
```

When the bar and line metrics share a comparable scale, both marks can plot against a
single shared axis:

```jsx
<Chart data={data}>
  <Axis position="left" title="Count" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo dimension="datetime">
    <Bar metric="orders" />
    <Line metric="visits" scaleType="point" />
  </Combo>
</Chart>
```

---

## Dual axis

When the metrics are on very different scales (e.g. a count vs. a percentage), give each
child mark its own named axis via `metricAxis` instead of sharing one y-scale:

```jsx
<Chart data={data}>
  <Axis position="left" title="People" grid />
  <Axis position="right" name="adoption" title="Adoption Rate" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Combo dimension="datetime">
    <Bar metric="people" />
    <Line metric="adoptionRate" metricAxis="adoption" scaleType="point" />
  </Combo>
</Chart>
```

---

## Tooltips and popovers

`Combo` has no inspect/popover content of its own — wrap each child mark's own `ChartInspect`
or `ChartPopover` the same way you would outside of a `Combo`:

```jsx
<Combo dimension="datetime">
  <Bar metric="people">
    <ChartInspect>
      {(datum) => <div>People: {datum.people}</div>}
    </ChartInspect>
  </Bar>
  <Line metric="adoptionRate" metricAxis="adoption" scaleType="point">
    <ChartInspect>
      {(datum) => <div>Adoption Rate: {datum.adoptionRate}</div>}
    </ChartInspect>
  </Line>
</Combo>
```

---

## Combo props (S2)

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
            <td>Bar | Line</td>
            <td>–</td>
            <td>The mark components to overlay. Each child's own props (metric, metricAxis, color, annotations, tooltips, etc.) are fully supported.</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>–</td>
            <td>Data field that the metrics are trended against (x-axis for horizontal orientation). Used as a fallback for any child mark that doesn't specify its own <code>dimension</code>.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Name of the combo component. Used as the prefix for auto-generated child mark names (e.g. <code>combo0Bar0</code>).</td>
        </tr>
    </tbody>
</table>
