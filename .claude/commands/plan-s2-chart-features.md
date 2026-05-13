# Plan S2 Chart Features from Figma

Given a Figma URL pointing to an S2 chart guidelines/design page and a chart type name, this skill:
1. Enumerates all design sections on the page
2. For each section, extracts design intent + visually analyzes the chart(s)
3. Compares each observed design pattern against current S2 feature support for that chart type
4. Writes one planning markdown per distinct feature or design concept to `planning/S2/<chartSlug>/`

This skill does **not** generate or implement chart stories. It produces planning artifacts only.

**Invocation**: `/plan-s2-chart-features <figmaUrl> <ChartType>`

Examples:
- `/plan-s2-chart-features https://www.figma.com/design/abc123?node-id=1234-5678 Bar`
- `/plan-s2-chart-features https://www.figma.com/design/abc123?node-id=1234-5678 Line`

`<ChartType>` should be the PascalCase component name (e.g. `Bar`, `Line`, `Area`, `Scatter`). The skill derives `chartSlug` (lowercase) for paths.

---

## Step 0 — Setup

Parse the two arguments:
- `figmaUrl` — the full Figma URL
- `ChartType` — PascalCase chart name (e.g. `Bar`)
- `chartSlug` — lowercase version of ChartType (e.g. `bar`)

Extract from `figmaUrl`:
- `fileKey` — the segment after `/design/` in the URL
- `rootNodeId` — the `node-id` query parameter value (use `-` or `:` form, both accepted by MCP)

```bash
mkdir -p ./tmp/plan-s2-<chartSlug> && rm -f ./tmp/plan-s2-<chartSlug>/*
mkdir -p ./planning/S2/<chartSlug>
```

**Save URL metadata**: write `./tmp/plan-s2-<chartSlug>/session.json` immediately:
```json
{ "fileKey": "<fileKey>", "rootNodeId": "<rootNodeId>", "chartType": "<ChartType>", "chartSlug": "<chartSlug>", "url": "<full url>" }
```

---

## Rate Limiting — Read Before Calling Any Figma MCP Tool

All three Figma MCP calls used in this skill — `get_figma_node_structure`, `get_figma_document_tree`, and `get_figma_image` — are **Tier 1 (Files/Images)** and share a single leaky-bucket rate limit of **10–20 requests/minute**.

**Pacing rule**: stay at or below **8 requests/minute** across all three call types combined. This means:
- Do not fire more than 8 Figma calls in any 60-second window
- When making parallel calls in a batch, keep the batch size to **3–4 calls at most**, then pause before the next batch
- A safe default: after each batch of 3–4 calls, wait ~5 seconds before issuing the next batch

**429 handling**: if any call returns a 429 error:
1. Read the `Retry-After` response header — it specifies how many seconds to wait
2. Wait that duration plus a 3-second buffer
3. Retry the call once
4. If it fails again: for structure/tree calls, note the gap and continue; for image calls, set `"imageAvailable": false` in the artifact, derive intent from structural data only, and mark confidence `"low"`

Apply this pacing to Steps 1, 2, and 3 — not just image capture.

---

## Step 1 — Enumerate top-level sections

Call `get_figma_node_structure` with:
- `fileKey`, `nodeId = rootNodeId`, `limit = 100`

This returns a shallow (depth-1) flat list of all nodes under the root.

**Identify the main vertical container**: look for a direct child FRAME of the root with `VERTICAL` layout mode that is roughly the same size as the root. This is the section stack.

**Identify section frames**: the direct children of the vertical container (depth-1 inside it). These are the top-level design sections. Each will be a FRAME. Collect their node IDs and names.

If `get_figma_node_structure` returns more than the container's direct children (i.e. goes deeper), filter to only nodes at depth 1 relative to the container.

If pagination is needed (more than 100 nodes at the structure level), paginate with `offset`.

---

## Step 2 — Scan each section for design content

Use a two-phase approach: **navigate with structure calls** (shallow, cheap), then **fetch details with tree calls** only on the specific nodes that matter.

### Phase A: Navigate — build the node ID map

Call `get_figma_node_structure` on the section frame node ID.

