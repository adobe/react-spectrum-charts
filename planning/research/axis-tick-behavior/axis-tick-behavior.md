# Axis Tick Behavior

> **Status: Proposed Design**
>
> This document defines the intended tick, gridline, and label behavior for responsive axes. The
> current implementation does not yet satisfy every rule below. The initial implementation scope is
> Spectrum 2 (`vega-spec-builder-s2` and `react-spectrum-charts-s2`).

---

## 1. Purpose

Axis ticks serve three related but distinct purposes:

1. **Major ticks** establish the labeled reference cadence.
2. **Minor ticks** subdivide the major cadence without adding labels.
3. **Gridlines** extend the major reference cadence through the plot.

These elements must remain visually coordinated while a chart resizes. Tick generation must also
preserve the semantic meaning of the scale: calendar ticks must remain calendar-aligned, numeric
ticks must remain meaningful numeric values, and neither may be moved to match data observations.

The design prioritizes:

- Vega-native scale and tick behavior over library-owned date generation,
- stable, predictable cadence over maximizing the number of labels,
- uniform positional thinning over local collision removal,
- calendar correctness over fixed-duration approximations,
- explicit local-time and UTC behavior,
- responsive behavior derived from rendered range rather than data span alone.

---

## 2. Scope

This document defines shared terminology for all axis types and a complete responsive policy for
temporal axes.

| Scale family | Policy in this document |
|---|---|
| Temporal (`time`, `utc`) | Normative responsive major/minor behavior |
| Quantitative (`linear`, `log`, `pow`, `sqrt`, `symlog`) | Preserve Vega-preferred values; responsive count remains implementation-defined |
| Categorical (`band`, `point`, `ordinal`) | Preserve category identity; label-overlap behavior is not redesigned here |

The temporal policy applies when an axis uses `labelFormat="time"` with an explicit `granularity`.
It does not change tooltip or hover behavior, data aggregation, scale domains, or mark positions.

---

## 3. Terminology

### Major tick

A tick that may have:

- a secondary label, such as `Jan`, `Q1`, or `12 PM`,
- a primary parent label, such as `2024` or `Jan 1`,
- a gridline.

Major ticks are the only labeled ticks and the only ticks that produce gridlines.

### Minor tick

An unlabeled tick between two adjacent major ticks. A minor tick:

- has no label,
- has no gridline,
- has no independent domain line,
- uses the same tick length and styling as a major tick.

### Primary label

The larger calendar context for the child tick cadence. Examples:

- year for month or quarter granularity,
- month for day or week granularity,
- date for hour or minute granularity.

Primary labels use parent-calendar boundaries. When the domain starts inside a parent period, a
label on the first visible child tick provides the missing calendar context.

### Secondary label

The label directly associated with every visible major tick. Examples:

- month,
- quarter,
- day of month,
- hour.

### Cadence

The ordered sequence of major tick values. A responsive change may select a coarser cadence, but the
result must remain a uniform multiple of the requested granularity.

---

## 4. Core Behavioral Contract

### 4.1 Vega owns the interior major cadence

RSC supplies Vega with a responsive `tickCount` interval specification:

```json
{ "interval": "month", "step": 3 }
```

Vega then owns:

- resolving the interval against the backing `time` or `utc` scale,
- generating calendar-aligned major values,
- filtering values to the scale range,
- mapping values to pixels,
- applying the selected label formats.

RSC owns only the product policy Vega does not provide: choosing a responsive interval/step from the
rendered range and requested granularity. RSC may materialize Vega's selected ticks so the major and
minor layers use the same values, but must not add observation endpoints or independently construct
the calendar sequence.

### 4.2 Major target

Major ticks target approximately **50px between adjacent ticks**.

This is a target, not a promise that every interval will be exactly 50px:

- calendar intervals have unequal durations,
- scale domains may begin or end between calendar boundaries,
- the selected granularity may naturally produce intervals wider than 50px,
- a boundary-inclusion rule may create a shorter edge interval.

The generator must not choose a cadence finer than the requested granularity merely to approach 50px.

### 4.3 Minor target

