---
sidebar_position: 10
---

# Donut (S2)

:::note Pre-alpha component
`Donut` is a [pre-alpha component](./pre-alpha) — it has no finalized Spectrum 2 design yet
and is imported from the `pre-alpha` subpath.
:::

The `Donut` component displays a donut (or pie, via `holeRatio={0}`) chart. Each data point
becomes a segment sized by `metric` and colored by `color`.

```jsx
import { Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Donut, DonutSummary, SegmentLabel } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';
```

```jsx
<Chart data={data}>
  <Donut metric="count" color="browser" />
  <Legend title="Browsers" position="right" highlight isToggleable />
</Chart>
```

---

## Tooltips and popovers

`Donut` supports `ChartInspect` and `ChartPopover` like other S2 chart mark components.
Unlike the base package, S2 does not have a `ChartTooltip` component — use `ChartInspect`
instead.

Interactive donut segments and their direct or advanced labels animate opacity on hover. 
Legend hover, controlled highlights, and popover selection share the animation state.
Set `animations={false}` or `animationTypes={[]}`
on `Chart` to keep instant opacity changes instead. A donut without interactive children
or highlighting remains static.

Inside a `Donut`, both render default content without children: the segment's color swatch and
series name, followed by its share of the visible total and short-number value (e.g.
`65.2% (23K)`), formatted with the chart `locale`. When children are provided, their content
replaces the default content.

```jsx
<Donut metric="count" color="browser">
  <ChartInspect />
  <ChartPopover width="auto">
    {(datum) => (
      <div>
        {datum.browser}: {datum.count} visitors
      </div>
    )}
  </ChartPopover>
</Donut>
```

---

## Draw-in animation

Add `'drawIn'` to the chart's `animationTypes` to sweep the segments clockwise over one
second with a quadratic ease-in. Full-circle donuts and pies start at the top;
semicircle donuts start at the left. Direct and advanced labels start a 50ms linear fade
as soon as their own slice finishes drawing. All text rows and swatches fade together;
the final label finishes about 50ms after the donut.
Hover dimming and existing small-segment and collision rules still apply. The center
summary stays visible throughout.

```jsx
<Chart data={data} animationTypes={['hover', 'drawIn']}>
  <Donut metric="count" color="browser">
    <SegmentLabel value />
  </Donut>
</Chart>
```

Draw-in is off by default. `animations={false}` disables it even when `'drawIn'` is
listed. It runs when the Vega view is created, including after data or spec changes;
resizing an existing view does not replay it. Empty-state rings remain static.

---

## Center summary (DonutSummary)

The `DonutSummary` component displays a label and aggregate value in the center of the
donut. If `isBoolean` is set on the parent `Donut`, the summary shows the first data point's
value as a percentage instead of a sum.

```jsx
<Donut metric="count" color="browser" holeRatio={0.8}>
  <DonutSummary label="Visitors" />
</Donut>
```

### DonutSummary props

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
            <td>hideValue</td>
            <td>boolean</td>
            <td>false</td>
            <td>Hides the value portion of the summary, only showing the label.</td>
        </tr>
        <tr>
            <td>label</td>
            <td>string</td>
            <td>–</td>
            <td>Label displayed under the summary value.</td>
        </tr>
        <tr>
            <td>numberFormat</td>
            <td>string</td>
            <td>'shortNumber'</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the summary value.</td>
        </tr>
    </tbody>
</table>

---

## Segment labels (SegmentLabel)

The `SegmentLabel` component labels each donut segment directly, with its percentage
and/or metric value.

```jsx
<Donut metric="count" color="browser">
  <SegmentLabel percent />
</Donut>
```

Labels stay fixed at each segment's midpoint. A label is hidden when it would overlap a label for a larger
segment, or when its segment is narrower than 0.3 radians (about 17°). Hovering a segment always shows its
label and temporarily hides any labels that would overlap it.

When `emphasizedItems` is set, two `SegmentLabel` children can provide different label
treatments for emphasized and de-emphasized segments:

```jsx
<Donut metric="count" color="browser" emphasizedItems={['Chrome']}>
  <SegmentLabel labelMode="emphasized" swatch showValueRow />
  <SegmentLabel labelMode="deemphasized" value />
</Donut>
```

