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

Kill any stale Storybook process on port 6008 first:
```bash
lsof -ti:6008 | xargs kill -9 2>/dev/null
```

Ensure `playwright` and its Chromium browser are available before proceeding:
```bash
node -e "require('playwright')" 2>/dev/null || yarn add -DW playwright --ignore-engines
yarn playwright install chromium
```
`yarn playwright install chromium` is idempotent — it exits immediately if Chromium is already downloaded.

Read `chartWidth` and `chartHeight` from `design-observation.json`, then screenshot:
```bash
node scripts/ai/playwright-screenshot.mjs <storyId> ./tmp/ai/result.png <chartWidth> <chartHeight>
```

The script starts its own Storybook dev server on port 6008, takes the screenshot, and shuts down.
It also writes `./tmp/ai/plot-bounds.json` (the Vega plot area bounding box).

**If the screenshot fails** and the error suggests stale build output (e.g. component not rendering,
`TypeError: X is not a function`, missing props on types), run the following **once** as a recovery
step, then retry the screenshot:
```bash
yarn build:parallel && yarn build:s2
```
Do not run this preemptively or for unrelated failures (wrong story ID, timeout, Storybook startup error).

---

## Step 2 — Direct visual comparison

**Read `./tmp/ai/reference.png` and `./tmp/ai/result.png` in the same response.**

Compare every visible property against the items listed in `implementation-hypothesis.json`:

| Property | What to check |
|---|---|
| **Title** | Present? Text matches? Font size appropriate? |
| **Legend position** | Top / bottom / left / right? Labels visible, not truncated? |
| **Axis label values** | Tick values match exactly? |
| **Axis tick spacing** | Tick intervals match? |
| **X-axis baseline/ticks** | Present? Match reference? |
| **Grid lines** | Count and orientation match? |
| **Series count** | Same number of lines/bars/etc.? |
| **Curve shapes** | Do relative positions of all series match at multiple x-positions? |
| **Colors** | Accepted gap — S2 defaults vs design brand colors always differ. |
| **Chart dimensions** | Overall aspect ratio match? |

**For every item in `capturedElements` and `explicitlyNotCaptured` from the hypothesis, explicitly
state what you observe in each image before drawing any conclusion.** Do not infer a feature is
working from how the code is written — confirm it from the pixels. If an item in
`explicitlyNotCaptured` appears to work visually, re-examine carefully before reversing the
classification.

State differences in plain language. This is the primary assessment — the pixel diff below is
a quantitative confirmation, not a substitute for direct observation.

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
