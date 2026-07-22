# react-spectrum-charts

Declarative React library for composing Spectrum data visualizations. Charts are described as JSX component trees; the library converts them to Vega specs at runtime.

---

## Package Structure

```
packages/
  react-spectrum-charts/       # Public React component library (@adobe/react-spectrum-charts)
  vega-spec-builder/           # Vega spec generation logic (@spectrum-charts/vega-spec-builder)
  vega-spec-builder-s2/        # Spectrum 2 variant of the spec builder
  react-spectrum-charts-s2/    # Spectrum 2 React component variant
  constants/                   # Shared string constants (signal names, data field names, defaults)
  themes/                      # Color schemes and runtime token resolution
  utils/                       # Shared utility functions
  locales/                     # i18n strings
  dev-tools/                   # Internal contributor CLI tools (not published)
  mcp/                         # MCP server
```

The two packages touched for most feature work:
- **`vega-spec-builder`** — spec logic, types, unit tests
- **`react-spectrum-charts`** — React components, Storybook stories, integration tests

---

## Architecture Reference

For deep architecture context — the VegaChart rendering cycle, signal system, data sources, scale system, interactive mark wiring, COMPONENT_NAME, sanitize gate, encoding conventions, and S2 parity rules — read `.claude/architecture.md`.

---

## The Three-Layer Pipeline

```
React JSX
  ↓  childrenAdapter.ts  — walks the React tree, extracts props into ChartOptions
ChartOptions
  ↓  buildSpec()         — packages/vega-spec-builder/src/chartSpecBuilder.ts
Vega Spec (JSON)
  ↓  vega-embed          — Chart.tsx renders via vega-embed
Rendered chart
```

**Key entry points:**
- `buildSpec(chartOptions)` — `vega-spec-builder/src/chartSpecBuilder.ts` — produces a complete Vega spec from a `ChartOptions` object
- `rscPropsToSpecBuilderOptions()` — `react-spectrum-charts/src/rscToSbAdapter/childrenAdapter.ts` — converts the React component tree to `ChartOptions`
- `Chart.tsx` — `react-spectrum-charts/src/Chart.tsx` — top-level component, calls `useSpec()` → `buildSpec()`

---

## Type System

Every mark follows the same three-type pattern, using Line as the canonical example:

| Type | Location | Purpose |
|---|---|---|
| `LineOptions` | `vega-spec-builder/src/types/marks/lineSpec.types.ts` | All fields optional. Public contract — input to `buildSpec`. |
| `LineSpecOptions` | same file | `LineOptions` with required defaults applied + internal fields (`idKey`, `index`, `colorScheme`, etc.). Used inside spec builder only. |
| `LineProps` | `react-spectrum-charts/src/types/marks/line.types.ts` | React component props. Extends `LineOptions` via `Omit` — replaces child-type fields with `children?: ReactElement`, callbacks with `onClick?` etc. |

`LineOptionsWithDefaults` (in `lineSpec.types.ts`) is a union of string literals naming every field that has a runtime default. It drives the `PartiallyRequired` utility type used by `LineSpecOptions`.

---

## `addLine` — How a Mark Gets Built

`addLine` in `lineSpecBuilder.ts` is the `produce`-wrapped function that mutates the spec for a single line mark. It:
1. Applies all defaults and assembles `LineSpecOptions`
2. Calls `addData()` — data sources, time transforms, tooltip/popover data, trendlines, metric ranges
3. Calls `addSignals()` — hover/select signals, tooltip signals
4. Calls `setScales()` — x/y scales, color/lineType/opacity scales
5. Calls `addLineMarks()` — the mark group, voronoi hover overlay, static points, trendline marks

Each of those four functions is exported and tested independently.

---

## Key Constants (`packages/constants/constants.ts`)

| Constant | Value | Purpose |
|---|---|---|
| `TABLE` | `'table'` | Root Vega data source name |
| `FILTERED_TABLE` | `'filteredTable'` | Filtered/transformed data source |
| `MARK_ID` | `'rscMarkId'` | Unique row ID added by identifier transform |
| `SERIES_ID` | `'rscSeriesId'` | Series identifier field |
| `HOVERED_ITEM` | `'hoveredItem'` | Signal name suffix for hover state |
| `HOVERED_SERIES` | `'hoveredSeries'` | Signal name suffix for hovered series |
| `COLOR_SCALE` | `'color'` | Ordinal color scale name |
| `LINE_TYPE_SCALE` | `'lineType'` | Ordinal line type scale |
| `OPACITY_SCALE` | `'opacity'` | Ordinal opacity scale |
| `DEFAULT_METRIC` | `'value'` | Default y-axis data field |
| `DEFAULT_TIME_DIMENSION` | `'datetime'` | Default x-axis data field |