When every adjacent major interval can support it, one minor tick is placed at the visual midpoint of
each major interval. A 50px major interval therefore becomes two approximately 25px subdivisions.

Minor ticks are all-or-nothing for a given axis evaluation:

- if every major interval is at least 50px, emit one midpoint per interval;
- if any major interval is below 50px, emit no minor ticks.

This prevents an irregular mix of subdivided and unsubdivided major intervals.

Only one minor tick is permitted between majors. A 100px major interval receives one midpoint, not
three additional ticks at 25px increments.

Quarter granularity has no minor ticks. Quarters are already a high-level calendar division, and an
unlabeled midpoint does not represent a useful named calendar boundary.

### 4.4 Gridlines

Gridlines are tied to major ticks only.

Minor ticks never produce gridlines. This keeps the grid aligned with labeled values and avoids a
dense visual texture that implies more labeled precision than the axis provides.

### 4.5 Labels

Secondary labels are tied to major ticks. The primary row is an independent calendar-context layer
with values at actual parent-period boundaries.

The renderer must not independently remove arbitrary labels after the major cadence has been chosen.
In particular, a local greedy collision pass can produce patterns such as:

```
shown, hidden, shown, shown, hidden
```

If labels cannot fit, the entire major cadence must be coarsened using one uniform positional stride.
The resulting sequence should look like:

```
shown, hidden, shown, hidden, shown
```

Label fit is allowed to increase major spacing beyond 50px. It must not reduce spacing below the
50px target.

---

## 5. Temporal Scale Semantics

### 5.1 Preserve the backing scale's time semantics

RSC does not select, convert, or normalize time zones. Vega's backing scale determines the calendar
semantics.

| Scale type | Calendar interpretation | Interval implementation | Label interpretation |
|---|---|---|---|
| `time` | Browser/runtime local time | Vega local-time intervals | Local time |
| `utc` | UTC | Vega UTC intervals | UTC |

The responsive policy returns an interval name and integer step to Vega. Vega resolves that interval
against the scale, so the policy does not need separate local-time and UTC date-generation code.

For example, `2024-01-01T00:00:00Z` is:

- Jan 1 at midnight on a UTC scale,
- Dec 31 in evening hours in North American local time zones on a local-time scale.

Both results are correct for their respective scale types. A story or application that requires UTC
calendar labels must use a UTC scale rather than UTC data with a local-time scale. RSC must not infer
UTC intent from an ISO string or a `Z` suffix.

### 5.2 Ticks are reference values, not observations

Major and minor ticks do not need to coincide with data points.

- Hover, inspection, and tooltips remain anchored to actual observations.
- Axis ticks remain anchored to calendar or numeric reference values.
- Tick generation must not reshape, bucket, or move source data.

### 5.3 Calendar arithmetic, not duration arithmetic

Vega must generate major ticks with calendar intervals. Fixed millisecond constants are not valid
substitutes for calendar stepping:

- a local day may contain 23, 24, or 25 hours,
- months and quarters have unequal durations,
- leap years contain an additional day.

Minor ticks are the exception: they are visual midpoints on a continuous time scale and therefore use
the midpoint between adjacent major instants.

---

## 6. Granularity Policy

The requested granularity defines the finest legal major cadence. Responsive behavior may select an
integer multiple of that cadence but may not switch to a finer unit.

| Granularity | Vega base `tickCount` | Secondary label | Primary label | Alignment |
|---|---|---|---|---|
| `second` | `seconds` | `:%S` | hour and minute | Calendar second |
| `minute` | `minutes` | hour and minute | month and day | Calendar minute |
| `hour` | `hours` | hour | month and day | Calendar hour |
| `day` | `day` | day of month | month | Local/UTC midnight |
| `week` | `week` | day of month | month | Vega week boundary |
| `month` | `month` | abbreviated month | year | First of month |
| `quarter` | `{interval: "month", step: 3}` | quarter number | year | Jan/Apr/Jul/Oct |
| `year` | `year` | year | none | Start of year, subject to boundary rules |

### 6.1 Uniform multiples

If the base interval is too dense, the selected cadence advances through an ordered ladder of
Vega-native calendar intervals:

```text
seconds → minutes → hours → day → week → month → year
```

