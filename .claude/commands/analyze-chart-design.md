# Analyze a chart design

Given a reference image in `$ARGUMENTS`, analyzes it visually and structurally and writes
`design-observation.json` — the stable contract that `generate-chart-story` and
`verify-chart-story` read as their source of truth.

`$ARGUMENTS` is one of:
- A Figma node URL (`https://www.figma.com/design/...?node-id=...`) — fetched via MCP
- A local file path to an existing PNG (`./path/to/reference.png`) — used directly

---

## Step 0 — Teardown and setup

Clear any stale artifacts from a previous run, then create a fresh workspace:

```bash
rm -rf ./tmp/ai && mkdir -p ./tmp/ai
```

---

## Step 1 — Acquire the reference image

### If input is a Figma URL

Extract `fileKey` and `nodeId` from the URL.
- URL format: `https://www.figma.com/design/<fileKey>/...?node-id=<nodeId>`
- `nodeId` in URLs uses `-` separator (e.g. `4615-29429`); the MCP accepts either form.

**Always use scale=1.** Scaling up introduces resampling artifacts that inflate diff scores.

Use `mcp__figma__get_figma_image` twice in parallel (do not use WebFetch — Figma S3 URLs time out):

```
nodeId, format=png, scale=1  → curl the returned URL → ./tmp/ai/reference.png
nodeId, format=svg, scale=1  → curl the returned URL → ./tmp/ai/reference.svg
```

Save each with: `curl --max-time 15 "<url>" -o ./tmp/ai/<filename>`

Then extract structure from the SVG:
```bash
node scripts/ai/extract-structure.mjs ./tmp/ai/reference.svg
```
This writes `./tmp/ai/reference.structure.json`.

**Before computing `chartWidth`/`chartHeight` below, derive `referencePlotBounds` from
`reference.structure.json` using the gridline method in the "Derive plot area bounds" section
below.** The sizing calculation depends on `referencePlotBounds.width` and
`referencePlotBounds.height`, so it must be done first.

Also fetch Figma node metadata: `mcp__figma__get_figma_node` with the fileKey and nodeId.
Extract:
- **Frame name** → derive the story export name (PascalCase, no spaces)
- **Frame dimensions** → top-level node's `width` × `height` → `frameWidth`, `frameHeight`
- **RSC Chart target dimensions** — determine which dimensions to pass to the RSC `Chart`
  component using this heuristic:

  **If the node is a padded card** (has explicit non-zero padding on all sides AND its direct
  children include both a title group and a chart content group as siblings):

  **Important:** Do NOT use the content group dimensions directly. In Figma padded cards the
  Y-axis labels/title live in the card's left padding and the X-axis lives in the bottom
  padding — outside the content group. RSC allocates those same elements inside its `width`
  and `height` budget. Using content group dimensions gives RSC less space than needed.

  Instead, use `referencePlotBounds` (derived from SVG gridlines below) as the anchor, then
  add RSC axis/title overhead:

  ```
  chartWidth  = referencePlotBounds.width  + left_axis_overhead + right_margin_overhead
  chartHeight = referencePlotBounds.height + title_overhead     + bottom_axis_overhead
  ```

  **RSC overhead estimates — use these defaults unless the chart structure suggests otherwise:**

  | Component | Default estimate | When to adjust |
  |---|---|---|
  | Left Y-axis (labels + rotated title) | 80px | 65px for short labels (0–100); 90px for wide labels ("$300M") |
  | Right margin | 20px | 30px if there is a right-side axis |
  | Vega title overhead | 40px | 0px if no Title component |
  | Bottom X-axis (labels + title) | 60px | 50px if no axis title; 70px if axis title is long |

  Record `frameWidth`/`frameHeight` from the outer node for reference only.

  **Rationale:** `referencePlotBounds` is derived from the precise pixel positions of horizontal
  gridlines in the Figma SVG — it is the most reliable measurement of the actual marks area.
  RSC includes axis and title overhead in its `width`/`height` budget, so those must be added
  back on top of the Figma marks area.

  **If the node contains only marks and axes (no title/legend siblings, no card padding)** →
  this is a bare chart area. Look up the nearest ancestor frame that has title/legend siblings
  and apply the padded-card rule there, or use the node's own dimensions if no such ancestor
  exists.

  **If the node has no explicit padding or `referencePlotBounds` cannot be computed** →
  fall back to `frameWidth × frameHeight` and add an ambiguity note.

  Record the chosen dimensions as `chartWidth` and `chartHeight` in the observation.

