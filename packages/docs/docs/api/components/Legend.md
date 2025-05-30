The `Legend` component is used to display a legend for the visualization.

```
<Chart data=\{data}>
    <Legend position="right" title="Country">
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
      <td>color</td>
      <td>string | \{value: Color}</td>
      <td>–</td>
      <td>Overrides the default symbol fill and stroke color. If a string is provided, this is a data key reference, similar to setting `color` on a mark like `Line` or `Bar`. If a static value object is provided then all symbols will be the color provided. Css color names and spectrum color names are supported for the static color value.</td>
    </tr>
    <tr>
      <td>descriptions</td>
      <td>\{seriesName: string, description: string}[]</td>
      <td>–</td>
      <td>An array of objects containing a `seriesName` and `description` property. The seriesName must match the value of the series property on the chart data being passed in. If set, a tooltip will appear after a short delay when you hover over a legend element. The contents of the tooltip will be the description found in the key-value pair.</td>
    </tr>
    <tr>
      <td>hiddenEntries</td>
      <td>string[]</td>
      <td>–</td>
      <td>List of series names that should be hidden from the legend. This does not hide these series in the chart as well, only the legend. To hide series in the chart, use `hiddenSeries`.</td>
    </tr>
    <tr>
      <td>highlight</td>
      <td>boolean</td>
      <td>false</td>
      <td>Defines if hovering over a legend element should highlight that series in the chart.</td>
    </tr>
    <tr>
      <td>isToggleable</td>
      <td>boolean</td>
      <td>false</td>
      <td>Sets if the series should be able to hide/show by clicking on the respective legend entry (uncontrolled).</td>
    </tr>
    <tr>
      <td>legendLabels</td>
      <td>\{seriesName: string, label: string}[]</td>
      <td>-</td>
      <td>Defines custom labels to display in place of the series value for data. If one series has an override, any series that don't have an override will display their series value.</td>
    </tr>
    <tr>
      <td>lineType</td>
      <td>string | \{ value: LineType }</td>
      <td>–</td>
      <td>Overrides the default symbol border line type. If a string is provided, this is a data key reference, similar to setting `color` on a mark like `Line` or `Bar`. If a static value object is provided then all symbol borders will have the line type provided.</td>
    </tr>
    <tr>
      <td>lineWidth</td>
      <td>string | \{ value: LineWidth }</td>
      <td>–</td>
      <td>Overrides the default symbol border line width. If a string is provided, this is a data key reference, similar to setting `color` on a mark like `Line` or `Bar`. If a static value object is provided then all symbol borders will have the line width provided.</td>
    </tr>
    <tr>
      <td>onMouseOut</td>
      <td>(seriesName: string) => void</td>
      <td>–</td>
      <td>Allows triggering of a callback function when moving the mouse pointer outside of a legend item.</td>
    </tr>
    <tr>
      <td>onMouseOver</td>
      <td>(seriesName: string) => void</td>
      <td>–</td>
      <td>Allows triggering of a callback function when moving the mouse pointer over a legend item.</td>
    </tr>
    <tr>
      <td>opacity</td>
      <td>string | \{ value: number }</td>
      <td>–</td>
      <td>Overrides the default symbol fill opacity. If a string is provided, this is a data key reference, similar to setting `color` on a mark like `Line` or `Bar`. If a static value object is provided then all symbols will have the fill opacity provided.</td>
    </tr>
    <tr>
      <td>position</td>
      <td>'left' | 'bottom' | 'top' | 'right'</td>
      <td>'bottom'</td>
      <td>Sets where the legend will be displayed.</td>
    </tr>
    <tr>
      <td>symbolShape</td>
      <td>string | \{ value: ChartSymbolShape }</td>
      <td>–</td>
      <td>Overrides the default symbol shape. If a string is provided, this is a data key reference, similar to setting `color` on a mark like `Line` or `Bar`. If a static value object is provided then all symbols will be the shape provided.</td>
    </tr>
    <tr>
      <td>title</td>
      <td>string</td>
      <td>–</td>
      <td>Defines the legend title.</td>
    </tr>
  </tbody>
</table>

## Hide/Show Series

The legend component can be used to hide and show series in the chart. These series will still appear in the legend but the data for these series will not be drawn.

If there is a need to hide a given series in the chart as well as in the legend, it is recommended to filter that data from the `data` array supplied to the `Chart` component.

### Uncontrolled

The easiest way to hide/show data in the chart is to supply the `isToggleable` prop to the legend. `isToggleable` sets up the legend entries so that each works like a toggle input that will hide/show the respective series.

#### Example

```
<Chart>
  <Bar/>
  <Legend isToggleable />
</Chart>
```

### Controlled

It is also possible to hide/show series using a controlled approach. This is useful if there is a need to toggle the visibility of series from an external input or if complex hide/show logic is needed.

To setup hide/show using a controlled method, pass in the list of hidden series to the `hiddenSeries` prop. Note that the hidden series values should be the series name and not a custom series label that might have been provided using the `legendLabels` prop.

The `onClick` handler can be used to trigger custom hide/show logic.

#### Example

```
const [hiddenSeries, setHiddenSeries] = useState<string[]>([])

const onLegendClick = (seriesName: string) => \{
  if (hiddenSeries.includes(seriesName)) \{
    setHiddenSeries(hiddenSeries.filter(series => series !== seriesName))
  }
  setHiddenSeries([...hiddenSeries, seriesName])
}

return (
  <Chart hiddenSeries=\{hiddenSeries}>
    <Bar/>
    <Legend onClick=\{onLegendClick} />
  </Chart>
)
```

## Advanced

### Faceting Data

It is possible to control the symbols for legend entries beyond the default styles that get applied based on the visualization. By default the legend symbol color, border line type, border line width, opacity, and shape are inferred from the mark that they represent.

If there is a need to override any of these, the `color`, `lineType`, `lineWidth`, and `opacity` props can be used. If a string is provided to any of these, then it will use that data key to facet the data. If a static value object is provided (`\{value: any}`), then that static value will be applied to all symbols.

#### Example

For the following example, each symbol in the legend will be `gray-800` and the opacity of each symbol will be determined by the operatingSystem.

```
<Chart>
  <Bar/>
  <Legend color=\{\{value: 'gray-800'}} opacity='operatingSystem' />
</Chart>
```