Each ladder entry uses steps that preserve a stable cadence at parent boundaries, such as 5/15/30
minutes, 3/6/12 hours, two days, or 2/3/4/6 months. Arbitrary field-based steps such as five months are avoided
because Vega/D3 resets those steps at the next year and would produce a short edge interval.

Weekly data remains on Vega week boundaries at every responsive width. If four-week ticks are still
too dense, the week step increases rather than advancing to month boundaries that may not coincide
with weekly observations.

The selected interval-step is passed to Vega as `tickCount`. It must not be implemented by starting at
the domain minimum and repeatedly adding a duration. Quarter ticks, for example, use
`{interval: "month", step: 3}` so Vega preserves Jan/Apr/Jul/Oct boundaries even if the domain starts
in February.

Responsive selection may use a coarser interval, but secondary labels retain the requested
granularity's format. An hourly axis with daily ticks therefore shows `12 AM` with independent date
labels rather than relabeling the child row as day-of-month values.

### 6.2 Week convention

The initial policy uses Vega's local or UTC week interval, which begins on Sunday and is
locale-independent.

A locale-specific or configurable week start is a separate API decision. It must not be inferred from
the number or time locale because doing so would move tick values when only formatting configuration
changes.

### 6.3 Daylight-saving transitions

For local-time scales:

- day and week ticks remain aligned to local midnight,
- hour ticks follow real local clock boundaries,
- adjacent calendar intervals may map to unequal pixel widths around DST transitions.

The generator must not compensate by moving calendar boundaries. Minor ticks remain visual temporal
midpoints and may therefore land at a non-round local clock time across a DST transition.

---

## 7. Responsive Major Selection

### 7.1 Inputs

Major selection depends on:

- the resolved scale domain,
- the rendered axis range in pixels,
- the requested granularity,
- any uniform label-fit spacing requirement.

It must not depend on:

- the number of observations,
- the positions of observations,
- hover state,
- tooltip state,
- a prior rendered label-overlap result.

### 7.2 Selection outline

Conceptually:

```text
minimumSpacing = max(50px, uniformLabelFitSpacing)
targetIntervals = floor(renderedRange / minimumSpacing)

candidates = ordered Vega interval-step ladder beginning at requested granularity
tickCount = first candidate that yields no more than targetIntervals
labelFormats = formats associated with tickCount's effective calendar unit

Vega generates the major tick values from tickCount and the backing scale
```

The interval-count calculation exists only to choose a ladder entry. It must not create or return
major tick values. Very large year spans may use a computed multi-year step after the predefined
calendar ladder is exhausted.

### 7.3 Stability during resize

Responsive changes should be progressive. Small width changes should generally preserve the current
cadence until the next integer multiplier is required.

If the first candidate meeting the preferred count would produce less than half that count because
few aligned boundaries fall inside the domain, retain the previous finer Vega interval. This prevents
cliffs such as four two-day ticks collapsing directly to one weekly tick.

The policy must not delegate the full decision to Vega's generic numeric time tick count because
that mechanism may jump between unrelated units, such as monthly ticks directly to yearly ticks. Such
cross-unit jumps can:

- collapse label count abruptly,
- apply a quarter or year formatter to finer values,
- produce duplicate labels such as repeated `Q1` or `2024`.

### 7.4 Degenerate ranges

- A zero rendered range produces no generated tick values.
- A reversed scale range uses its absolute rendered length.
- Invalid dates or an invalid domain produce no generated tick values and must not throw.
- A single-instant domain requires explicit product behavior; see Open Questions.

---

## 8. Domain Boundaries

### 8.1 General rule

All major ticks remain on the calendar boundaries selected by Vega. RSC does not turn the first or
last observation into a tick merely to fill the axis extent.

An observation endpoint can fall between calendar boundaries or represent a different local date than
its UTC timestamp suggests. Formatting that instant as a month, quarter, or year tick would imply a
calendar boundary that does not exist and would make adjacent midpoint ticks inaccurate.

### 8.2 Year granularity

Year granularity is the exception because omitting the first or last represented year can remove
essential context from a multi-year chart.

The year policy must:

