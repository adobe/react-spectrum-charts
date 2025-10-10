The `ChartTooltip` component is used to setup hover tooltips for data on the chart. `ChartTooltip` must be used as a child of another component such as `Bar`, `Area`, `Line` or `Trendline`.

Tooltips should only use plain html without any interactive elements. It's not possible to click on any elements of a tooltip. If you need interactive elements like buttons, those should be added to the `ChartPopover`.

## Examples

### Basic

```jsx
<Chart data={data}>
  <Bar>
    <ChartTooltip>{(datum) => <div>Average: {datum.average}</div>}</ChartTooltip>
  </Bar>
</Chart>
```

### Tooltip disabled for some data

```tsx
const data = [
  /* Tooltip will not be shown when disableTooltip is truthy */
  { value: 10, disableTooltip: true },
  { value: 20, disableTooltip: 'a string' },
  /* Tooltip will be shown when disableTooltip is falsy */
  { value: 30, disableTooltip: false },
  { value: 40 },
];

<Chart data={data}>
  <Bar>
    <ChartTooltip excludeDataKey="disableTooltip">{(datum) => <div>Value: {datum.value}</div>}</ChartTooltip>
  </Bar>
</Chart>;
```

### Tooltip with dimension area targeting (stacked bars)

```jsx
<Chart data={data}>
  <Bar type="stacked">
    <ChartTooltip targets={['item']}>
      {(datum) => (
        <div>
          <div>Series: {datum.series}</div>
          <div>Value: {datum.value}</div>
        </div>
      )}
    </ChartTooltip>
    <ChartTooltip targets={['dimensionArea']}>
      {(datum) => (
        <div>
          <div>Dimension: {datum.dimension}</div>
          {datum.rscGroupData?.map((item, index) => (
            <div key={index}>
              {item.series}: {item.value}
            </div>
          ))}
        </div>
      )}
    </ChartTooltip>
  </Bar>
</Chart>
```

In this example, two separate tooltips are defined: one for hovering over the actual bar marks (`item`) that shows individual segment data, and another for hovering anywhere within the dimension area (`dimensionArea`) that shows aggregated data across the dimension. The datum shape differs between these targets, so they require separate tooltip implementations.

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
      <td>children*</td>
      <td>(datum: Datum) => ReactElement</td>
      <td>–</td>
      <td>Sets what is displayed by the tooltip. Supplies the datum for the value(s) that is currently hovered and expects a ReactElement to be returned.</td>
    </tr>
    <tr>
      <td>excludeDataKey</td>
      <td>string</td>
      <td>–</td>
      <td>When present, points in the chart data where the value for `excludeDataKey` is truthy will not be interactable and will not display a tooltip.</td>
    </tr>
    <tr>
      <td>highlightBy</td>
      <td>'item' | 'dimension' | 'series' | string[]</td>
      <td>'item'</td>
      <td>Specifies which marks on the parent should be highlighted on hover. For example if set to `dimension`, when a user hovers a mark, it will highlight all marks with the same dimension value.<br/>If an array of strings is provided, each of those key will be used to find other marks that match and should be highlighted. For example, if `highlightBy` is set to `['company', 'quarter']`, when a mark is hovered, all marks with the same company and quarter values will be highlighted.<br/>If `highlightBy` uses `series`, `dimension`, or an array of string, the `item` passed to the tooltip callback will include the `rscGroupData` key. This will have the data for all highlighted marks so that your tooltip can provide info for all the highlighted marks, not just the hovered mark.</td>
    </tr>
    <tr>
      <td>targets</td>
      <td>('dimensionArea' | 'item')[]</td>
      <td>['item']</td>
      <td>Specifies which areas of the chart should trigger the tooltip. `item` will trigger the tooltip when hovering over the actual data mark. `dimensionArea` will trigger the tooltip when hovering anywhere within the dimension area (e.g., for stacked bars, hovering anywhere along the dimension slice).<br/><strong>Note:</strong> Currently only active for stacked bar charts.</td>
    </tr>
  </tbody>
</table>
