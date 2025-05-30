The `Bar` component is used to display bar charts. You can do [stacked](https://spectrum.adobe.com/page/bar-chart/#Stacked) or [dodged](https://spectrum.adobe.com/page/bar-chart/#Dodged) (grouped) bars as well as [vertical](https://spectrum.adobe.com/page/bar-chart/#Column-chart) or [horizontal](https://spectrum.adobe.com/page/bar-chart/#Bar-chart) orientation. It's also possible to define tooltips and on-click popovers for the bars using the `ChartTooltip` and `ChartPopover` components respectively as children. Trendlines can be added as well using the `Trendline` component as a child (only average and median methods are supported for bar).

If you only have one series in your data, both the `type` and `color` props can be ignored.

### Examples:

#### Horizontal Bar

```
<Chart data=\{data}>
    <Axis position="bottom" grid ticks title="Page Views" />
    <Axis position="left" baseline title="Browser" />
    <Bar
        name="Bar Chart"
        orientation="horizontal"
        dimension="browser"
        metric="views"
    />
</Chart>
```

![bar](https://github.com/adobe/react-spectrum-charts/assets/29240999/8bb373b5-3a3a-46e1-a08e-340cdd23968e)

#### Vertical Bar

```
<Chart data=\{data}>
    <Axis position="bottom" baseline title="Browser" />
    <Axis position="left" grid ticks title="Visitors" />
    <Bar
        name="Vertical Bar"
        orientation="vertical"
        dimension="browser"
        metric="visitors"
    />
</Chart>
```

![verticalbar](https://github.com/adobe/react-spectrum-charts/assets/29240999/fb5726c9-107a-4738-bf32-c796bafe1074)

#### Stacked Bar

```
<Chart data=\{data}>
    <Axis position="bottom" grid title="Page Views" />
    <Axis position="left" baseline title="Browser" />
    <Bar
        name="Bar Chart"
        orientation="horizontal"
        type="stacked"
        color="operatingSystem"
        dimension="browser"
        metric="views"
    />
    <Legend position="top" title="Operating system" />
</Chart>
```

![stackedbar](https://github.com/adobe/react-spectrum-charts/assets/29240999/2aa91dd6-dc28-4138-832a-51d6b51b1bca)

#### Dodged Bar

```
<Chart data=\{data}>
    <Axis position="bottom" gridtitle="Page Views" />
    <Axis position="left" baseline title="Browser" />
    <Bar
        name="Bar Chart"
        orientation="horizontal"
        type="dodged"
        color="operatingSystem"
        dimension="browser"
        metric="views"
    />
    <Legend position="top" title="Operating system" />
</Chart>
```

![dodgedbar](https://github.com/adobe/react-spectrum-charts/assets/29240999/c35144f0-f4f0-4355-91d4-a261f1af49e5)

#### Trellised Bar

```
<Chart data=\{data}>
    <Axis
        grid
        position="left"
        title="Users, Count"
    />
    <Axis
        baseline
        position="bottom"
        title="Platform"
    />
    <Bar
        color="bucket"
        dimension="platform"
        order="order"
        orientation="vertical"
        trellis="event"
        trellisOrientation="horizontal"
        type="stacked"
    >
    </Bar>
    <Legend />
</Chart>
```

<img width="885" alt="trellis" src="https://github.com/adobe/react-spectrum-charts/assets/29240999/258041f5-16ab-45f9-bbc6-787fb19c1064" />

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
            <td>ChartTooltip | ChartPopover | Trendline</td>
            <td>–</td>
            <td>Optional elements that can be rendered within the chart.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>The key in the data that defines what color that bar will be. This is not a color value itself but rather the key in the data that will map to the colors scale.<br/>            For example: A stacked bar chart that has a different color for each operating system, `color` would be set to the name of the key in the data that defines which operating system it is (color="operatingSystem").</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'category'</td>
            <td>The key in the data that is used for the categories of the bar.</td>
        </tr>
         <tr>
            <td>groupedPadding</td>
            <td>number (0-1)</td>
            <td>-</td>
            <td>Defines the padding around each bar within a group of bars. Allows setting different paddings between grouped and non-grouped bars. A groupedPadding of 0 will result in 0px between bars. For more details, see the <a href="https://vega.github.io/vega/docs/scales/#band">Vega band scale docs</a>.</td>
        </tr>
        <tr>
            <td>hasSquareCorners</td>
            <td>boolean</td>
            <td>false</td>
            <td>Forces bars to be square on top instead of using default rounded corners.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Bar name. Useful for if you need to traverse the chart object to find this bar.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>string | \{value: number}</td>
            <td>\{value: 1}</td>
            <td>If a string is provided, this string is the key in the data that bars will be grouped into series by. Each unique value for this key in the provided data will map to an opacity from the opacities scale.<br/>            If an object with a value is provided, this will set the opacity for bars.</td>
        </tr>
        <tr>
            <td>order</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that sets the order that the bars get stacked/grouped in. For a vertical bar, order goes from bottom to top (stacked) and left to right (dodged). For a horizontal bar, order goes from left to right (stacked) and top to bottom (dodged).</td>
        </tr>
        <tr>
            <td>orientation</td>
            <td>'horizontal' | 'vertical'</td>
            <td>'vertical'</td>
            <td>Sets the orientation of the bars.</td>
        </tr>
        <tr>
            <td>paddingRatio</td>
            <td>number (0-1)</td>
            <td>0.4</td>
            <td>Defines the padding around each bar. The padding is calculated as (paddingRatio * stepLength). "stepLength" is the distance in pixels from the center of one bar to the center of the next bar. A paddingRatio of 0 will result in 0px between bars. For more details, see the <a href="https://vega.github.io/vega/docs/scales/#band">Vega band scale docs</a>.</td>
        </tr>
        <tr>
            <td>paddingOuter</td>
            <td>number (0-1)</td>
            <td>–</td>
            <td>Sets the chart area padding. The padding is calculated as (paddingOuter * stepLength). "stepLength" is the distance in pixels from the center of one bar to the center of the next bar. If undefined, paddingOuter is calculated based on the paddingRatio. For more details, see the <a href="https://vega.github.io/vega/docs/scales/#band">Vega band scale docs</a>.</td>
        </tr>
        <tr>
            <td>subSeries</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that defines the sub series of the data. Adds an additional dimension to the bar chart. If the bar chart is a stacked bar, then the stacked bars will be dodged (grouped) by the sub series. Conversely, if the bar chart is a dodged (grouped) bar, then the dodged bars will be stacked the sub series.<br/>            To configure the colors of the sub series, pass through a two dimensional array of colors (Color[][]) to Chart.</td>
        </tr>
        <tr>
            <td>type</td>
            <td>'dodged' | 'stacked'</td>
            <td>'stacked'</td>
            <td>Defines if multiple series should be grouped side-by-side (dodged) or stacked</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>The key in the data that is used for the height of the bar.</td>
        </tr>
        <tr>
            <td>trellis</td>
            <td>string</td>
            <td>–</td>
            <td>The key in the data that defines a third grouping of the data. This creates multiple bar charts with a common axis for the metric data, while each chart labels each bar with the associated category/dimension.</td>
        </tr>
        <tr>
            <td>trellisOrientation</td>
            <td>'horizontal' | 'vertical'</td>
            <td>'horizontal'</td>
            <td>Determines the direction the trellised charts should be laid out in. Only takes effect when the "trellis" prop is defined.</td>
        </tr>
<tr>
            <td>trellisPadding</td>
            <td>number (0-1)</td>
            <td>0.2</td>
            <td>Defines the padding between each sub-chart in the trellis. The padding is calculated as (trellisPadding * axisLength). "axisLength" is the length in pixels of one charts' axis in the direction of the trellis (i.e. x-axis for a horizontal trellis). For more details, see the <a href="https://vega.github.io/vega/docs/scales/#band">Vega band scale docs</a>.</td>
        </tr>
   </tbody>
</table>
