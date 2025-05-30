The `BigNumber` component calls attention to a specified data metric. A `BigNumber` gets its data from a parent `Chart`.

You can specify which data dimension (`dataKey`) a `BigNumber` should display. Also, you can optionally specify a metric aggregation `method`, as well as custom formatting with `orientation`, `numberType`, and/or `numberFormat`.

`BigNumber` can also display an icon and/or "sparkline" (basic line chart) to provide better context for the metric.

## Examples

#### Basic Horizontal

```
<Chart
  data=\{[\{ x: 20, y: 90 }]}
  height=\{100}
  width=\{200}
>
  <BigNumber
    dataKey="x"
    label="Visitors"
    orientation="horizontal"
  />
</Chart>
```

<img width="200" alt="20 visitors" src="https://github.com/adobe/react-spectrum-charts/assets/20342122/d67c68c3-32c5-4b43-bdda-f25da6a11ff9" />

#### Vertical with Icon

```
<Chart
  data=\{[\{ x: 20, y: 90 }]}
  height=\{100}
  width=\{200}
>
  <BigNumber
    dataKey="x"
    icon=\{<User />} /* From react-spectrum icons */
    label="Visitors"
    orientation="horizontal"
  />
</Chart>
```

<img width="250" alt="20 visitors" src="https://github.com/adobe/react-spectrum-charts/assets/20342122/eeb8abd3-513e-4358-82cb-d15f61e7a5e4" />

#### Horizontal with Sparkline

```
<Chart
  data=\{[
    /* previous data values omitted for brevity */
    \{
      x: 19,
      y: 55
    },
    \{
      x: 20,
      y: 90
    }
  ]}
  height=\{100}
  width=\{200}
>
  <BigNumber
    dataKey="x"
    label="Visitors"
    orientation="horizontal"
  >
    <Line
      dimension="x"
      metric="y"
      scaleType="linear"
    />
  </BigNumber>
</Chart>
```

<img width="450" alt="20 visitors" src="https://github.com/adobe/react-spectrum-charts/assets/20342122/488596e4-731d-437b-b94f-d671aea8370f" />

#### Vertical with Icon and Sparkline

```
<Chart
   data=\{[
    /* previous data values omitted for brevity */
    \{
      x: 19,
      y: 55
    },
    \{
      x: 20,
      y: 90
    }
  ]}
  height=\{100}
  width=\{200}
>
  <BigNumber
    dataKey="x"
    icon=\{<User />} /* From react-spectrum icons */
    label="Visitors"
    orientation="vertical"
  >
    <Line
      dimension="x"
      metric="y"
      scaleType="linear"
    />
  </BigNumber>
</Chart>
```

<img width="350" alt="20 visitors" src="https://github.com/adobe/react-spectrum-charts/assets/20342122/5f2c7085-f6e3-4f64-9ec7-acdd4290528c" />

#### Currency Format

```
<Chart
  data=\{[\{ value: 255.56 }]}
  height=\{600}
  locale="de-DE"
  width=\{600}
>
  <BigNumber
    dataKey="value"
    label="Ad Spend"
    numberFormat="$,.2f"
    orientation="horizontal"
  />
</Chart>
```

<img width="250" alt="255,56 euros Ad Spend" src="https://github.com/adobe/react-spectrum-charts/assets/20342122/ffae21d3-adf7-4343-afaa-5829ca3acc9c" />

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
            <td>LineElement</td>
            <td>–</td>
            <td>Optional sparkline element.</td>
        </tr>
        <tr>
            <td>dataKey</td>
            <td>string</td>
            <td>–</td>
            <td>The key that references the metric this component will display.</td>
        </tr>
        <tr>
            <td>icon</td>
            <td>IconElement</td>
            <td>–</td>
            <td>Optional icon element.</td>
        </tr>
        <tr>
            <td>label</td>
            <td>string</td>
            <td>–</td>
            <td>A custom metric label that titles the data shown.</td>
        </tr>
        <tr>
            <td>method</td>
            <td>'sum' | 'avg' | 'last'</td>
            <td>'last'</td>
            <td>
                The aggregation method used before displaying the metric value.
                <ul>
                    <li><strong>Last:</strong> display only the last metric value of <code>dataKey</code> from the <code>Chart</code> data</li>
                    <li><strong>Sum:</strong> display the sum of all the <code>dataKey</code> in the <code>Chart</code> data</li>
                    <li><strong>Average:</strong> display the arithmetic mean of the <code>dataKey</code> in the <code>Chart</code> data</li>
                </ul>
                Additionally, the <code>last</code> method adds a visual indicator of the last value on the sparkline (if a sparkline is shown).
            </td>
        </tr>
       <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>-</td>
            <td>Sets the format for numeric axis labels. This format must be a <a href="https://d3js.org/d3-format#locale_format" target="_blank">d3-format specifier</a> (Example: '$.2f' = $5,432.10). <a href="https://github.com/adobe/react-spectrum-charts/wiki/Chart-API#locale" target="_blank">Number locale</a> will be applied to the number format.</td>
        </tr>
       <tr>
            <td>numberType</td>
            <td>'linear' | 'percentage'</td>
            <td>'linear'</td>
            <td>If set to <code>percentage</code>, automatically formats the number as a percentage.  Otherwise, this component relies on the <code>numberFormat</code> prop.</td>
        </tr>
       <tr>
            <td>orientation</td>
            <td>'vertical' | 'horizontal'</td>
            <td>'vertical'</td>
            <td>Specifies the visual direction for this component's elements.  See visual examples above.</td>
        </tr>
       <tr>
            <td>rscChartProps</td>
            <td>RscChartProps</td>
            <td>-</td>
            <td>Used internally to drill down props from the parent <code>Chart</code> to the sparkline (if displayed). Modify at your own risk!</td>
        </tr>
    </tbody>
</table>
