The `Axis` component is used to display the axis, axis labels and grid marks. An axis is not required if you would like something like a [sparkline](https://spectrum.adobe.com/page/line-chart/#Sparkline) visualization.

```
<Chart data=\{data}>
    <Axis position="bottom" granularity="hour" grid=\{false} title="My Axis Title" />
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
            <td>position*</td>
            <td>'left' | 'bottom' | 'top' | 'right'</td>
            <td>–</td>
            <td>Sets where the axis will be displayed.</td>
        </tr>
        <tr>
            <td>baseline</td>
            <td>boolean</td>
            <td>false</td>
            <td>Sets if the baseline for this axis should be displayed.</td>
        </tr>
        <tr>
            <td>baselineOffset</td>
            <td>number</td>
            <td>0</td>
            <td>Sets the offset from 0 for the baseline. `baselineOffset` is only valid when the 'baseline' is true and the baseline is being drawn relative to a continuous axis (ex. linear or time).<br/>If 'baselineOffset' is not 0, the baseline will be drawn behind all other marks in the chart.</td>
        </tr>
        <tr>
            <td>children</td>
            <td>AxisAnnotation | ReferenceLine</td>
            <td>–</td>
            <td>Optional content of the axis</td>
        </tr>
        <tr>
            <td>granularity</td>
            <td>'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter'</td>
            <td>'day'</td>
            <td>Defines the granularity for axis labels. This is only valid for time trended charts.</td>
        </tr>
        <tr>
            <td>grid</td>
            <td>boolean</td>
            <td>false</td>
            <td>Sets whether or not to display grid lines.</td>
        </tr>
        <tr>
            <td>hideDefaultLabels</td>
            <td>boolean</td>
            <td>false</td>
            <td>Hides the default axis labels. Labels that have been explicitly added using the `labels` or `subLabels` props will still be visible.</td>
        </tr>
        <tr>
            <td>labelAlign</td>
            <td>'start' | 'center' | 'end'</td>
            <td>'center'</td>
            <td>Sets the alignment and justification for labels. If applied to an axis for a bar, the labels will also justify to the start/end/center of the bar. For vertical a vertical axis, 'start' = 'top' and 'end' = 'bottom'. For a horizontal axis, 'start' = 'left' and 'end' = 'right'.</td>
        </tr>
        <tr>
            <td>labelFormat</td>
            <td>'duration' | 'linear' | 'percentage' | 'time'</td>
            <td>–</td>
            <td>Sets the format to display the labels in. `duration` will display seconds value in a m:ss format if less than 3,600 and in a H:mm:ss format if >= 3,600 (ex: 3 = 0:03, 36 = 0:36, 366 = 6:06, 3661 = 1:01:01).</td>
        </tr>
        <tr>
            <td>labelOrientation</td>
            <td>'horizontal' | 'vertical'</td>
            <td>'horizontal'</td>
            <td>Sets the orientation to display the axis labels in. If using `vertical`, subLabels will not be displayed.</td>
        </tr>
        <tr>
            <td>labels</td>
            <td>(\{value: string | number, label?: string | number, align?: LabelAlign, fontWeight?: FontWeight} | number | string)[]</td>
            <td>–</td>
            <td>Adds additional labels to the axis. Either an object or the domain value (string | number) can be provided as entries to the array. Just providing the domain values makes it possible to simply control the labels that should be added without altering the display value or styling of the label. Providing an object as the label entry opens up control of the alignment, font-weight and display value of the label. `fontWeight` and `align` will default to the axis font weight and label alignment. `label` is equal to `value` by default.The following are semantically equivalent: [\{value: 2, label: 2, align: 'center', fontWeight: normal}] = [\{value: 2}] = [2]</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber' | string</td>
            <td>–</td>
            <td>Sets the format for numeric axis labels. This format must be a <a href="https://d3js.org/d3-format#locale_format" target="_blank">d3-format specifier</a> (Example: '$.2f' = $5,432.10). <a href="https://github.com/adobe/react-spectrum-charts/wiki/Chart-API#locale" target="_blank">Number locale</a> will be applied to the number format. The following presets are also provided: currency ($2.50), shortCurrency ($20M), shortNumber (3B), standardNumber (2,500)</td>
        </tr>
        <tr>
            <td>range</td>
            <td>[number, number]</td>
            <td>–</td>
            <td>An array containing the minimum and maximum values of an axis, for example: `[-10, 10].` The `scaleType` corresponding to the axis must be either `linear` or `time.`</td>
        </tr>
        <tr>
            <td>subLabels</td>
            <td>\{value: string | number, subLabel: string, align?: LabelAlign, fontWeight?: FontWeight}[]</td>
            <td>–</td>
            <td>Mapping of values to their sub-labels (controlled). This will add a sub-labels below the axis labels. If the provided value is not within the axis domain, it won't be added. Note that if `labelOrientation` is set to `vertical`, `subLabels` will not be displayed.</td>
        </tr>
        <tr>
            <td>ticks</td>
            <td>boolean</td>
            <td>false</td>
            <td>Sets whether or not to display ticks for labels.</td>
        </tr>
        <tr>
            <td>tickMinStep</td>
            <td>number</td>
            <td>undefined</td>
            <td>The minimum desired step between axis ticks, in terms of scale domain values. For example, a value of 1 indicates that ticks should not be less than 1 unit apart. Note: This prop is only supported for linear axes.</td>
        </tr>
        <tr>
            <td>title</td>
            <td>string | string[]</td>
            <td>–</td>
            <td>Sets the axis title. If an array of strings is provided, each string will render on a new line.</td>
        </tr>
        <tr>
            <td>truncateLabels</td>
            <td>boolean</td>
            <td>false</td>
            <td>If true, labels will be truncated if they are wider than the step size. This is only valid for categorical axes (ex. dimension axis on a bar chart). This setting is also ignored if the `labels` prop is used to control the axis labels.</td>
        </tr>
    </tbody>
</table>

## Content

The `Axis` component supports additional content as children.

### AxisAnnotation

An `AxisAnnotation` can be used to add icons to an axis. These are typically used to provide information in a tooltip or popover for a specific data point or range.

#### Example

```
const axisAnnotationProps = \{
	dataKey: 'annotations',
	color: 'gray-600',
}

<Chart data=\{data}>
    <Axis position="bottom" granularity="hour" grid=\{false} title="My Axis Title">
        <AxisAnnotation \{...axisAnnotationProps} />
    </Axis>
</Chart>
```

// Todo axisannotation image

#### AxisAnnotation Props

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
            <td>children*</td>
            <td>ChartPopover | ChartTooltip</td>
            <td>-</td>
            <td>Optional content of the AxisAnnotation</td>
        </tr>
        <tr>
            <td>color</td>
            <td>Color | string</td>
            <td>'gray-600'</td>
            <td>The color to use for the annotation icons and range lines if a color isn't specified in options, or multiple annotations fall in the same icon. CSS color names and spectrum color names are supported.</td>
        </tr>
        <tr>
            <td>dataKey</td>
            <td>string</td>
            <td>'annotations'</td>
            <td>The data field where the annotation ids are listed for each data point.</td>
        </tr>
        <tr>
            <td>format</td>
            <td>'span' | 'summary'</td>
            <td>'span' if using a time based scale, otherwise 'summary'</td>
            <td>Show annotations as a horizontal span of icons or a single summary icon.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>A generated string that includes the axis name and the index of the annotation.</td>
            <td>Unique name for the annotation to be used as an identifier.</td>
        </tr>
        <tr>
            <td>offset</td>
            <td>number</td>
            <td>80</td>
            <td>Adds pixels to offset the annotation from the bottom of the bottom of the chart.</td>
        </tr>
        <tr>
            <td>options</td>
            <td>\{ id: string, color: Color | string }[]</td>
            <td>[]</td>
            <td>Options specific to each annotation in the data.</td>
        </tr>
    </tbody>
</table>

#### AxisAnnotation Options

An array of `option` objects can be passed to the prop `options` to control individual annotations using an id.

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
            <td>id</td>
            <td>string</td>
            <td>-</td>
            <td>The id of the annotation to apply the options to.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>Color | string</td>
            <td>-</td>
            <td>The color of the annotation icon and range lines. CSS color names and spectrum color names are supported.</td>
        </tr>
    </tbody>
</table>

```
const axisAnnotationProps = \{
	dataKey: 'annotations',
	options: [
		\{ id: '1', color: 'magenta-600' },
		\{ id: '2', color: 'fuchsia-600' },
		\{ id: '3', color: 'yellow-600' },
		\{ id: '4', color: 'celery-600' },
	],
}

<Chart data=\{data}>
    <Axis position="bottom" granularity="hour" grid=\{false} title="My Axis Title">
        <AxisAnnotation \{...axisAnnotationProps} />
    </Axis>
</Chart>
```

### ReferenceLine

A `ReferenceLine` can be used to add a vertical or horizontal line to a chart as a reference.

```
<Chart data=\{data}>
    <Axis position="bottom" granularity="hour" grid=\{false} title="My Axis Title">
        <ReferenceLine value=\{0.5} icon="date" />
    </Axis>
</Chart>
```

//todo add reference line image

#### ReferenceLine Props

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
            <td>value*</td>
            <td>number | string</td>
            <td>–</td>
            <td>Sets the value on the axis that the reference line will be drawn at.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>SpectrumColor | string</td>
            <td>'gray-800'</td>
            <td>Sets the color of the reference line.</td>
        </tr>
        <tr>
            <td>icon</td>
            <td>SupportedIcon | string (svg path)</td>
            <td>–</td>
            <td>Adds an icon on the axis for the reference line. Either the name of a supported svg icon can be provided or an svg path string can be provided. For correct sizing, custom svg paths should be defined within a square bounding box with coordinates ranging from -1 to 1 along both the x and y dimensions.</td>
        </tr>
        <tr>
            <td>iconColor</td>
            <td>SpectrumColor | string</td>
            <td>'gray-800'</td>
            <td>Sets the color of the icon.</td>
        </tr>
        <tr>
            <td>label</td>
            <td>string</td>
            <td>–</td>
            <td>Adds a text label on the axis for the reference line. This will be positioned outside of the icon if both an icon and a label are provided (e.g., beneath the icon if the axis `position` is `bottom`, left of the icon if the axis `position` is `left`).</td>
        </tr>
        <tr>
            <td>labelColor</td>
            <td>SpectrumColor | string</td>
            <td>'gray-800'</td>
            <td>Sets the color of the label.</td>
        </tr>
        <tr>
            <td>labelFontWeight</td>
            <td>string</td>
            <td>'normal'</td>
            <td>Sets the font weight of the label.</td>
        </tr>
        <tr>
            <td>layer</td>
            <td>'back' | 'front'</td>
            <td>'front'</td>
            <td>Sets the layer that the reference line gets drawn on. If set to `back`, the reference line will be drawn behind all data marks (bars, lines, etc.). If `front`, the reference line will be drawn in front of all data marks.</td>
        </tr>
        <tr>
            <td>position</td>
            <td>'before' | 'after' | 'center'</td>
            <td>'center'</td>
            <td>Set the reference line position to either center on the `value`, or to be between the `value` and the value before or after. Typically used in Bar visualizations where spacing is more likely to exist between values.</td>
        </tr>
    </tbody>
</table>

#### Icons

An icon can be used as a label for the reference line. Either the name of a supported svg icon can be provided or an svg path string can be provided. For correct sizing, custom svg paths should be defined within a square bounding box with coordinates ranging from -1 to 1 along both the x and y dimensions.

Supported Icons:

- date

If there is a [Spectrum Icon](https://spectrum.adobe.com/page/icons/) that is not supported, submit an issue to this repo to get it added.
