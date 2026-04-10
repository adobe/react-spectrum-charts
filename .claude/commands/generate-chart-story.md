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
    "color": "series"
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
  "rscPropsUsed": ["color", "dimension", "metric"],
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

**Chart sizing:** Use `chartWidth` × `chartHeight` from `design-observation.json` (these are
the RSC `Chart` target dimensions determined during analysis — the full frame size when the
Figma node contains title/legend siblings). A numeric `width` bypasses ResizeObserver entirely
— no hover-shrink, no layout reflow. Do not use `minWidth`/`maxWidth`.

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

**Do not work around gaps by changing chart semantics** (e.g. converting linear → categorical
just to match specific tick labels). If the only path corrupts the data model, record it in
`uncertainElements` instead.

Report what story was written and which file it was inserted into before concluding.
