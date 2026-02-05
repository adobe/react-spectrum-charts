The `Line` component is used to display line charts. You can specify the type of data that the line is being trended over with the `scaleType` prop. You can add `Trendline`s and `MetricRanges` as children to show trends in your data or include a ranged area of data in addition to the line. It's also possible to define tooltips and on-click popovers for the line using the `ChartTooltip` and `ChartPopover` components respectively as children.

### Examples

#### Basic Line Chart

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid title="Users" />
  <Line metric="users" color="event" />
  <Legend position="bottom" />
</Chart>
```

![Line chart example](/img/line_light.png#gh-light-mode-only)
![Line chart example](/img/line_dark.png#gh-dark-mode-only)

#### Line with Tooltip and Click Handler

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid title="Users" />
  <Line metric="users" color="browser" onClick={(event, data) => console.log('Clicked:', data)}>
    <ChartTooltip>
      {(datum) => (
        <div>
          <div>{datum.date}</div>
          <div>Event: {datum.event}</div>
          <div>Users: {Number(datum.users).toLocaleString()}</div>
        </div>
      )}
    </ChartTooltip>
  </Line>
  <Legend position="bottom" />
</Chart>
```

![Line tooltip chart example](/img/line_tooltip_light.png#gh-light-mode-only)
![Line tooltip chart example](/img/line_tooltip_dark.png#gh-dark-mode-only)

#### Line with Trendline and MetricRange

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" ticks baseline />
  <Axis position="left" grid title="Users" />
  <Line metric="users" color="event">
    <Trendline method="quadratic" />
    <MetricRange upperMetric="upperBound" lowerMetric="lowerBound" />
  </Line>
</Chart>
```

![Line chart with metric range and trendline example](/img/line_metricRangeTrendline_light.png#gh-light-mode-only)
![Line chart with metric range and trendline example](/img/line_metricRangeTrendline_dark.png#gh-dark-mode-only)

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
            <td>Optional elements that can be rendered within the chart. Use these to add tooltips, popovers, metric ranges, or trendlines to your line chart.</td>
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
            <td>If a string is provided, this string is the key in the data that lines will be grouped into series by. Each unique value for this key in the provided data will map to a line type from the lineTypes scale. <br/>If an object is provided with format `{value: 'solid' | 'dashed' | 'dotted' | number[]}`, this will set the line type for all lines.</td>
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
            <td>onClick</td>
            <td>(event: MouseEvent, data: any) => void</td>
            <td>–</td>
            <td>Callback function that will be executed when a point or section of the line is clicked. Receives the mouse event and the data point as arguments.</td>
        </tr>
        <tr>
            <td>onMouseOver</td>
            <td>function</td>
            <td>–</td>
            <td>Callback function that will be executed when a point or section of the line is hovered.</td>
        </tr>
        <tr>
            <td>onMouseOut</td>
            <td>function</td>
            <td>–</td>
            <td>Callback function that will be executed when a point or section of the line is no longer hovered.</td>
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
            <td>Key in the data that if it exists and its value is true, a visible point will be shown on the line for that data item.</td>
        </tr>
    </tbody>
</table>

### Best Practices

1. **Scale Type Selection**

   - Use `scaleType="time"` for time-series data
   - Use `scaleType="linear"` for continuous numerical data
   - Use `scaleType="point"` when working with categorical data or when combining with ordinal marks like bars

2. **Interactivity**

   - Add tooltips using `ChartTooltip` for better data exploration
   - Use `onClick` handlers for interactive features like drilling down into data
   - Consider using `ChartPopover` for displaying detailed information on click

3. **Data Analysis**
   - Use `Trendline` to show data trends
   - Add `MetricRange` to display confidence intervals or bounds
   - Use `staticPoint` to highlight specific data points of interest

### Accessibility

The Line component follows accessibility best practices:

- Uses semantic SVG elements for better screen reader support
- Supports keyboard navigation when interactive elements are added
- Color combinations should meet WCAG contrast requirements
