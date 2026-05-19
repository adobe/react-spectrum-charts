# react-spectrum-charts: Implementing Time Period Comparisons (S1)

Use this skill when a user wants to compare two time periods on the same line chart — e.g. this month vs. last month, this year vs. last year, or any two arbitrary date ranges overlaid on the same x-axis.

This pattern is fully supported today using existing S1 props. No new features are required.

A working reference story exists at:
`packages/react-spectrum-charts/src/stories/components/Line/Line.story.tsx` — `HistoricalCompare`

---

## How It Works

The chart library does not perform date normalization. The **consumer is responsible** for:
1. Aligning the two periods' datetimes to the same x values
2. Adding a `period` field to each row to identify which period it belongs to

Once the data is shaped correctly, RSC encodes the period dimension using `lineType`.

This is the standard approach used by D3, Vega-Lite, ggplot2, and pandas — normalization belongs in the data layer, not the chart layer.

---

## Required Data Shape

Each row must have:
- A shared `datetime` field — **both periods use the same timestamp values** so they plot at the same x positions
- A `period` field — string label identifying the period (e.g. `'Current'`, `'Last month'`)
- The metric field(s)
- Any other dimension fields (e.g. `series` for multiple lines per period)

```ts
const data = [
  { datetime: 1667890800000, users: 477, series: 'Add Fallout', period: 'Current' },
  { datetime: 1667890800000, users: 147, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1667977200000, users: 481, series: 'Add Fallout', period: 'Current' },
  { datetime: 1667977200000, users: 148, series: 'Add Fallout', period: 'Last month' },
  // ...
];
```

The same datetime value appears twice — once per period. The consumer shifts the previous period's real timestamps to match the current period's timestamps before passing data to `<Chart>`.

---

## Chart Configuration

Pass `lineTypes` and `opacities` to `<Chart>` to control how each period renders. The order of values in these arrays corresponds to the order periods appear in the `lineType` scale domain (alphabetical by default, or as they appear in the data).

```tsx
<Chart
  data={data}
  lineTypes={['dotted', 'solid']}   // index 0 = first period in domain, index 1 = second
  opacities={[0.5, 1]}              // same ordering
  width={600}
  height={400}
>
  <Axis position="left" grid title="Users" />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line
    dimension="datetime"
    metric="users"
    color="series"
    lineType="period"
    scaleType="time"
  />
  <Legend highlight opacity="period" />
</Chart>
```

### Key props

| Prop | Where | Purpose |
|---|---|---|
| `lineTypes` | `<Chart>` | Dash patterns for each period. `'solid'`, `'dashed'`, `'dotted'`, `'shortDash'`, `'longDash'`, `'twoDash'` |
| `opacities` | `<Chart>` | Opacity levels for each period. Typically `[0.5, 1]` to de-emphasize the comparison period |
| `lineType="period"` | `<Line>` | Encodes the `period` field as the stroke dash dimension |
| `color="series"` | `<Line>` | Encodes the primary series dimension (e.g. event name, browser) as color |
| `opacity="period"` | `<Legend>` | Facets legend opacity by period so legend items reflect the correct opacity |

---

## Controlling Period Order

The `lineType` scale domain is built from the values of the `period` field as they appear in the data (or alphabetically). The `lineTypes` array maps to this domain in order.

To ensure a specific period is always solid (index 1) and the comparison is always dotted (index 0), either:
- Name periods so they sort correctly alphabetically (e.g. `'A - Current'`, `'B - Last month'`)
- Or ensure the data arrives ordered with the comparison period first

---

## What the Consumer Must Do

The chart has no knowledge of calendar dates — it only sees the `datetime` values in the data. The consumer must:

1. **Choose a reference period** — typically the current/most-recent period
2. **Shift the comparison period's timestamps** to match the reference period's timestamps, date-for-date:
   - Jan 15 last year → use Jan 15 this year's timestamp
   - Handle leap years, month-end differences, and DST in the data pipeline, not in the chart
3. **Tag each row** with a `period` string field
4. **Combine into a single flat array** and pass to `<Chart data={...}>`

This is intentional. Normalization logic belongs in SQL, pandas, or whatever data pipeline feeds the chart — not in the charting layer. See `planning/research/period-comparison-line-charts/` for a deep-dive on why in-chart normalization is complex.

---

## What to Avoid

- Do not try to pass two separate datasets. `<Chart>` takes a single flat `data` array.
- Do not use `color` for the period dimension if you also want color to encode a primary series — `color` can only map to one field. Use `lineType` + `opacity` for period, and `color` for the primary series.
- Do not add a `color` prop for period if you want secondary lines to appear gray — the current API does not support a "gray for comparison period" default. That would require a new feature (see research notes).
