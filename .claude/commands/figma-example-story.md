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

## Phase 0 — Environment setup

Run these steps once before Phase 1. They are prerequisites for Phase 3.

### Read the Storybook port

The port is set per-developer in `.env` as `STORYBOOK_AI_PORT`. This keeps multiple
worktrees from colliding — each developer assigns a unique port in their local `.env`.

**Important:** Write the port file to `./tmp/storybook-port.txt` (NOT inside `./tmp/ai/`).
The `analyze-chart-design` skill deletes `./tmp/ai/` in its Step 0 — anything inside it
will be lost before Phase 3 runs.

```bash
mkdir -p ./tmp
source .env 2>/dev/null || true
STORYBOOK_PORT=${STORYBOOK_AI_PORT:-6100}
echo $STORYBOOK_PORT > ./tmp/storybook-port.txt
echo "Storybook port: $STORYBOOK_PORT"
```

If `.env` is missing, fall back to 6100 and continue — do not abort.

### Ensure Playwright and Chromium are available

```bash
node -e "require('playwright')" 2>/dev/null || yarn add -DW playwright --ignore-engines
yarn playwright install chromium
```

`yarn playwright install chromium` is idempotent — exits immediately if already downloaded.

### Start Storybook in the background

Start the S2 Storybook server on the derived port and keep it running for the entire workflow.
The screenshot script attaches to it rather than starting/stopping its own server each iteration.

**If Storybook is already running on the port, attach to it — do not start a second instance.**
Multiple instances on competing ports are the root cause of port drift between sessions.

**Important:** Write the PID file to `./tmp/storybook-pid.txt` (NOT inside `./tmp/ai/`) for
the same reason as the port file.

```bash
STORYBOOK_PORT=$(cat ./tmp/storybook-port.txt)
if curl -s http://localhost:$STORYBOOK_PORT > /dev/null 2>&1; then
  echo "Storybook already running on port $STORYBOOK_PORT — attaching."
else
  yarn storybook dev -p $STORYBOOK_PORT --config-dir .storybook-s2 --ci > ./tmp/ai/storybook.log 2>&1 &
  echo $! > ./tmp/storybook-pid.txt
  echo "Storybook PID: $!"
  # Wait for it to be ready (poll every second, 120 s timeout)
  for i in $(seq 1 120); do
    curl -s http://localhost:$STORYBOOK_PORT > /dev/null 2>&1 && echo "Storybook ready on port $STORYBOOK_PORT" && break
    sleep 1
    [ $i -eq 120 ] && echo "ERROR: Storybook failed to start. Check ./tmp/ai/storybook.log" && exit 1
  done
  # Verify it actually started on the expected port (not auto-incremented)
  ACTUAL_PORT=$(grep -o "localhost:[0-9]*" ./tmp/ai/storybook.log | head -1 | cut -d: -f2)
  if [ "$ACTUAL_PORT" != "$STORYBOOK_PORT" ]; then
    echo "ERROR: Storybook started on port $ACTUAL_PORT instead of $STORYBOOK_PORT."
    echo "Another process may still be holding $STORYBOOK_PORT. Kill it and retry."
    exit 1
  fi
fi
```

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

4. If continuing: apply all Category 1 (retryable) fixes directly to the story. Then:
   - **Story/data changes only** (props, data values, axis config): Storybook HMR picks these
     up automatically. Wait ~3 seconds before screenshotting.
   - **Spec builder changes** (any edit to `vega-spec-builder-s2/` or `vega-spec-builder/`):
     Run `yarn build:s2` before screenshotting — HMR does not rebuild library code.
   Then loop.

### Stop conditions (check in order — stop on first match)

- **`retryableCount` is 0** → stop; story is as close as it can get without new feature work
- **All remaining retryable discrepancies have the same label and `suggestedAction` as the
  previous iteration** → stop; the fix is not converging; reclassify those as Category 3
- **`overallMatch` is `"good"` with no structural checklist failures** → stop; only
  palette/style gaps remain (accepted)
- **Iteration 3 reached** → stop regardless

---

## Phase 4 — Final gap report

### Tear down Storybook

Only kill the process if we started it (PID file exists and was written this session).
Do not kill a Storybook that was already running when Phase 0 attached to it.

```bash
if [ -f ./tmp/storybook-pid.txt ]; then
  kill $(cat ./tmp/storybook-pid.txt) 2>/dev/null && echo "Storybook stopped" || echo "Storybook already stopped"
fi
```

Read the final `./tmp/ai/gap-classification.json` and `./tmp/ai/verification-report.json`
and present:

```
## Story: <storyExportName>

**View in Storybook:** http://localhost:<port>/?path=/story/<storyId>

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

The `<port>` comes from `./tmp/storybook-port.txt`. The `<storyId>` is the kebab-case story ID
used throughout Phase 3.

Present this report directly — do not spawn another agent for this step.
