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

## Point annotations (LinePointAnnotation)

The `LinePointAnnotation` component places a text label adjacent to each static point on the line. It requires `staticPoint` to be set on the parent `Line` — the annotation appears for every data point that has a visible static point.

```jsx
// data: [{ datetime: ..., value: 10, highlight: true, label: '10K' }, ...]
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid />
  <Line color="series" staticPoint="highlight">
    <LinePointAnnotation textKey="label" />
  </Line>
</Chart>
```

Labels are rendered in the series color with a background halo for legibility. The placement algorithm tries each position in the `anchor` array in order and uses the first one that fits within the chart bounds without overlapping other labels or points.

### Controlling label placement

By default, the algorithm tries `right`, `top`, `bottom`, then `left`. Pass a single string to fix the position, or an array to control the fallback order:

```jsx
{/* Always place the label to the left of the point */}
<LinePointAnnotation textKey="label" anchor="left" />

{/* Try top first, then fall back to bottom */}
<LinePointAnnotation textKey="label" anchor={['top', 'bottom']} />
```

### Displaying different data fields

The `textKey` prop sets which field in the data is used as the label text. It defaults to the `metric` field on the parent `Line`:

```jsx
{/* Use a pre-formatted string from the data */}
<LinePointAnnotation textKey="formattedValue" />

{/* Use the default metric field */}
<LinePointAnnotation />
```

### LinePointAnnotation props

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
            <td>textKey</td>
            <td>string</td>
            <td>(metric field)</td>
            <td>Key in the data whose value is displayed as the label text. Defaults to the <code>metric</code> prop of the parent <code>Line</code>.</td>
        </tr>
        <tr>
            <td>anchor</td>
            <td>'top' | 'bottom' | 'left' | 'right' | (string | string[])</td>
            <td>['right', 'top', 'bottom', 'left']</td>
            <td>
                The preferred placement direction relative to the data point. When an array is provided, each position is tried in order until one fits without overlapping other labels or points. If no position fits, the label is not shown.
            </td>
        </tr>
        <tr>
            <td>matchLineColor</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true, the label text color matches the series color. In S2, labels always use the series color regardless of this setting.</td>
        </tr>
    </tbody>
</table>

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
        <tr>
            <td>fontSize</td>
            <td>number</td>
            <td>–</td>
            <td>Override font size in pixels. When omitted, font size scales automatically with chart size.</td>
        </tr>
    </tbody>
</table>

---

## Primary series

The `primarySeries` prop designates which series render with full color. All other series are rendered in a de-emphasized gray, making it easy to highlight one or a few key series against a backdrop of contextual data.

Pass a number to promote the first N series (by color scale order), or a string array to name specific series explicitly:

```jsx
{/* Highlight the first 2 series by color scale order */}
<Line color="series" primarySeries={2} />

{/* Highlight specific named series */}
<Line color="series" primarySeries={['Revenue', 'Target']} />
```

Use `otherSeriesColor` to override the default gray used for de-emphasized series:

```jsx
<Line color="series" primarySeries={2} otherSeriesColor="gray-100" />
```

When `primarySeries` is combined with `LineDirectLabel`, direct labels are only shown on the primary series.

---

## Alternate segments

The `alternateSegmentKey` prop lets you visually distinguish specific data points — such as estimated or projected values — by rendering their line segments with a different stroke style while keeping the same series color.

Set `alternateSegmentKey` to a field in your data whose truthy value marks a point as part of an alternate segment. Those segments will be drawn using `alternateSegmentLineType` (defaults to `'dotted'`).

```jsx
// data: [{ datetime: ..., value: 10, isEstimated: false }, { datetime: ..., value: 12, isEstimated: true }, ...]
<Line color="series" alternateSegmentKey="isEstimated" alternateSegmentLineType="dotted" />
```

The transition between segments is seamless — the line connects solid and dotted runs without gaps. Any series without the field (or with all-falsy values) renders as a plain solid line.

---

## Forecast (LineForecast)

The `LineForecast` component is an S2-exclusive child of `Line`. It visually distinguishes a forecast region from historical data: the line transitions from solid to dotted at the forecast boundary, a vertical rule marks the start of the forecast, and an optional label appears above the rule.

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid />
  <Line color="series" metric="value" dimension="datetime" scaleType="time">
    <LineForecast metric="forecastValue" start={1725148800000} label="Forecast" />
  </Line>
