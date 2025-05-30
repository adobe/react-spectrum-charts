The `Line` component is used to display line charts. You can specify the type of data that the line is being trended over with the `scaleType` prop. You can add `Trendline`s and `MetricRanges` as children to show trends in your data or include a ranged area of data in addition to the line. It's also possible to define tooltips and on-click popovers for the line using the `ChartTooltip` and `ChartPopover` components respectively as children.

### Examples

#### Line

```
<Chart data=\{data}>
	<Axis position='bottom' labelFormat='time' granularity='month' baseline />
	<Axis position='left' grid title="Visitors" />
	<Line metric="visitors" color="browser" />
	<Legend position='top' title='Browser' />
</Chart>
```

![line](https://github.com/adobe/react-spectrum-charts/assets/29240999/5fb8d55e-7f07-4846-a944-d2eb46c477fa)

### Props

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
            <td>ChartTooltip | ChartPopover | MetricRange | Trendline</td>
            <td>–</td>
            <td>Optional elements that can be rendered within the chart.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>The key in the data that defines what color that line will be. This is not a color value itself but rather the key in the data that will map to the colors scale.<br/>For example: A line chart that has a different line and color for each operating system, `color` would be set to the name of the key in the data that defines which operating system it is (color="operatingSystem").</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'datetime'</td>
            <td>The key in the data that the metric is trended against. This is the x-axis for a standard line chart.</td>
        </tr>
        <tr>
            <td>lineType</td>
            <td>string | \{value: LineType | number[]}</td>
            <td>–</td>
            <td>If a string is provided, this string is the key in the data that lines will be grouped into series by. Each unique value for this key in the provided data will map to a line type from the lineTypes scale. <br/>If an object with a value is provided, this will set the line type for all lines.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>The key in the data that is used for the value of the data point.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Line name. Useful for if you need to traverse the chart object to find this line.</td>
        </tr>
        <tr>
            <td>padding</td>
            <td>number</td>
            <td>–</td>
            <td>Sets the chart area padding. This is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear)</td>
        </tr>
        <tr>
            <td>scaleType</td>
            <td>'linear' | 'time' | 'point'</td>
            <td>'time'</td>
            <td>Type of data that the line is trended over. If using 'time', the dimension data must be in milliseconds since Jan 1, 1970 UTC (<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#the_ecmascript_epoch_and_timestamps">epoch time</a>).<br/>If you are plotting this line along with other marks that are ordinal (ex. bar), then you must use a 'point' scale for the two to line up correctly.</td>
        </tr>
        <tr>
            <td>staticPoint</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data that if it exists and it's value is true, a visible point will be shown on the line for that data item.</td>
        </tr>
    </tbody>
</table>
