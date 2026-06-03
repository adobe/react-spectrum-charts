# react-spectrum-charts: Spike

Use this command to explore and prototype a chart feature before committing to a full implementation.
Given a spike description (Jira ticket URL/key, or plain text in `$ARGUMENTS`), it researches the
codebase, proposes approaches, then produces either a Vega spec (preferred, for Vega editor prototyping)
or a Storybook story under the `/spikes` directory.

**Arguments:** `$ARGUMENTS` — a Jira ticket URL/key (e.g. `RSC-1234` or `https://...`) OR a plain
text description of the feature to spike.

---

## Phase 1: Intake

Parse `$ARGUMENTS`:

- **Jira URL or key** (matches `RSC-\d+` or starts with `https://...jira...`): ask the user to paste
  the ticket description and acceptance criteria. Claude Code cannot authenticate to Jira without an
  MCP integration — do not attempt a web fetch.
- **Plain text**: treat as the full spike description. Read it carefully and confirm your understanding
  in one sentence before continuing.

Extract from the description:
- The specific visual behavior or interaction being explored
- Any constraints mentioned (data shape, mark type, performance, accessibility)
- Success criteria — what does "done" look like for this spike?

---

## Phase 2: Research

Run these steps in parallel where possible.

### 2a: Read architecture context
Read `.claude/architecture.md` to load the render cycle, signal system, data pipeline, and scale
conventions into context. This is required before proposing any Vega spec approach.

### 2b: Read relevant implementation skills
Read whichever of these skill files are relevant to the spike domain:
- `.claude/commands/implement-new-chart-mark.md` — if the spike involves a new mark type
- `.claude/commands/implement-new-prop.md` — if it's a new option on an existing mark
- `.claude/commands/implement-new-child-component.md` — if it's a new nested component
- `.claude/commands/implement-bug-fix.md` — if it involves fixing or changing existing behavior

### 2c: Explore existing code
Spawn an **Explore** subagent. Ask it to:
- Find marks, utilities, or spec builder functions most related to the spike domain
- Identify any existing signals, scales, or data transforms that could be reused
- Note where in the pipeline the proposed behavior would need to hook in
- Report exact file paths and key function names — not summaries

### 2d: Check for prior spike artifacts
Search for existing spikes that might be related:
```
packages/react-spectrum-charts/src/stories/spikes/
packages/react-spectrum-charts-s2/src/stories/spikes/
tmp/spikes/
```
If any exist, read them to avoid duplicating work.

---

## Phase 3: Propose

Based on Phases 1–2, present **2–3 concrete implementation approaches**. For each:

- **Name** — short label (e.g. "Signal-driven highlight", "Data transform approach")
- **Summary** — 2–3 sentences: what it does and how it hooks into the pipeline
- **Key files** — which spec builder functions, utilities, or React components would change
- **Vega spec feasibility** — can this be fully prototyped as a standalone Vega spec? If yes, what
  marks, signals, and transforms would it use? If no, explain why (e.g. requires React integration,
  RSC data pipeline, or S2 tokens).
- **Tradeoffs** — complexity, reuse of existing patterns, risk

End the proposal with: **"Which approach would you like to pursue?"** and wait for the user's
response before proceeding to Phase 4.

---

## Phase 4: Execute

### 4a: Determine output type

**Prefer a Vega spec** when:
- The core behavior can be demonstrated with Vega primitives (marks, signals, transforms, scales)
- The spike does not depend on RSC's React prop system, S2 tokens, or childrenAdapter
- The goal is to validate a Vega-level approach before wiring up React

**Fall back to a Storybook story** when:
- The behavior requires RSC components, hooks, or React-level state
- S2-specific tokens or provider context are part of what's being tested
- The spike is about component API shape, not Vega spec correctness

---

### Output path A: Vega spec

Create `tmp/spikes/<kebab-case-name>.vg.json`.

Before writing the spec, re-read `.claude/architecture.md` if it has not already been loaded in this
session. The architecture doc defines the encoding conventions, signal system, scale naming, data
source contracts, and COMPONENT_NAME patterns that all RSC specs must follow. Any spec that
contradicts those conventions — even in a prototype — will mislead the full implementation.

The spec must be self-contained and openable in the Vega editor at `https://vega.github.io/editor`.
Structure it as:

```json
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "<spike name> — <one sentence>",
  "width": 500,
  "height": 300,
  "padding": 5,
  "data": [...],
  "signals": [...],
  "scales": [...],
  "axes": [...],
  "marks": [...]
}
```

**Always follow RSC styling and patterns.** Every generated spec must:

- Use the **full `config` block** from the reference examples verbatim — fonts, colors, axis styling,
  legend layout, mark defaults. Do not invent or simplify the config.