- **Title text node** → find the TEXT node for the chart title; record its `fontSize`,
  `fontWeight`, and `fontFamily`. This is required — `generate-chart-story` uses `titleFontSize`
  to set the correct `fontSize` prop on the `Title` component.

#### Derive plot area bounds from the SVG structure

Read `reference.structure.json` and derive plot area bounds from `line-horizontal` gridline
coordinates. These are used by `verify-chart-story` for pixel diff cropping:

```
plotX = x-coordinate of line-horizontal start points (left edge of plot)
plotY = y-coordinate of the topmost line-horizontal gridline
plotW = x-coordinate of line-horizontal end points - plotX
plotH = y-coordinate of bottommost line-horizontal gridline - plotY
```

Coordinates are in the `reference.png` frame's coordinate space (scale=1, so 1:1 with SVG).

#### Derive data values from the SVG line path

If `reference.structure.json` contains a `line-open` path (the data line), convert its
path-point y-coordinates to data values using the axis gridline positions as a ruler:

```
For each path point y-coordinate:
  dataValue = axisMin + (axisMaxY - pointY) / (axisMaxY - axisMinY) * (axisMax - axisMin)
```

Where:
- `axisMinY` = y-coordinate of the bottom gridline (baseline, value = 0 or axis minimum)
- `axisMaxY` = y-coordinate of the top gridline (value = axis maximum)
- `axisMin` / `axisMax` = the corresponding data values from axis tick labels

Map each path x-coordinate to a date/category using the x-axis tick positions.
Record the resulting data series in `dataPoints` in `design-observation.json`. This replaces
the qualitative `dataShapeHypothesis` for charts where SVG path data is available.

**Important:** If the axis gridline pixel-spacing does not correspond to the value-spacing
(i.e. the scale is non-linear in the Figma design), note this explicitly and use the
closest linear interpolation. Do not silently invent data — flag non-linear scale as an ambiguity.

### If input is a local file path

Copy the file to `./tmp/ai/reference.png`. Note that SVG structure is not available — set
`referencePlotBounds` to `null` in the observation and record it as an ambiguity.
Frame/chart dimensions come from the image dimensions; story export name must be inferred from
context or left as a placeholder.

---

## Step 2 — Analyze the design visually

Read `./tmp/ai/reference.png` visually.
If available, read `./tmp/ai/reference.structure.json` for structural data.

Determine from the image:
- **Chart type** — line, bar, donut, area, scatter, combo, etc.
- **Series** — count, colors
- **Axes** — positions, labels, tick count, tick values
- **Legend** — position, labels
- **Grid** — horizontal gridline count
- **Title** — present or absent; read text from the image visually
- **Annotations** — direct labels, endpoint markers, reference lines, etc.
- **Data shape** — infer approximate values from path positions relative to axis bounds

---

## Step 3 — Write `design-observation.json`

Write `./tmp/ai/design-observation.json`:

```json
{
  "sourceType": "figma | local",
  "chartFamily": "line | bar | donut | area | scatter | combo | ...",
  "seriesCount": 2,
  "seriesColors": ["#hex1", "#hex2"],
  "titleText": "Chart title or null",
  "legendPosition": "top | bottom | left | right | none",
  "axes": [
    {
      "position": "left | right | bottom | top",
      "label": "...",
      "tickCount": 5,
      "tickValues": [0, 25, 50, 75, 100]
    }
  ],
  "gridlineCount": 4,
  "hasBaseline": true,
  "hasTicks": true,
  "directLabels": false,
  "endpointMarkers": false,
  "frameWidth": 600,
  "frameHeight": 400,
  "chartWidth": 560,
  "chartHeight": 360,
  "referencePlotBounds": { "x": 40, "y": 10, "width": 520, "height": 300 },
  "storyExportName": "MyStoryName",
  "dataShapeHypothesis": "two series, values 0–100, ~6 data points each",
  "ambiguities": [
    "tick values inferred — axis labels unreadable at this resolution",
    "interpolation type unknown"
  ],
  "confidence": "high | medium | low"
}
```

This file is the stable contract all downstream skills read. Report a summary of what you
found before concluding.
