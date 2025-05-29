# Area

The `Area` component is used to display area charts. You can specify the type of data that the area is being trended over (linear data, time data or point data) with the `scaleType` prop. It's also possible to define tooltips and on-click popovers for the area using the `ChartTooltip` and `ChartPopover` components respectively as children.

There are two different types of area charts available, standard area and stacked area. When using `metric` alone, areas will automatically be stacked. When using `metricStart` and `metricEnd`, stacking is not supported.

## Defining the shape of an area plot

The shape of an area plot can be defined using two different methods. Both of these methods are mutually exclusive. The table below describes the two methods. If `metricStart` and `metricEnd` are defined, `metric` will be ignored and the "start and end" method will be used.

| method        | props                      | details                                                                                                |
| ------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| metric        | `metric`                   | Start fixed to the baseline (0) or the end of the previous area (stacked), end is start + metric value |
| start and end | `metricStart`, `metricEnd` | Start and end values are provided. Cannot be used with stacking.                                       |

### Value only (Stackable)

If only the `metric` prop is used to set the shape of the area, then the start of the area will be the baseline (0) or the end of the previous area (stacked). The end of the area will be the start + metric value. This is similar to how a traditional bar or a stacked bar would be defined.

### Start and End (Non-stackable)

When using `metricStart` and `metricEnd`, each area's shape is defined by explicit start and end values. This method cannot be used with stacking, and the `order` property will be ignored if these are defined.

### Examples

#### Value only (one series)

```jsx
<Chart data={data}>
	<Axis baseline labelFormat="time" position="bottom" ticks />
	<Axis grid position="left" ticks />
	<Area dimension="date" metric="count" />
</Chart>
```

![Area chart](/img/area_light.png#gh-light-mode-only)
![Area chart](/img/area_dark.png#gh-dark-mode-only)

#### Value only (multiple series)

```jsx
<Chart data={data}>
	<Axis baseline labelFormat="time" position="bottom" ticks />
	<Axis grid position="left" ticks />
	<Area dimension="date" metric="count" color="event" />
	<Legend />
</Chart>
```

![Stacked area chart](/img/area_stacked_light.png#gh-light-mode-only)
![Stacked area chart](/img/area_stacked_dark.png#gh-dark-mode-only)

#### Start and End (floating)

```jsx
<Chart data={data}>
	<Axis baseline labelFormat="time" position="bottom" />
	<Axis grid position="left" title="Temperature (F)" />
	<Area metricEnd="maxTemperature" metricStart="minTemperature" opacity={0.6} />
</Chart>
```

![Floating area chart](/img/area_floating_light.png#gh-light-mode-only)
![Floating area chart](/img/area_floating_dark.png#gh-dark-mode-only)

## Interactivity

The Area component supports rich interactions through tooltips and popovers. When hovering over an area:

-   The opacity of non-hovered areas will be reduced automatically
-   If tooltips are defined, they will be displayed
-   If popovers are defined, clicking the area will show the popover

To add these interactions, use the `ChartTooltip` and `ChartPopover` components as children of the Area component.

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
            <td>Optional elements that can be rendered within the chart. Used to define tooltips and popovers for interactivity.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>The key in the data that defines what color that area will be. This is not a color value itself but rather the key in the data that will map to the color's scale.<br/>For example: A stacked area chart that has a different color for each operating system, `color` would be set to the name of the key in the data that defines which operating system it is (color="operatingSystem").</td>
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
            <td>The key in the data that is used for the value of the data point. When used alone, enables stacking behavior. Incompatible with `metricEnd` and `metricStart`.</td>
        </tr>
        <tr>
            <td>metricEnd</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that is used for the end of the area. Must be used together with `metricStart`. Incompatible with `metric` and stacking behavior.</td>
        </tr>
        <tr>
            <td>metricStart</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that is used for the start of the area. Must be used together with `metricEnd`. Incompatible with `metric` and stacking behavior.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Area name. Useful for if you need to traverse the chart object to find this area. If not provided, will be auto-generated based on the index of the area in the chart.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number</td>
            <td>0.8</td>
            <td>Opacity of the area. The area will automatically handle opacity changes during interactions like hovering and selection.</td>
        </tr>
        <tr>
            <td>order</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that defines the stack order. The higher the order, the higher in the stack the series will be. Only applies when using `metric` for stacked areas. Incompatible with "metricStart" and "metricEnd" (order will be ignored if these are defined).</td>
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
            <td>Type of data that the area is trended over. If using 'time', the dimension data must be in valid time format like a date string or timestamp number.<br/>If you are plotting this area along with other marks that are ordinal (ex. bar), then you must use a 'point' scale for the two to align correctly.</td>
        </tr>
    </tbody>
</table>
