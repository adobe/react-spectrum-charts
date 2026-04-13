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

Also fetch Figma node metadata: `mcp__figma__get_figma_node` with the fileKey and nodeId.
Extract:
- **Frame name** → derive the story export name (PascalCase, no spaces)
- **Frame dimensions** → top-level node's `width` × `height` → `frameWidth`, `frameHeight`
- **RSC Chart target dimensions** — determine which dimensions to pass to the RSC `Chart`
  component using this heuristic:

  **If the node's direct children include a title text node, a legend instance, and a marks/chart
  area as siblings** → the node itself IS the card. Use `frameWidth` × `frameHeight` directly.
  The RSC `Chart` component renders title, legend, axes, and marks all within its given size,
  so the outer frame maps 1:1.

  **If the node contains only marks and axes (no title/legend siblings)** → this is an inner
  content area. Look up the nearest ancestor frame that has title/legend siblings and use its
  dimensions instead.

  Record the chosen dimensions as `chartWidth` and `chartHeight` in the observation. Do not
  subtract padding to derive inner content dimensions — that produces the wrong target size.

- **Title text node** → find the TEXT node for the chart title; fetch its text style:
  `fontSize`, `fontWeight`, `fontFamily`.

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
