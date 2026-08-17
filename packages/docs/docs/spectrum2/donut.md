---
sidebar_position: 10
---

# Donut (S2)

:::note Pre-alpha component
`Donut` is a [pre-alpha component](./pre-alpha) — it has no finalized Spectrum 2 design yet
and is imported from the `pre-alpha` subpath.
:::

The `Donut` component displays a donut (or pie, via `holeRatio={0}`) chart. Each data point
becomes a segment sized by `metric` and colored by `color`.

```jsx
import { Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Donut, DonutSummary, SegmentLabel } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
```

```jsx
<Chart data={data}>
  <Donut metric="count" color="browser" />
  <Legend title="Browsers" position="right" highlight isToggleable />
</Chart>
```

---

## Tooltips and popovers

`Donut` supports `ChartInspect` and `ChartPopover` like other S2 chart mark components.
Unlike the base package, S2 does not have a `ChartTooltip` component — use `ChartInspect`
instead.

```jsx
<Donut metric="count" color="browser">
  <ChartInspect>
    {(datum) => (
      <div>
        <div>Browser: {datum.browser}</div>
        <div>Visitors: {datum.count}</div>
      </div>
    )}
  </ChartInspect>
</Donut>
```

---

## Center summary (DonutSummary)

The `DonutSummary` component displays a label and aggregate value in the center of the
donut. If `isBoolean` is set on the parent `Donut`, the summary shows the first data point's
value as a percentage instead of a sum.

```jsx
<Donut metric="count" color="browser" holeRatio={0.8}>
  <DonutSummary label="Visitors" />
</Donut>
```

### DonutSummary props

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
            <td>hideValue</td>
            <td>boolean</td>
            <td>false</td>
            <td>Hides the value portion of the summary, only showing the label.</td>
        </tr>
        <tr>
            <td>label</td>
            <td>string</td>
            <td>–</td>
            <td>Label displayed under the summary value.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>'shortNumber'</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the summary value.</td>
        </tr>
    </tbody>
</table>

---

## Segment labels (SegmentLabel)

The `SegmentLabel` component labels each donut segment directly, with its percentage
and/or metric value.

```jsx
<Donut metric="count" color="browser">
  <SegmentLabel percent value />
</Donut>
```

### SegmentLabel props

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
            <td>labelKey</td>
            <td>string</td>
            <td>(the parent <code>Donut</code>'s <code>color</code> field)</td>
            <td>Key in the data that has the segment label.</td>
        </tr>
        <tr>
            <td>percent</td>
            <td>boolean</td>
            <td>false</td>
            <td>Shows the donut segment's percentage of the total.</td>
        </tr>
        <tr>
            <td>percentFormat</td>
            <td>string</td>
            <td>'.0%'</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the percentage value.</td>
        </tr>
        <tr>
            <td>value</td>
            <td>boolean</td>
            <td>false</td>
            <td>Shows the donut segment's metric value.</td>
        </tr>
        <tr>
            <td>valueFormat</td>
            <td>string</td>
            <td>'standardNumber'</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the metric value.</td>
        </tr>
    </tbody>
</table>

---

## Boolean donuts

When `isBoolean` is set, the data should be exactly two points that sum to 1 — the first
point is displayed as a percent of the whole (e.g. a success/failure rate):

```jsx
<Donut metric="value" color="id" isBoolean colors={['green-800', 'gray-200']}>
  <DonutSummary label="Success rate" />
</Donut>
```

---

## Donut props (S2)

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
            <td>ChartInspect | ChartPopover | DonutSummary | SegmentLabel</td>
            <td>–</td>
            <td>Optional child components for inspect panels, popovers, a center summary, and segment labels.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>Key in the data used to map each segment to a color.</td>
        </tr>
        <tr>
            <td>holeRatio</td>
            <td>number</td>
            <td>0.85</td>
            <td>Ratio of the donut's inner radius to its outer radius. <code>0</code> renders a pie chart.</td>
        </tr>
        <tr>
            <td>isBoolean</td>
            <td>boolean</td>
            <td>false</td>
            <td>Treats the data as a two-point boolean pair summing to 1, displaying the first point as a percent of the whole.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>Key in the data used to size each segment.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Name of the donut component. Useful when referencing the donut marks programmatically.</td>
        </tr>
        <tr>
            <td>startAngle</td>
            <td>number</td>
            <td>0</td>
            <td>Start angle of the donut in radians. <code>0</code> is top dead center.</td>
        </tr>
    </tbody>
</table>