### SegmentLabel props

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
            <td>labelMode</td>
            <td>'emphasized' | 'deemphasized'</td>
            <td>–</td>
            <td>Selects which emphasized segment group receives this label. Omit for uniform single-label behavior.</td>
        </tr>
        <tr>
            <td>showValueRow</td>
            <td>boolean</td>
            <td>false</td>
            <td>Shows an additional segment value row.</td>
        </tr>
        <tr>
            <td>showTotal</td>
            <td>boolean</td>
            <td>false</td>
            <td>Appends <code>/ total</code> to the segment value row.</td>
        </tr>
        <tr>
            <td>labelKey</td>
            <td>string</td>
            <td>(the parent <code>Donut</code>'s <code>color</code> field)</td>
            <td>Key in the data that has the segment label.</td>
        </tr>
        <tr>
            <td>percent</td>
            <td>boolean</td>
            <td>false</td>
            <td>Shows the donut segment's percentage of the total.</td>
        </tr>
        <tr>
            <td>percentFormat</td>
            <td>string</td>
            <td>'.0%'</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the percentage value.</td>
        </tr>
        <tr>
            <td>swatch</td>
            <td>boolean</td>
            <td>false</td>
            <td>Shows a color swatch before the segment label.</td>
        </tr>
        <tr>
            <td>value</td>
            <td>boolean</td>
            <td>true</td>
            <td>Shows the donut segment's metric value.</td>
        </tr>
        <tr>
            <td>valueFormat</td>
            <td>string</td>
            <td>'standardNumber'</td>
            <td>A <a href="https://d3js.org/d3-format#locale_format">d3-format</a> specifier for the metric value.</td>
        </tr>
    </tbody>
</table>

---

## Boolean donuts

When `isBoolean` is set, the data should be exactly two points that sum to 1 — the first
point is displayed as a percent of the whole (e.g. a success/failure rate):

```jsx
<Donut metric="value" color="id" isBoolean colors={['green-800', 'gray-200']}>
  <DonutSummary label="Success rate" />
</Donut>
```

---

## Semicircle donuts

Setting `variant="semicircle"` renders a top-half arc instead of a full
circle. By default, data is sorted descending by `metric`, so the largest segment renders
leftmost. Set `sortOrder="data"` to preserve source order for ordinal categories.
Semicircles start at 9 o'clock and sweep clockwise through 12 to 3 o'clock.
Circle donuts start at 12 o'clock. These start positions are fixed.

```jsx
<Donut metric="count" color="browser" variant="semicircle">
  <DonutSummary label="Visitors" />
</Donut>
```

```jsx
<Donut metric="count" color="response" variant="semicircle" sortOrder="data">
  <DonutSummary label="Responses" />
</Donut>
```

:::note Segment labels unsupported
`SegmentLabel` children are not supported for `variant="semicircle"` and are silently
omitted.
:::

---

## Donut props (S2)

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
            <td>ChartInspect | ChartPopover | DonutSummary | SegmentLabel</td>
            <td>–</td>
            <td>Optional child components for inspect panels, popovers, a center summary, and segment labels.</td>
        </tr>
        <tr>
            <td>color</td>
            <td>string</td>
            <td>'series'</td>
            <td>Key in the data used to map each segment to a color.</td>
        </tr>
        <tr>
            <td>emphasizedItems</td>
            <td>(string | number)[]</td>
            <td>–</td>
            <td>Segments whose categorical colors remain emphasized. Other segments use <code>gray-400</code>.</td>
        </tr>
        <tr>
            <td>hideDeemphasizedLabels</td>
            <td>boolean</td>
            <td>false</td>
            <td>Hides labels for segments outside <code>emphasizedItems</code>.</td>
        </tr>
        <tr>
            <td>holeRatio</td>
            <td>number</td>
            <td>0.85</td>
            <td>Ratio of the donut's inner radius to its outer radius. <code>0</code> renders a pie chart.</td>
        </tr>
        <tr>
            <td>isBoolean</td>
            <td>boolean</td>
            <td>false</td>
            <td>Treats the data as a two-point boolean pair summing to 1, displaying the first point as a percent of the whole.</td>
        </tr>
        <tr>
            <td>metric</td>
            <td>string</td>
            <td>'value'</td>
            <td>Key in the data used to size each segment.</td>
        </tr>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>–</td>
            <td>Name of the donut component. Useful when referencing the donut marks programmatically.</td>
        </tr>
        <tr>
            <td>sortOrder</td>
            <td>'valueDescending' | 'data'</td>
            <td>'valueDescending'</td>
            <td>Controls semicircle segment ordering. <code>'data'</code> preserves source order for ordinal categories.</td>
        </tr>
        <tr>
            <td>variant</td>
            <td>'circle' | 'semicircle'</td>
            <td>'circle'</td>
            <td>Renders a top-half arc instead of a full circle. <code>SegmentLabel</code> children are not supported with this variant.</td>
        </tr>
    </tbody>
</table>