This returns a flat depth-1 list: IDs, names, and types of the section's direct children. **It does not return component props or text content** — those require a separate fetch in Phase B.

Scan the results for:
- INSTANCE nodes whose name contains "chart" (case-insensitive) → chart instances at this level
- INSTANCE nodes named `SC Heading` → section title/description component; record its node ID
- TEXT nodes → potential explanatory text; record their node IDs
- FRAME or GROUP nodes → intermediate containers that may hold charts deeper; call `get_figma_node_structure` on each to drill one level deeper

Repeat this breadth-first walk until no more intermediate FRAMEs/GROUPs remain unvisited or all chart instances are found. Track visited node IDs to avoid cycles.

**Save the discovery map** after traversal — write `./tmp/plan-s2-<chartSlug>/structure-<sectionSlug>.json`:
```json
{
  "sectionNodeId": "...",
  "sectionName": "...",
  "traversalDepth": 4,
  "chartInstances": [
    { "nodeId": "...", "name": "<ChartType> chart (S)", "parentNodeId": "...", "depth": 3 }
  ],
  "headingNodeId": "...",
  "textNodeIds": ["...", "..."],
  "allNodes": [ /* full flat list of every node seen across all structure calls */ ]
}
```

### Phase B: Fetch properties — one node at a time

For every node ID that matters (SC Heading, each chart instance, each text node), call `get_figma_document_tree` with **`limit=1`**.

`limit=1` returns only that single node's own properties — its component props, text content, size, fills — without descending into any children.

- **SC Heading** (`limit=1`): extract `Title#...=<value>` and `Description#...=<value>` from component props
- **Chart instance** — fetch the complete subtree: call `get_figma_document_tree` with `limit=100` and paginate (`offset=100, 200, ...`) until all nodes are returned. The full chart node tree reveals child components (Tooltip, Popover, labels, annotations, reference lines, etc.), mark layers, axis configuration, legend layout. Save the paginated output into the section's structure file under the chart instance's node ID key.
- **TEXT node** (`limit=1`): extract text string and font size. Discard any text node under 14px or whose text is clearly chart chrome (a single number, a short axis label, a legend item name)

Make these calls in parallel where possible (group by type: all SC Headings together, all chart instances together, all text nodes together) — but respect the batch size limit from the Rate Limiting section above.

After Phase B, every node you care about has its full content. SC Headings and text nodes have their properties. Each chart instance has its complete internal tree — use this in Step 4 alongside the visual image to identify features.

### Extracted data

After both phases, you have for each section:

**Section heading**: title + description from `SC Heading` component props. Fall back to the frame name if no `SC Heading` exists.

**Chart instances**: for each instance — node ID, name, Variant prop value (may be absent), width × height.

**Explanatory text**: full text content of TEXT nodes found at section level (not nested inside chart instances). Ignore text under 14px or clearly inside chart chrome.

**No Variant, no text**: if a chart instance has no `Variant` prop and no adjacent explanatory text, it still gets a ticket. The visual analysis (Step 4) is the sole source of design intent. Set `"variantSource": "visual-only"` and confidence to `"medium"` unless the design is unambiguous.

**Intro/montage sections**: do NOT skip these. They may show features not covered elsewhere. Capture an image of the full section, analyze every distinct chart visible, and produce one ticket per. Set `"sectionType": "intro-montage"` in all artifacts.

**Multi-chart sections**: produce one ticket per chart instance. Do not collapse size variants — S and M are separate tickets. Record companion sizes in `"companionSizes"` in the artifact.

---

## Step 3 — Capture images

For each distinct design unit identified in Step 2:

1. Determine the containing frame to screenshot. Prefer the smallest frame that:
   - Contains the chart instance
   - Also contains any immediately adjacent explanatory text
   - Has a meaningful size (at least 200×150px)

2. Call `get_figma_image` with `format=png, scale=1` on that frame's node ID.

3. Download the image:
   ```bash
   curl --max-time 15 "<url>" -o ./tmp/plan-s2-<chartSlug>/<slug>.png
   ```
   where `<slug>` is a kebab-case version of the section heading + chart variant (e.g. `direct-labels-end-position`).

