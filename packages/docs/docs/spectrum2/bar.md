---
sidebar_position: 3
---

# Bar (S2)

The `Bar` component in the S2 package supports nearly all props from the [base Bar component](/docs/api/visualizations/Bar) plus S2-exclusive features: inline direct labels and Spectrum 2 styled visuals.

:::note
The S2 `Bar` component does not yet support `Trendline` as a child component.
:::

```jsx
import { Chart, Axis, Bar } from '@spectrum-charts/react-spectrum-charts-s2';
```

---

## Bar direct labels (BarDirectLabel)

The `BarDirectLabel` component is an S2-exclusive child of `Bar`. It places a numeric label outside the tip of each bar, reading directly from the metric value. Labels are positioned automatically based on orientation — above or below the bar for vertical charts, left or right for horizontal charts — and flip to the opposite side for negative values.

```jsx
<Chart data={data}>
  <Axis position="bottom" baseline title="Browser" />
  <Axis position="left" grid title="Downloads" />
  <Bar dimension="browser" metric="downloads">
    <BarDirectLabel />
  </Bar>
</Chart>
```

![Bar direct label light](/img/s2_bar_directLabel_vertical_light.png#gh-light-mode-only)
![Bar direct label dark](/img/s2_bar_directLabel_vertical_dark.png#gh-dark-mode-only)

### Horizontal bars

The same component works for horizontal bar charts. Labels appear to the right of positive bars and to the left of negative bars.

```jsx
<Chart data={data}>
  <Axis position="left" baseline title="Browser" />
  <Axis position="bottom" grid title="Downloads" />
  <Bar dimension="browser" metric="downloads" orientation="horizontal">
    <BarDirectLabel />
  </Bar>
</Chart>
```

![Bar direct label horizontal light](/img/s2_bar_directLabel_horizontal_light.png#gh-light-mode-only)
![Bar direct label horizontal dark](/img/s2_bar_directLabel_horizontal_dark.png#gh-dark-mode-only)

### BarDirectLabel props

`BarDirectLabel` is intentionally minimal for v1 — additional options (custom format, prefix, etc.) will be added in future releases.

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
            <td colspan="4"><em>No props in v1. The label text and placement are derived automatically from the parent Bar's metric, dimension, and orientation.</em></td>
        </tr>
    </tbody>
</table>

---

## Bar props (S2)

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
            <td>ChartTooltip | ChartPopover | BarAnnotation | BarDirectLabel</td>
            <td>–</td>
            <td>Optional child components for tooltips, popovers, annotations, and inline direct labels.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string | &#123;value: string&#125;</td>
            <td>'categorical-100'</td>
            <td>Key in the data used to map each series to a color, or a fixed color value object.</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'category'</td>
            <td>Key in the data used for the categorical axis.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>Key in the data used for the metric axis value.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>'bar0'</td>
            <td>Name of the bar component. Useful when referencing a specific bar programmatically.</td>
        </tr>
        <tr>
            <td>onClick</td>
            <td>(datum: Datum) =&gt; void</td>
            <td>–</td>
            <td>Callback fired when a bar is clicked.</td>
        </tr>
        <tr>
            <td>orientation</td>
            <td>'vertical' | 'horizontal'</td>
            <td>'vertical'</td>
            <td>Controls whether bars extend vertically (default) or horizontally.</td>
        </tr>
        <tr>
            <td>type</td>
            <td>'stacked' | 'dodged'</td>
            <td>'stacked'</td>
            <td>Controls whether multi-series bars are stacked on top of each other or placed side by side.</td>
        </tr>
    </tbody>
</table>
