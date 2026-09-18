---
sidebar_position: 8
---

# Bullet (S2)

:::note Pre-alpha component
`Bullet` is a [pre-alpha component](./pre-alpha) — it has no finalized Spectrum 2 design yet
and is imported from the `pre-alpha` subpath.
:::

The `Bullet` component displays bullet charts, used to show a metric's progress against a
target, optionally with threshold bands or a track for additional context.

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
```

```jsx
<Chart data={data}>
  <Bullet metric="currentAmount" dimension="graphLabel" target="target" />
</Chart>
```

---

## Tooltips

`Bullet` supports `ChartInspect` like other S2 chart mark components. Unlike the base package,
S2 does not have a `ChartTooltip` component — use `ChartInspect` instead.

```jsx
<Bullet metric="currentAmount" dimension="graphLabel" target="target">
  <ChartInspect>
    {(datum) => (
      <div>
        <div>{datum.graphLabel}</div>
        <div>Current: ${datum.currentAmount}</div>
        <div>Target: ${datum.target}</div>
      </div>
    )}
  </ChartInspect>
</Bullet>
```

---

## Thresholds and tracks

The `thresholds` prop draws background bands behind the metric bar, useful for indicating
performance zones (e.g. red/yellow/green). Set `thresholdBarColor` to also color the metric
bar itself based on which threshold band its value falls in.

```jsx
<Bullet
  metric="currentAmount"
  dimension="graphLabel"
  target="target"
  thresholds={[
    { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
    { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
    { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
  ]}
  thresholdBarColor
/>
```

The `track` prop draws a flat background region behind the metric bar instead. `thresholds`
and `track` are mutually exclusive — `thresholds` takes precedence when both are set.

---

## Bullet props (S2)

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
            <td>ChartInspect</td>
            <td>–</td>
            <td>Optional child component for inspect panel content.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'blue-900'</td>
            <td>The color of the metric bar. Accepts a CSS color value or a Spectrum color name.</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'graphLabel'</td>
            <td>Key in the data used as the row/column label for each bullet group.</td>
        </tr>
        <tr>
            <td>direction</td>
            <td>'row' | 'column'</td>
            <td>'column'</td>
            <td>Specifies the direction bullet groups are laid out in.</td>
        </tr>
        <tr>
            <td>labelPosition</td>
            <td>'side' | 'top'</td>
            <td>'top'</td>
            <td>Specifies whether the dimension/value labels are shown above or to the side of the bullet. Side labels are not supported in row mode.</td>
        </tr>
        <tr>
            <td>maxScaleValue</td>
            <td>number</td>
            <td>100</td>
            <td>Maximum value for the scale when <code>scaleType</code> is <code>'fixed'</code> or <code>'flexible'</code>. Must be greater than zero.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'currentAmount'</td>
            <td>Key in the data used for the metric bar's value.</td>
        </tr>
        <tr>
            <td>metricLabel</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data containing a pre-formatted label for the metric value. When provided, this label is shown instead of the formatted metric value.</td>
        </tr>
        <tr>
            <td>metricAxis</td>
            <td>boolean</td>
            <td>false</td>
            <td>Adds an axis that follows the shared scale, in column direction.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Name of the bullet component. Useful when referencing the bullet marks programmatically.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>–</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the metric and target values.</td>
        </tr>
        <tr>
            <td>scaleType</td>
            <td>'normal' | 'fixed' | 'flexible'</td>
            <td>'normal'</td>
            <td><code>'normal'</code> derives the scale max from the data. <code>'fixed'</code> pins it to <code>maxScaleValue</code>. <code>'flexible'</code> uses <code>maxScaleValue</code> until the data overtakes it.</td>
        </tr>
        <tr>
            <td>showTarget</td>
            <td>boolean</td>
            <td>true</td>
            <td>Controls whether the target line is shown.</td>
        </tr>
        <tr>
            <td>showTargetValue</td>
            <td>boolean</td>
            <td>false</td>
            <td>Controls whether the target value label is shown.</td>
        </tr>
        <tr>
            <td>target</td>
            <td>string</td>
            <td>'target'</td>
            <td>Key in the data used for the target line's value.</td>
        </tr>
        <tr>
            <td>targetLabel</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data containing a pre-formatted label for the target value. When provided, this label is shown instead of the formatted target value.</td>
        </tr>
        <tr>
            <td>thresholdBarColor</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true, colors the metric bar based on which threshold band its value falls in.</td>
        </tr>
        <tr>
            <td>thresholds</td>
            <td>&#123;thresholdMin?: number, thresholdMax?: number, fill?: string&#125;[]</td>
            <td>–</td>
            <td>Background bands rendered behind the metric bar. An undefined <code>thresholdMin</code>/<code>thresholdMax</code> extends the band to the start/end of the scale.</td>
        </tr>
        <tr>
            <td>track</td>
            <td>boolean</td>
            <td>false</td>
            <td>Draws a flat background region behind the metric bar. Ignored when <code>thresholds</code> is set.</td>
        </tr>
    </tbody>
</table>
