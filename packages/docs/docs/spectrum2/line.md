---
sidebar_position: 2
---

# Line (S2)

The `Line` component in the S2 package supports all the props from the [base Line component](/docs/api/visualizations/Line) plus several S2-exclusive features: gradients, interpolation, inline direct labels, and Spectrum 2 styled point display.

```jsx
import { Chart, Axis, Line, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
```

---

## Line gradient

Setting `gradient` to `true` renders a filled area beneath the line that fades from the line color to transparent. This works well for emphasizing trends on single-series or lightly multi-series charts.

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid />
  <Line color="series" gradient />
</Chart>
```

![Line gradient light](/img/s2_line_gradient_light.png#gh-light-mode-only)
![Line gradient dark](/img/s2_line_gradient_dark.png#gh-dark-mode-only)

---

## Line interpolation

The `interpolate` prop controls the curve algorithm used to draw the line between data points.

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid />
  <Line color="series" interpolate="monotone" />
</Chart>
```

![Line interpolation light](/img/s2_line_interpolation_light.png#gh-light-mode-only)
![Line interpolation dark](/img/s2_line_interpolation_dark.png#gh-dark-mode-only)

Available interpolation methods:

| Value | Description |
|-------|-------------|
| `'linear'` | Straight segments between points (default Vega behavior) |
| `'monotone'` | Smooth curve that preserves monotonicity — recommended for most time-series data |
| `'basis'` | B-spline curve |
| `'cardinal'` | Cardinal spline |
| `'catmull-rom'` | Catmull-Rom spline |
| `'natural'` | Natural cubic spline |
| `'step'` | Horizontal then vertical steps, centered on the data point |
| `'step-before'` | Vertical then horizontal steps |
| `'step-after'` | Horizontal then vertical steps |

---

## Line point styles

In the S2 package, visible points on a line are styled automatically using Spectrum 2 design tokens — including color, stroke, and size — when they are displayed. Points are shown in two cases:

1. **On hover** — a point appears at the hovered location on the line.
2. **Static points** — use the `staticPoint` prop to mark specific data points as always visible. Set `staticPoint` to the key in your data whose value is `true` for the data points you want to pin.

```jsx
// data: [{ datetime: ..., value: 10, highlight: true }, ...]
<Line color="series" staticPoint="highlight" />
```

![Line static point light](/img/s2_line_staticPoint_light.png#gh-light-mode-only)
![Line static point dark](/img/s2_line_staticPoint_dark.png#gh-dark-mode-only)

S2 selection and hover states (stroke ring, opacity fading of other series) are handled automatically by the S2 spec builder and follow the Spectrum 2 visual spec.

---

## Line direct labels (LineDirectLabel)

The `LineDirectLabel` component is an S2-exclusive child of `Line`. It places an inline text label at the end of each line series by default, making multi-series charts readable without requiring a separate legend. Use the `position` prop to move labels to the start instead.

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid />
  <Line color="series">
    <LineDirectLabel />
  </Line>
</Chart>
```

![Line direct label light](/img/s2_line_directLabel_light.png#gh-light-mode-only)
![Line direct label dark](/img/s2_line_directLabel_dark.png#gh-dark-mode-only)

Labels are automatically positioned to avoid overlap. When two series end at similar values, the labels are offset vertically.

### Showing different values

```jsx
{/* Show the series name instead of the last value */}
<LineDirectLabel value="series" />

{/* Show the average value */}
<LineDirectLabel value="average" />

{/* Place the label at the start of the line */}
<LineDirectLabel position="start" />

{/* Add a prefix and custom number format */}
<LineDirectLabel prefix="Avg:" value="average" format=".1f" />
```

![Line direct label average light](/img/s2_line_directLabel_average_light.png#gh-light-mode-only)
![Line direct label average dark](/img/s2_line_directLabel_average_dark.png#gh-dark-mode-only)

### Excluding series

Use `excludeSeries` to prevent labels from appearing on specific series:

```jsx
<LineDirectLabel excludeSeries={['Other', 'Unknown']} />
```

### LineDirectLabel props

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
            <td>value</td>
            <td>'last' | 'average' | 'series'</td>
            <td>'last'</td>
            <td>
                What to display as the label text.<br/>
                <code>'last'</code>: the value at the last (or first, if <code>position="start"</code>) data point.<br/>
                <code>'average'</code>: the mean value across all data points in the series.<br/>
                <code>'series'</code>: the series name (the value of the <code>color</code> field).
            </td>
        </tr>
        <tr>
            <td>position</td>
            <td>'start' | 'end'</td>
            <td>'end'</td>
            <td>Where to place the label. <code>'end'</code> places it at the right edge of the chart; <code>'start'</code> places it at the left edge.</td>
        </tr>
        <tr>
            <td>format</td>
            <td>string</td>
            <td>',.2~f'</td>
            <td>A <a href="https://d3js.org/d3-format">d3-format</a> string controlling how numeric values are displayed. Has no effect when <code>value="series"</code>.</td>
        </tr>
        <tr>
            <td>prefix</td>
            <td>string</td>
            <td>–</td>
            <td>Text prepended to the label value, separated by a space.</td>
        </tr>
        <tr>
            <td>excludeSeries</td>
            <td>string[]</td>
            <td>[]</td>
            <td>Series names that should not receive a label.</td>
        </tr>
    </tbody>
</table>

---

## Line props (S2)

:::note Not all base Line props are supported
The S2 `Line` component does not yet support `onMouseOver`, `onMouseOut`, `MetricRange`, `Trendline`, or `LinePointAnnotation`. `LinePointAnnotation` is replaced by [`LineDirectLabel`](#line-direct-labels-linedirectlabel).
:::

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
            <td>ChartTooltip | ChartPopover | LineDirectLabel</td>
            <td>–</td>
            <td>Optional child components for tooltips, popovers, and inline direct labels.</td>
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
            <td>'datetime'</td>
            <td>Key in the data that the metric is trended against (x-axis).</td>
        </tr>
        <tr>
            <td>dualMetricAxis</td>
            <td>boolean</td>
            <td>–</td>
            <td>When true, the last series uses a secondary y-axis with an independent scale.</td>
        </tr>
        <tr>
            <td>gradient</td>
            <td>boolean</td>
            <td>–</td>
            <td><strong>S2 only.</strong> When true, renders a gradient fill beneath the line that fades from the line color to transparent.</td>
        </tr>
        <tr>
            <td>interactionMode</td>
            <td>'nearest' | 'item'</td>
            <td>'nearest'</td>
            <td>Controls which point is highlighted when the user hovers over the chart area.</td>
        </tr>
        <tr>
            <td>interpolate</td>
            <td>'basis' | 'cardinal' | 'catmull-rom' | 'linear' | 'monotone' | 'natural' | 'step' | 'step-after' | 'step-before'</td>
            <td>–</td>
            <td><strong>S2 only.</strong> The curve interpolation method used to draw the line between data points.</td>
        </tr>
        <tr>
            <td>lineType</td>
            <td>string | &#123;value: LineType | number[]&#125;</td>
            <td>&#123;value: 'solid'&#125;</td>
            <td>Key in the data for line type faceting, or a fixed line type value.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>Key in the data used for the y-axis value.</td>
        </tr>
        <tr>
            <td>metricAxis</td>
            <td>string</td>
            <td>–</td>
            <td>Name of the axis the metric is plotted against. Used for dual-axis layouts.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>'line0'</td>
            <td>Name of the line component. Useful when referencing a specific line programmatically.</td>
        </tr>
        <tr>
            <td>onClick</td>
            <td>(datum: Datum) =&gt; void</td>
            <td>–</td>
            <td>Callback fired when a point or section of the line is clicked.</td>
        </tr>
        <tr>
            <td>onContextMenu</td>
            <td>(event: MouseEvent, datum: Datum) =&gt; void</td>
            <td>–</td>
            <td>Callback fired on right-click. Use this to show a custom context menu anchored to the clicked point.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number | string</td>
            <td>–</td>
            <td>Fixed opacity value or key in the data for opacity faceting.</td>
        </tr>
        <tr>
            <td>padding</td>
            <td>number</td>
            <td>–</td>
            <td>Chart area padding. A ratio (0–1) for categorical scales or a pixel value for continuous scales.</td>
        </tr>
        <tr>
            <td>scaleType</td>
            <td>'linear' | 'time' | 'point'</td>
            <td>'time'</td>
            <td>The scale type for the x-axis dimension.</td>
        </tr>
        <tr>
            <td>staticPoint</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data whose truthy value causes a visible point to be drawn at that data item.</td>
        </tr>
    </tbody>
</table>

---

## Reference lines (S2)

The `ReferenceLine` component is a child of `Axis` that draws a vertical or horizontal reference line at a specified value. It is available in the S2 package and styled to the Spectrum 2 visual spec.

```jsx
import { Chart, Axis, Line } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline>
    <ReferenceLine value={1706745600000} label="Launch" />
  </Axis>
  <Axis position="left" grid />
  <Line color="series" />
</Chart>
```

![Line reference line light](/img/s2_line_referenceLine_light.png#gh-light-mode-only)
![Line reference line dark](/img/s2_line_referenceLine_dark.png#gh-dark-mode-only)

The reference line is drawn on the axis it is nested inside. Use a bottom/top axis child for vertical reference lines (marking a point in time or a categorical value), and a left/right axis child for horizontal reference lines (marking a threshold value).

### Reference line with label

```jsx
<Axis position="left" grid>
  <ReferenceLine value={1000} label="Target" />
</Axis>
```

### Positioning on bar charts

On bar charts with categorical axes, the `position` prop controls whether the reference line is positioned before, centered on, or after the specified value:

```jsx
<Axis position="bottom">
  <ReferenceLine value="Q3" position="before" label="Q3 Start" />
</Axis>
```

### ReferenceLine props

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
            <td>value *</td>
            <td>number | string</td>
            <td>–</td>
            <td>The value on the axis at which to draw the reference line. For time axes, provide epoch milliseconds. For categorical axes, provide the category value.</td>
        </tr>
        <tr>
            <td>label</td>
            <td>string</td>
            <td>–</td>
            <td>Optional text label rendered alongside the reference line.</td>
        </tr>
        <tr>
            <td>position</td>
            <td>'before' | 'after' | 'center'</td>
            <td>'center'</td>
            <td>Controls where the line is drawn relative to the value. Only relevant for bar charts with categorical axes.</td>
        </tr>
    </tbody>
</table>

_* required_
