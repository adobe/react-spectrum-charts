The `Area` component is used to display area charts. You can specify the type of data that the area is being trended over (linear data, time data or point data) with the `scaleType` prop. It's also possible to define tooltips and on-click popovers for the area using the `ChartTooltip` and `ChartPopover` components respectively as children.

There are two different types of area charts available, standard area and stacked area.

## Defining the shape of an area plot

The shape of an area plot can be defined using two different methods. Both of these methods are mutually exclusive. The table below describes the two methods. If `metricStart` and `metricEnd` are defined, `metric` will be ignored and the "start and end" method will be used.

| method        | props                      | details                                                                                                |
| ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| metric        | `metric`                   | Start fixed to the baseline (0) or the end of the previous area (stacked), end is start + metric value |
| start and end | `metricStart`, `metricEnd` | Start and end values are provided                                                                      |

### Value only

If only the `metric` prop is used to set the shape of the area, then the start of the area will be the baseline (0) or the end of the previous area (stacked). The end of the area will be the start + metric value. This is similar to how a traditional bar or a stacked bar would be defined.

### Examples

#### One series

```
<Chart data={data}>
    <Axis position="bottom" labelFormat="time" granularity="month" baseline />
    <Axis position='left' grid title="Users" />
    <Area metric="users" />
</Chart>
```

![area](https://github.com/adobe/react-spectrum-charts/assets/29240999/86f36311-6ffc-4f29-9f55-d8fb600436bb)

#### Multiple series

```
<Chart data={data}>
    <Axis position="bottom" labelFormat="time" granularity="month" baseline />
    <Axis position='left' grid title="Users" />
    <Area metric="users" color="operatingSystem" />
    <Legend position="top" title="Operating system" />
</Chart>
```

![stackedarea](https://github.com/adobe/react-spectrum-charts/assets/29240999/f861741c-3ea1-473e-830b-0155e5656e59)

### Start and end

The shape of the area can be defined using the `metricStart` and `metricEnd`. If one of these props is defined, the other must also be defined. These props cannot be used with `stacked = true` or with `metric`. If `stacked` is set to `true`, `metricStart` and `metricEnd` will both be ignored.

### Example

```
<Chart data={data}>
    <Area metricStart="minScore" metricEnd="maxScore" />
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
            <td>ChartTooltip | ChartPopover</td>
            <td>–</td>
            <td>Optional elements that can be rendered within the chart.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>The key in the data that defines what color that area will be. This is not a color value itself but rather the key in the data that will map to the color's scale.<br/>            For example: A stacked area chart that has a different color for each operating system, `color` would be set to the name of the key in the data that defines which operating system it is (color="operatingSystem").</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'datetime'</td>
            <td>The key in the data that the metric is trended against. This is the x-axis for a standard area chart.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>The key in the data that is used for the value of the data point. Incompatible with `metricEnd` and `metricStart`.</td>
        </tr>
        <tr>
            <td>metricEnd</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that is used for the end of the area. Incompatible with `metric`.</td>
        </tr>
        <tr>
            <td>metricStart</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that is used for the start of the area. Incompatible with `metric`.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Area name. Useful for if you need to traverse the chart object to find this area.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number</td>
            <td>0.8</td>
            <td>Opacity of the area.</td>
        </tr>
        <tr>
            <td>order</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that defines the stack order. The higher the order, the higher in the stack the series will be. Incompatible with "metricStart" and "metricEnd" (order will be ignored if these are defined).</td>
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
            <td>Type of data that the area is trended over. If using 'time', the dimension data must be in milliseconds since Jan 1, 1970 UTC (<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#the_ecmascript_epoch_and_timestamps">epoch time</a>).<br/>If you are plotting this area along with other marks that are ordinal (ex. bar), then you must use a 'point' scale for the two to area up correctly.</td>
        </tr>
    </tbody>
</table>