- Use the **standard signal set**: `chartBackgroundColor`, `referenceLineLabelBackgroundStroke`,
  `colors`, `lineTypes`, `opacities`, `hiddenSeries`, `controlledHighlightedItem`,
  `highlightedGroup`, `controlledHighlightedSeries`, `selectedItem`, `selectedSeries`,
  `selectedGroup`. Include all of them even if the spike only uses a subset — they are required
  for the spec to behave correctly in the RSC runtime.
- Use the **standard data pipeline**: `table` (with `identifier` + `rscSeriesId` formula transforms)
  → `filteredTable` (filters `hiddenSeries`) → any mark-specific derived sources.
- Name marks using the RSC convention: `<markType><index>` (e.g. `bar0`, `line0`) with a matching
  `_background` rect for bar marks and a `_group`/`_facet` wrapper for line marks.
- Include `xBaseline` rule mark wherever a zero-line is appropriate.
- Set `"background": "transparent"` at the top level and use `{ "signal": "chartBackgroundColor" }`
  for any fill that should track the chart background — never hardcode `"white"` or `"#fff"`.
- Use `"interactive": false` on all decorative / non-data marks.
- Match axis configuration from the reference examples: `ticks: false`, `tickCount` signal for y,
  `clamp(ceil(height/100), 2, 10)` pattern, `domain: false`.

**Reference patterns** (from project example specs — see section below).

After writing the spec, output the full JSON in a code block so the user can paste it directly into
the Vega editor without opening the file.

---

### Output path B: Storybook story

**S1 spike:** `packages/react-spectrum-charts/src/stories/spikes/<SpikeName>.story.tsx`
**S2 spike:** `packages/react-spectrum-charts-s2/src/stories/spikes/<SpikeName>.story.tsx`

Use the `ChartUnsafeVega` component if the spike uses a raw Vega spec embedded in React. Otherwise
use the standard `Chart` + mark composition pattern.

Story structure:
```tsx
export default {
  title: 'Spikes/<SpikeName>',
  // no component — spikes are standalone explorations
};

const SpikeStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data: ..., width: 600 });
  return (
    <Chart {...chartProps}>
      {/* spike content */}
    </Chart>
  );
};

export const Default = bindWithProps(SpikeStory);
Default.args = { /* minimal args */ };
```

Include a comment block at the top of the story file:
```tsx
/**
 * SPIKE: <name>
 * Description: <what this explores>
 * Approach: <which option was chosen and why>
 * Next steps: <what a full implementation would require>
 */
```

---

## Phase 5: Summarize

After delivering the output, provide a short summary covering:

1. **What was built** — spec or story, file path
2. **Approach chosen** — which Phase 3 option and why
3. **Key Vega patterns used** — which signals, transforms, or mark types drove the prototype
4. **What a full implementation would require** — which layers of the pipeline (types, spec builder,
   adapter, React component) would need to change, and which existing implementation skill to follow

---

## Reference Vega Spec Patterns

Use these as the canonical style reference when generating new specs in Phase 4. Match their config,
signal names, data pipeline conventions, and encoding patterns exactly.

### Example 1: Vertical Bar Chart with Hover + Axis Label Interaction

Demonstrates:
- Standard RSC `config` block (fonts, colors, legend layout, range palettes)
- Data pipeline: `table` → `filteredTable` (stack transform) → `bar0_stacks` (aggregate for corner radius)
- Full signal set: `chartBackgroundColor`, `colors`, `lineTypes`, `opacities`, `hiddenSeries`,
  `controlledHighlightedItem`, `highlightedGroup`, `bar0_hoveredItem`, `hoveredAxisLabel`
- Bar mark hover opacity logic (item-level vs. controlled highlight)
- Interactive axis labels: hover changes fill/fontWeight, tooltip shows a structured object
- `cornerRadius` conditional: only the top bar in a stack gets rounded corners
- `bar0_background` rect uses `chartBackgroundColor` fill to create a gap between stacked segments

