The `Trendline` component is used to add average lines, regression (trend) lines as well as moving average lines to a cartesean based plot like `Area`, `Bar` or `Line`. `Trendline` will add a single line of the provided variant to each series in the chart. Styling of the `Trendline` is inherited from the mark that it is attached to but it is possible to override these values with static values (for example: change the line type so all moving averages are dashed lines).

`Trendline`s do not get added to the legend. Only the parent marks get added to the legend.

## Statistical Calculations

You can define what type of trendline you want plotted using the `method` property. `method` supports [regressions](https://en.wikipedia.org/wiki/Regression_analysis) and [rolling windows](https://vega.github.io/vega/docs/transforms/window/). `react-spectrum-charts` will do all of the trendline transformations for you so there is no need to pre-calculate these values.

### Regression

A regression transform fits a two dimensional data set which can assist with identifying trends and anomalies. The two dimensional fit can be written out as an x, y equation (ex. linear equation: y = mx + b).

One characteristic of regressions is they have a minimum number of data points required to be able to be calculated. The minimum number for most supported methods is 2, however the polynomial methods require 1 more data point than the order of the polynomial. For example, a `polynomial-2` (`quadratic`) requires at least 3 data points to be calculated and a `polynomial-9` would require at least 10 points. If there aren't sufficient points, the trendline may not draw at all.

Supported regression transforms:

- average: `y = a`
- linear: `y = a + b * x`
- logarithmic: `y = a + b * log(x)`
- exponential: `y = a + exp(b * x)`
- power: `y = a * pow(x, b)`
- quadratic: `y = a + b * x + c * pow(x, 2)`
- polynomial-$\{number}: `y = a + b * x + ... + k * pow(x, order)`

Note: `linear` is identical to `polynomial-1` and `quadratic` is identical to `polynomial-2`.

#### Time base regressions

Timestamps in `react-spectrum-charts` use unix time which is the milliseconds since Jan, 1st 1970 in London. This means that timestamps are on the order of 1.5 trillion. Using such large numbers for the x axis is problematic when calculating regressions. To solve this and get more value out of regression methods, `react-spectrum-charts` normalizes timestamp dimensions so that the regressions are actually calculated using days since the beginning of time period + 1 day.

```
normalizedTimestamp = (timestamp - timePeriodStart + msPerDay) / msPerDay
```

### Window

A window transform performs calculations on a set window of data. There is only one window method currently supported which is `movingAverage-$\{number}`. This transform will average x number of data points leading up to the current data point. For example, if you used `movingAverage-3`, then the 4th data point in the series would average the values of data points 2, 3, and 4 to calculate the 3 point moving average. One thing to note is if there aren't enough data points for the full window prior to the current point, the start of the window will truncate to the start of the data points. For example the `movingAverage-3` of the 2nd data point would be the average of point 1 and 2.

Example
|x|y|movingAverage-3|
|-|-|-:|
|1|4|4|
|2|6|5|
|3|8|6|
|4|1|5|
|5|0|3|

## Examples

### Average line on a bar chart

```
<Chart data=\{data} >
    <Bar>
        <Trendline method="average" color="gray-500"  />
    </Bar>
</Chart>
```

### Rolling 7 day average on a line chart

For this example, the granularity of the data would be in days.

```
<Chart data=\{data} >
    <Line>
        <Trendline method="movingAverage-7" lineType="dashed" />
    </Line>
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
            <td>ChartTooltip | TrendlineAnnotation</td>
            <td>–</td>
            <td>Supplementary content to render with a trendline.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>SpectrumColor | CssColor</td>
            <td>–</td>
            <td>The line color of the trendline. If undefined, will default to the color of the series that it represents.</td>
        </tr>
        <tr>
            <td>dimensionExtent</td>
            <td>[number | 'domain' | null, number | 'domain' | null]</td>
            <td>–</td>
            <td>The start and end point for drawing the trendline. If undefined, will default to the value of the `dimensionRange`. If 'domain' is used as a start or end value, this will extrapolate the trendline out to the beginning and end of the chart domain respectively. If null is used as a start or end value, the trendline will be be drawn from the first data point to the last data point respectively.</td>
        </tr>
        <tr>
            <td>dimensionRange</td>
            <td>[number | null, number | null]</td>
            <td>[null, null]</td>
            <td>The dimension range that the statistical tranform should be calculated and drawn for. If the start or end values are null, then the dimension range will not be bounded.</td>
        </tr>
        <tr>
            <td>displayOnHover</td>
            <td>boolean</td>
            <td>false</td>
            <td>Whether the trendline should only be visible when hovering over the parent line.</td>
        </tr>
        <tr>
            <td>excludeDataKeys</td>
            <td>string[]</td>
            <td>-</td>
            <td>If a chart datum has a truthy value for any of these keys, it will not be included in the trendline calculation.</td>
        </tr>
        <tr>
            <td>highlightRawPoint</td>
            <td>boolean</td>
            <td>false</td>
            <td>If there is a tooltip on this trendline, then this will highlight the raw point in addition to the hovered trendline point.</td>
        </tr>
        <tr>
            <td>lineType</td>
            <td>'solid' | 'dashed' | 'dotted' | 'dotDash' | 'shortDash' | 'longDash' | 'twoDash' | number[]</td>
            <td>'solid'</td>
            <td>The line type of the trend line.</td>
        </tr>
        <tr>
            <td>lineWidth</td>
            <td>'XS' | 'S' | 'M' | 'L' | 'XL' | number</td>
            <td>'M'</td>
            <td>The line width of the trend line.</td>
        </tr>
        <tr>
            <td>method</td>
            <td>'average' | 'exponential' | 'linear' | 'logarithmic' | `movingAverage-$\{number}` | `polynomial-$\{number}` | 'power' | 'quadratic'</td>
            <td>'linear'</td>
            <td>The type of statistical transform that will be calculated.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Trendline name. Useful for if you need to traverse the chart object to find the trendline (ex. for testing).</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number</td>
            <td>–</td>
            <td>If provided, sets the opacity of the trendlines.</td>
        </tr>
    </tbody>
</table>

## TrendlineAnnotation

[[/images/trendlineAnnotation.png|Trendline annotation]]

The `TrendlineAnnotation` component will render a text annotation on the trendline, calling out the trendline value at the point. `TrendlineAnnotation` can be defined as a child of a `Trendline`. If an annotation cannot be rendered without overlapping over graphical marks or text, it will not be rendered. Because of this, `TrendlineAnnotation`s should be thought of as "nice to haves".

### Text collisions

Annotations on a trendline use logic to identify if the annotation will overlap any of the underlying marks (`Scatter`, `Line`, etc.), the `Trendline`, and even other annotations. If an annotation would overlap other graphical marks or text, then the logic will cycle through the available render positions to see if it can render the annotation without overlapping (see order of annotation position below). If so, it will render in that position and if not, the annotation will not be rendered.

#### Annotation position order

- top
- bottom
- right
- left
- top-right
- top-left
- bottom-right
- bottom-left

#### Example

```
<Chart \{...chartProps}>
    <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
    <Axis position="left" grid ticks baseline title="Handling (normal)" />
    <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline method="median" dimensionExtent=\{['domain', 'domain']} lineWidth="S">
            <TrendlineAnnotation dimensionValue="end" prefix="Speed:" />
        </Trendline>
    </Scatter>
    <Legend title="Weight class" highlight position="right" />
    <Title text="Mario Kart 8 Character Data" />
</Chart>

```

[[/images/trendlineAnnotationTextCollisions.png|Trendline annotation text collision]]

In the chart above, the annoations are being displayed at the end of the trendline. The first annotation attempted to place the text at top, bottom, right, left, and top-right (all relative to the end point) but all of these failed since there wasn't enough room. Finally it attempted to place the text at the top-left (relative to the end point) and was successful. The same goes for the second annotation. The third annotation was not able to find any position that it could place the text without a collision so the annotation was not rendered.

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
            <td>badge</td>
            <td>boolean</td>
            <td>false</td>
            <td>Displays the annotation text as a badge. Contrast checker is used on the annotation text to ensure a contrast greater that 3.5 when compared to the badge color.</td>
        </tr>
        <tr>
            <td>dimensionValue</td>
            <td>'start' | 'end' | number</td>
            <td>'end'</td>
            <td>Where on the dimension axis to place the trendline annotation anchor.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>''</td>
            <td>Sets the format of the displayed trendline value. This format must be a <a href="https://d3js.org/d3-format#locale_format" target="_blank">d3-format specifier</a> (Example: '$.2f' = $5,432.10). <a href="https://github.com/adobe/react-spectrum-charts/wiki/Chart-API#locale" target="_blank">Number locale</a> will be applied to the number format.</td>
        </tr>
        <tr>
            <td>prefix</td>
            <td>string</td>
            <td>''</td>
            <td>Text string that will prefix the trendline value</td>
        </tr>
    </tbody>
</table>
