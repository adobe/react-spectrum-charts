# Verify and classify a chart story

Given a Storybook story ID in `$ARGUMENTS`, screenshots the story, compares it to the reference
image, and classifies all discrepancies anchored to the `ChartOptions`/`buildSpec` pipeline.

Reads:
- `./tmp/ai/reference.png` — the design reference image
- `./tmp/ai/design-observation.json` — chart design spec
- `./tmp/ai/implementation-hypothesis.json` — what the story claims to show

Writes:
- `./tmp/ai/result.png` — story screenshot
- `./tmp/ai/plot-bounds.json` — Vega plot area bounding box
- `./tmp/ai/verification-report.json`
- `./tmp/ai/gap-classification.json`

---

## Step 1 — Screenshot the story

Read `chartWidth` and `chartHeight` from `design-observation.json` and the port from
`./tmp/storybook-port.txt` (note: outside `./tmp/ai/` — that directory is wiped by the analyze
step), then screenshot:

```bash
STORYBOOK_PORT=$(cat ./tmp/storybook-port.txt)
node scripts/ai/playwright-screenshot.mjs <storyId> ./tmp/ai/result.png <chartWidth> <chartHeight> --port $STORYBOOK_PORT
```

The script attaches to the already-running Storybook server started in Phase 0, loads the story,
and captures the screenshot. It also writes:
- `./tmp/ai/plot-bounds.json` — the Vega plot area bounding box
- `./tmp/ai/result.svg` — the raw Vega `svg.marks` element HTML

After the screenshot, extract structural data from the result SVG:

```bash
node scripts/ai/extract-structure.mjs ./tmp/ai/result.svg
# reads result.svg (unchanged), writes result.structure.json alongside it
```

**If the screenshot fails** and the error suggests stale build output (e.g. component not rendering,
`TypeError: X is not a function`, missing props on types), run the following **once** as a recovery
step, then retry the screenshot:
```bash
yarn build:parallel && yarn build:s2
```
Do not run this preemptively or for unrelated failures (wrong story ID, timeout).

---

## Step 2 — Structural comparison

**Read `./tmp/ai/reference.structure.json` and `./tmp/ai/result.structure.json` in the same
response.** These are the extracted SVG structures for the reference design and the RSC render.

The two SVGs are produced by different tools (Figma vs Vega) so their schemas differ — do not
diff them mechanically. Instead, reason about what each element represents in context:

| What to look for | Reference field | Result field |
|---|---|---|
| **Title font size** | `shape-curved` text paths near top or explicit text nodes with large fontSize | same area in result — compare computed font size |
| **Axis label font size** | text nodes near axis positions | same in result |
| **Gridline count** | `line-horizontal` array length | `line-horizontal` array length |
| **Gridline y-positions** | `start[1]` of each `line-horizontal` entry | same |
| **Data line shape** | `line-open` path `start` and `end` y-coordinates at each x-tick | same — compare relative vertical positions |
| **Mark colors** | `strokes` and `fills` arrays | same |
| **Axis tick count** | `line-vertical` array length | same |

For the data line shape specifically: map the `line-open` path points to x-axis ticks using
x-coordinates, then compare the y-position (as a fraction of plot height) at each tick between
reference and result. A large fraction difference at a specific tick = data shape mismatch there.

State what you find for each row. This structural pass catches things the pixel comparison misses:
exact font sizes, exact gridline counts, and per-tick data shape fidelity.

---

## Step 3 — Direct visual comparison

**Read `./tmp/ai/reference.png` and `./tmp/ai/result.png` in the same response.**

Compare every visible property against the items listed in `implementation-hypothesis.json`.
Use the structural findings from Step 2 to anchor your observations — if the structure says
title font-size differs, confirm it visually here.

| Property | What to check |
|---|---|
| **Title** | Present? Text matches? Font size — use structural finding from Step 2 |
| **Title-to-chart spacing** | Gap between the bottom of the title text and the top of the plot/axis area — measure visually in pixels and compare |
| **Internal chart spacing** | Left margin (axis labels to plot edge), right margin, top padding above the first gridline, bottom padding below the x-axis — compare all four sides |
| **Legend position** | Top / bottom / left / right? Labels visible, not truncated? |
| **Axis label values** | Tick values match exactly? |
| **Axis tick spacing** | Tick intervals match? |
| **X-axis baseline/ticks** | Present? Match reference? |
| **Grid lines** | Count and orientation match? Use structural count from Step 2 |
| **Series count** | Same number of lines/bars/etc.? |
| **Curve shapes** | Do peaks and valleys align at the same x-axis ticks? Use per-tick structural comparison from Step 2. **If the shape still doesn't match after the first retryable fix attempt, classify as a library/interpolation gap rather than continuing to tweak data.** |
| **Curve smoothness** | Is there a visible S-curve bump or inflection near the start of a diminishing-returns curve? This is a monotone interpolation artifact caused by a sharp slope change at the first data point. Check if the first point should be anchored to `(0, 0)` — Category 1 if so. If the bump is at an interior point, classify as Category 3. |
| **Colors** | Accepted gap — S2 defaults vs design brand colors always differ. |
| **Chart dimensions** | Overall aspect ratio match? |

**For every item in `capturedElements` and `explicitlyNotCaptured` from the hypothesis, explicitly
state what you observe before drawing any conclusion.**

State differences in plain language. The pixel diff below is a quantitative confirmation, not a
substitute for direct observation.

---

## Step 3 — Pixel diff

