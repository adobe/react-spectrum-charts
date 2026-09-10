---
sidebar_position: 4
---

# Axis (S2)

The `Axis` component in the S2 package supports nearly all props from the [base Axis component](/docs/api/components/Axis) plus S2-exclusive features: axis label hover tooltips and axis label click callbacks.

:::note
The S2 `Axis` component does not yet support:
- `chartTooltips` (rich per-tooltip JSX content via a `ChartTooltip` child) — use `hasTooltip`/`tooltipText` instead, which show plain text.
- `hasPopover` (triggering a `ChartPopover` from an `AxisThumbnail` click).
- `AxisAnnotation` as a child component.
:::

```jsx
import { Chart, Axis } from '@spectrum-charts/react-spectrum-charts-s2';
```

---

## Axis label hover tooltips

Set `hasTooltip` to show a Spectrum 2 tooltip when hovering an axis label. By default the tooltip shows the label's full, untruncated value — useful when combined with `truncateLabels` or `labelLimit`.

```jsx
<Chart data={data}>
  <Axis position="bottom" truncateLabels hasTooltip title="Browser" />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

### Custom tooltip text (`tooltipText`)

Pass `tooltipText` to override the tooltip content for specific values. Values not listed keep the default (full label value). Set `text: null` to suppress the tooltip entirely for one value.

```jsx
<Chart data={data}>
  <Axis
    position="bottom"
    truncateLabels
    hasTooltip
    title="Browser"
    tooltipText={[
      { value: 'Other', text: 'Clicking Other may expand the chart' },
      { value: 'Mac Safari', text: null },
    ]}
  />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

---

## Axis label click

Set `onClick` to run a callback when an axis label is clicked. The callback receives the native mouse event, the label's value, and its tick index.

```jsx
<Chart data={data}>
  <Axis position="bottom" title="Browser" onClick={(event, value, index) => console.log(value, index)} />
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

---

## AxisThumbnail

`AxisThumbnail` is a child of `Axis` that replaces each tick label with a thumbnail image, read from a key in the data.

```jsx
<Chart data={data}>
  <Axis position="bottom" title="Browser">
    <AxisThumbnail urlKey="thumbnail" />
  </Axis>
  <Bar dimension="browser" metric="downloads" />
</Chart>
```

### AxisThumbnail props

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

---

## ReferenceLine

`ReferenceLine` is a child of `Axis` that draws a labeled line at a specific value.

```jsx
<Chart data={data}>
  <Axis position="left" title="Users">
    <ReferenceLine value={50} label="Target" />
  </Axis>
  <Line dimension="datetime" metric="users" />