Process sections in batches of 3 to stay within rate limits, with a ~5 second pause between batches. On 429, follow the retry procedure from the Rate Limiting section.

---

## Step 4 — Analyze each design

Read the image **and** the full chart node tree together for each design unit.

**From the image** (`./tmp/plan-s2-<chartSlug>/<slug>.png`):
- **Chart type** — confirm it matches `<ChartType>` (or is a combo). If clearly a different chart type, note it and skip.
- **Core visual feature** — what is the primary thing this design is demonstrating?
- **Supporting details** — series count, colors, axes, legend presence/absence, annotations, label placement
- **Interaction states shown** — hover tooltip, selected state, popover (if depicted)

**From the chart node tree** (saved in the structure file):
- Identify child component INSTANCE nodes by name — look for nodes whose names contain: `Tooltip`, `Popover`, `Direct label`, `Reference line`, `Metric range`, `Trendline`, `Annotation`, or any `<ChartType>`-specific child component names
- Note any layer names or component prop values that indicate specific features or variants
- Use this to corroborate or surface features that may not be visually obvious in the screenshot

**Design intent** — synthesize Variant prop text + explanatory TEXT nodes + visual + structural findings into 1–2 sentences.

---

## Step 5 — Build the S2 support table and classify

Before classifying any feature, build the current S2 support picture by reading source:

### Build the support table

Read these files for `<ChartType>`:

1. **S2 prop types**: `packages/vega-spec-builder-s2/src/types/marks/<chartSlug>Spec.types.ts`
   - List every prop in `<ChartType>Options` as a supported feature entry
   - Note any props present in S1 (`packages/vega-spec-builder/src/types/marks/<chartSlug>Spec.types.ts`) but absent from S2

2. **S2 child components**: scan `packages/react-spectrum-charts-s2/src/components/` for any components that are children of `<ChartType>` (check the `<ChartType>Props` children type or the children adapter)

3. **S1 child components**: scan `packages/react-spectrum-charts/src/components/` and `packages/vega-spec-builder/src/types/marks/supplemental/` for supplemental types scoped to `<ChartType>`. Note which exist in S1 but not S2.

Produce a table:

| Feature | Prop/Component | In S2? | Notes |
|---|---|---|---|
| ... | ... | yes/no | ... |

And a "Not yet in S2" list of S1 props and child components with no S2 equivalent.

### Classification rules

- **`supported`** — the design shows a feature fully covered by the S2 support table above
- **`partial`** — the design shows a feature that is partially supported (exists but the design shows a variant not yet in the API)
- **`new`** — the design shows a feature not in the support table and not in S1
- **`investigation-needed`** — the design is ambiguous and needs further source code review before classifying

For **all** `new`, `partial`, and `investigation-needed` cases: scan `packages/vega-spec-builder/src/<chartSlug>/` and `packages/react-spectrum-charts/src/components/` for any existing S1 child component or supplemental type that already covers the observed feature before writing the ticket. A label adjacent to a data point might be an existing S1 child component (e.g. `<LinePointAnnotation>`) — misidentifying a port as a new feature produces a wrong ticket. Note what you find and whether it exists in S2 (`packages/vega-spec-builder-s2/src/`) or only S1.

---

## Step 6 — Write planning markdown files

For each distinct feature/design concept, write `planning/S2/<chartSlug>/<slug>.md`.

**Filename slug**: kebab-case of the feature name (e.g. `metric-range.md`, `direct-label-start-position.md`).

If a file for this feature already exists in `planning/S2/<chartSlug>/`, update it rather than creating a duplicate.

### Markdown format

