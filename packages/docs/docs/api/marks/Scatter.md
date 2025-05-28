The `Scatter` component is used to display scatter plots. Scatter plots use continuous data for both the x and y axes. They are most useful for comparing two continuous values across many different points.

## Encoding

The `Scatter` component supports many different attributes for mapping data properties to visual representations.

- `color`
  - Can be a categorical color scale for categorical mappings or a continuous color scale (sequential or divergent) for numerical mappings
- `lineType`
- `lineWidth`
- `opacity`
- `size`

### Examples

All the following examples will use the same base chart code:

```
<Chart data={data}>
    <Axis
        baseline
        grid
        position="bottom"
        ticks
        title="Speed (normal)"
    />
    <Axis
        baseline
        grid
        position="left"
        ticks
        title="Handling (normal)"
    />
    <Scatter
        dimension="speedNormal"
        metric="handlingNormal"
    />
    <Legend
        highlight
        position="right"
        title="Weight class"
    />
    <Title text="Mario Kart 8 Character Data" />
</Chart>
```

#### Color

```
...
    <Scatter {...scatterProps} color="weightClass" />
...
```

![Scatter plot with different colors based on weight class](/img/scatter_color_light.png#gh-light-mode-only)
![Scatter plot with different colors based on weight class](/img/scatter_color_dark.png#gh-dark-mode-only)

#### Continuous color scale

```
...
    <Scatter {...scatterProps} color="weight" colorScaleType="linear" />
...
```

![Scatter plot with different colors based on weight](/img/scatter_sequentialColor_light.png#gh-light-mode-only)
![Scatter plot with different colors based on weight](/img/scatter_sequentialColor_dark.png#gh-dark-mode-only)

#### Size

```
...
    <Scatter {...scatterProps} size="weight" />
...
```

![Scatter plot with different symbol sizes based on weight](/img/scatter_size_light.png#gh-light-mode-only)
![Scatter plot with different symbol sizes based on weight](/img/scatter_size_dark.png#gh-dark-mode-only)

## Tooltips and Popovers

`Scatter` supports `ChartTooltip` and `ChartPopover` like all other chart mark components.

### Tooltip

```
<Chart data={data}>
    <Axis
        baseline
        grid
        position="bottom"
        ticks
        title="Speed (normal)"
    />
    <Axis
        baseline
        grid
        position="left"
        ticks
        title="Handling (normal)"
    />
    <Scatter
        dimension="speedNormal"
        metric="handlingNormal"
        color="weightClass"
    >
        <ChartTooltip>
            {
                (item) => (
                    <Content>
                        <Flex direction="column">
                            <div style={{ fontWeight: 'bold' }}>{(item.character as string[]).join(', ')}</div>
                            <div>
                                Speed (normal): {item.speedNormal}
                            </div>
                            <div>
                                Handling (normal): {item.handlingNormal}
                            </div>
                        </Flex>
                    </Content>
                )
            }
        </ChartTooltip>
    </Scatter>
    <Legend
        highlight
        position="right"
        title="Weight class"
    />
    <Title text="Mario Kart 8 Character Data" />
</Chart>
```

![Scatter plot with a tooltip displayed on one of the points](/img/scatter_tooltip_light.png#gh-light-mode-only)
![Scatter plot with a tooltip displayed on one of the points](/img/scatter_tooltip_dark.png#gh-dark-mode-only)

## Trendlines

The `Trendline` component is fully supported by `Scatter`. To plot a trendline, simply pass the `Trendline` component into `Scatter` as a child.

![Scatter plot with vertical and horizontal median lines](/img/featureMatrix_light.png#gh-light-mode-only)
![Scatter plot with vertical and horizontal median lines](/img/featureMatrix_dark.png#gh-dark-mode-only)

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
            <td>ChartTooltip | ChartPopover | Trendline</td>
            <td>–</td>
            <td>Optional elements that can be rendered within the chart.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string | \{value: ColorValue}</td>
            <td>'series'</td>
            <td>Symbol color.<br/>If a string is provided, this string is the key in the data that symbols will be grouped into series by. Each unique value for this key in the provided data will map to a color from the color scale.<br/>If an object with a value is provided, this will set the color for all symbols.</td>
        </tr>
        <tr>
            <td>colorScaleType</td>
            <td>'linear' | 'ordinal'</td>
            <td>'linear'</td>
            <td>The scale type for the color scale. If the backing data for `color` is continuous (non-binned numerical data) then this should be `linear` which will calculate the color of the point based on the number in the data, using the linear color scale (color gradient).<br/>If the backing data is ordinal (ex. string data), then this should be 'ordinal' which will assign colors based on the order of the data passed in. There is no interpolation of color values in ordinal scales.</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'datetime'</td>
            <td>The key in the data that the metric is trended against. This is the x-axis for a scatter plot.</td>
        </tr>
        <tr>
            <td>lineType</td>
            <td>string | \{value: LineType | number[]}</td>
            <td>–</td>
            <td>Scatter point line type (dasharray).<br/>If a string is provided, this string is the key in the data that symbols will be grouped into series by. Each unique value for this key in the provided data will map to a line type from the lineTypes scale.<br/>
            If an object with a value is provided, this will set the line type for all symbols.</td>
        </tr>
        <tr>
            <td>lineWidth</td>
            <td>string | \{value: LineWidth | number}</td>
            <td>–</td>
            <td>Scatter point border line width in pixels.<br/>If a string is provided, this string is the key in the data that symbols will be grouped into series by. Each unique value for this key in the provided data will map to a line width from the line widths scale.<br/>If an object with a value is provided, this will set the line width for all symbols.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>The key in the data that is used for the value of the data point. this is the y-axis for a scatter plot.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Scatter name. Useful for if you need to traverse the chart object to find the scatter plot marks.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>string | \{value: number}</td>
            <td>\{value: 1}</td>
            <td>If a string is provided, this string is the key in the data that symbols will be grouped into series by. Each unique value for this key in the provided data will map to an opacity from the opacity scale.<br/>If an object with a value is provided, this will set the opacity for all symbols.</td>
        </tr>
        <tr>
            <td>size</td>
            <td>string | \{value: SymbolSize | number}</td>
            <td>\{value: 'M'}</td>
            <td>Scatter point symbol size.<br/>If a string is provided, this string is the key in the data that symbols will be grouped into series by. Each unique value for this key in the provided data will map to an size from the symbol size scale. <br/>If an object with a value is provided, this will set the size for all symbols.</td>
        </tr>
    </tbody>
</table>

## Advanced

### ScatterPath

The `ScatterPath` component can be passed into `Scatter` as a child. This allows you to draw a continuous path connecting points on the scatter plot. The width of the path can vary from point to point.

#### Example

This plot is using the `ScatterPath` component to draw "comets" that help visually connect the "before" and "after" state of components.

![Scatter plot with paths connecting past points to their present counterparts](/img/featureMatrixTimeCompare_light.png#gh-light-mode-only)
![Scatter plot with paths connecting past points to their present counterparts](/img/featureMatrixTimeCompare_dark.png#gh-dark-mode-only)

```
<Chart {...chartProps}>
    {...chartComponents}
    <Scatter
        color="segment"
        dimension="dauPercent"
        lineType="period"
        lineWidth={{
            value: 1
        }}
        metric="countAvg"
        opacity="period"
    >
        {...scatterChildren}
        <ScatterPath
            groupBy={['event', 'segment']}
            opacity={0.2}
            pathWidth="trailSize"
        />
    </Scatter>
</Chart>
```

#### Props

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
            <td>ColorValue</td>
            <td>'gray-500'</td>
            <td>The color of the path. Can be a css color value or a spectrum color name.</td>
        </tr>
        <tr>
            <td>groupBy</td>
            <td>string[]</td>
            <td>–</td>
            <td>List of keys that defines what data must be in common to draw a connecting path.<br/>For example, if groupBy=\{['weightClass', 'type']} then each point with the same weight class and type will have a path drawn connecting them.</td>
        </tr>
        <tr>
            <td>pathWidth</td>
            <td>string | \{value: PathWidth | number}</td>
            <td>\{value: 'M'}</td>
            <td>The width of the path.<br/>If a string is provided, this string is the key in the data. Each value for this key in the provided data will map to a width from the path width scale.<br/>If an object with a value is provided, this will set the width for all paths.</td>
        </tr>
        <tr>
            <td>opacity</td>
            <td>number</td>
            <td>0.5</td>
            <td>The fill opacity of the path.</td>
        </tr>
    </tbody>
</table>