</Chart>
```

The `start` value must be a dimension value that exists in the data (for time axes, epoch milliseconds). Rows at or after `start` are rendered as the forecast segment. Rows before `start` use the `metric` field on `Line`; rows in the forecast region use the `metric` field on `LineForecast`.

When `gradient` is set on the parent `Line`, the gradient is also rendered in the forecast region at a reduced opacity (40% of the historical gradient) to reinforce the uncertainty of the forecast.

### LineForecast props

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
            <td>metric *</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data containing the forecast values.</td>
        </tr>
        <tr>
            <td>start *</td>
            <td>number | string</td>
            <td>–</td>
            <td>Dimension value at which the forecast begins. For time axes, provide epoch milliseconds. Rows at or after this value are rendered as the forecast segment.</td>
        </tr>
        <tr>
            <td>label</td>
            <td>string</td>
            <td>'Forecast'</td>
            <td>Text shown above the boundary rule. Hidden automatically when fewer than 80px remain between the boundary and the right edge of the chart.</td>
        </tr>
    </tbody>
</table>

_* required_

---

## Line props (S2)

:::note Not all base Line props are supported
The S2 `Line` component does not yet support `onMouseOver`, `onMouseOut`, `MetricRange`, or `Trendline`.
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
            <td>ChartInspect | ChartPopover | LineDirectLabel | LineForecast | LinePointAnnotation</td>
            <td>–</td>
            <td>Optional child components for tooltips, popovers, inline direct labels, forecast regions, and point annotations.</td>
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
            <td>contextMenuMode</td>
            <td>'interaction' | 'item'</td>
            <td>'interaction'</td>
            <td>Controls which interactions can trigger <code>onContextMenu</code>. <code>'interaction'</code> fires for any hover interaction (default). <code>'item'</code> fires only when an individual data point is right-clicked.</td>
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
        <tr>
            <td>primarySeries</td>
            <td>number | string[]</td>
            <td>–</td>
            <td><strong>S2 only.</strong> Designates which series render with full color. A number promotes the first N series by color scale order; a string array names specific series explicitly. All other series are rendered in a de-emphasized gray. When used with <code>LineDirectLabel</code>, labels are suppressed on non-primary series.</td>
        </tr>
        <tr>
            <td>otherSeriesColor</td>
            <td>string</td>
            <td>'gray-400'</td>
            <td><strong>S2 only.</strong> Overrides the default gray used for de-emphasized series when <code>primarySeries</code> is set. Accepts any Spectrum 2 color token (e.g. <code>'gray-200'</code>) or CSS color value.</td>
        </tr>
        <tr>
            <td>alternateSegmentKey</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data whose truthy value marks a point as part of an alternate segment. Alternate segments are rendered with a different line type (see <code>alternateSegmentLineType</code>) while keeping the same series color.</td>
        </tr>
        <tr>
            <td>alternateSegmentLineType</td>
            <td>'solid' | 'dashed' | 'dotted' | 'dotDash' | 'longDash' | 'twoDash'</td>
            <td>'dotted'</td>
            <td>The line type used for alternate segments identified by <code>alternateSegmentKey</code>.</td>
        </tr>
        <tr>
            <td>alternateSegmentLabel</td>
            <td>string</td>
            <td>–</td>
            <td>Text appended to the hover value label for alternate-segment points (e.g. <code>'(Estimated)'</code>).</td>
        </tr>
        <tr>
            <td>showHoverLabel</td>
            <td>boolean</td>
            <td>true</td>
            <td>When true, shows the metric value as a label adjacent to the hovered data point. Suppressed when a <code>ChartInspect</code> child is present.</td>
        </tr>
        <tr>
            <td>dimensionHover</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true, all series at the hovered x-dimension highlight simultaneously instead of only the nearest series. Hover value labels show for every series at that dimension.</td>
        </tr>
        <tr>
            <td>hoverLabelKey</td>
            <td>string</td>
            <td>(metric field)</td>
            <td>Data field key to display in the hover value label. Defaults to the <code>metric</code> field. Use this to show a pre-formatted or alternate field instead of the raw metric value.</td>
        </tr>
    </tbody>
</table>

---

## Reference lines (S2)

The `ReferenceLine` component is a child of `Axis` that draws a vertical or horizontal reference line at a specified value. It is available in the S2 package and styled to the Spectrum 2 visual spec.

```jsx
import { Chart, Axis, Line, ReferenceLine } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={data}>
  <Axis position="left" grid>
    <ReferenceLine value={5000} label="Target" />
  </Axis>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Line color="series" />
</Chart>
```

![Line reference line light](/img/s2_line_referenceLine_light.png#gh-light-mode-only)
![Line reference line dark](/img/s2_line_referenceLine_dark.png#gh-dark-mode-only)

In S2, reference lines are **horizontal only** — place `<ReferenceLine>` inside a left or right `<Axis>` and give it a numeric metric value (e.g. a threshold count). Bottom/top axes are not supported in S2.

### Reference line with label

```jsx
<Axis position="left" grid>
  <ReferenceLine value={1000} label="Target" />
</Axis>
```

### Secondary style

Set `secondary` to `true` to render a lighter, lower-emphasis reference line. Secondary lines have no caret caps and use a lighter stroke color, making them suitable for contextual reference values (baselines, prior-period comparisons) that should visually recede behind a primary target line.

```jsx
<Axis position="left" grid>
  <ReferenceLine value={7500} label="Target" />
  <ReferenceLine value={5000} label="Last year" secondary />
</Axis>
```

Stroke weight is always 1px for secondary lines. Stroke and label color are size-dependent:

| Size | Stroke / label color |
|------|---------------------|
| `'XS'` | `gray-600` |
| `'S'` / `'M'` / `'L'` / auto | `gray-800` |

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
        <tr>
            <td>size</td>
            <td>'XS' | 'S' | 'M' | 'L'</td>
            <td>auto</td>
            <td>Controls the stroke weight and caret triangle dimensions. When omitted, both react to the chart width automatically (S below 400px, M below 800px, L at 800px+). Use <code>'XS'</code> for sparkline contexts.</td>
        </tr>
        <tr>
            <td>secondary</td>
            <td>boolean</td>
            <td>–</td>
            <td>When true, renders a lighter secondary style: no caret caps, 1px stroke weight, full-width rule, and size-dependent color (<code>gray-600</code> at XS, <code>gray-800</code> for other sizes). Label color matches the stroke color. Use for contextual reference values (baselines, prior-period comparisons) that should recede behind a primary target line.</td>
        </tr>
    </tbody>
</table>

_* required_