</Chart>
```

### ReferenceLine props

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
            <td>The value on the axis where the reference line should be drawn.</td>
        </tr>
        <tr>
            <td>position</td>
            <td>'before' | 'after' | 'center'</td>
            <td>–</td>
            <td>Position the line on the value, or between the previous/next value. Only supported in Bar visualizations.</td>
        </tr>
        <tr>
            <td>label</td>
            <td>string</td>
            <td>–</td>
            <td>Axis text label for the reference line.</td>
        </tr>
        <tr>
            <td>size</td>
            <td>'S' | 'M' | 'L'</td>
            <td>–</td>
            <td>Size variant controlling stroke weight and caret triangle dimensions. When omitted, stroke width reacts to chart size automatically.</td>
        </tr>
        <tr>
            <td>secondary</td>
            <td>boolean</td>
            <td>–</td>
            <td>When true, renders a lighter secondary style: no caret caps, and a lighter stroke color for size 'S'.</td>
        </tr>
    </tbody>
</table>

---

## Axis props (S2)

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
            <td>children</td>
            <td>AxisThumbnail | ReferenceLine</td>
            <td>–</td>
            <td>Optional child components for tick thumbnails and reference lines.</td>
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
            <td>Adds an offset to the baseline. Ignored if <code>baseline</code> is false, or if the baseline is drawn relative to a categorical axis.</td>
        </tr>
        <tr>
            <td>granularity</td>
            <td>'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'</td>
            <td>–</td>
            <td>Sets the granularity of the primary axis labels for a time axis. Ignored if this axis is not a time axis.</td>
        </tr>
        <tr>
            <td>grid</td>
            <td>boolean</td>
            <td>false</td>
            <td>Displays gridlines at each tick location.</td>
        </tr>
        <tr>
            <td>hasTooltip</td>
            <td>boolean</td>
            <td>–</td>
            <td>Enables a Spectrum 2 hover tooltip on axis labels. See <a href="#axis-label-hover-tooltips">Axis label hover tooltips</a>.</td>
        </tr>
        <tr>
            <td>hideDefaultLabels</td>
            <td>boolean</td>
            <td>false</td>
            <td>Hides the axis labels. If labels have been explicitly added using the <code>labels</code> prop, those remain visible.</td>
        </tr>
        <tr>
            <td>labelAlign</td>
            <td>'center' | 'start' | 'end'</td>
            <td>'center'</td>
            <td>Sets the alignment of axis labels.</td>
        </tr>
        <tr>
            <td>labelFontWeight</td>
            <td>FontWeight</td>
            <td>–</td>
            <td>Sets the font weight of axis labels.</td>
        </tr>
        <tr>
            <td>labelFormat</td>
            <td>'duration' | 'linear' | 'percentage' | 'time'</td>
            <td>–</td>
            <td>Sets the format of the axis labels.</td>
        </tr>
        <tr>
            <td>labelLimit</td>
            <td>number</td>
            <td>180</td>
            <td>Sets the maximum allowed length, in pixels, of axis tick labels. Combine with <code>truncateLabels</code> to keep the limit within the tick bandwidth.</td>
        </tr>
        <tr>
            <td>labelOrientation</td>
            <td>'horizontal' | 'vertical'</td>
            <td>'horizontal'</td>
            <td>Sets the orientation of the label.</td>
        </tr>
        <tr>
            <td>labels</td>
            <td>(Label | string | number)[]</td>
            <td>–</td>
            <td>Explicitly sets the axis labels (controlled). Providing a <code>Label</code> object allows control over the display value, alignment, and font weight per label.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>–</td>
            <td>d3 number format specifier. Only valid if <code>labelFormat</code> is <code>'linear'</code> or unset.</td>
        </tr>
        <tr>
            <td>onClick</td>
            <td>(event: MouseEvent, value: string | number | Date, index: number) =&gt; void</td>
            <td>–</td>
            <td>Callback fired when an axis label is clicked. See <a href="#axis-label-click">Axis label click</a>.</td>
        </tr>
        <tr>
            <td>range</td>
            <td>[number, number]</td>
            <td>–</td>
            <td>The minimum and maximum values for the axis. Only supported for axes with <code>linear</code> or <code>time</code> scale types.</td>
        </tr>
        <tr>
            <td>subLabels</td>
            <td>SubLabel[]</td>
            <td>–</td>
            <td>Adds sublabels below the axis labels.</td>
        </tr>
        <tr>
            <td>tickCountMinimum</td>
            <td>number</td>
            <td>2</td>
            <td>Sets the minimum number of axis ticks. Smaller charts may want a minimum of 3 for a more accurate representation of the data.</td>
        </tr>
        <tr>
            <td>tickCountLimit</td>
            <td>number</td>
            <td>–</td>
            <td>Sets the upper limit on the number of axis ticks. On time-based axes, setting this overrides the automatic granularity-based tick interval and can produce duplicate labels — you are responsible for aligning it with the data granularity.</td>
        </tr>
        <tr>
            <td>tickMinStep</td>
            <td>number</td>
            <td>–</td>
            <td>The minimum desired step between axis ticks, in scale domain values. Only supported for linear axes.</td>
        </tr>
        <tr>
            <td>ticks</td>
            <td>boolean</td>
            <td>false</td>
            <td>Displays ticks at each label location.</td>
        </tr>
        <tr>
            <td>title</td>
            <td>string | string[]</td>
            <td>–</td>
            <td>Sets the axis title. Pass an array for a multi-line title.</td>
        </tr>
        <tr>
            <td>tooltipText</td>
            <td>&#123;value: string | number, text: string | null&#125;[]</td>
            <td>–</td>
            <td>Per-value tooltip text overrides. See <a href="#custom-tooltip-text-tooltiptext">Custom tooltip text</a>.</td>
        </tr>
        <tr>
            <td>truncateLabels</td>
            <td>boolean</td>
            <td>false</td>
            <td>If the text is wider than the tick's bandwidth, truncates it so it stays within that bandwidth.</td>
        </tr>
        <tr>
            <td>currencyLocale</td>
            <td>string</td>
            <td>–</td>
            <td>⚠️ Limited support. Sets the locale for currency formatting (affects symbol position and spacing). Requires <code>currencyCode</code> to take effect.</td>
        </tr>
        <tr>
            <td>currencyCode</td>
            <td>string</td>
            <td>–</td>
            <td>⚠️ Limited support. Overrides the currency symbol from the chart locale. Requires <code>currencyLocale</code> to take effect.</td>
        </tr>
    </tbody>
</table>