```json
{
    "width": 600,
    "height": 600,
    "config": {
        "axis": {
            "bandPosition": 0.5,
            "domain": false,
            "domainWidth": 1,
            "domainColor": "#292929",
            "gridColor": "#DADADA",
            "labelFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "labelFontSize": 14,
            "labelFontWeight": "normal",
            "labelPadding": 8,
            "labelOverlap": true,
            "labelColor": "#505050",
            "ticks": false,
            "tickColor": "#DADADA",
            "tickRound": true,
            "tickSize": 8,
            "tickCap": "round",
            "tickWidth": 1,
            "titleAnchor": "middle",
            "titleColor": "#505050",
            "titleFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "titleFontSize": 14,
            "titleFontWeight": "normal",
            "titlePadding": 16
        },
        "range": {
            "category": [
                "rgb(15, 181, 174)", "rgb(64, 70, 202)", "rgb(246, 133, 17)",
                "rgb(222, 61, 130)", "rgb(126, 132, 250)", "rgb(114, 224, 106)",
                "rgb(20, 122, 243)", "rgb(115, 38, 211)", "rgb(232, 198, 0)",
                "rgb(203, 93, 0)", "rgb(0, 143, 93)", "rgb(188, 233, 49)",
                "rgb(90, 169, 250)", "rgb(192, 56, 204)", "rgb(245, 107, 183)",
                "rgb(255, 226, 46)"
            ],
            "diverging": [
                "rgb(88, 0, 0)", "rgb(121, 38, 11)", "rgb(156, 69, 17)",
                "rgb(189, 101, 26)", "rgb(221, 134, 41)", "rgb(245, 173, 82)",
                "rgb(254, 214, 147)", "rgb(255, 255, 224)", "rgb(187, 228, 209)",
                "rgb(118, 199, 190)", "rgb(62, 168, 166)", "rgb(32, 130, 136)",
                "rgb(7, 103, 105)", "rgb(0, 73, 75)", "rgb(0, 44, 45)"
            ],
            "ordinal": [
                "rgb(15, 181, 174)", "rgb(64, 70, 202)", "rgb(246, 133, 17)",
                "rgb(222, 61, 130)", "rgb(126, 132, 250)", "rgb(114, 224, 106)",
                "rgb(20, 122, 243)", "rgb(115, 38, 211)", "rgb(232, 198, 0)",
                "rgb(203, 93, 0)", "rgb(0, 143, 93)", "rgb(188, 233, 49)",
                "rgb(90, 169, 250)", "rgb(192, 56, 204)", "rgb(245, 107, 183)",
                "rgb(255, 226, 46)"
            ],
            "ramp": [
                "rgb(253, 231, 37)", "rgb(210, 226, 27)", "rgb(165, 219, 54)",
                "rgb(122, 209, 81)", "rgb(84, 197, 104)", "rgb(53, 183, 121)",
                "rgb(34, 168, 132)", "rgb(31, 152, 139)", "rgb(35, 136, 142)",
                "rgb(42, 120, 142)", "rgb(49, 104, 142)", "rgb(57, 86, 140)",
                "rgb(65, 68, 135)", "rgb(71, 47, 125)", "rgb(72, 26, 108)",
                "rgb(68, 1, 84)"
            ]
        },
        "background": "transparent",
        "legend": {
            "columnPadding": 20,
            "labelColor": "#292929",
            "labelFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "labelFontSize": 14,
            "labelFontWeight": "normal",
            "labelLimit": 184,
            "layout": {
                "bottom": { "anchor": "middle", "direction": "horizontal", "center": true, "offset": 24, "bounds": "full", "margin": 48 },
                "top":    { "anchor": "middle", "direction": "horizontal", "center": true, "offset": 24, "bounds": "full", "margin": 48 },
                "left":   { "anchor": "middle", "direction": "vertical",   "center": false, "offset": 24, "bounds": "full", "margin": 24 },
                "right":  { "anchor": "middle", "direction": "vertical",   "center": false, "offset": 24, "bounds": "full", "margin": 24 }
            },
            "rowPadding": 8,
            "symbolSize": 250,
            "symbolType": "M -0.55 -1 h 1.1 a 0.45 0.45 0 0 1 0.45 0.45 v 1.1 a 0.45 0.45 0 0 1 -0.45 0.45 h -1.1 a 0.45 0.45 0 0 1 -0.45 -0.45 v -1.1 a 0.45 0.45 0 0 1 0.45 -0.45 z",
            "symbolStrokeColor": "#505050",
            "titleColor": "#292929",
            "titleFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "titleFontSize": 14,
            "titlePadding": 8
        },
        "arc":    { "fill": "#5424DB" },
        "area":   { "fill": "#5424DB", "opacity": 0.8 },
        "line":   { "strokeWidth": 2.5, "stroke": "#5424DB" },
        "path":   { "stroke": "#5424DB" },
        "rect":   { "strokeWidth": 0, "stroke": "#ACCFFD", "fill": "#5424DB" },
        "rule":   { "stroke": "#292929", "strokeWidth": 1 },
        "shape":  { "stroke": "#5424DB" },
        "symbol": { "strokeWidth": 2, "size": 100, "fill": "#5424DB" },
        "text": {
            "fill": "#292929",
            "font": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "fontSize": 14
        },
        "title": {
            "offset": 10,
            "font": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "fontSize": 22,
            "color": "#292929",
            "anchor": "start",
            "frame": "group"
        },
        "autosize": { "type": "fit", "contains": "padding", "resize": true }
    },
    "usermeta": {
        "chartOrientation": "vertical",
        "interactiveMarks": ["bar0"]
    },
    "data": [
        {
            "name": "table",
            "values": [
                { "browser": "Chrome",   "downloads": 27000, "percentLabel": "53.1%", "rscMarkId": 1 },
                { "browser": "Firefox",  "downloads": 8000,  "percentLabel": "15.7%", "rscMarkId": 2 },
                { "browser": "Safari",   "downloads": 7750,  "percentLabel": "15.2%", "rscMarkId": 3 },
                { "browser": "Edge",     "downloads": 7600,  "percentLabel": "14.9%", "rscMarkId": 4 },
                { "browser": "Explorer", "downloads": 500,   "percentLabel": "1.0%",  "rscMarkId": 5 }
            ],
            "transform": [
                { "type": "identifier", "as": "rscMarkId" }
            ]
        },
        {
            "name": "filteredTable",
            "source": "table",
            "transform": [
                {
                    "type": "stack",
                    "groupby": ["browser"],
                    "field": "downloads",
                    "as": ["downloads0", "downloads1"]
                },
                { "type": "formula", "as": "rscStackId", "expr": "datum.browser" }
            ]
        },
        {
            "name": "controlledHighlightedTable",
            "source": "filteredTable",
            "transform": [
                {
                    "type": "filter",
                    "expr": "isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1"
                }
            ]
        },
        {
            "name": "bar0_stacks",
            "source": "filteredTable",
            "transform": [
                {
                    "type": "aggregate",
                    "groupby": ["browser"],
                    "fields": ["downloads1", "downloads1"],
                    "ops": ["min", "max"]
                },
                { "type": "formula", "as": "rscStackId", "expr": "datum.browser" }
            ]
        }
    ],
    "background": "transparent",
    "signals": [
        { "name": "chartBackgroundColor", "value": "white" },
        { "name": "referenceLineLabelBackgroundStroke", "value": "white" },
        {
            "name": "colors",
            "value": [
                ["#5424DB"], ["#D92361"], ["#E86A00"], ["#5D89FF"], ["#9A47E2"],
                ["#F24CB8"], ["#0BA286"], ["#9C28AF"], ["#036E45"], ["#52A119"],
                ["#FF513D"], ["#046691"], ["#424242"], ["#056B74"], ["#C67E58"],
                ["#865500"], ["#274DEA"], ["#056C5C"], ["#FF94DB"], ["#811B0E"]
            ]
        },
        { "name": "lineTypes",  "value": [[[]], [[7, 4]], [[2, 3]], [[2, 3, 7, 4]], [[11, 4]], [[5, 2, 11, 2]]] },
        { "name": "opacities",  "value": [[1]] },
        { "name": "hiddenSeries",               "value": [] },
        { "name": "controlledHighlightedItem",  "value": null },
        { "name": "highlightedGroup",           "value": null },
        { "name": "controlledHighlightedSeries","value": null },
        { "name": "selectedItem",               "value": null },
        { "name": "selectedSeries",             "value": null },
        { "name": "selectedGroup",              "value": null },
        { "name": "paddingInner",               "value": 0.4 },
        {
            "description": "Tracks the hovered item for bar0",
            "name": "bar0_hoveredItem",
            "value": null,
            "on": [
                { "events": "@bar0:mouseover", "update": "datum" },
                { "events": "@bar0:mouseout",  "update": "null" }
            ]
        },
        {
            "description": "Tracks which axis label is currently hovered",
            "name": "hoveredAxisLabel",
            "value": null,
            "on": [
                { "events": "axis-label:mouseover", "update": "datum.value" },
                { "events": "axis-label:mouseout",  "update": "null" }
            ]
        }
    ],
    "scales": [
        {
            "name": "yLinear",
            "type": "linear",
            "range": "height",
            "domain": { "data": "filteredTable", "fields": ["downloads1"] },
            "nice": true,
            "zero": true
        },
        {
            "name": "xBand",
            "type": "band",
            "range": "width",
            "domain": { "data": "filteredTable", "fields": ["browser"] },
            "paddingInner": 0.4,
            "paddingOuter": 0.2
        }
    ],
    "marks": [
        {
            "name": "bar0_background",
            "description": "bar0_background",
            "type": "rect",
            "from": { "data": "filteredTable" },
            "interactive": false,
            "encode": {
                "enter": {
                    "y": [
                        { "test": "datum.downloads0 === 0", "signal": "scale('yLinear', datum.downloads0)" },
                        { "test": "datum.downloads1 > 0",  "signal": "max(scale('yLinear', datum.downloads0) - 1.5, scale('yLinear', datum.downloads1))" },
                        { "signal": "min(scale('yLinear', datum.downloads0) + 1.5, scale('yLinear', datum.downloads1))" }
                    ],
                    "y2": { "scale": "yLinear", "field": "downloads1" },
                    "cornerRadiusTopLeft":     [{ "test": "datum.downloads1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].max_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "cornerRadiusTopRight":    [{ "test": "datum.downloads1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].max_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "cornerRadiusBottomLeft":  [{ "test": "datum.downloads1 < 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].min_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "cornerRadiusBottomRight": [{ "test": "datum.downloads1 < 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].min_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "fill": { "signal": "chartBackgroundColor" }
                },
                "update": {
                    "x": { "scale": "xBand", "field": "browser" },
                    "width": { "scale": "xBand", "band": 1 }
                }
            }
        },
        {
            "name": "bar0",
            "description": "bar0",
            "type": "rect",
            "from": { "data": "filteredTable" },
            "interactive": true,
            "encode": {
                "enter": {
                    "y": [
                        { "test": "datum.downloads0 === 0", "signal": "scale('yLinear', datum.downloads0)" },
                        { "test": "datum.downloads1 > 0",  "signal": "max(scale('yLinear', datum.downloads0) - 1.5, scale('yLinear', datum.downloads1))" },
                        { "signal": "min(scale('yLinear', datum.downloads0) + 1.5, scale('yLinear', datum.downloads1))" }
                    ],
                    "y2": { "scale": "yLinear", "field": "downloads1" },
                    "cornerRadiusTopLeft":     [{ "test": "datum.downloads1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].max_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "cornerRadiusTopRight":    [{ "test": "datum.downloads1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].max_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "cornerRadiusBottomLeft":  [{ "test": "datum.downloads1 < 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].min_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "cornerRadiusBottomRight": [{ "test": "datum.downloads1 < 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), 'rscStackId'), datum.rscStackId)].min_downloads1 === datum.downloads1", "value": 4 }, { "value": 0 }],
                    "fill": { "value": "#5424DB" },
                    "fillOpacity": { "value": 1 }
                },
                "update": {
                    "x": { "scale": "xBand", "field": "browser" },
                    "width": { "scale": "xBand", "band": 1 },
                    "cursor": { "value": "pointer" },
                    "opacity": [
                        { "test": "isValid(bar0_hoveredItem)", "signal": "bar0_hoveredItem.rscMarkId === datum.rscMarkId ? 1 : 0.2" },
                        { "test": "isArray(controlledHighlightedItem) && length(controlledHighlightedItem) > 0 && indexof(controlledHighlightedItem, datum.rscMarkId) === -1", "value": 0.2 },
                        { "value": 1 }
                    ],
                    "stroke": [{ "value": "#5424DB" }],
                    "strokeDash": [{ "value": [] }],
                    "strokeWidth": [{ "value": 0 }]
                }
            }
        },
        {
            "name": "xBaseline",
            "description": "xBaseline",
            "type": "rule",
            "interactive": false,
            "encode": {
                "update": {
                    "x": { "value": 0 },
                    "x2": { "signal": "width" },
                    "y": { "scale": "yLinear", "value": 0 }
                }
            }
        }
    ],
    "axes": [
        {
            "scale": "xBand",
            "orient": "bottom",
            "grid": false,
            "ticks": false,
            "title": "Browser",
            "labelAngle": 0,
            "labelFontWeight": "normal",
            "labels": true,
            "labelAlign": "center",
            "labelBaseline": "top",
            "encode": {
                "labels": {
                    "interactive": true,
                    "update": {
                        "text": [{ "signal": "datum.value" }],
                        "fill": [
                            { "test": "datum.value === hoveredAxisLabel", "value": "#5424DB" },
                            { "value": "#505050" }
                        ],
                        "fontWeight": [
                            { "test": "datum.value === hoveredAxisLabel", "value": "bold" },
                            { "value": "normal" }
                        ],
                        "cursor": { "value": "pointer" },
                        "tooltip": {
                            "signal": "{'Browser': datum.value, 'Downloads': data('filteredTable')[indexof(pluck(data('filteredTable'), 'browser'), datum.value)].downloads}"
                        }
                    }
                }
            }
        },
        {
            "scale": "yLinear",
            "orient": "left",
            "grid": true,
            "ticks": false,
            "tickCount": { "signal": "clamp(ceil(height/100), 2, 10)" },
            "title": "Downloads",
            "labelAngle": 0,
            "labelFontWeight": "normal",
            "labels": true,
            "labelAlign": "right",
            "labelBaseline": "middle",
            "encode": {
                "labels": {
                    "interactive": false,
                    "update": {
                        "text": [{ "signal": "datum.value" }]
                    }
                }
            },
            "domain": false,
            "domainWidth": 2
        }
    ]
}
```

