# Generate a chart story from a design observation

Reads `./tmp/ai/design-observation.json` and produces a matching Storybook story. Records
implementation decisions in `implementation-hypothesis.json` before writing any code.

Defaults to writing an **Examples story** for the S2 variant. `$ARGUMENTS` can specify a
different target mode if needed (e.g. `mode=features` to write a Features story instead).

---

## Step 1 — Read the design observation

Read `./tmp/ai/design-observation.json`. This is the authoritative source of truth about the
design. All implementation decisions are anchored here.

---

## Step 2 — Identify the target story file and assess feasibility

Determine the RSC component from `chartFamily` (e.g. `line` → `Line`, `bar` → `Bar`).

**Default (Examples mode):**
`packages/react-spectrum-charts-s2/src/stories/<Component>/<Component>Examples.story.tsx`

Read the existing story file to understand the current story order and grouping before inserting.

For component API and available props, read:
- `packages/docs/docs/api/`
- `packages/docs/docs/spectrum2/`

Do not rely on the MCP server for RSC-specific documentation.

**Feasibility check — do this before writing any code.**

For each design feature identified in `design-observation.json` (axes, colors, labels,
annotations, legend, title, etc.), explicitly determine whether RSC supports it:

1. Read the relevant docs page(s) for the component.
2. If a feature is not covered by the docs, grep the S2 types for the relevant prop:
   `packages/vega-spec-builder-s2/src/types/` and `packages/react-spectrum-charts-s2/src/types/`
3. If still uncertain, grep the spec builder source for the feature.

For each feature, record one of:
- **supported** — an RSC prop or child component directly expresses it
- **partial** — RSC has something close but it won't match exactly (note the gap)
- **unsupported** — no RSC prop, type, or story covers this; it is a library gap

**Do not include unsupported features in the story.** Add them directly to
`explicitlyNotCaptured` in the hypothesis instead of attempting them and letting
`verify-chart-story` discover the gap.

**Decompose compound problems before classifying.** A design feature that cannot be matched
exactly may still have sub-properties that are independently controllable. Always assess each
dimension separately:

- **Tick count vs tick values**: if the design shows N gridlines and the tick values cannot
  match (e.g. non-linear scale), that does not mean the count cannot match. Always check
  `tickCountLimit` on `Axis` as a first-class option. Set `tickCountLimit={N-1}` (excluding
  the baseline) to approximate the visual density even when exact values differ. Classify
  "tick count" and "tick values" as separate feasibility items.

- **Axis position vs axis formatting**: the side an axis appears on is independent of its
  label format. Assess each separately.

- **Title text vs title style**: title text is always supported; font size (`fontSize` prop on
  `Title`) may differ from the design default. Always read `titleFontSize` from
  `design-observation.json` and apply it explicitly — do not rely on the RSC default.

---

## Step 3 — Write `implementation-hypothesis.json`

Before writing any code, record what you intend to capture and what is uncertain.
This becomes the checklist that `verify-chart-story` validates against.

Write `./tmp/ai/implementation-hypothesis.json`:

```json
{
  "storyExportName": "MyStoryName",
  "storyFilePath": "packages/react-spectrum-charts-s2/src/stories/Line/LineExamples.story.tsx",
  "chartOptions": {
    "metric": "value",
    "dimension": "datetime",
    "color": "seriesField",
    "scaleType": "linear",
    "title": "My Chart",
    "legend": { "position": "top" },
    "axes": [
      { "position": "left", "labelFormat": "percentage", "tickCount": 5 },
      { "position": "bottom", "ticks": true, "baseline": true }
    ]
  },
  "capturedElements": [
    "2 series lines",
    "legend top",
    "4 horizontal gridlines",
    "left axis with 5 ticks",
    "bottom axis with time labels",
    "title: 'My Chart'"
  ],
  "uncertainElements": [
    "tick values inferred — Y axis labels unreadable at reference image resolution",
    "curve interpolation assumed monotone — type unclear from image"
  ],
  "rscPropsUsed": ["color", "dimension", "metric", "scaleType", "Title", "Legend", "Axis (left)", "Axis (bottom)"],
  "explicitlyNotCaptured": [
    "custom font family — not available in RSC"
  ]
}
```

---

## Step 4 — Write the story

Add the new story to the target file following the existing pattern:

```tsx
const MyStoryNameStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Title text="Chart title" />
      <Legend position="top" />
      <Axis position="left" grid labelFormat="percentage" />
      <Axis position="bottom" title="X axis title" baseline ticks />
      <Line {...args} />
    </Chart>
  );
};

export const MyStoryName = bindWithProps(MyStoryNameStory);
MyStoryName.args = {
  color: 'seriesField',
  dimension: 'xField',
  metric: 'yField',
  scaleType: 'linear',
};
```

**Chart sizing:** Use `chartWidth` × `chartHeight` from `design-observation.json`. These are
computed by `analyze-chart-design` from `referencePlotBounds` (the Figma SVG gridline-derived
plot area) plus RSC axis/title overhead — not from the outer Figma frame or inner content group.
A numeric `width` bypasses ResizeObserver entirely — no hover-shrink, no layout reflow. Do not
use `minWidth`/`maxWidth`.

```ts
const defaultChartProps: ChartProps = {
  data: myData,
  width: chartWidth,
  height: chartHeight,
};
```

**Design compliance principle:** The chart dimensions from `design-observation.json` are
authoritative and must not be changed to fix layout issues. If at the correct dimensions the
library produces a different layout than the design (e.g. legend wraps to two rows, axis labels
clip, bar spacing differs), that is a **library gap** to classify in `verify-chart-story` —
not a story prop to tweak. Resizing the chart to make layout problems disappear masks real
non-compliance between the library and the S2 design spec.

Insert at a logical position relative to existing stories, not blindly at the end.

**Data realism.** Story data should resemble what a real analyst would export, not just the
minimum values needed to render the chart. Concretely:

- If the chart displays a derived metric (a percentage, a rate, a delta), include the
  underlying counts or raw values that a dataset would actually contain alongside it. A CTR
  chart row should have `clicks` and `impressions` fields, not just `ctrDelta: 9.8`.
- Use domain-plausible magnitudes. Ad-performance data has thousands of impressions, not
  single digits. Retention rates are 0–1, not 0–100.
- Aim for 5–15 rows total. Enough to look realistic; short enough to stay readable in the
  story file.
- Do not fabricate data that distorts the visualization (wrong relative bar lengths, wrong
  axis range). The chart must still visually match the reference.

The goal is that a developer reading the story understands both what props to use *and* what
their data might look like in practice.

**Curve smoothness near the origin.** For diminishing-returns or power-law curves where the
axis starts at zero, check whether the first data point should be `(0, 0)`. If the Figma-derived
first point has a very small non-zero value (e.g. spend < 1% of axis max) AND the slope from
that first point to the second is much steeper than subsequent slopes, monotone cubic interpolation
will generate an S-curve bump at the start. Replace the first point with `(dimensionField: 0,
metricField: 0)` to give the interpolation a clean zero-crossing and eliminate the bump.

**Do not work around gaps by changing chart semantics** (e.g. converting linear → categorical
just to match specific tick labels). If the only path corrupts the data model, record it in
`uncertainElements` instead.

Report what story was written and which file it was inserted into before concluding.
