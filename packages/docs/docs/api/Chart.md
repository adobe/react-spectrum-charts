The `<Chart>` component is a [collection component](https://react-spectrum.adobe.com/react-stately/collections.html). This is the primary wrapper component for all of `react-spectrum-charts`. This component renders the chart visualization based on the children and props passed in.

## Canvas vs. SVG

Charts use Vega to draw the chart. Vega charts can be rendered as either `svg` or `canvas` elements. We recommend using `svg` in most situations. However, if you are plotting data on the order of 10K rows or more, you may want to switch to `canvas` as the renderer. Using `canvas` as the rendered does not add elements to the document for every shape in the visualization, unlike `svg`.

```jsx
<Chart data={data} renderer="canvas" description={chartDescription} height={300} width={500} padding={32} theme="light">
  <Line />
</Chart>
```

## Height and Width Constraints

React-spectrum-charts provides fine-grained control over chart dimensions through several props:

### Width Controls

- `width`: Can be a number (pixels), 'auto', or a percentage (e.g. '50%')
- `minWidth`: Minimum width in pixels (default: 100)
- `maxWidth`: Maximum width in pixels (default: Infinity)

### Height Controls

- `height`: Can be a number (pixels) or a percentage (e.g. '50%')
- `minHeight`: Minimum height in pixels (default: 100)
- `maxHeight`: Maximum height in pixels (default: Infinity)

### Percentages

Percentage values are calculated based on the size of the charts container element. For example: if the `<Chart>` element is inside of a div that has a width of 500px and the width of the chart is set to 50%, the chart width will be 250px.

These constraints work together to ensure your chart maintains appropriate dimensions across different screen sizes and container widths.

Example:

```jsx
<Chart data={data} width="100%" height={400} minWidth={300} maxWidth={800} minHeight={200} maxHeight={600}>
  <Bar metric="sales" />
</Chart>
```

## Handles

Chart exposes four handles, `copy()`, `download()`, `getBase64Png()`, and `getSvg()`. These are exposed so that you can call them from elsewhere in your application. These are accessed by passing a `ref` to `Chart` and calling them from `ref.current` (see examples below).

### Copy

The `copy()` function will copy the current visualization to the user's clipboard. Copy returns a promise so that you can handle the success/failure as needed.

If attempts to copy to clipboard result in the promise rejecting and receiving this result: "Error occurred while writing to clipboard", then it is likely that writing to the clipboard is not permitted.

#### Example

```tsx
const ref = useRef<ChartHandle>(null);

const copy = () => {
    ref.current?.copy().then(console.log, console.warn)
}

return (
    <>
        <Chart data={data} ref={ref}>
            <Line />
        </Chart>

        <ActionButton onPress={copy}>Copy to clipboard</ActionButton>
    </>
)
```

### Download

The `download()` function will download a PNG of the current visualization to the user's computer. Download returns a promise so that you can handle the success/failure as needed.

#### Example

```tsx
const ref = useRef<ChartHandle>(null);

const download = () => {
    ref.current?.download().then(console.log, console.warn)
}

return (
    <>
        <Chart data={data} ref={ref}>
            <Line />
        </Chart>

        <ActionButton onPress={download}>Download</ActionButton>
    </>
)
```

### Get PNG

The `getBase64Png()` method will return the PNG Base 64 string for the current visualization as the resolution for a promise.

#### Example

```tsx
const ref = useRef<ChartHandle>(null);

const getBase64Png = () => {
    ref.current?.getBase64Png().then(console.log, console.warn)
}

return (
    <>
        <Chart data={data} ref={ref}>
            <Line />
        </Chart>

        <ActionButton onPress={getBase64Png}>Log Base64 PNG</ActionButton>
    </>
)
```

### Get SVG

The `getSvg()` method will return the SVG string for the current visualization as the resolution for a promise.

#### Example

```tsx
const ref = useRef<ChartHandle>(null);

const getSvg = () => {
    ref.current?.getSvg().then(console.log, console.warn)
}

return (
    <>
        <Chart data={data} ref={ref}>
            <Line />
        </Chart>

        <ActionButton onPress={getSvg}>Log SVG</ActionButton>
    </>
)
```

## Scales

There are a handful of scales that can be used to differentiate marks in charts. These are:

- `colors`
- `lineTypes`
- `lineWidths` (coming soon)
- `opacities`
- `symbolSizes` (coming soon)
- `symbolShapes`

These scales can be used on the mark components to divide the data into series for the chart. The most common scale used for dividing the data into series is `colors`.

Example:

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" granularity="month" baseline />
  <Axis position="left" grid title="Visitors" />
  <Line metric="visitors" color="browser" />
  <Legend position="top" title="Browser" />
</Chart>
```

![line-chart_options_standard@2x_1649350993232](https://github.com/adobe/react-spectrum-charts/assets/29240999/e045dafb-9a6b-45ee-aa16-af8b00b6e5e4)

It is possible to divide the data using more than one scale and key. The following example will subdivide the data into series by every unique combination of `series` and `period`

Example:

This example sets the lineTypes scale to be `['dotted', 'solid']`. This means the first division will use be a `dotted` line and the second division will be a `solid` line. The line is divided into series using color and lineType. Each unique browser will be a different color and each unique version will be a different line type.

```jsx
<Chart data={data} lineTypes={['dotted', 'solid']}>
  <Axis position="bottom" labelFormat="time" granularity="day" baseline />
  <Axis position="left" grid title="Events" />
  <Line metric="events" color="browser" lineType="version" />
  <Legend position="bottom" />
</Chart>
```

### Repeating scales

If there are more divisions than there are entries in a scale, then the entries will repeat the loop. For example, if there are 3 series (`['Windows', 'Mac', 'Linux']`) and only two colors (`['red', 'blue']`), then the color scale will start over with the third element (`'Windows' = 'red', 'Mac' = 'blue', 'Linux' = 'red'`).

## Colors

### 2D color scales

It is also possible to define colors as a 2D scale (scale of scales). Two dimensional color scales are used when a given series is additionally subdivided. An example of this is using a dodged bar with a `subSeries`. Each series will use the scale for that series to set the color of each subdivision. Just like the color of the series repeats when the are more series than colors in the scale, the series scale will repeat when the number of sub series is greater than the number of colors in the series scale.

### Supported colors

A color scale can be defined as a color scheme name, an array of spectrum color names or an array of css colors. It is possible to mix spectrum color names and css colors in a single array.

#### Color scheme

The color schemes are defined by [spectrum](https://spectrum.adobe.com/page/color-for-data-visualization/). Research and careful consideration went into selecting these colors so that they are accessible and aesthetically pleasing. It is **highly** recommended to use the default spectrum color schemes.

Categorical color schemes should be used for ordinal/categorical data. The diverging color schemes should be used for continuous/numerical data, especially when representing high vs. low.

![59c69201-d9ec-4c91-9ee4-8ad5b0777c4e](https://github.com/adobe/react-spectrum-charts/assets/29240999/16f4aef4-8442-41ca-8f5b-b31fa1a74157)
![73578353-8726-4eba-b0b9-925937ffd871](https://github.com/adobe/react-spectrum-charts/assets/29240999/6a03a143-bb08-422c-bc80-56cd4ca7a139)

If a sequential scheme is needed, request to have the spectrum sequential color schemes added or submit a PR (haven't been prioritized yet).

Available color schemes:

- `categorical6`
- `categorical12`
- `categorical16`
- `categorical24`
- `divergentOrangeYellowSeafoam5`
- `divergentOrangeYellowSeafoam9`
- `divergentOrangeYellowSeafoam15`
- `divergentRedYellowBlue5`
- `divergentRedYellowBlue9`
- `divergentRedYellowBlue15`
- `divergentRedBlue5`
- `divergentRedBlue9`
- `divergentRedBlue15`

#### Spectrum color names

A color scale can be defined as an array of spectrum color names. Spectrum color names are responsive (excluding `static*` variants). This is great for when light and dark mode support is needed. The colors adjust so that they look ideal in both light and dark mode.

Example: `['red-500', 'blue-600', 'celery-400']`

#### CSS colors

A color scale can also be defined as an array of css colors. This method is the least desirable.

Example: `['#FFF', 'DarkGoldenRod', '#00008B', 'rgb(150, 150, 150)']`

### Background Color

The chart's background can be customized using the `backgroundColor` prop. By default, it's set to 'transparent', allowing the chart to blend with your application's background.

It is recommended to set this prop to the background color of the chart's container element, even if it looks good with the transparent background. The reason for this is chart export. If someone exports your chart (via the copy or download handles) or saves a copy of it (right click on canvas), you want the background color to be saved with the chart. This guarentees that the exported chart will be readable even if it's copied and pasted into a dark or light mode app (like slack).

```jsx
<Chart data={data} backgroundColor="gray-100">
  <Line metric="trend" />
</Chart>
```

### Theme Integration

The chart integrates with @adobe/react-spectrum's theming system through the `theme` prop. This ensures that components like tooltips and popovers match your application's styling:

```jsx
<Chart data={data} theme={yourSpectrumTheme}>
  <Line metric="trend">
    <ChartTooltip>{() => <View>Hello world!</View>}</ChartTooltip>
  </Line>
</Chart>
```

## Locale

`react-spectrum-charts` supports locale for both number and date/time values. There are multiple methods available for setting the locale definitions.

1. Use a locale code. This will use the provided locale for both number and date/time values.
   - Example: `locale='fr-FR'`
2. Use different locale codes for number and date/time. For example you can specify ar-AE to be used for numbers, and ar-SY to be used for dates/times. This method may be appropriate for use cases that require more customizability than using a single locale.
   - Example: `locale=\{\{number: 'ar-AE', time: 'ar-SY'}}`
3. Provide your own locale definitions. You can create any custom definition for number or date/ time locales, using the properties available for the [formatLocale](https://d3js.org/d3-format#formatLocale) and [timeFormatLocale](https://d3js.org/d3-time-format#timeFormatLocale) methods, respectively. For examples for various locales, check out [number locale definitions](https://github.com/d3/d3-format/tree/main/locale) and [time locale definitions](https://github.com/d3/d3-time-format/tree/main/locale).

### Custom locale definition example

```tsx
import {NumberLocale, TimeLocale} from 'vega'

...
const numberLocale: NumberLocale = {
    "decimal": ",",
    "thousands": "\u00a0",
    "grouping": [3],
    "currency": ["", "\u00a0CHF"],
    "percent": "\u202f%"
};
const timeLocale: TimeLocale = {
    "dateTime": "%A %e %B %Y à %X",
    "date": "%d.%m.%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
    "shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
    "months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    "shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
}

...
<Chart {...chartProps} locale={{number: numberLocale, time: timeLocale}}>
...
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
            <td>animations</td>
            <td>boolean</td>
            <td>–</td>
            <td>Whether or not to include initial, dataset transition, and opacity animations in bar, area, and line charts. Animations are on by default. Explicitly define this prop as false to disable them.</td>
        </tr>
        <tr>
            <td>backgroundColor</td>
            <td>string</td>
            <td>'transparent'</td>
            <td>Sets the background color of the chart.</td>
        </tr>
        <tr>
            <td>children*</td>
            <td>AreaElement | AxisElement | BarElement | BigNumberElement | DonutElement | ComboElement | LegendElement | LineElement | ScatterElement | TitleElement</td>
            <td>–</td>
            <td>The elements that make up the chart.</td>
        </tr>
        <tr>
            <td>colors</td>
            <td>Color | Color[]</td>
            <td>'categorical12'</td>
            <td>Defines the color scale used for coloring divisions (series). A single dimension color scale can be defined by supplying a ColorScheme or and array of CssColor | SpectrumColor[]</td>
        </tr>
        <tr>
            <td>colorScheme</td>
            <td>'light' | 'dark'</td>
            <td>'light'</td>
            <td>Sets whether the chart should be rendered in light or dark mode.</td>
        </tr>
        <tr>
            <td>config</td>
            <td>Config</td>
            <td>–</td>
            <td><a href="https://vega.github.io/vega/docs/config/">Vega config</a> object that sets the custom style of the chart. This config will be merged with the default spectrum config.</td>
        </tr>
        <tr>
            <td>data*</td>
            <td>ChartData[]</td>
            <td>–</td>
            <td>Data to be plotted in the chart.</td>
        </tr>
        <tr>
            <td>dataTestId</td>
            <td>string</td>
            <td>–</td>
            <td>Adds a data-testid to the Chart component.</td>
        </tr>
        <tr>
            <td>debug</td>
            <td>boolean</td>
            <td>false</td>
            <td>Flag that will console.log useful information about the chart (ex the vega spec for the chart). Helpful for debugging your visualization.<br/>DO NOT SHIP WITH DEBUG ENABLED</td>
        </tr>
        <tr>
            <td>description</td>
            <td>string</td>
            <td>–</td>
            <td>Chart description.</td>
        </tr>
        <tr>
            <td>emptyStateText</td>
            <td>string</td>
            <td>No data found</td>
            <td>Chart placeholder text that is displayed if the data array is empty. Be sure to localize this value.</td>
        </tr>
        <tr>
            <td>height</td>
            <td>number | `$\{number}%`</td>
            <td>500</td>
            <td>Chart height in pixels.</td>
        </tr>
        <tr>
            <td>hiddenSeries</td>
            <td>string[]</td>
            <td>–</td>
            <td>List of series names that should be hidden from the chart (controlled). This does not hide these series in the legend as well, only the chart. To hide series in the legend, use `hiddenEntries` in the `Legend` component.</td>
        </tr>
        <tr>
            <td>highlightedSeries</td>
            <td>string</td>
            <td>–</td>
            <td>The series that should be highlighted on the chart (controlled). This will not have an effect if `highlight` (uncontrolled) is enabled on a `Legend` somewhere in the chart.</td>
        </tr>
        <tr>
            <td>idKey</td>
            <td>string</td>
            <td>–</td>
            <td>The key to use as the unique identifier for data points.</td>
        </tr>
        <tr>
            <td>lineTypes</td>
            <td>('solid' | 'dashed' | 'dotted' | 'dotDash' | 'longDash' | 'twoDash' | number[])[]</td>
            <td>['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash']</td>
            <td>Defines the line type scale used for divisions (series).<br/>The default line types available are `solid`, `dashed` ([7, 4]), `dotted` ([2, 3]), `dotDash`([2, 3, 7, 4]), `longDash`([11, 4]), and `twoDash` ([5, 2, 11, 2]).<br/>Custom line types can be set by using the <a href="https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray">dash array format.</a></td>
        </tr>
        <tr>
            <td>lineWidths</td>
            <td>number[]</td>
            <td>–</td>
            <td>Array of line widths to use for different series. Line widths are in pixels.</td>
        </tr>
        <tr>
            <td>loading</td>
            <td>boolean</td>
            <td>false</td>
            <td>Defines if the loading screen should be displayed instead of the visualization.</td>
        </tr>
        <tr>
            <td>locale</td>
            <td>Locale | LocaleCode | \{ number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale }</td>
            <td>'en-US'</td>
            <td>Sets the locale for numeric and time values. Can be set using many different predefined locale codes or you can provide your own locale definitions. See <a href="#locale">Locale</a> for more details.</td>
        </tr>
        <tr>
            <td>maxHeight</td>
            <td>number</td>
            <td>Infinity</td>
            <td>Maximum height of the chart in pixels.</td>
        </tr>
        <tr>
            <td>maxWidth</td>
            <td>number</td>
            <td>Infinity</td>
            <td>Maximum width of the chart in pixels.</td>
        </tr>
        <tr>
            <td>minHeight</td>
            <td>number</td>
            <td>100</td>
            <td>Minimum height of the chart in pixels.</td>
        </tr>
        <tr>
            <td>minWidth</td>
            <td>number</td>
            <td>100</td>
            <td>Minimum width of the chart in pixels.</td>
        </tr>
        <tr>
            <td>opacities</td>
            <td>number[]</td>
            <td>[1]</td>
            <td>Defines the opacity scale used for divisions (series).<br/>The default opacities are dynamically calculated based on the number of unique values in the domain. For example, if the `opacity` on a bar is set on `version` and there are 3 unique versions in the data supplied, the default opacities scale will be [1, 0.67, 0.33]. If there were 4 unique versions, the the default opacities scale will be [1, 0.75, 0.5, 0.25]<br/>Default opacities scale equation: new Array(nDivisions).fill(0).map((d, i) => (nDivisions - i) / nDivisions)</td>
        </tr>
        <tr>
            <td>padding</td>
            <td>number | \{left: number, top: number, right: number, bottom: number}</td>
            <td>0</td>
            <td>Chart padding. If a single number is provided, the padding around the chart will be that number on all sides. Supply and object to customize the padding by side.</td>
        </tr>
        <tr>
            <td>renderer</td>
            <td>'canvas' | 'svg'</td>
            <td>'svg'</td>
            <td>Sets if the chart should be rendered as an <a href="https://developer.mozilla.org/en-US/docs/Web/SVG">SVG</a> or as a <a href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API">canvas</a> element</td>
        </tr>
        <tr>
            <td>theme</td>
            <td>Theme</td>
            <td>'light'</td>
            <td>Sets the theme of the chart from @adobe/react-spectrum provider. react-spectrum components like tooltip content and popovers need this to get the proper styling to match your app.</td>
        </tr>
        <tr>
            <td>title</td>
            <td>string</td>
            <td>–</td>
            <td>Sets the chart title. If the Title component is used to define the chart title, that will overwrite this prop.</td>
        </tr>
        <tr>
            <td>tooltipAnchor</td>
            <td>'cursor' | 'mark'</td>
            <td>'cursor'</td>
            <td>Sets what the tooltip should be anchored to. If set to `cursor`, the tooltip will always follow the cursor. If set to `mark` the tooltip will snap to the associated mark. Defaults to `cursor`.</td>
        </tr>
        <tr>
            <td>tooltipPlacement</td>
            <td>'top' | 'bottom' | 'left' | 'right'</td>
            <td>–</td>
            <td>The placement of the tooltip with respect to the mark. Only applicable if `tooltipAnchor = 'mark'`.</td>
        </tr>
        <tr>
            <td>width</td>
            <td>number | 'auto' | string // percentage format (/^\d+%$/)</td>
            <td>'auto'</td>
            <td>Chart width. Number will set the width in pixels. 'auto' will expand to fill the parent element. A percentage will take up a percentage of the parent element. Must be integer percentages.<br/>Note: 'auto' and '100%' are the same.</td>
        </tr>
    </tbody>
</table>
