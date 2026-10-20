# Bullet

**Stage:** Lab

Bullets compare a metric against a target. Each data point becomes one bullet: a bar for the metric, a line for the target, and a label with the formatted value.

```jsx
import { Chart, Title } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletScoreData}>
  <Title text="Customer health" />
  <Bullet metric="score" dimension="kpi" target="goal" track />
</Chart>
```

`Bullet` is a lab component. Import it from the `lab` subpath:

```tsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```

## Data

`data` goes on `Chart` as an array of objects, one per bullet. On `Bullet`, `metric` names the field for the bar (default `currentAmount`), `target` names the field for the target line (default `target`), and `dimension` names the field for each bullet's label (default `graphLabel`). Most examples on this page use `bulletScoreData`:

```ts
const bulletScoreData = [
  { kpi: 'Satisfaction', score: 82, goal: 90 },
  { kpi: 'Retention', score: 74, goal: 70 },
  { kpi: 'Task success', score: 58, goal: 75 },
];
```

```tsx
<Chart data={bulletScoreData}>
  <Bullet metric="score" dimension="kpi" target="goal" />
</Chart>
```

All bullets in a chart share one scale, so their bars and targets can be compared directly. Use separate charts for metrics in different units.

### Empty and loading

When `data` is an empty array, `Chart` shows `emptyStateText` instead. Set `loading` on `Chart` to show a spinner while data loads.

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={emptyData} emptyStateText="No KPI data">
  <Bullet track metric="score" dimension="kpi" target="goal" />
</Chart>
```

## Layout

`direction` stacks bullets in a `column` (the default) or places them side by side in a `row`.

In a column, `labelPosition="side"` moves each bullet's label to its left and its value to its right, so bullets take less height. Rows always show labels on top.

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletScoreData}>
  <Bullet
    track
    metric="score"
    dimension="kpi"
    target="goal"
    labelPosition="side"
  />
</Chart>
```

The examples on this page are 480px wide and exactly as tall as their bullets. Bullets keep a fixed height and spacing, so a taller `Chart` leaves empty space below them rather than stretching them.

## Target

`showTarget` draws the target line (on by default). `showTargetValue` adds the target value below the line, formatted like the metric value. A data point without a target has no target line, and its target value reads "No Target".

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletScoreData}>
  <Bullet track metric="score" dimension="kpi" target="goal" showTargetValue />
</Chart>
```

## Scale

The scale always starts at 0. `scaleType` sets its maximum:

-   `normal` (default) fits the data: the largest metric or 105% of the largest target.
-   `fixed` uses `maxScaleValue`. Bars and targets beyond it stop at the end of the scale.
-   `flexible` uses `maxScaleValue` until the data needs more room, then fits the data.

`maxScaleValue` defaults to `100`, which suits percentages and scores. `metricAxis` adds a value axis below the bullets.

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletScoreData}>
  <Bullet
    track
    metric="score"
    dimension="kpi"
    target="goal"
    scaleType="fixed"
    metricAxis
  />
</Chart>
```

> **Note:**
> 
> `metricAxis` only applies to column bullets and isn't shown with `showTargetValue`. Bullets draw their own labels and axis; they don't use `Axis` or `Legend`.

## Thresholds and track

`thresholds` draws background bands behind each bar, such as red, orange, and green performance zones. Each band takes a `fill` CSS color and optional `thresholdMin` and `thresholdMax`; an omitted bound extends the band to the edge of the scale. Bands are drawn at 20% opacity.

```ts
const bulletScoreThresholds = [
  { thresholdMax: 60, fill: 'rgb(234, 56, 41)' },
  { thresholdMin: 60, thresholdMax: 80, fill: 'rgb(249, 137, 23)' },
  { thresholdMin: 80, fill: 'rgb(21, 164, 110)' },
];
```

-   `thresholdBarColor` colors each bar with the full-strength `fill` of the band its value falls in. Values below the first band keep `color`.
-   `track` draws a plain gray track behind each bar instead. It's ignored when `thresholds` is set.

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletScoreData}>
  <Bullet
    metric="score"
    dimension="kpi"
    target="goal"
    thresholds={bulletScoreThresholds}
  />
</Chart>
```

## Color

`color` sets the bar color as a Spectrum color name, such as `purple-900`, or a CSS color. The default is `blue-900`. Target lines and labels are always gray.

## Labels and number format

### numberFormat

`numberFormat` formats the metric values, target values, and metric axis. It accepts `standardNumber` (default), `shortNumber`, `currency`, `shortCurrency`, or a [d3-format](https://d3js.org/d3-format) specifier. Numbers follow the chart's `locale`.

```ts
const bulletRevenueData = [
  { region: 'Americas', revenue: 4215000, target: 4000000 },
  { region: 'EMEA', revenue: 2930000, target: 3500000 },
  { region: 'APAC', revenue: 1785000, target: 2200000 },
];
```

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletRevenueData}>
  <Bullet
    track
    metric="revenue"
    dimension="region"
    target="target"
    numberFormat="shortCurrency"
    showTargetValue
  />
</Chart>
```

