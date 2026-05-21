# Period Comparison Line Charts — Research Notes

> **Status: Prototype / Research Only**
> This document captures exploratory findings from a spike. None of this is a planned feature. These are ideas and tradeoffs worth preserving for a future conversation if this work is ever prioritized.

---

## What This Is

A period comparison line chart overlays multiple time periods (e.g. this year vs. last year, this month vs. last month) on the same x-axis so trends can be compared directly. The primary period is rendered as a solid line; the comparison period(s) as dashed lines, optionally in gray.

A working prototype lives at `tmp/spikes/line-2d-faceting.vg.json`.

---

## The Core Problem

To overlay two periods on the same x-axis, the data must be normalized — dates from the comparison period need to map to the same x positions as the corresponding dates in the primary period. How that normalization is done has significant tradeoffs.

Three approaches were explored.

---

## Approach 1: Arithmetic Shift

Shift all comparison-period timestamps forward (or backward) by a fixed number of milliseconds to align them with the primary period.

```json
{ "type": "formula", "expr": "toString(utcyear(datum.datetime))", "as": "period" },
{ "type": "formula", "expr": "datum.datetime + (2024 - utcyear(datum.datetime)) * 31536000000", "as": "normalizedDatetime" },
{ "type": "timeunit", "field": "normalizedDatetime", "units": ["year", "month", "date"], "utc": true, "as": ["datetime0", "datetime1"] }
```

This was the initial approach in the spike. `31536000000` is the number of milliseconds in a 365-day year.

**What works:**
- Simple to understand — the intent is readable
- Works correctly for most days of the year

**Problems:**
- **Leap year drift** — 2024 has 366 days, 2023 has 365. Adding exactly 365 days' worth of milliseconds causes every date after Feb 28 to land one day off. Mar 1, 2023 shifts to Feb 29, 2024 instead of Mar 1.
- **Hardcoded reference year** — the spec uses `2024` as the reference. A real implementation would need a dynamic signal derived from `max(utcyear(datum.datetime))` over the dataset, adding pipeline complexity.
- **DST** — UTC data sidesteps this, but local-time data would have 23/25 hour days.

---

## Approach 2: `timeunit` Partial Units (Drop Year from Units Array)

Instead of normalizing timestamps, use Vega's `timeunit` transform with `["month", "date"]` — omitting `"year"`. Vega bins all dates to a fixed internal reference epoch regardless of year, so Jan 15 in any year maps to the same `datetime0` value.

```json
{ "type": "formula", "expr": "toString(utcyear(datum.datetime))", "as": "period" },
{ "type": "timeunit", "field": "datetime", "units": ["month", "date"], "utc": true, "as": ["datetime0", "datetime1"] }
```

The normalization arithmetic disappears entirely. The `timeunit` transform does the alignment implicitly.

**What works:**
- Cleaner — one fewer transform
- Calendar-aware — (month, day) pairs always align correctly, no drift
- Generalizes across units by swapping the `units` array:

  | Period unit | `timeunit` units |
  |---|---|
  | `year` | `["month", "date"]` |
  | `month` | `["date"]` |
  | `day` | `["hours"]` |

- Feb 29 in the non-leap year correctly has no data point (clean gap, line interpolates)

**Problems:**
- **Implicit behavior** — Vega anchors output datetimes to an internal reference year when "year" is omitted. The reference year is not documented or controllable. If that reference year is a non-leap year, Feb 29 data from a leap year overflows to March 1 (one point misplaced). The reader of the spec has no way to know this is happening.
- **Feb 29 uncertainty** — whether Feb 29 maps correctly or rolls to March 1 depends entirely on Vega's internal reference year. This is an implementation detail, not a guarantee.
- **Less readable intent** — someone reading the spec has to know this quirk of `timeunit` to understand why year is omitted from the units array.

**Vs. Approach 1 on leap years:** `timeunit ["month","date"]` is actually *more* correct than arithmetic shift for leap year comparisons. Arithmetic shift causes drift for all dates after Feb 28; `timeunit` only has an edge case on Feb 29 itself.

---

## Approach 3: Ordinal Position (`utcdayofyear`)

Extract a numeric position within the period — day of year, day of month, hour of day — and use that as the x field on a linear scale.

```js
// year-over-year
{ "type": "formula", "expr": "utcdayofyear(datum.datetime)", "as": "position" }

// month-over-month
{ "type": "formula", "expr": "utcdate(datum.datetime)", "as": "position" }

// day-over-day
{ "type": "formula", "expr": "utchours(datum.datetime)", "as": "position" }
```

**What works:**
- Explicit and readable — `utcdayofyear` communicates intent clearly
- Standard D3/Vega-Lite community pattern for period comparison
- No implicit Vega internals to rely on
- Month-over-month and day-over-day work correctly — shorter months just have no data at higher positions, DST is a non-issue with UTC

**Problems:**
- **Leap year drift (year-over-year only)** — `utcdayofyear` assigns ordinal positions 1–365 (non-leap) or 1–366 (leap). After Feb 28, the positions no longer correspond to the same calendar date between a leap and non-leap year. Mar 1 in a leap year is day 61; Mar 1 in a non-leap year is day 60. Every date from March onwards is one tick off. This is worse than the `timeunit` approach.
- **Axis labels lose calendar meaning** — the x scale is now a linear numeric scale (1–365). Month/day labels require custom formatting work that `timeunit` provides automatically.

---

## Comparison Summary

| | Arithmetic Shift | `timeunit` Partial | Ordinal Position |
|---|---|---|---|
| Leap year drift | Yes — all dates after Feb 28 | No drift (edge case on Feb 29 only) | Yes — all dates after Feb 28 |
| Feb 29 handling | Misaligns (overflow) | Depends on Vega internals | Gap in non-leap year (correct); drift in leap year |
| Axis labels | Calendar dates automatically | Calendar dates automatically | Numeric — needs custom formatting |
| Readable intent | Yes | No — implicit behavior | Yes |
| Reference to Vega internals | No | Yes | No |
| Standard in D3/Vega community | No | No | Closest to community norm |

---

## What the Community Actually Does

D3, Vega-Lite, ggplot2, pandas — all treat period normalization as a **data concern, not a charting concern**. The standard approach is to pre-process data before it reaches the chart: add a `period` field and normalize datetimes to a shared reference in SQL, pandas, or whatever data pipeline feeds the chart. The chart layer just encodes `color` and `lineType` by period.

This is worth considering if this feature is ever revisited. An API like:

```tsx
<Line color="browser" comparisonData={previousYearData} />
```

...where the user supplies pre-normalized comparison data, shifts the date alignment responsibility to the consumer (where every other charting library puts it) and removes all the calendar complexity from RSC's scope. RSC's value-add is then purely the visual encoding — dashed+gray for comparison series, `matchColor` toggle, legend behavior — which is well within RSC's responsibility.

---

## Prototype

`line-2d-faceting.vg.json` (in this directory) — uses Approach 1 (arithmetic shift) with the `utcyear()` timezone fix applied. Demonstrates 4 lines (Chrome 2024 solid, Chrome 2023 dashed gray, Safari 2024 solid, Safari 2023 dashed gray) with a `matchColor` signal toggle.

Paste the contents into the [Vega editor](https://vega.github.io/editor) to run it interactively. Toggle `matchColor` from `false` to `true` in the signals panel to see secondary lines switch from gray to their browser color.