- represent the earliest calendar year present in the domain,
- represent the latest calendar year present in the domain,
- avoid duplicates for a single-year domain,
- preserve a uniform interior year cadence,
- avoid adding an adjacent year that is not represented by the domain.

The earliest/latest-year requirement is not implemented by coercing observation endpoints into year
ticks. Any future solution must preserve actual year boundaries and may require a deliberate scale
domain or labeling policy.

### 8.3 Other granularities

Day, week, month, and quarter ticks remain calendar-aligned even when that leaves unused axis space
between the final tick and the final observation.

---

## 9. Label Rows and Deduplication

### 9.1 Horizontal axes

Horizontal temporal axes may render:

- one secondary label at each major tick,
- primary labels on independently selected parent-calendar boundaries.

Examples:

- month granularity: `Jan`, `Apr`, `Jul` with `2024` shown once,
- hour granularity: `12 AM`, `6 AM`, `12 PM` with `Jan 1` shown once.

The primary row uses the next coarser calendar granularity:

| Child granularity | Primary boundary |
|---|---|
| second | minute |
| minute/hour | day |
| day/week | month |
| month/quarter | year |
| year | no primary row |

Its values are selected responsively by Vega at true parent boundaries. When the first parent
boundary is outside the visible range, its context label uses the first visible child tick. For
example, a chart beginning Jan 8 shows `Jan` at the first visible January tick, while a later `Feb`
label remains at Feb 1.

Year granularity has no primary label row and should not create an empty axis solely for blank labels.

### 9.2 Vertical axes

Vertical temporal axes combine primary and secondary context into one label. Repeated primary text may
be suppressed, but the secondary label remains tied to every major tick.

### 9.3 Duplicate secondary labels

Repeated secondary text is acceptable only when the primary context distinguishes the values, such as
`Jan` in two different years. Adjacent values must not repeat because ticks finer than the requested
granularity were formatted as though they were coarser values.

Examples of invalid output:

- multiple monthly ticks formatted as `Q1`,
- multiple quarterly ticks formatted as `2024`,
- multiple minute ticks formatted as the same hour without minute detail.

---

## 10. Label Collision Policy

Vega's rendered-bounds collision strategies are not the primary responsive mechanism:

- `greedy` removes labels locally and produces uneven cadence,
- `parity` removes alternating labels but may preserve endpoints in a way that creates an irregular
  final interval.

The preferred collision policy is:

1. Determine the space required by the relevant label format and locale.
2. Convert that requirement into one minimum major spacing for the axis.
3. Select one uniform major cadence using that spacing.
4. Render all labels in that cadence without a second independent removal pass.

If exact measurement is unavailable, the 50px major target is the fallback. A future measurement
implementation must preserve the same uniform-cadence contract.

Truncation, rotation, and uniform cadence are independent controls:

- rotation changes required horizontal width,
- truncation limits label width,
- cadence determines which values are represented.

None should infer a new calendar unit from the formatted label text.

---

## 11. Quantitative and Categorical Axes

### 11.1 Quantitative scales

Quantitative axes should continue to use Vega's preferred numeric tick selection so values remain
round and interpretable. Responsive input may suggest an approximate count, but the final count is not
required to equal it exactly.

If quantitative minor ticks are introduced later, they should follow the same semantic split:

- labels and gridlines on majors,
- unlabeled tick marks on minors,
- no local label-removal pattern that makes cadence uneven.

### 11.2 Categorical scales

Categorical ticks represent actual category identities and cannot be replaced with arithmetic
midpoints. When all categories do not fit, the system must choose among scrolling, truncation,
rotation, or uniform category sampling. That policy is outside the scope of this document.

---

## 12. API Policy

Responsive tick behavior should be automatic for the common case.

S2 does not expose `tickCountMinimum` or `tickCountLimit` as temporal-density controls. Those values
require consumers to reproduce layout policy and can conflict with calendar alignment.

Any future override must express user intent rather than Vega implementation details. Potential
examples include:

- an explicit major-spacing target,
- an explicit fixed tick-values array,
- a configurable week start.

Overrides must define how they interact with minor ticks, gridlines, labels, and responsive sizing.

---