### metricLabel and targetLabel

To show text you've already formatted, such as values with units, set `metricLabel` to a field holding the metric text and `targetLabel` to a field holding the target text. `targetLabel` only shows with `showTargetValue`.

```ts
const bulletStorageData = [
  { volume: 'Primary', used: 750, usedLabel: '750 GB', quota: 1000, quotaLabel: '1 TB' },
  { volume: 'Backups', used: 420, usedLabel: '420 GB', quota: 500, quotaLabel: '500 GB' },
  { volume: 'Archive', used: 1200, usedLabel: '1.2 TB', quota: 1500, quotaLabel: '1.5 TB' },
];
```

```jsx
import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletStorageData}>
  <Bullet
    track
    metric="used"
    dimension="volume"
    target="quota"
    metricLabel="usedLabel"
    targetLabel="quotaLabel"
    showTargetValue
  />
</Chart>
```

## Title

Add [`Title`](/react-spectrum-charts/s2/docs/docs/title) as a sibling of `Bullet` to label the chart. The main example at the top of this page has one.

## Interaction

### ChartInspect

Add `ChartInspect` with a function as children to show details when a bullet is hovered. The function receives the bullet's data row. Hovering the bar or target line shows the details; with `thresholds` or `track`, hovering anywhere along the band does too.

```jsx
import { Chart, ChartInspect } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

<Chart data={bulletScoreData}>
  <Bullet metric="score" dimension="kpi" target="goal" track>
    <ChartInspect>
      {(datum) => (
        <div>
          {datum.kpi}: {datum.score} (goal {datum.goal})
        </div>
      )}
    </ChartInspect>
  </Bullet>
</Chart>
```

> **Note:**
> 
> Bullets don't support `ChartPopover` or highlighting (`highlightedSeries`, `highlightedItem`) yet, and `ChartInspect` without children shows nothing.

## Animation

Bullets don't animate; `animationTypes` has no effect on them.

## API

### Bullet

`name` identifies the bullet's marks and signals in the rendered Vega spec. It defaults to `bullet0`, `bullet1`, and so on.

| Prop | Type | Default |
| --- | --- | --- |
| `children` — `ChartInspect` to show details when a bullet is hovered. | `ChartInspect` | – |
| `color` — Color of the metric bars, as a Spectrum color name or CSS color. | `string` | `'blue-900'` |
| `dimension` — Key in the data for each bullet's label. | `string` | `'graphLabel'` |
| `direction` — Stacks bullets in a `column` or places them side by side in a `row`. | `"row" \| "column"` | `'column'` |
| `labelPosition` — Shows each bullet's label and value above it (`top`) or on either side (`side`, column direction only). | `"top" \| "side"` | `'top'` |
| `maxScaleValue` — Scale maximum when `scaleType` is `fixed` or `flexible`; must be greater than zero. | `number` | `100` |
| `metric` — Key in the data for the metric bar's value. | `string` | `'currentAmount'` |
| `metricAxis` — Adds a value axis below the bullets in column direction; not shown with `showTargetValue`. | `boolean` | `false` |
| `metricLabel` — Key in the data for preformatted text shown instead of the formatted metric value. | `string` | – |
| `name` — Names the bullet's marks and signals in the Vega spec. Defaults to `bullet0`, `bullet1`, and so on. | `string` | `'bullet0'` |
| `numberFormat` — Format for values, target values, and the metric axis: `standardNumber`, `shortNumber`, `currency`, `shortCurrency`, or a d3-format specifier. | `string` | `''` |
| `scaleType` — Sets the scale maximum from the data (`normal`), from `maxScaleValue` (`fixed`), or the larger of the two (`flexible`). | `"normal" \| "fixed" \| "flexible"` | `'normal'` |
| `showTarget` — Shows the target line. | `boolean` | `true` |
| `showTargetValue` — Shows the target value below the target line. | `boolean` | `false` |
| `target` — Key in the data for the target value. | `string` | `'target'` |
| `targetLabel` — Key in the data for preformatted text shown instead of the formatted target value when `showTargetValue` is set. | `string` | – |
| `thresholdBarColor` — Colors each metric bar with the `fill` of the threshold band its value falls in. | `boolean` | `false` |
| `thresholds` — Background bands `{ thresholdMin?, thresholdMax?, fill }`; an omitted bound extends to the edge of the scale and `fill` is a CSS color. | `ThresholdBackground[]` | – |
| `track` — Draws a gray track behind each metric bar; ignored when `thresholds` is set. | `boolean` | `false` |