---

## Adding a Property to an Existing Mark

Always implement in this order:

1. **`vega-spec-builder/src/types/marks/lineSpec.types.ts`**
   - Add the field to `LineOptions` (optional, with JSDoc)
   - Add its key to `LineOptionsWithDefaults` only if it has a runtime default

2. **`vega-spec-builder/src/line/lineSpecBuilder.ts`**
   - Destructure the new field (with its default if any) inside `addLine`'s produce callback
   - Add it to the assembled `lineOptions` object
   - Implement the vega spec change in whichever of `addData`, `addSignals`, `setScales`, `addLineMarks` is affected

3. **`vega-spec-builder/src/line/lineTestUtils.ts`**
   - Add a fixture (`LineSpecOptions`) for the new option variant

4. **Unit tests** — `lineSpecBuilder.test.ts`, `lineMarkUtils.test.ts`, etc.
   - Test each affected builder function directly using the new fixture

5. **`react-spectrum-charts/src/types/marks/line.types.ts`**
   - Only add the field to the `Omit` list if it needs to be *replaced* at the React boundary (e.g. swapped for a `ReactNode` or callback). If it's a plain value prop it passes through `LineOptions` automatically — do nothing.

6. **`react-spectrum-charts/src/components/Line/Line.tsx`**
   - Thread through a default value if needed (Line.tsx is a render-null component that holds prop defaults)

7. **Storybook story** — required for every new feature
   - Check through existing storybook file names for relevancy first
   - Read the existing or relevant story file for the mark first to understand the established story order and grouping before adding a new one
   - Add the story using `bindWithProps()` in a position that fits logically with related stories
   - `defaultArgs` already sets `dimension`, `metric`, `scaleType`, `color` — don't repeat them
   - Export the new story at the bottom of the existing export list

---

## Test Conventions

- Unit tests live next to the source file they test (`lineSpecBuilder.test.ts` beside `lineSpecBuilder.ts`)
- Internal test fixtures live in `<mark>TestUtils.ts` (e.g. `lineTestUtils.ts`) — never import these outside `vega-spec-builder`
- Tests call spec builder functions directly with `produce` — no React rendering
- `initializeSpec()` from `specUtils.ts` creates a minimal starting spec for tests
- `defaultSignals` from `specTestUtils.ts` is the baseline signal array all specs start with
- Run timezone-normalized: `cross-env TZ=UTC` is set in all test scripts

---

## Package Management

Always use `yarn` for all package management and script execution — never `npm install`, `npm run`, or `npx`. This is a yarn workspaces monorepo. To install a package at the workspace root, use `yarn add -DW <package> --ignore-engines`.

---

## Common Commands

```bash
# Before running tests in a fresh worktree or after cloning, verify node_modules are installed.
# If `cross-env: command not found` appears, run `yarn install` first, then retry.
yarn install

# Run all tests
yarn test

# Watch mode
yarn watch

# Run tests for a specific package
yarn workspace @spectrum-charts/vega-spec-builder test
yarn workspace @adobe/react-spectrum-charts test

# Run tests matching a pattern
yarn test --testPathPattern=line

# Lint
yarn lint

# TypeScript check (no emit)
yarn tsc

# Storybook (port 6009)
yarn storybook
# or
yarn start

# Storybook S2 variant (port 6010)
yarn storybook:s2

# Build all packages (respects dependency order)
yarn build

# Build in parallel (faster, use for full rebuild)
yarn build:parallel

# Build s2 packages. These depend on s1 packages being built
yarn build:s2

# Build a single package
yarn workspace @spectrum-charts/vega-spec-builder build
```

---

## Storybook Story Pattern

Every new feature must have a Storybook story. Before adding one, read the existing story file for the mark to understand the current story ordering and grouping — insert the new story in a position that fits logically with related stories rather than appending blindly to the end.

```tsx
// All stories follow this pattern:
const MyStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args} />
    </Chart>
  );
};

export const WithMyFeature = bindWithProps(MyStory);
WithMyFeature.args = {
  ...defaultArgs,
  myNewProp: someValue, // only fields that differ from defaultArgs
};
```

