The `MetricRange` component is used to add a custom area mark onto visualizations. `MetricRange` is only supported for `Line` components. When creating a `MetricRange` you define a `metricStart` and `metricEnd` for the range that controls the area of the chart it will cover. You can also provide a `Metric` to create an additional line within the `MetricRange`. This metric line is not a `Trendline` and will only display with the data you provide to the `Chart`.

`MetricRanges`s do not get added to the legend. Only the parent marks get added to the legend.

## Examples

### Average line on a bar chart

```jsx
<Chart data={data} >
    <Bar>
        <MetricRange metricStart="minDataKey" metricEnd="maxDataKey" color="gray-500"  />
    </Bar>
</Chart>
```

## Props

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
            <td>ChartTooltip</td>
            <td>–</td>
            <td>Tooltip to be display when hovering over the metric range.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>SpectrumColor | CssColor</td>
            <td>–</td>
            <td>The line color of the metric range. If undefined, will default to the color of the series that it represents.</td>
        </tr>
        <tr>
            <td>displayOnHover</td>
            <td>boolean</td>
            <td>false</td>
            <td>Whether the metric range should only be visible when hovering over the parent line.</td>
        </tr>
        <tr>
            <td>lineType</td>
            <td>'solid' | 'dashed' | 'dotted' | 'dotDash' | 'shortDash' | 'longDash' | 'twoDash' | number[]</td>
            <td>'dashed'</td>
            <td>If a metric is provided, defines the line type of the metric line.</td>
        </tr>
        <tr>
            <td>lineWidth</td>
            <td>'XS' | 'S' | 'M' | 'L' | 'XL' | number</td>
            <td>'S'</td>
            <td>If a metric is provided, defines the width of the metric line.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>The key for the metric value in the data.</td>
        </tr>
        <tr>
            <td>metricEnd</td>
            <td>string</td>
            <td>-</td>
            <td>The key for the upper range in the data.</td>
        </tr>
        <tr>
            <td>metricStart</td>
            <td>string</td>
            <td>-</td>
            <td>The key for the lower range in the data.</td>
        </tr>
        <tr>
            <td>rangeOpacity</td>
            <td>number</td>
            <td>0.8</td>
            <td>The opacity of the metric range</td>
        </tr>
        <tr>
            <td>scaleAxisToFit</td>
            <td>boolean</td>
            <td>false</td>
            <td>Whether or not the y-axis should expand to include the entire metric range (if necessary).</td>
        </tr>
    </tbody>
</table>
