The `Axis` component is used to display the axis, axis labels and grid marks. An axis is not required if you would like something like a [sparkline](https://spectrum.adobe.com/page/line-chart/#Sparkline) visualization.

```jsx
<Chart data={data}>
  <Axis position="bottom" granularity="hour" grid={false} title="My Axis Title" />
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
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Sets the name of the component.</td>
        </tr>
        <tr>
            <td>baseline</td>
            <td>boolean</td>
            <td>false</td>
            <td>Adds a baseline rule for this axis.</td>
        </tr>
        <tr>
            <td>baselineOffset</td>
            <td>number</td>
            <td>0</td>
            <td>Adds an offset to the baseline. If baseline is false then this prop is ignored. If baseline is drawn relative to a categorical axis, this prop is ignored.</td>
        </tr>
        <tr>
            <td>children</td>
            <td>AxisAnnotation | ReferenceLine</td>
            <td>–</td>
            <td>Child components that add supplemental content to the axis</td>
        </tr>
        <tr>
            <td>granularity</td>
            <td>'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'</td>
            <td>'day'</td>
            <td>Sets the granularity of the primary axis labels for time axis. If this axis is not for a time axis, this prop is ignored.</td>
        </tr>
        <tr>
            <td>grid</td>
            <td>boolean</td>
            <td>false</td>
            <td>Displays gridlines at each tick location.</td>
        </tr>
        <tr>
            <td>hideDefaultLabels</td>
            <td>boolean</td>
            <td>false</td>
            <td>Hides the axis labels. If labels have been explicitly added using the `labels` prop, these will still be visible.</td>
        </tr>
        <tr>
            <td>labelAlign</td>
            <td>'start' | 'center' | 'end'</td>
            <td>'center'</td>
            <td>Sets the alignment of axis labels. `center` will set the align to `center` for horizontal axes and the baseline to `middle` for vertical axes. `start` will set the align to `left` for horizontal axes and the baseline to `top` for vertical axes. `end` will set the align to `right` for horizontal axes and the baseline to `bottom` for vertical axes.</td>
        </tr>
        <tr>
            <td>labelFontWeight</td>
            <td>FontWeight</td>
            <td>'normal'</td>
            <td>Sets the font weight of axis labels.</td>
        </tr>
        <tr>
            <td>labelFormat</td>
            <td>'duration' | 'linear' | 'percentage' | 'time'</td>
            <td>–</td>
            <td>Sets the format of the axis labels. `duration` will display seconds value in a m:ss format if less than 3,600 and in a H:mm:ss format if >= 3,600 (ex: 3 = 0:03, 36 = 0:36, 366 = 6:06, 3661 = 1:01:01).</td>
        </tr>
        <tr>
            <td>labelLimit</td>
            <td>number</td>
            <td>undefined (180 Vega default)</td>
            <td>Sets the maximum allowed length, in pixels, of axis tick labels. Labels that exceed this limit will be truncated. If not specified, Vega uses its default of 180 pixels.</td>
        </tr>
        <tr>
            <td>labelOrientation</td>
            <td>'horizontal' | 'vertical'</td>
            <td>'horizontal'</td>
            <td>Sets the orientation of the label. If using `vertical`, subLabels will not be displayed.</td>
        </tr>
        <tr>
            <td>labels</td>
            <td>(\{value: string | number, label?: string, align?: LabelAlign, fontWeight?: FontWeight} | number | string)[]</td>
            <td>–</td>
            <td>Explicitly sets the axis labels (controlled). Providing a Label object allows for more control over the label display. Either an object or the domain value (string | number) can be provided as entries to the array. Just providing the domain values makes it possible to simply control the labels that should be added without altering the display value or styling of the label. Providing an object as the label entry opens up control of the alignment, font-weight and display value of the label. `fontWeight` and `align` will default to the axis font weight and label alignment. `label` is equal to `value` by default. The following are semantically equivalent: [\{value: 2, label: "2", align: 'center', fontWeight: "normal"}] = [\{value: 2}] = [2]</td>
        </tr>
        <tr>
            <td>tickCountLimit</td>
            <td>number</td>
            <td>–</td>
            <td>Sets the upper limit on the number of axis ticks. Base tick, typically 0, is not included in the count. e.g. 0, 1, 2, 3 is considered 3 ticks. Note: The final tick count may vary based on Vega's automatic calculations to create visually pleasing values.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber' | string</td>
            <td>'shortNumber'</td>
            <td>Sets the format for numeric axis labels. This format must be a <a href="https://d3js.org/d3-format#locale_format" target="_blank">d3-format specifier</a> (Example: '$.2f' = $5,432.10). <a href="https://github.com/adobe/react-spectrum-charts/wiki/Chart-API#locale" target="_blank">Number locale</a> will be applied to the number format. The following presets are also provided: currency ($2.50), shortCurrency ($20M), shortNumber (3B), standardNumber (2,500). Only valid if labelFormat is linear or undefined.</td>
        </tr>
        <tr>
            <td>range</td>
            <td>[number, number]</td>
            <td>–</td>
            <td>The minimum and maximum values for the axis, for example: `[-10, 10]`. Note: This prop is only supported for axes with `linear` or `time` scale types.</td>
        </tr>
        <tr>
            <td>subLabels</td>
            <td>\{value: string | number, subLabel: string, align?: LabelAlign, fontWeight?: FontWeight}[]</td>
            <td>–</td>
            <td>Adds sublabels below the axis labels. If the provided value is not within the axis domain, it won't be added. Note that if `labelOrientation` is set to `vertical`, `subLabels` will not be displayed.</td>
        </tr>
        <tr>
            <td>ticks</td>
            <td>boolean</td>
            <td>false</td>
            <td>Displays ticks at each label location.</td>
        </tr>
        <tr>
            <td>tickMinStep</td>
            <td>number</td>
            <td>–</td>
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
            <td>If the text is wider than the bandwidth that is labels, it will be truncated so that it stays within that bandwidth. This is only valid for categorical axes (ex. dimension axis on a bar chart). This setting is also ignored if the `labels` prop is used to control the axis labels.</td>
        </tr>
        <tr>
            <td>currencyLocale</td>
            <td>string</td>
            <td>–</td>
            <td>Set the locale for currency formatting (affects symbol position and spacing). ⚠️ Limited Support: Support for and changes to this prop will be limited. Only use this if you need to override the currency locale formatting from the chart locale. **Important:** This prop requires 'currencyCode' prop to take effect. Example: 'en-US' ($100) vs 'de-DE' (100 $)</td>
        </tr>
        <tr>
            <td>currencyCode</td>
            <td>string</td>
            <td>–</td>
            <td>Override the currency symbol from the chart locale with a specific currency code. ⚠️ Limited Support: Support for and changes to this prop will be limited. Only use this if you need to override the currency symbol from the chart locale. **Important:** This prop requires 'currencyLocale' prop to take effect.</td>
        </tr>
    </tbody>
</table>

## Content

The `Axis` component supports additional content as children.

### AxisAnnotation

An `AxisAnnotation` can be used to add icons to an axis. These are typically used to provide information in a tooltip or popover for a specific data point or range.

#### Example

```jsx
const axisAnnotationProps = {
	dataKey: 'annotations',
	color: 'gray-600',
}

<Chart data={data}>
    <Axis position="bottom" granularity="hour" grid={false} title="My Axis Title">
        <AxisAnnotation {...axisAnnotationProps} />
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

```jsx
const axisAnnotationProps = {
	dataKey: 'annotations',
	options: [
		{ id: '1', color: 'magenta-600' },
		{ id: '2', color: 'fuchsia-600' },
		{ id: '3', color: 'yellow-600' },
		{ id: '4', color: 'celery-600' },
	],
}

<Chart data={data}>
    <Axis position="bottom" granularity="hour" grid={false} title="My Axis Title">
        <AxisAnnotation {...axisAnnotationProps} />
    </Axis>
</Chart>
```

### ReferenceLine

A `ReferenceLine` can be used to add a vertical or horizontal line to a chart as a reference.

```jsx
<Chart data={data}>
  <Axis position="bottom" granularity="hour" grid={false} title="My Axis Title">
    <ReferenceLine value={0.5} icon="date" />
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

### AxisThumbnail

An `AxisThumbnail` can be used to display thumbnail images on axis labels. This component enhances axis labels with visual thumbnails from your data, providing additional context and visual appeal to categorical axes.

```jsx
const data = [
  { browser: 'Chrome', downloads: 1000, thumbnail: 'https://example.com/chrome-icon.png' },
  { browser: 'Firefox', downloads: 800, thumbnail: 'https://example.com/firefox-icon.png' }
];

<Chart data={data}>
  <Bar dimension="browser" metric="downloads" />
  <Axis position="bottom" baseline>
    <AxisThumbnail urlKey="thumbnail" />
  </Axis>
</Chart>
```

#### AxisThumbnail Props

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
            <td>urlKey</td>
            <td>string</td>
            <td>'thumbnail'</td>
            <td>The data field key that contains the URL of the thumbnail image.</td>
        </tr>
    </tbody>
</table>

#### Supported Scale Types

Axis thumbnails are currently supported only on **band scales**, which are typically used for categorical dimensions in bar charts and similar visualizations. Linear and time scales do not support thumbnails.

#### Thumbnail Behavior

- **Dynamic Sizing**: Thumbnails automatically resize based on the available bandwidth of the scale, with a maximum size of 42px and minimum size of 16px
- **Visibility**: Thumbnails become invisible when the available space is less than 16px to prevent overcrowding
- **Positioning**: Thumbnails are positioned relative to the axis

#### Data Requirements

- Each data point must include a field containing the URL of the thumbnail image
- The URL should point to a valid image file (PNG, JPG, SVG, etc.)
- Images should be square and appropriately sized for display (recommended: 32x32px or larger)
- Ensure the image URLs are accessible and load properly
- For best results, use consistent image dimensions across all thumbnails

#### Example Use Cases

- **Browser logos** in web analytics charts
- **Product images** in e-commerce dashboards
- **Country flags** in geographic data visualizations
- **Brand logos** in marketing performance charts
- **Category icons** in organizational charts

#### Notes

- Thumbnails are automatically hidden when there isn't enough space to display them properly
- The component automatically handles label positioning to prevent overlap with thumbnails
- Thumbnails are rendered as Vega image marks and support all standard image formats