`useChartProps` handles responsive sizing. `bindWithProps` wires up Storybook controls.

## S2 Storybook Directory Structure

S2 stories live in `packages/react-spectrum-charts-s2/src/stories/<ComponentName>/`:

- `<ComponentName>Examples.story.tsx` — Figma design equivalents only. These match specific Figma frames and use `title: 'React Spectrum Charts 2/<ComponentName>/Examples'`.
- `Features/` — Granular per-prop and test-case stories. Title prefix: `'React Spectrum Charts 2/<ComponentName>/Features'`.
  - **Single-story files** (one named export): Storybook hoists them flat into the sidebar — no folder node is created. Use for simple prop showcases (e.g. `LineType.story.tsx`).
  - **Multi-story groups** (two or more related stories): Place in a named subdirectory with a matching title segment. Example: `Features/Tooltip/LineTooltip.story.tsx` with `title: 'React Spectrum Charts 2/Line/Features/Tooltip'`. This creates a `Tooltip` folder node in the sidebar.
  - Never put two files with the same `title` and overlapping export names — Storybook will throw a duplicate story ID error.

---

## Code Style

- **No nested template literals.** When a template literal would contain an inner `${}` expression that is itself a template literal or ternary producing a string, extract the inner expression into a named `const` first, then reference it in the outer template. This keeps Vega signal strings readable and avoids linter/code-smell warnings.

```ts
// Bad
`outer ${condition ? `inner_a` : `inner_b`} rest`

// Good
const inner = condition ? 'inner_a' : 'inner_b';
`outer ${inner} rest`
```
## Test Completeness Checklist

After any feature implementation, verify all of the following before considering the work done:

### 1. Snapshot / fixture tests
If a new field was added to a `*Options` or `*SpecOptions` type, find all `toStrictEqual` snapshot tests that assert the full options shape (e.g. `chartAdapter.test.ts`). The new field must appear in every expected object, set to its default value.

### 2. childrenAdapter / displayName coverage
If a new `case X.displayName:` was added to `childrenAdapter.ts`, the corresponding adapter test (e.g. `barAdapter.test.ts`) must have a test that passes `createElement(X)` as a child and asserts the resulting collection has length 1. Follow the pattern of existing popover/tooltip/annotation child tests.

### 3. Spec builder loop coverage
If a new `for...of options.<collection>.entries()` loop was added to a spec builder, the corresponding `addMarks()` test block must have a test passing `[{}]` for that collection and asserting the correct number and names of added marks. Use the `with annotations` describe block as a model.

### 4. Vega type assertions
When asserting properties on Vega `encode` objects, use `toHaveProperty('key', value)` rather than `obj?.key?.value`. Direct property access fails TypeScript because Vega uses `ProductionRule<T>` union types.

### 5. Encoding consistency
When adding a new mark, verify its encodings follow the same conventions as comparable existing marks before finalizing. Key rules:
- Background/halo colors must use `{ signal: BACKGROUND_COLOR }`, not a hardcoded `getS2ColorValue(...)` call — the signal respects the chart's `backgroundColor` prop
- Opacity must use `getMarkOpacity()` rather than a hardcoded value
- Cross-check against one or two similar existing marks (e.g. `barAnnotationUtils.ts`, `linePointUtils.ts`) to catch any other conventions

### 6. TypeScript
After writing or modifying test files, run `yarn tsc --noEmit` and confirm no errors before reporting the work done. `yarn test` passing does not imply the files are type-correct.

---

## S2 Docs Pages

When adding a new page under `packages/docs/docs/spectrum2/`:

1. **Register it in the sidebar** — add the page to `packages/docs/sidebars.ts` under the `'Spectrum 2 (Alpha)'` category. The page will not appear in the docs site otherwise.

2. **Accurately document supported props** — before writing a props table, cross-reference the S2 types (`vega-spec-builder-s2/src/types/marks/`) against the s1 equivalent (`vega-spec-builder/src/types/marks/`) to identify anything not yet supported. Add a `:::note` callout listing unsupported props or child components, following the pattern in `line.md`.

---

## S2 Variant

`vega-spec-builder-s2` overrides specific functions from `vega-spec-builder` (color resolution, background signals) to use Spectrum 2 tokens. `react-spectrum-charts-s2` wraps the S2 spec builder. When working on S2 features, build with `yarn build:s2` and run Storybook with `yarn storybook:s2`.