---

### Example 2: Multi-Series Line Chart with Time Axis

Demonstrates:
- Time-scale x-axis (`xTime`, type `"time"`) using `datetime0` output of the `timeunit` transform
- Data pipeline: `table` (identifier → toDate formula → timeunit → rscSeriesId formula) → `filteredTable` (filters `hiddenSeries` for legend toggling)
- Multi-series line via `group` + `facet` by `series`: `line0_group` → `line0_facet` → `line0`
- `color` ordinal scale maps `series` field to color range
- Dual x-axes: primary labels day numbers (`format: "%-d"`), secondary axis offsets month labels 28px below with `dy`
- Y-axis label uses conditional format signal: `format(datum['value'], ',.2f')` for numbers, raw value otherwise
- No interactive marks (`"interactiveMarks": []`) — line hover uses voronoi overlay (not shown here)
- `rscSeriesId` formula set to `datum.series` — always mirror this pattern for series identity

```json
{
    "width": 500,
    "height": 300,
    "config": {
        "axis": {
            "bandPosition": 0.5,
            "domain": false,
            "domainWidth": 1,
            "domainColor": "#292929",
            "gridColor": "#DADADA",
            "labelFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "labelFontSize": 14,
            "labelFontWeight": "normal",
            "labelPadding": 8,
            "labelOverlap": true,
            "labelColor": "#505050",
            "ticks": false,
            "tickColor": "#DADADA",
            "tickRound": true,
            "tickSize": 8,
            "tickCap": "round",
            "tickWidth": 1,
            "titleAnchor": "middle",
            "titleColor": "#505050",
            "titleFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "titleFontSize": 14,
            "titleFontWeight": "normal",
            "titlePadding": 16
        },
        "range": {
            "category": [
                "rgb(15, 181, 174)", "rgb(64, 70, 202)", "rgb(246, 133, 17)",
                "rgb(222, 61, 130)", "rgb(126, 132, 250)", "rgb(114, 224, 106)",
                "rgb(20, 122, 243)", "rgb(115, 38, 211)", "rgb(232, 198, 0)",
                "rgb(203, 93, 0)", "rgb(0, 143, 93)", "rgb(188, 233, 49)",
                "rgb(90, 169, 250)", "rgb(192, 56, 204)", "rgb(245, 107, 183)",
                "rgb(255, 226, 46)"
            ],
            "diverging": [
                "rgb(88, 0, 0)", "rgb(121, 38, 11)", "rgb(156, 69, 17)",
                "rgb(189, 101, 26)", "rgb(221, 134, 41)", "rgb(245, 173, 82)",
                "rgb(254, 214, 147)", "rgb(255, 255, 224)", "rgb(187, 228, 209)",
                "rgb(118, 199, 190)", "rgb(62, 168, 166)", "rgb(32, 130, 136)",
                "rgb(7, 103, 105)", "rgb(0, 73, 75)", "rgb(0, 44, 45)"
            ],
            "ordinal": [
                "rgb(15, 181, 174)", "rgb(64, 70, 202)", "rgb(246, 133, 17)",
                "rgb(222, 61, 130)", "rgb(126, 132, 250)", "rgb(114, 224, 106)",
                "rgb(20, 122, 243)", "rgb(115, 38, 211)", "rgb(232, 198, 0)",
                "rgb(203, 93, 0)", "rgb(0, 143, 93)", "rgb(188, 233, 49)",
                "rgb(90, 169, 250)", "rgb(192, 56, 204)", "rgb(245, 107, 183)",
                "rgb(255, 226, 46)"
            ],
            "ramp": [
                "rgb(253, 231, 37)", "rgb(210, 226, 27)", "rgb(165, 219, 54)",
                "rgb(122, 209, 81)", "rgb(84, 197, 104)", "rgb(53, 183, 121)",
                "rgb(34, 168, 132)", "rgb(31, 152, 139)", "rgb(35, 136, 142)",
                "rgb(42, 120, 142)", "rgb(49, 104, 142)", "rgb(57, 86, 140)",
                "rgb(65, 68, 135)", "rgb(71, 47, 125)", "rgb(72, 26, 108)",
                "rgb(68, 1, 84)"
            ]
        },
        "background": "transparent",
        "legend": {
            "columnPadding": 20,
            "labelColor": "#292929",
            "labelFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "labelFontSize": 14,
            "labelFontWeight": "normal",
            "labelLimit": 184,
            "layout": {
                "bottom": { "anchor": "middle", "direction": "horizontal", "center": true, "offset": 24, "bounds": "full", "margin": 48 },
                "top":    { "anchor": "middle", "direction": "horizontal", "center": true, "offset": 24, "bounds": "full", "margin": 48 },
                "left":   { "anchor": "middle", "direction": "vertical",   "center": false, "offset": 24, "bounds": "full", "margin": 24 },
                "right":  { "anchor": "middle", "direction": "vertical",   "center": false, "offset": 24, "bounds": "full", "margin": 24 }
            },
            "rowPadding": 8,
            "symbolSize": 250,
            "symbolType": "M -0.55 -1 h 1.1 a 0.45 0.45 0 0 1 0.45 0.45 v 1.1 a 0.45 0.45 0 0 1 -0.45 0.45 h -1.1 a 0.45 0.45 0 0 1 -0.45 -0.45 v -1.1 a 0.45 0.45 0 0 1 0.45 -0.45 z",
            "symbolStrokeColor": "#505050",
            "titleColor": "#292929",
            "titleFont": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "titleFontSize": 14,
            "titlePadding": 8
        },
        "arc":    { "fill": "#5424DB" },
        "area":   { "fill": "#5424DB", "opacity": 0.8 },
        "line":   { "strokeWidth": 2.5, "stroke": "#5424DB" },
        "path":   { "stroke": "#5424DB" },
        "rect":   { "strokeWidth": 0, "stroke": "#ACCFFD", "fill": "#5424DB" },
        "rule":   { "stroke": "#292929", "strokeWidth": 1 },
        "shape":  { "stroke": "#5424DB" },
        "symbol": { "strokeWidth": 2, "size": 100, "fill": "#5424DB" },
        "text": {
            "fill": "#292929",
            "font": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "fontSize": 14
        },
        "title": {
            "offset": 10,
            "font": "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif",
            "fontSize": 22,
            "color": "#292929",
            "anchor": "start",
            "frame": "group"
        },
        "autosize": { "type": "fit", "contains": "padding", "resize": true }
    },
    "usermeta": {
        "interactiveMarks": []
    },
    "data": [
        {
            "name": "table",
            "values": [
                { "datetime": 1667890800000, "value": 3738, "series": "Add Fallout",        "rscMarkId": 1,  "rscSeriesId": "Add Fallout" },
                { "datetime": 1667977200000, "value": 2704, "series": "Add Fallout",        "rscMarkId": 2,  "rscSeriesId": "Add Fallout" },
                { "datetime": 1668063600000, "value": 1730, "series": "Add Fallout",        "rscMarkId": 3,  "rscSeriesId": "Add Fallout" },
                { "datetime": 1668150000000, "value": 465,  "series": "Add Fallout",        "rscMarkId": 4,  "rscSeriesId": "Add Fallout" },
                { "datetime": 1668236400000, "value": 31,   "series": "Add Fallout",        "rscMarkId": 5,  "rscSeriesId": "Add Fallout" },
                { "datetime": 1668322800000, "value": 108,  "series": "Add Fallout",        "rscMarkId": 6,  "rscSeriesId": "Add Fallout" },
                { "datetime": 1668409200000, "value": 648,  "series": "Add Fallout",        "rscMarkId": 7,  "rscSeriesId": "Add Fallout" },
                { "datetime": 1667890800000, "value": 12208,"series": "Add Freeform table", "rscMarkId": 8,  "rscSeriesId": "Add Freeform table" },
                { "datetime": 1667977200000, "value": 11309,"series": "Add Freeform table", "rscMarkId": 9,  "rscSeriesId": "Add Freeform table" },
                { "datetime": 1668063600000, "value": 11099,"series": "Add Freeform table", "rscMarkId": 10, "rscSeriesId": "Add Freeform table" },
                { "datetime": 1668150000000, "value": 7243, "series": "Add Freeform table", "rscMarkId": 11, "rscSeriesId": "Add Freeform table" },
                { "datetime": 1668236400000, "value": 395,  "series": "Add Freeform table", "rscMarkId": 12, "rscSeriesId": "Add Freeform table" },
                { "datetime": 1668322800000, "value": 1606, "series": "Add Freeform table", "rscMarkId": 13, "rscSeriesId": "Add Freeform table" },
                { "datetime": 1668409200000, "value": 10932,"series": "Add Freeform table", "rscMarkId": 14, "rscSeriesId": "Add Freeform table" }
            ],
            "transform": [
                { "type": "identifier", "as": "rscMarkId" },
                { "type": "formula", "expr": "toDate(datum['datetime'])", "as": "datetime" },
                {
                    "type": "timeunit",
                    "field": "datetime",
                    "units": ["year", "month", "date", "hours", "minutes", "seconds"],
                    "as": ["datetime0", "datetime1"]
                },
                { "type": "formula", "as": "rscSeriesId", "expr": "datum.series" }
            ]
        },
        {
            "name": "filteredTable",
            "source": "table",
            "transform": [
                { "type": "filter", "expr": "indexof(hiddenSeries, datum.rscSeriesId) === -1" }
            ]
        },
        {
            "name": "controlledHighlightedTable",
            "source": "filteredTable",
            "transform": [
                {
                    "type": "filter",
                    "expr": "isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1"
                }
            ]
        }
    ],
    "background": "transparent",
    "signals": [
        { "name": "chartBackgroundColor",          "value": "white" },
        { "name": "referenceLineLabelBackgroundStroke", "value": "white" },
        {
            "name": "colors",
            "value": [
                ["#5424DB"], ["#D92361"], ["#E86A00"], ["#5D89FF"], ["#9A47E2"],
                ["#F24CB8"], ["#0BA286"], ["#9C28AF"], ["#036E45"], ["#52A119"],
                ["#FF513D"], ["#046691"], ["#424242"], ["#056B74"], ["#C67E58"],
                ["#865500"], ["#274DEA"], ["#056C5C"], ["#FF94DB"], ["#811B0E"]
            ]
        },
        { "name": "lineTypes",  "value": [[[]], [[7,4]], [[2,3]], [[2,3,7,4]], [[11,4]], [[5,2,11,2]]] },
        { "name": "opacities",  "value": [[1]] },
        { "name": "hiddenSeries",                "value": [] },
        { "name": "controlledHighlightedItem",   "value": null },
        { "name": "highlightedGroup",            "value": null },
        { "name": "controlledHighlightedSeries", "value": null },
        { "name": "selectedItem",                "value": null },
        { "name": "selectedSeries",              "value": null },
        { "name": "selectedGroup",               "value": null }
    ],
    "scales": [
        {
            "name": "color",
            "type": "ordinal",
            "range": [
                "#5424DB","#D92361","#E86A00","#5D89FF","#9A47E2","#F24CB8",
                "#0BA286","#9C28AF","#036E45","#52A119","#FF513D","#046691",
                "#424242","#056B74","#C67E58","#865500","#274DEA","#056C5C",
                "#FF94DB","#811B0E"
            ],
            "domain": { "data": "table", "fields": ["series"] }
        },
        {
            "name": "xTime",
            "type": "time",
            "range": "width",
            "domain": { "data": "filteredTable", "fields": ["datetime0"] },
            "padding": 0
        },
        {
            "name": "yLinear",
            "type": "linear",
            "range": "height",
            "domain": { "data": "filteredTable", "fields": ["value"] },
            "nice": true,
            "zero": true
        }
    ],
    "marks": [
        {
            "name": "line0_group",
            "type": "group",
            "from": {
                "facet": { "name": "line0_facet", "data": "filteredTable", "groupby": ["series"] }
            },
            "marks": [
                {
                    "name": "line0",
                    "description": "line0",
                    "type": "line",
                    "from": { "data": "line0_facet" },
                    "interactive": false,
                    "encode": {
                        "enter": {
                            "y": [{ "scale": "yLinear", "field": "value" }],
                            "stroke": { "scale": "color", "field": "series" },
                            "strokeDash": { "value": [] },
                            "strokeOpacity": { "value": 1 }
                        },
                        "update": {
                            "x": { "scale": "xTime", "field": "datetime0" },
                            "opacity": [{ "value": 1 }]
                        }
                    }
                }
            ]
        },
        {
            "name": "xBaseline",
            "description": "xBaseline",
            "type": "rule",
            "interactive": false,
            "encode": {
                "update": {
                    "x": { "value": 0 },
                    "x2": { "signal": "width" },
                    "y": { "scale": "yLinear", "value": 0 }
                }
            }
        }
    ],
    "axes": [
        {
            "scale": "xTime",
            "orient": "bottom",
            "grid": false,
            "ticks": true,
            "tickCount": "day",
            "formatType": "time",
            "format": "%-d",
            "labelAngle": 0,
            "labelSeparation": 12,
            "labelAlign": "center",
            "labelBaseline": "top"
        },
        {
            "scale": "xTime",
            "orient": "bottom",
            "format": "%b",
            "tickCount": "day",
            "formatType": "time",
            "labelOverlap": "greedy",
            "labelFontWeight": "normal",
            "labelAngle": 0,
            "labelAlign": "center",
            "labelBaseline": "top",
            "encode": {
                "labels": {
                    "interactive": false,
                    "enter": { "dy": { "value": 28 } },
                    "update": { "text": { "signal": "datum.value" } }
                }
            }
        },
        {
            "scale": "yLinear",
            "orient": "left",
            "grid": true,
            "ticks": false,
            "tickCount": { "signal": "clamp(ceil(height/100), 2, 10)" },
            "labelAngle": 0,
            "labelFontWeight": "normal",
            "labels": true,
            "labelAlign": "right",
            "labelBaseline": "middle",
            "encode": {
                "labels": {
                    "interactive": false,
                    "update": {
                        "text": [
                            { "test": "isNumber(datum['value'])", "signal": "format(datum['value'], ',.2f')" },
                            { "signal": "datum.value" }
                        ]
                    }
                }
            },
            "domain": false,
            "domainWidth": 2
        }
    ]
}
```