## 13. Vega Spec Structure

Vega has no native major/minor tick distinction. The intended temporal structure is therefore:

1. **Major axis**
   - explicit values materialized from Vega's selected calendar ticks,
   - secondary labels,
   - major tick marks,
   - optional gridlines,
   - optional title and domain line.
2. **Minor axis**
   - explicit minor values,
   - tick marks only,
   - no labels,
   - no gridlines,
   - no domain line.
3. **Primary-label axis**
   - independently selected parent-calendar boundary values,
   - responsive primary labels only,
   - no additional tick or grid cadence.

The extra axis layers are an implementation detail. Together they must behave as one accessible visual
axis and must not duplicate titles, domain lines, or interaction surfaces.

The major-values helper delegates the child sequence to Vega. The minor helper derives values from
that final major sequence so those two layers cannot choose different cadences. The primary row uses a
separate Vega sequence for the parent calendar unit plus first-child context for a partial first period.

---

## 14. Validation Matrix

Automated tests should cover behavior, not only generated expression strings.

### Every temporal granularity

- base boundaries are correctly aligned,
- responsive multipliers remain multiples of the requested granularity,
- shrinking width coarsens cadence progressively,
- no selected value is finer than the requested granularity,
- the same interval-step policy works through Vega for local and UTC scales.

### Specific edge cases

| Case | Expected behavior |
|---|---|
| Quarter domain begins in February | Ticks remain Jan/Apr/Jul/Oct boundaries within the domain |
| Month or quarter spans multiple years | Secondary labels may repeat only with distinct primary-year context |
| Year domain begins or ends mid-year | Earliest and latest represented years remain visible |
| Single-year domain | One year label; no duplicate boundary tick |
| Local day crosses DST start/end | Calendar-midnight majors remain correct |
| UTC data on a local-time scale | Labels reflect local time; no implicit UTC conversion |
| UTC data on a UTC scale | UTC calendar boundaries and labels |
| Any major gap below 50px | No minor ticks anywhere on the axis |
| Every major gap at least 50px | Exactly one midpoint minor per adjacent major pair |
| Quarter granularity | No midpoint minor ticks |
| Domain begins or ends between calendar boundaries | No synthetic endpoint tick |
| Long localized labels | Cadence coarsens uniformly rather than hiding arbitrary labels |
| Zero-width chart | No generated values and no exception |

### Structural tests

- major axes use the same Vega-derived child values,
- the minor axis derives from the final major values,
- primary labels use actual parent-calendar boundaries,
- gridlines exist only on the major axis,
- labels exist only on major values,
- the minor axis has no domain line,
- year granularity does not create an empty primary-label axis,
- hover and inspection signals remain data-driven.

---

## 15. Non-Goals

This design does not:

- align ticks to observations,
- aggregate or bucket source data,
- replace Vega's normal major tick generation,
- infer or convert time zones,
- guarantee exactly 50px or 25px for unequal calendar intervals,
- introduce multiple minor ticks per major interval,
- define categorical label overflow,
- define a locale-specific week start,
- change tooltip date formatting,
- change S1 behavior in the initial implementation.

---

## 16. Open Questions

These questions must be resolved before the behavior is considered final:

1. **Year boundaries:** Can earliest/latest represented years be communicated without coercing
   observation endpoints into false calendar boundaries?
2. **Label measurement:** Should uniform label-fit spacing use measured rendered text, conservative
   format-specific constants, or both?
3. **Week start:** Is Vega's Sunday boundary the intended product convention, or does S2 need an
   explicit configurable convention?
4. **Accessibility:** Should layered Vega axes require additional suppression or metadata to ensure
   they are represented as one semantic axis?

---

## 17. References

- [Vega axes](https://vega.github.io/vega/docs/axes/)
- [Vega scales](https://vega.github.io/vega/docs/scales/)
- [Vega time units](https://vega.github.io/vega/docs/transforms/timeunit/)
- [D3 time intervals](https://d3js.org/d3-time)
- `planning/specs/chart/issues/implemented/time-axis-granularity-tick-density-unbounded.json`
- `planning/specs/github-issues/gh-584-year-granularity-boundary-ticks.json`