```markdown
---
status: new | partial | supported | investigation-needed
figma_section: "<SC Heading Title>"
figma_variant: "<Variant prop value or 'N/A'>"
figma_node_id: "<node ID of the screenshotted frame>"
figma_url: "https://www.figma.com/design/<fileKey>?node-id=<nodeId>"
---

# <Feature Name>

## Design Intent

<1–3 sentences synthesizing the Variant prop text, explanatory text from the Figma frame, and visual observation. What is this design trying to communicate to the user?>

## Visual Observations

<Bullet list of observable properties: series count, colors, axes, label placement, interactions shown, etc.>

## Feature Comparison

**Status**: `<new | partial | supported | investigation-needed>`

<For `supported`: explain which prop/component covers this and confirm no gaps.>
<For `partial`: describe what's covered and what's missing.>
<For `new`: describe what new prop, child component, or behavior would be needed.>
<For `investigation-needed`: describe the ambiguity and what was found in source.>

## Implementation Notes

<Only for `new` or `partial` statuses. High-level direction: which files would need to change, what the new prop or component might look like, any known constraints. This is directional — not a full spec.>

<Omit this section for `supported` or if genuinely unclear.>

## Analysis Artifact

```json
{
  "sectionTitle": "<SC Heading Title>",
  "sectionDescription": "<SC Heading Description or null>",
  "sectionType": "design | intro-montage",
  "chartInstanceName": "<ChartType> chart (S) | <ChartType> chart (M) | ...",
  "chartVariant": "<Variant prop value or null>",
  "variantSource": "figma-prop | explanatory-text | visual-only",
  "companionSizes": ["S", "M"],
  "figmaNodeId": "<node ID of screenshotted frame>",
  "figmaSectionNodeId": "<node ID of the section frame>",
  "figmaFileKey": "<fileKey>",
  "figmaUrl": "https://www.figma.com/design/<fileKey>?node-id=<nodeId>",
  "structureFile": "./tmp/plan-s2-<chartSlug>/structure-<sectionSlug>.json",
  "coreFeature": "<feature name>",
  "chartType": "<chartSlug>",
  "chartSize": "S | M | unknown",
  "frameWidth": 0,
  "frameHeight": 0,
  "seriesCount": 0,
  "hasLegend": true,
  "interactionShown": "tooltip | popover | hover-point | none",
  "explanatoryText": "<raw text extracted from adjacent TEXT nodes, or null>",
  "status": "new | partial | supported | investigation-needed",
  "confidence": "high | medium | low",
  "ambiguities": ["..."]
}
```

## Node Structure

Full traversal saved to `./tmp/plan-s2-<chartSlug>/structure-<sectionSlug>.json`.

Key nodes identified:
- **Section frame**: `<nodeId>` — `<name>` (W×H)
- **Chart instance**: `<nodeId>` — `<name>` (W×H), Variant: `<value>`
- **Explanatory text nodes**: `<nodeId>` — `"<first 80 chars of text>"`

## Reference Image

Screenshotted from Figma section **"<SC Heading Title>"**, node `<nodeId>`.
To view in Figma: `https://www.figma.com/design/<fileKey>?node-id=<nodeId>`
```

---

## Step 7 — Summary

After writing all files, output a summary table:

```
| Ticket | Status | File |
|--------|--------|------|
| Direct labels (end) | supported | planning/S2/<chartSlug>/direct-label-end.md |
| Metric range band | new | planning/S2/<chartSlug>/metric-range.md |
...
```

Report total counts: N supported, N partial, N new, N investigation-needed.

---

## Notes on handling edge cases

**Section is a montage/overview**: capture the full section image. Visually identify every distinct chart design visible in it and produce one ticket per. If two thumbnails show the same feature at different sizes (S vs. M), produce separate tickets for each. Set `"sectionType": "intro-montage"` in all artifacts from this section.

**No Variant prop, no text**: still produce a ticket. The image is the evidence. Document every observable feature. Mark `"variantSource": "visual-only"` and note in "Design Intent" that intent is inferred from observation only.

**Text-heavy section with one chart**: pull all explanatory text verbatim into `explanatoryText` in the artifact. This text is the highest-confidence signal for design intent.

**S vs. M size**: always produce separate tickets. Do not merge. Sizes affect layout, axis density, label truncation, padding, and potentially feature behavior.

**Feature visible in image but not named**: if you observe something in an image that looks like a feature (e.g. a shaded band, an annotation, a step line) but there is no label or Variant prop for it, still produce a ticket. Describe what you see, mark `"variantSource": "visual-only"`, and classify it the same way as any other feature.

**Rate limit / 429**: follow the retry procedure from the Rate Limiting section. If an image call fails on retry, set `"imageAvailable": false`, derive intent from structural data only, mark confidence `"low"`.