Read `referencePlotBounds` from `design-observation.json` for `--crop-a`.
If `referencePlotBounds` is `null` (e.g. local PNG source with no SVG), skip cropping and
diff the full images instead.

Read `./tmp/ai/plot-bounds.json` for `--crop-b`.

```bash
node scripts/ai/diff-images.mjs \
  ./tmp/ai/reference.png \
  ./tmp/ai/result.png \
  --crop-a <referencePlotBounds.x>,<referencePlotBounds.y>,<referencePlotBounds.width>,<referencePlotBounds.height> \
  --crop-b <plotBounds.x>,<plotBounds.y>,<plotBounds.width>,<plotBounds.height> \
  --out ./tmp/ai/diff.png
```

**Read `./tmp/ai/a-prepared.png`, `./tmp/ai/b-prepared.png`, and `./tmp/ai/diff.png` in the
same response.** Explicitly state: "I read all three prepared/diff PNGs directly."

Diff interpretation:
- **Red only along curve lines** = color palette difference (acceptable)
- **Displaced red blobs** = curve shape or position mismatch (investigate)
- **Thin horizontal red band** = gridline y-position offset (minor, usually acceptable)
- **Scattered red across the plot** = curve shapes don't match (investigate data or interpolation)

---

## Step 4 — Classify discrepancies anchored to `ChartOptions`/`buildSpec`

**Before classifying any discrepancy, read `explicitlyNotCaptured` from
`./tmp/ai/implementation-hypothesis.json`.** If a discrepancy matches an item already listed
there, it was pre-determined to be unsupported during story generation — do not re-classify it
as Category 1 or attempt a retry. Mark it `retryable: false` and carry forward the category
and reasoning from the hypothesis. Skip the pipeline below for those items.

For every other discrepancy from Steps 2–3:

**Design compliance:** The chart dimensions in `design-observation.json` are authoritative.
Layout discrepancies at the correct dimensions (legend wraps, axis labels clip, bar spacing
differs) are **library gaps** — classify them as Category 2 or 3, not Category 1. Do not
suggest increasing chart size as a retryable fix. The goal is to surface where the library
diverges from the S2 design spec, not to resize around it.

**Locate where in the pipeline the issue lives:**
1. Is it a story/data configuration issue, or a prop that exists in `ChartOptions` but is set
   incorrectly in the story (wrong field name, missing prop, wrong value)? → **Category 1**
   Note: changing chart `width`/`height` is never a Category 1 fix.
2. Could a new optional field on `ChartOptions` express this without touching `addData`,
   `addSignals`, `setScales`, or `add<Mark>Marks`? → **Category 2**
3. Would it require changing spec builder internals (`buildSpec()`, `addData`, transforms,
   signals, mark encodings)? → **Category 3**
4. Would it require Vega capabilities not wired into the pipeline, or fundamental changes to
   the chart model (e.g. new mark type, new data flow)? → **Category 4**
5. Can't determine from visual evidence alone — too ambiguous or insufficient detail? → **Category 5**

**Category reference:**
| # | Label | Retryable |
|---|---|---|
| 1 | Supported directly by RSC | Yes — story/data fix |
| 2 | Supported by Vega, could be added to RSC | No — new feature work |
| 3 | Unsupported without core library changes | No — spec builder work |
| 4 | Moonshot / outside current architecture | No |
| 5 | Too ambiguous / requires human analysis | No |

**Do not work around gaps by changing chart semantics.** If matching the reference would require
corrupting the data model (e.g. converting a linear scale to categorical), classify it as a
gap instead.

---

## Step 5 — Write `verification-report.json`

Write `./tmp/ai/verification-report.json`:

```json
{
  "iteration": 1,
  "storyId": "react-spectrum-charts-2-line-examples--my-story-name",
  "directComparison": {
    "overallMatch": "good | partial | poor",
    "checklist": {
      "title": { "match": true, "notes": "" },
      "legendPosition": { "match": true, "notes": "" },
      "axisLabelValues": { "match": false, "notes": "Y axis shows 0–100 but reference shows 0–4" },
      "axisTickSpacing": { "match": true, "notes": "" },
      "baselineAndTicks": { "match": true, "notes": "" },
      "gridlineCount": { "match": true, "notes": "" },
      "seriesCount": { "match": true, "notes": "" },
      "curveShapes": { "match": true, "notes": "" },
      "chartDimensions": { "match": true, "notes": "" }
    }
  },
  "pixelDiffInterpretation": "red along curves = palette gap only; no displaced blobs"
}
```

---

## Step 6 — Write `gap-classification.json`

Write `./tmp/ai/gap-classification.json`:

```json
{
  "iteration": 1,
  "discrepancies": [
    {
      "label": "Y axis scale",
      "description": "Reference shows 0–4, story renders 0–100",
      "category": 1,
      "categoryLabel": "Supported directly by RSC",
      "retryable": true,
      "evidence": "Y axis tick labels clearly show 0–4 in reference PNG",
      "suggestedAction": "Update story data to use 0–4 value range"
    },
    {
      "label": "Custom gridline color",
      "description": "Reference uses lighter gray for gridlines than S2 default",
      "category": 2,
      "categoryLabel": "Supported by Vega, could be added to RSC",
      "retryable": false,
      "evidence": "gridline color #E5E5E5 in reference vs S2 token in RSC",
      "suggestedAction": "Add gridlineColor prop to AxisOptions"
    }
  ],
  "retryableCount": 1,
  "nonRetryableCount": 1,
  "summary": "1 story fix needed; 1 feature gap (new prop)"
}
```

Report the final discrepancy count and retryable count before concluding.
