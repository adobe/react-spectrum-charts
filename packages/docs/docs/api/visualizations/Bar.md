The `Bar` component is used to display bar charts. You can do [stacked](https://spectrum.adobe.com/page/bar-chart/#Stacked) or [dodged](https://spectrum.adobe.com/page/bar-chart/#Dodged) (grouped) bars as well as [vertical](https://spectrum.adobe.com/page/bar-chart/#Column-chart) or [horizontal](https://spectrum.adobe.com/page/bar-chart/#Bar-chart) orientation. It's also possible to define tooltips and on-click popovers for the bars using the `ChartTooltip` and `ChartPopover` components respectively as children. Trendlines can be added as well using the `Trendline` component as a child (only average and median methods are supported for bar). Bar annotations can be added using the `Annotation` component as a child.

If you only have one series in your data, both the `type` and `color` props can be ignored.

### Examples:

#### Horizontal Bar

```jsx
<Chart data={data}>
  <Axis position="bottom" grid ticks title="Downloads" />
  <Axis position="left" baseline title="Browser" />
  <Bar name="Bar Chart" orientation="horizontal" dimension="browser" metric="views" />
</Chart>
```

![Horizontal bar chart](/img/bar_horizontal_light.png#gh-light-mode-only)
![Horizontal bar chart](/img/bar_horizontal_dark.png#gh-dark-mode-only)

#### Vertical Bar

```jsx
<Chart data={data}>
  <Axis position="bottom" baseline title="Browser" />
  <Axis position="left" grid ticks title="Downloads" />
  <Bar name="Vertical Bar" orientation="vertical" dimension="browser" metric="downloads" />
</Chart>
```

![Vertical bar chart](/img/bar_vertical_light.png#gh-light-mode-only)
![Vertical bar chart](/img/bar_vertical_dark.png#gh-dark-mode-only)

#### Stacked Bar

```jsx
<Chart data={data}>
  <Axis position="bottom" grid title="Downloads" />
  <Axis position="left" baseline title="Browser" />
  <Bar
    name="Bar Chart"
    orientation="horizontal"
    type="stacked"
    color="operatingSystem"
    dimension="browser"
    metric="downloads"
  />
  <Legend position="top" title="Operating system" />
</Chart>
```

![Horizontal stacked bar chart](/img/bar_stackedHorizontal_light.png#gh-light-mode-only)
![Horizontal stacked bar chart](/img/bar_stackedHorizontal_dark.png#gh-dark-mode-only)

#### Dodged Bar

```jsx
<Chart data={data}>
  <Axis position="bottom" grid title="Downloads" />
  <Axis position="left" baseline title="Browser" />
  <Bar
    name="Bar Chart"
    orientation="horizontal"
    type="dodged"
    color="operatingSystem"
    dimension="browser"
    metric="downloads"
  />
  <Legend position="top" title="Operating system" />
</Chart>
```

![Horizontal dodged bar chart](/img/bar_dodgedHorizontal_light.png#gh-light-mode-only)
![Horizontal dodged bar chart](/img/bar_dodgedHorizontal_dark.png#gh-dark-mode-only)

#### Trellised Bar

```jsx
<Chart data={data}>
  <Axis grid position="left" title="Users, Count" />
  <Axis baseline position="bottom" title="Platform" />
  <Bar
    color="bucket"
    dimension="platform"
    order="order"
    orientation="vertical"
    trellis="event"
    trellisOrientation="horizontal"
    type="stacked"
  ></Bar>
  <Legend />
</Chart>
```

![Trellis dodged bar chart](/img/bar_trellis_light.png#gh-light-mode-only)
![Trellis dodged bar chart](/img/bar_trellis_dark.png#gh-dark-mode-only)

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
            <td>Annotation | ChartTooltip | ChartPopover | Trendline</td>
            <td>–</td>
            <td>Optional elements that can be rendered within the chart.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string | [string, string]</td>
            <td>'series'</td>
            <td>The key in the data that defines what color that bar will be, or a dual facet array for more complex color mapping. This is not a color value itself but rather the key in the data that will map to the colors scale.<br/>For example: A stacked bar chart that has a different color for each operating system, `color` would be set to the name of the key in the data that defines which operating system it is (color="operatingSystem").</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'category'</td>
            <td>The key in the data that is used for the categories of the bar.</td>
        </tr>
        <tr>
            <td>dimensionDataType</td>
            <td>string</td>
            <td>–</td>
            <td>Data type field used for the bar categories (x-axis for a vertical bar).</td>
        </tr>
        <tr>
            <td>dualMetricAxis</td>
            <td>boolean</td>
            <td>false</td>
            <td>Whether to scale the last series in the data separately using the secondary metric axis.</td>
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
            <td>lineType</td>
            <td>string | [string, string]</td>
            <td>'solid'</td>
            <td>Line type or key in the data that is used as the line type facet. Can be a dual facet array for more complex line type mapping.</td>
        </tr>
        <tr>
            <td>lineWidth</td>
            <td>number</td>
            <td>0</td>
            <td>Border width of the bar.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Bar name. Useful for if you need to traverse the chart object to find this bar.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>string | \{value: number} | [string, string]</td>
            <td>\{value: 1}</td>
            <td>If a string is provided, this string is the key in the data that bars will be grouped into series by. Each unique value for this key in the provided data will map to an opacity from the opacities scale. Can also be a dual facet array for more complex opacity mapping.</td>
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
            <td>onClick</td>
            <td>function</td>
            <td>–</td>
            <td>Callback that will be run when a point/section is clicked.</td>
        </tr>
        <tr>
            <td>onMouseOver</td>
            <td>function</td>
            <td>–</td>
            <td>Callback that will be run when a bar is hovered.</td>
        </tr>
        <tr>
            <td>onMouseOut</td>
            <td>function</td>
            <td>–</td>
            <td>Callback that will be run when a bar is no longer hovered.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>The key in the data that is used for the height of the bar.</td>
        </tr>
        <tr>
            <td>metricAxis</td>
            <td>string</td>
            <td>–</td>
            <td>Axis that the metric is trended against (y-axis for a vertical bar). This is used for combo charts.</td>
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
        <tr>
            <td>type</td>
            <td>'dodged' | 'stacked'</td>
            <td>'stacked'</td>
            <td>Defines if multiple series should be grouped side-by-side (dodged) or stacked.</td>
        </tr>
    </tbody>
</table>

## Annotation

The `Annotation` component is used to display a text annotation. The annotation will display at the top of the bar for each data point in `data`.

```jsx
<Chart data={data}>
  <Bar {...props}>
    <Annotation textKey="textKey" style={{ width: 48 }} />
  </Bar>
</Chart>
```

![Bar annotation chart](/img/barAnnotation_light.png#gh-light-mode-only)
![Bar annotation chart](/img/barAnnotation_dark.png#gh-dark-mode-only)

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
            <td>textKey</td>
            <td>string</td>
            <td>–</td>
            <td>The key on each value in the data passed to the chart that contains the text to display in the annotation.</td>
        </tr>
        <tr>
            <td>style</td>
            <td>\{width: number}</td>
            <td>-</td>
            <td>Style overrides. Width is used in place of dynamically calculated width.</td>
        </tr>
    </tbody>
</table>
