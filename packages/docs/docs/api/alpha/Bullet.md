# Bullet

:::caution Alpha Component
Bullet is an **alpha component** and may undergo breaking changes. See [Alpha Components](./index.md) for more information.
:::

## Basic Usage

```jsx
import { Bullet } from '@adobe/react-spectrum-charts/alpha';

<Chart data={data}>
  <Bullet
    dimension="category"
    metric="current"
    target="goal"
  />
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
            <td>string</td>
            <td>'categorical-100'</td>
            <td>The key in the data that is used as the color facet, or a color value.</td>
        </tr>
        <tr>
            <td>dimension</td>
            <td>string</td>
            <td>'category'</td>
            <td>Data field that the metric is trended against (x-axis for horizontal orientation).</td>
        </tr>
        <tr>
            <td>direction</td>
            <td>'row' | 'column'</td>
            <td>'column'</td>
            <td>Specifies the direction the bars should be ordered (row/column).</td>
        </tr>
        <tr>
            <td>labelPosition</td>
            <td>'side' | 'top'</td>
            <td>'top'</td>
            <td>Specifies if the labels should be on top of the bullet chart or to the side. Side labels are not supported in row mode.</td>
        </tr>
        <tr>
            <td>maxScaleValue</td>
            <td>number</td>
            <td>–</td>
            <td>Maximum value for the scale. This value must be greater than zero.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>Key in the data that is used as the metric.</td>
        </tr>
        <tr>
            <td>metricLabel</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data that contains a pre-formatted label for the metric value. When provided, this formatted label will be displayed instead of applying numberFormat to the metric value.</td>
        </tr>
        <tr>
            <td>metricAxis</td>
            <td>boolean</td>
            <td>false</td>
            <td>Adds an axis that follows the max target in basic mode.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Sets the name of the component.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>'standardNumber'</td>
            <td>d3 number format specifier or shorthand ('currency', 'shortCurrency', 'shortNumber', 'standardNumber'). Sets the number format for the summary value. See <a href="https://d3js.org/d3-format#locale_format">d3-format</a>.</td>
        </tr>
        <tr>
            <td>scaleType</td>
            <td>'normal' | 'fixed' | 'flexible'</td>
            <td>'normal'</td>
            <td>
                In normal mode the maximum scale value will be calculated using the maximum value of the metric and target data fields.<br/><br/>
                In fixed mode the maximum scale value will be set as the maxScaleValue prop.<br/><br/>
                In flexible mode the maximum scale value will be calculated using the maximum value of either the maxScaleValue prop or maximum value of the metric and target data fields.
            </td>
        </tr>
        <tr>
            <td>showTarget</td>
            <td>boolean</td>
            <td>true</td>
            <td>Flag to control whether the target line is shown.</td>
        </tr>
        <tr>
            <td>showTargetValue</td>
            <td>boolean</td>
            <td>false</td>
            <td>Flag to control whether the target value label is shown.</td>
        </tr>
        <tr>
            <td>target</td>
            <td>string</td>
            <td>'target'</td>
            <td>Key in the data for the target line value.</td>
        </tr>
        <tr>
            <td>targetLabel</td>
            <td>string</td>
            <td>–</td>
            <td>Key in the data that contains a pre-formatted label for the target value. When provided, this formatted label will be displayed instead of applying numberFormat to the target value.</td>
        </tr>
        <tr>
            <td>thresholdBarColor</td>
            <td>boolean</td>
            <td>false</td>
            <td>If true, the metric bar will be colored according to the thresholds.</td>
        </tr>
        <tr>
            <td>thresholds</td>
            <td>ThresholdBackground[]</td>
            <td>–</td>
            <td>
                Array of threshold definitions to be rendered as background bands on the bullet chart.<br/>
                Each threshold object supports:<br/>
                • <code>thresholdMin</code> (optional): The lower bound of the threshold<br/>
                • <code>thresholdMax</code> (optional): The upper bound of the threshold<br/>
                • <code>fill</code>: The fill color to use for the threshold background
            </td>
        </tr>
        <tr>
            <td>track</td>
            <td>boolean</td>
            <td>false</td>
            <td>Adds color regions that sit behind the bullet bar.</td>
        </tr>
    </tbody>
</table>

## Custom Label Formatting

The `metricLabel` and `targetLabel` props allow you to provide pre-formatted labels in your data, giving you complete control over label formatting including custom units, localization, or annotations.

### Example with Custom Labels

```jsx
const data = [
  {
    category: 'Storage Used',
    current: 750,
    currentLabel: '750 GB',
    goal: 1000,
    goalLabel: '1 TB',
  },
  {
    category: 'API Requests',
    current: 850,
    currentLabel: '85K req/sec',
    goal: 1000,
    goalLabel: '100K req/sec',
  },
];

<Chart data={data}>
  <Bullet
    dimension="category"
    metric="current"
    metricLabel="currentLabel"
    target="goal"
    targetLabel="goalLabel"
  />
</Chart>
```

This is useful when you need:
- Custom units that aren't in standard number formats
- Localized formatting from external libraries
- Context-specific annotations
- Different formatting per data point

## Thresholds

Thresholds create colored background regions to indicate performance zones:

```jsx
const thresholds = [
  { thresholdMax: 600, fill: 'rgb(21, 164, 110)' }, // green
  { thresholdMin: 600, thresholdMax: 900, fill: 'rgb(249, 137, 23)' }, // orange
  { thresholdMin: 900, fill: 'rgb(234, 56, 41)' }, // red
];

<Chart data={data}>
  <Bullet
    dimension="category"
    metric="current"
    target="goal"
    thresholds={thresholds}
    thresholdBarColor={true}
  />
</Chart>
```

When `thresholdBarColor` is enabled, the bullet bar itself will be colored based on which threshold zone it falls into.

