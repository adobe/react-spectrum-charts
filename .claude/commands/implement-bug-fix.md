# react-spectrum-charts: Bug Fix

Use this skill when fixing a bug. Read `/architecture` first — diagnosing any bug requires understanding the render cycle, signal system, data sources, COMPONENT_NAME, and encoding conventions.

---

## Diagnosing a Bug

### Step 1: Identify which layer the bug lives in

| Symptom | Layer | Where to look |
|---|---|---|
| Chart flickers or disappears on resize | Render cycle | `VegaChart.tsx` dep arrays, `useSpec.tsx` memo deps |
| Chart redraws when popover opens/closes | Render cycle | State mutations causing spec rebuild |
| Hover/selection stays stuck after interaction | Signal | `clearHoverSignals`, `setSelectedSignals`, `useNewChartView.tsx` |
| Popover opens with wrong content or for wrong mark | COMPONENT_NAME | `markClickUtils.ts`, `getTooltip()` in mark utils |
| Mark has wrong color that doesn't respect backgroundColor | Encoding | Check for hardcoded color vs `{ signal: BACKGROUND_COLOR }` |
| Mouse events not firing | Interaction wiring | `useNewChartView.tsx`, `isInteractive()`, voronoi mark existence |
| TypeScript errors after tests pass | Type system | Run `yarn tsc --noEmit` — Jest doesn't type-check |
| Feature works in S1 but not S2 | S2 parity | Find the S2 equivalent file and apply the same fix |

### Step 2: Follow the data flow from symptom to root cause

For rendering bugs, trace backwards from the symptom:
- "Chart re-embeds on resize" → find the dep that triggers the embed effect → trace where that dep comes from
- "Chart blank on load" → check whether dimensions start at 0, check the `hasMounted` / `needsInitEmbed` pattern

For signal bugs, find the signal by name in the spec (`spec.signals[]`), then find every `view.signal(name, ...)` call — both the places that set it and the places that should clear it. A "stuck" signal almost always has a clear path that doesn't run in some interaction sequence.

For interaction bugs (click, right-click, legend), trace through `useNewChartView.tsx` which is where all Vega event listeners are registered. The `click` and `contextmenu` paths must receive the same arguments.

---

## Key Rules (Not Past Incidents — These Are Principles)

### Background colors use signals, not static values
Any fill/stroke that should track the chart's `backgroundColor` prop must use `{ signal: BACKGROUND_COLOR }`. A static color value (`getS2ColorValue(...)` or `{ value: '#fff' }`) is baked into the spec and will not react to runtime prop changes. This applies to halos, labels, and any "background-matching" visual element.

### Signal writes need existence checks
Before `view.signal(name, value)`, check `specSignalNames.has(name)`. The set of signals in a spec varies based on which marks and features are active. Writing to an absent signal throws.

### Signal clearing must be symmetric
Every signal write must have a corresponding clear. If you add signal state in a `mouseenter` handler, clear it in `mouseleave`. If you set `selectedData` on mark click, clear it on popover close. "Stuck" UI state is almost always an asymmetric signal write.

### The resize and embed effects must stay separate
Width and height must not appear in the embed effect's dep array. Chart size changes must flow through the resize effect only. The spec should be rebuilt only when data, options, or config change — not when the container resizes.

### Text marks hide via `fontSize: 0`, not `fillOpacity: 0`
Hiding a text mark with opacity still runs layout calculations (like `limit` constraints), which can produce NaN. Setting `fontSize: 0` disables both rendering and layout.

### Decorative/overlay marks need `interactive: false`
Any mark that is purely visual (annotation text, halo, badge, reference label) must have `interactive: false`. Without it, the mark intercepts mouse events meant for the data marks underneath it.

### Use `displayName` for component identity, never reference equality
`child.type === Component` fails across hot-reload boundaries. Always use `getElementDisplayName(child) === Component.displayName`.

### S2 parity is always required
When fixing a bug in an s1 file, find the corresponding s2 file (`packages/vega-spec-builder-s2/` mirrors `packages/vega-spec-builder/`). Apply the same fix unless the bug doesn't exist in s2 — but verify, don't assume. S2 has intentional simplifications (no Venn, simpler static point rendering) so don't port s1-specific behavior blindly.

---

## Writing the Regression Test

Every bug fix must include a test that would have caught the bug:

**For render bugs**: Assert DOM node identity is preserved after the interaction that triggered the bug. `node.isConnected === true` after a popover opens and closes means the node was not recreated.

**For signal bugs**: Exercise the full cycle (set → interact → clear) in a single test. Assert that the visual state is correct after the closing interaction, not just after the opening one.

**For encoding bugs**: Test the spec builder function directly with `toHaveProperty('key', value)`. Do not use direct property access on Vega encode objects — Vega uses `ProductionRule<T>` union types, and TypeScript will reject direct access.

**For data bugs**: Test `addData` directly with `initializeSpec()` and assert the transform array. Prefer unit tests on spec builder functions over integration tests for data pipeline issues.

After writing tests, always run `yarn tsc --noEmit`. Test passes do not imply type correctness.
