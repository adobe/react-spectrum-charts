---
sidebar_position: 7
---

# Scatter (S2)

:::note Pre-alpha component
`Scatter` is a [pre-alpha component](./pre-alpha) — it has no finalized Spectrum 2 design yet
and is imported from the `pre-alpha` subpath.
:::

The `Scatter` component displays scatter plots. Scatter plots use continuous data for both
the x and y axes and are most useful for comparing two continuous values across many points.

```jsx
import { Chart, Axis, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
```

```jsx
<Chart data={data}>
  <Axis position="bottom" grid ticks baseline />
  <Axis position="left" grid ticks baseline />
  <Scatter dimension="x" metric="y" color="series" />
  <Legend highlight position="right" title="Series" />
</Chart>
```

---

## Tooltips and popovers

`Scatter` supports `ChartInspect` and `ChartPopover` like other S2 chart mark components.
Unlike the base package, S2 does not have a `ChartTooltip` component — use `ChartInspect`
instead.

```jsx
<Scatter dimension="x" metric="y" color="series">
  <ChartInspect>
    {(datum) => (
      <div>
        <div>Series: {datum.series}</div>
        <div>Value: {datum.y}</div>
      </div>
    )}
  </ChartInspect>
</Scatter>
```

---

## Path annotations (ScatterPath)

The `ScatterPath` component draws a continuous path connecting points on the scatter plot.
Pass `groupBy` to control which points are connected — points sharing the same values for
all `groupBy` keys are joined by a path.

```jsx
<Scatter dimension="x" metric="y" color="series">
  <ScatterPath groupBy={['series']} />
</Scatter>
```

### ScatterPath props

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
            <td>color</td>
            <td>string</td>
            <td>'gray-500'</td>
            <td>The color of the path. Accepts a CSS color value or a Spectrum color name.</td>
        </tr>
        <tr>
            <td>groupBy</td>
            <td>string[]</td>
            <td>–</td>
            <td>Keys in the data that define which points get connected. Points sharing the same value for every key in <code>groupBy</code> are joined by a path.</td>
        </tr>
        <tr>
            <td>pathWidth</td>
            <td>string | &#123;value: number&#125;</td>
            <td>&#123;value: 'M'&#125;</td>
            <td>The width of the path. A string is treated as a key in the data mapped through the path width scale; an object with a value sets a fixed width.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number</td>
            <td>0.5</td>
            <td>The fill opacity of the path.</td>
        </tr>
    </tbody>
</table>

---

## Text annotations (ScatterAnnotation)

The `ScatterAnnotation` component places a text label next to each scatter point. Use
`textKey` to choose which data field to display; if omitted, the label falls back to the
`Scatter` component's own `metric` field.

```jsx
<Scatter dimension="x" metric="y" color="series">
  <ScatterAnnotation textKey="label" />
</Scatter>
```

Labels that don't fit within the chart bounds without overlapping other labels or points are
not shown — annotations should be treated as supplemental, "nice to have" information.