When fixing a bug or refactoring behavior in an s1 package file, always check whether the corresponding s2 file needs the same change. The packages mirror each other structurally but s2 has no Venn support, no `s2` prop, and uses s2-specific imports (`vega-spec-builder-s2`, `react-spectrum-charts-s2`). A fix in one without the other leaves the packages inconsistent.

## Building After Spec Builder Changes

Storybook's dev server rebuilds story files via HMR but does **not** rebuild library packages.
After modifying any file in `vega-spec-builder-s2/`, `vega-spec-builder/`,
`react-spectrum-charts-s2/`, or `react-spectrum-charts/`, run `yarn build:s2` before
screenshotting or verifying behavior in Storybook. Story-only changes (props, data values,
JSX structure) are picked up automatically after ~3 seconds without a rebuild.

## S2 Spec Builder Defaults

When a Vega configuration value differs from the S2 design spec (e.g. title offset, font
weight, font size, axis label spacing), encode it as a named default in `s2DefaultOptions`
inside the relevant `vega-spec-builder-s2` spec builder file. Do not expose it as a
user-facing React prop unless the S2 design spec intentionally allows per-chart variation.
Check `applyTitleOptionsDefaults` in `vega-spec-builder-s2/src/title/titleSpecBuilder.ts`
as the canonical pattern.

---

## Before Implementing Any Feature or Bug Fix

Before writing any code, always:

1. Read `.claude/architecture.md` for system context
2. If a Jira ticket is associated with the work, check it for explicit spec values (line widths, pixel dimensions, thresholds, token names) **before** fetching Figma images or doing web research. Ticket descriptions for this project routinely contain the exact implementation values needed.
3. Classify the change type and read the corresponding skill file:
   - Unexpected or broken behavior → `.claude/commands/implement-bug-fix.md`
   - New component used directly inside `<Chart>` → `.claude/commands/implement-new-chart-mark.md`
   - New component nested inside an existing mark (e.g. `<Line><NewChild /></Line>`) → `.claude/commands/implement-new-child-component.md`
   - New prop on an existing component → `.claude/commands/implement-new-prop.md`
4. Follow the steps in the matched skill file

---

## Adding a Chart-Level Prop

Chart-level props (on `<Chart>` itself, not a mark) follow a different file path than mark props:

1. **`packages/constants/constants.ts`** — add the type and any associated runtime constants (breakpoints, lookup maps)
2. **`vega-spec-builder/src/types/chartSpec.types.ts`** and **`vega-spec-builder-s2/src/types/chartSpec.types.ts`** — add to `ChartOptions` (import the type from `@spectrum-charts/constants`)
3. **`react-spectrum-charts-s2/src/chartUtils.ts`** — add helper functions and update `applyChartPropsDefaults` if there's a default
4. **`react-spectrum-charts-s2/src/Chart.tsx`** — compute the effective value (explicit prop vs. auto-derived), override in `rscChartProps`
5. **`react-spectrum-charts-s2/src/RscChart.tsx`** — destructure and pass to `useSpec`
6. **`react-spectrum-charts-s2/src/hooks/useSpec.tsx`** — accept the param, pass to `rscPropsToSpecBuilderOptions`, add to the dep array

`SanitizedSpecProps` and `RscChartProps` pick up optional `ChartOptions` fields automatically via `Omit<ChartOptions, ...>` — no explicit change needed unless making the field required.

`rscPropsToSpecBuilderOptions` spreads `...specProps`, so any field in `ChartOptions` flows through to the spec builder without touching the adapter.

---

## Issue Tracking

Known bugs that are not being acted on immediately go in `planning/issues/` as markdown files. Each doc should include:
- **Status** — Open / In Progress
- **Symptom** — 1-2 sentence description of the observable behavior
- **Root cause** — Technical explanation with `file:line` references
- **Relevant files** — Table of files and their role
- **Proposed fix** — Direction, not full implementation

When the user describes a bug or observation and says they want to note it for later, create a doc there without being asked for the format.

---

## AI Workflow Skills

The `figma-example-story` pipeline and its sub-skills (`analyze-chart-design`, `generate-chart-story`, `verify-chart-story`) live in `.claude/commands/`. When a new rule or refinement is discovered for this workflow, update the relevant skill file directly. Do not save workflow rules to session memory — the skill files are the transferable source of truth.

---

## API Documentation

When looking up S2 component API and props, read `packages/docs/docs/` — particularly `docs/api/` and `docs/spectrum2/`
