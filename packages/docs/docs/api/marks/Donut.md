## RELEASE CANDIDATE

Donut is currently in `rc`. This means that the component, behavior and API are all subject to change. To use, you will need to import from `@adobe/react-spectrum-charts/rc`. If your app is bundled with `parcel`, check out the [troubleshooting guide](https://github.com/adobe/react-spectrum-charts/wiki/Troubleshooting-Guide) for details on how to setup your `package.json` so it will accept this style of import.

```
import { Chart, ChartProps } from '@adobe/react-spectrum-charts';
import { Donut, DonutSummary, SegmentLabel } from '@adobe/react-spectrum-charts/rc';
```

# Donut

The `Donut` component is used to display donut and pie charts. The `holeRatio` prop is used to control the size of the hole in the center of the chart. A `holeRatio` of 0 will give you a pie chart.

## Data aggregation

Unlike many other chart types, `Donut` only draws a single mark (arc) for a given series. This means that if you pass in multiple data points for the same series, donut will aggregate them together, summing their metric values.

## Legend vs. direct labels

A donut chart can display series labels directly next to each arc using the `SegmentLabel` component. This is the direct labels method. This method is great when there are fewer than 6 segments in your donut chart. If one of the segments of the pie chart is really thin (sliver), the direct label for that slice will be dropped. The minimum angle for a segment to display a label is 0.3 radians (17.2 degrees).

It is also possible to label each series using a legend just like you would on any other chart type.

You should not use direct labels and a legend at the same time as the information is redundant.

## Examples

### Donut

```jsx
<Chart data={data}>
    <Donut color="operatingSystem" metric="visitors">
        <DonutSummary label="Visitors" />
    </Donut>
    <Legend title="Operating system" />
</Chart>
```

![Donut with legend](/img/donut_legend_light.png#gh-light-mode-only)
![Donut with legend](/img/donut_legend_dark.png#gh-dark-mode-only)

### Direct labels

```jsx
<Chart data={data}>
    <Donut color="operatingSystem" metric="visitors">
        <DonutSummary label="Visitors" />
        <SegmentLabel percent value />
    </Donut>
</Chart>
```

![Donut with labels on each segment](/img/donut_segmentLabelSummary_light.png#gh-light-mode-only)
![Donut with labels on each segment](/img/donut_segmentLabelSummary_dark.png#gh-dark-mode-only)

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
            <td>(ChartTooltip | ChartPopover | DonutSummary | SegmentLabel)[]</td>
            <td>–</td>
            <td>Defines the extra content associated to the Donut.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>The key in the data that defines what color that arc of the donut will be. This is not a color value itself but rather the key in the data that will map to the colors scale.<br/>For example: A donut chart that has a different color for each operating system, `color` would be set to the name of the key in the data that defines which operating system it is (color="operatingSystem").</td>
        </tr>
        <tr>
            <td>holeRatio</td>
            <td>number</td>
            <td>0.85</td>
            <td>Ratio of the donut inner radius / donut outer radius. 0 is a piechart. The outer radius is calculated as min(width, height) / 2 - 2 pixels (to make room for selection ring).</td>
        </tr>
        <tr>
            <td>isBoolean</td>
            <td>boolean</td>
            <td>false</td>
            <td>Determines if the metric value should be displayed as a percent. If true, data should only contain two data points which sum to 1. When true, will display the first datapoint as a percent.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>donut\{index}</td>
            <td>Donut name. Useful for if you need to traverse the chart object to find this donut. If not provided, will be automatically generated as "donut" followed by its index number.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>The key in the data that is used for the length of the arc.</td>
        </tr>
        <tr>
            <td>startAngle</td>
            <td>number</td>
            <td>0</td>
            <td>The start angle of the donut in radians. 0 is top dead center.</td>
        </tr>
   </tbody>
</table>

## Donut Summary

The `DonutSummary` component can be used to provide a total of the displayed metric in the center of the donut. The font size of the summary is calculated as 35% of the inner donut radius.

```jsx
<Chart {...chartProps}>
    <Donut>
        <DonutSummary label="Visitors" />
    </Donut>
</Chart>
```

![Donut with a metric total and label in the center](/img/donut_summary_light.png#gh-light-mode-only)
![Donut with a metric total and label in the center](/img/donut_summary_dark.png#gh-dark-mode-only)

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
            <td>label</td>
            <td>string</td>
            <td>–</td>
            <td>Metric label that gets placed below the metric total.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber' | string</td>
            <td>shortNumber</td>
            <td>Sets the format for the metric total. This format must be a <a href="https://d3js.org/d3-format#locale_format" target="_blank">d3-format specifier</a> (Example: '$.2f' = $5,432.10). <a href="https://github.com/adobe/react-spectrum-charts/wiki/Chart-API#locale" target="_blank">Number locale</a> will be applied to the number format. The following presets are also provided: currency ($2.50), shortCurrency ($20M), shortNumber (3B), standardNumber (2,500)</td>
        </tr>
    </tbody>
</table>

## Segment Label

The `SegmentLabel` component can be used to add labels to each segment of the donut. Labels will only be shown for segments with an arc angle greater than 0.3 radians (17.2 degrees).

```jsx
<Chart {...chartProps}>
    <Donut>
        <SegmentLabel percent value valueFormat="shortNumber" />
    </Donut>
</Chart>
```

![Donut with labels on each segment](/img/donut_segmentLabel_light.png#gh-light-mode-only)
![Donut with labels on each segment](/img/donut_segmentLabel_dark.png#gh-dark-mode-only)

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
            <td>labelKey</td>
            <td>string</td>
            <td>–</td>
            <td>Sets the key in the data that should be used for the label. Defaults to the value of `color` on the parent Donut component.</td>
        </tr>
        <tr>
            <td>percent</td>
            <td>boolean</td>
            <td>false</td>
            <td>Displays the percent of the total donut that the segment represents.</td>
        </tr>
        <tr>
            <td>value</td>
            <td>boolean</td>
            <td>false</td>
            <td>Displays the metric value of the donut that the segment represents.</td>
        </tr>
        <tr>
            <td>valueFormat</td>
            <td>'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber' | string</td>
            <td>standardNumber</td>
            <td>Sets the format for the segment metric value. This format must be a <a href="https://d3js.org/d3-format#locale_format" target="_blank">d3-format specifier</a> (Example: '$.2f' = $5,432.10). <a href="https://github.com/adobe/react-spectrum-charts/wiki/Chart-API#locale" target="_blank">Number locale</a> will be applied to the number format. The following presets are also provided: currency ($2.50), shortCurrency ($20M), shortNumber (3B), standardNumber (2,500)</td>
        </tr>
    </tbody>
</table>
