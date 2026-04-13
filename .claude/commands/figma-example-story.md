# Create a Figma Examples story

Given a Figma node URL in `$ARGUMENTS`, orchestrates the full design → story → verify loop
using three generic sub-skills:

- `analyze-chart-design` — fetches Figma assets, tears down stale artifacts, produces `design-observation.json`
- `generate-chart-story` — reads the observation and writes the story + `implementation-hypothesis.json`
- `verify-chart-story` — screenshots, diffs, and classifies discrepancies into `gap-classification.json`

All intermediate artifacts are written to `./tmp/ai/`.

**Arguments:** `$ARGUMENTS` contains a Figma URL and an optional `--auto` flag separated by a space (e.g. `https://... --auto`).
- Parse `$ARGUMENTS` as space-delimited tokens. The URL is the token that starts with `https://`; `--auto` is a separate flag token.
- Pass only the URL to sub-skills.
- If `--auto` is present, skip all inter-phase confirmation prompts and run all phases end-to-end.
- If `--auto` is absent, ask "Would you like me to proceed to Phase N?" after each phase completes and wait for confirmation before continuing.

---

## Phase 1 — Analyze

Invoke the `analyze-chart-design` skill with `$ARGUMENTS` (the Figma URL).

Wait for it to complete and confirm `./tmp/ai/design-observation.json` was written.

---

## Phase 2 — Generate

Invoke the `generate-chart-story` skill (no arguments — it reads `design-observation.json`).

Wait for it to complete and confirm that:
- `./tmp/ai/implementation-hypothesis.json` was written
- The story was inserted into the target file

---

## Phase 3 — Verify and fix loop

**Maximum 3 iterations.** Each iteration:

1. Derive the Storybook story ID from the story's `title` and `storyExportName`:
   - Title: `'React Spectrum Charts 2/Line/Examples'` → `react-spectrum-charts-2-line-examples`
   - Export: `MyStoryName` → `my-story-name` (camelCase → kebab-case)
   - ID: `react-spectrum-charts-2-line-examples--my-story-name`

2. Invoke the `verify-chart-story` skill with the story ID.

3. Read `./tmp/ai/gap-classification.json`. Apply the stop conditions below.

4. If continuing: apply all Category 1 (retryable) fixes directly to the story, then loop.

### Stop conditions (check in order — stop on first match)

- **`retryableCount` is 0** → stop; story is as close as it can get without new feature work
- **All remaining retryable discrepancies have the same label and `suggestedAction` as the
  previous iteration** → stop; the fix is not converging; reclassify those as Category 3
- **`overallMatch` is `"good"` with no structural checklist failures** → stop; only
  palette/style gaps remain (accepted)
- **Iteration 3 reached** → stop regardless

---

## Phase 4 — Final gap report

Read the final `./tmp/ai/gap-classification.json` and `./tmp/ai/verification-report.json`
and present:

```
## Story: <storyExportName>

### What was implemented
[bullet list of capturedElements from implementation-hypothesis.json]

### Visual match
[overallMatch + any structural checklist failures]

### Feature gaps
```

| Gap | Category | Reference expects | Current behavior | Suggested path |
|-----|----------|-------------------|-----------------|----------------|
| [label] | [N — label] | [description] | [what RSC produces] | [suggestedAction or "None"] |

One row per non-retryable discrepancy. Use em-dashes for empty cells.

Present this report directly — do not spawn another agent for this step.