### ScatterAnnotation props

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
            <td>anchor</td>
            <td>LabelAnchor | LabelAnchor[]</td>
            <td>['right', 'top', 'bottom', 'left']</td>
            <td>Where to position the annotation relative to the data point. When an array is provided, each position is tried in order until one fits without overlapping other annotations or points.</td>
        </tr>
        <tr>
            <td>textKey</td>
            <td>string</td>
            <td>(the parent <code>Scatter</code>'s <code>metric</code> field)</td>
            <td>Key in the data whose value is displayed as the label text.</td>
        </tr>
    </tbody>
</table>

---

## Trendlines (Trendline)

The `Trendline` component plots a statistical trend calculated from a `Scatter`'s data.
Pass a `method` to control the statistical transform — regression methods (`'linear'`,
`'polynomial-2'`, etc.) draw a fitted curve; aggregate methods (`'average'`, `'median'`)
draw a flat reference line; `orientation` is only meaningful on scatter plots.

```jsx
<Scatter color="series" dimension="x" metric="y">
  <Trendline method="linear" lineType="dashed" />
</Scatter>
```

`Trendline` supports its own `ChartInspect` child, independent of the parent `Scatter`'s —
use this to show trend-specific values (e.g. the trendline's calculated value via the
`TRENDLINE_VALUE` field) on hover.

### Trendline props

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
            <td>ChartInspect | TrendlineAnnotation</td>
            <td>–</td>
            <td>Optional child components for trend-specific inspect content and value annotations.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>(parent series color)</td>
            <td>The line color of the trendline. Defaults to the color of the series it represents.</td>
        </tr>
        <tr>
            <td>dimensionExtent</td>
            <td>[number | 'domain' | null, number | 'domain' | null]</td>
            <td>(value of <code>dimensionRange</code>)</td>
            <td>The dimension range to draw the trendline over. <code>'domain'</code> extrapolates to the chart's domain edge; <code>null</code> stops at the first/last data point.</td>
        </tr>
        <tr>
            <td>dimensionRange</td>
            <td>[number | null, number | null]</td>
            <td>[null, null]</td>
            <td>The dimension range the statistical transform is calculated over.</td>
        </tr>
        <tr>
            <td>displayOnHover</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true, the trendline is only visible while hovering the parent Scatter.</td>
        </tr>
        <tr>
            <td>excludeDataKeys</td>
            <td>string[]</td>
            <td>–</td>
            <td>Data points where these keys have truthy values are excluded from the trendline calculation.</td>
        </tr>
        <tr>
            <td>hidePartialWindows</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true, hides the initial <code>movingAverage-N</code> points calculated from fewer than <code>N</code> data points.</td>
        </tr>
        <tr>
            <td>highlightRawPoint</td>
            <td>boolean</td>
            <td>false</td>
            <td>When true and an inspect is present, also highlights the raw scatter point alongside the hovered trendline point.</td>
        </tr>
        <tr>
            <td>lineType</td>
            <td>LineType</td>
            <td>'dashed'</td>
            <td>The line type of the trendline.</td>
        </tr>
        <tr>
            <td>lineWidth</td>
            <td>LineWidth</td>
            <td>'M'</td>
            <td>The line width of the trendline.</td>
        </tr>
        <tr>
            <td>method</td>
            <td>'average' | 'median' | 'exponential' | 'linear' | 'logarithmic' | 'polynomial-N' | 'power' | 'quadratic' | 'movingAverage-N'</td>
            <td>'linear'</td>
            <td>The statistical transform used to calculate the trendline.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number</td>
            <td>1</td>
            <td>The opacity of the trendline.</td>
        </tr>
        <tr>
            <td>orientation</td>
            <td>'horizontal' | 'vertical'</td>
            <td>'horizontal'</td>
            <td>Orientation of the trendline. Only supported on scatter plots.</td>
        </tr>
    </tbody>
</table>

### Trendline value labels (TrendlineAnnotation)

The `TrendlineAnnotation` component places a label showing the trendline's calculated value
at a point along the trendline.

```jsx
<Trendline method="median" dimensionExtent={['domain', 'domain']}>
  <TrendlineAnnotation badge prefix="Median:" />
</Trendline>
```

#### TrendlineAnnotation props

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
            <td>badge</td>
            <td>boolean</td>
            <td>false</td>
            <td>Adds a badge background around the annotation.</td>
        </tr>
        <tr>
            <td>dimensionValue</td>
            <td>number | 'start' | 'end'</td>
            <td>'end'</td>
            <td>Where along the dimension scale to label the trendline value.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>–</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the labeled value.</td>
        </tr>
        <tr>
            <td>prefix</td>
            <td>string</td>
            <td>–</td>
            <td>Text prepended to the labeled value.</td>
        </tr>
    </tbody>
</table>

---

## Scatter props (S2)

:::note Not all base Scatter props are supported
The S2 `Scatter` component does not yet support `ChartTooltip`, `onClick`, `onContextMenu`,
`onMouseOver`, or `onMouseOut`.
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
            <td>ChartInspect | ChartPopover | ScatterAnnotation | ScatterPath | Trendline</td>
            <td>–</td>
            <td>Optional child components for inspect panels, popovers, path annotations, and text annotations.</td>
        </tr>
        <tr>
            <td>blend</td>
            <td>'normal' | Blend</td>
            <td>–</td>
            <td>CSS blend mode for overlapping points. <code>'normal'</code> disables blending; other values apply the specified blend mode. Defaults to <code>'multiply'</code> in light mode and <code>'screen'</code> in dark mode.</td>
        </tr>
        <tr>
            <td>clip</td>
            <td>boolean</td>
            <td>false</td>
            <td>Restricts scatter plot contents to the plot boundaries.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string | &#123;value: string&#125;</td>
            <td>'series'</td>
            <td>Key in the data used to map each point to a color, or a fixed color value object. Also sets the stroke color unless <code>stroke</code> is provided.</td>
        </tr>
        <tr>
            <td>colorScaleType</td>
            <td>'linear' | 'ordinal'</td>
            <td>'linear'</td>
            <td>Use <code>'ordinal'</code> when <code>color</code> maps to string values, or <code>'linear'</code> when it maps to numeric values.</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'x'</td>
            <td>Key in the data used for the x-axis value.</td>
        </tr>
        <tr>
            <td>lineType</td>
            <td>string | &#123;value: LineType | number[]&#125;</td>
            <td>&#123;value: 'solid'&#125;</td>
            <td>Key in the data for point border line type faceting, or a fixed line type value.</td>
        </tr>
        <tr>
            <td>lineWidth</td>
            <td>string | &#123;value: number&#125;</td>
            <td>&#123;value: 0&#125;</td>
            <td>Key in the data for point border width faceting, or a fixed line width value.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>Key in the data used for the y-axis value.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Name of the scatter component. Useful when referencing the scatter marks programmatically.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>string | &#123;value: number&#125;</td>
            <td>&#123;value: 1&#125;</td>
            <td>Key in the data for point opacity faceting, or a fixed opacity value.</td>
        </tr>
        <tr>
            <td>size</td>
            <td>string | &#123;value: number&#125;</td>
            <td>&#123;value: 100&#125;</td>
            <td>Key in the data for point size faceting, or a fixed size value.</td>
        </tr>
        <tr>
            <td>stroke</td>
            <td>string | &#123;value: string&#125;</td>
            <td>–</td>
            <td>Key in the data used to map each point's border to a color, or a fixed color value. Defaults to <code>color</code> if not provided.</td>
        </tr>
    </tbody>
</table>
