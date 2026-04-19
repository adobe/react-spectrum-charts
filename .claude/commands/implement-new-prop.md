# react-spectrum-charts: Adding a New Prop to an Existing Component

Use this skill when adding a new prop to an existing chart mark or component (e.g., `blend` on Scatter, `labelLimit` on Axis, `onMouseOver` on Bar).

Read `/architecture` for the three-type system (Options / SpecOptions / Props), OptionsWithDefaults, what the adapter does and when it needs to change, and encoding conventions.

---

## Prop Types and Their Implications

Understanding which type of prop you're adding determines which files need to change.

### Type 1: Plain Value Prop (Most Common)
A simple value (boolean, number, string, enum) with no special React boundary handling. Examples: `hasSquareCorners`, `blend`, `labelLimit`, `hideValue`, `padding`.

These pass through the `...markProps` spread automatically. The adapter doesn't change. The only distinction is whether the prop has a runtime default (goes in `OptionsWithDefaults`) or is truly optional with no fallback (does not go in `OptionsWithDefaults`).

**When to use conditional spreading**: If the prop's absence should mean "let Vega use its own default" (not inject `undefined`), use `...(prop !== undefined && { prop })` in the spec builder utility rather than always including the field.

### Type 2: Callback / Event Prop
A function prop (`onClick`, `onMouseOver`, `onMouseOut`, `onContextMenu`). These never enter the Vega spec as functions. They get converted to boolean flags in the adapter, which gate the creation of voronoi/hover marks in the spec builder.

The flag mapping is mark-specific — check the existing adapter before writing new logic. For Line, click and hover use **separate flags**:
- `hasOnClick: Boolean(onClick)` — gates click-specific behavior
- `hasMouseInteraction: Boolean(onMouseOut || onMouseOver)` — gates hover-specific behavior

Other marks may combine them differently. Always read the adapter pattern before assuming `hasOnClick` covers all callbacks.

Callback props live in `<Mark>Props` only — they don't exist in `<Mark>Options`. They must be added to the `Omit` list in `<Mark>Props` if they share a name with an `Options` field (which they usually don't) or simply added as new fields.

Changes to the Vega spec are minimal or none — the spec builder already emits hover/click marks when `isInteractive()` returns true. The main change is wiring the React callback to fire when the corresponding Vega event happens, which lives in `useMarkMouseInputDetails.tsx` or `useNewChartView.tsx`.

### Type 3: Encoding Prop
A prop that changes the Vega `encode` block of a mark — fill, stroke, opacity, shape, size, blend mode. Examples: `stroke`, `blend`, `opacity`, `lineOpacity`.

These flow into the mark utility function (e.g., `getScatterMark`) and modify `encode.enter` or `encode.update`. The main implementation work is in the mark utility, not the spec builder orchestrator.

### Type 4: Scale / Data / Signal Prop
A prop that changes how data is structured, how scales are built, or how interaction signals work. Examples: `metricAxis`, `tickCountLimit`, `hidePartialWindows`, `highlightBy`.

These require changes to `addData()`, `setScales()`, or `addSignals()` in the spec builder. They may also require changes to `axisSpecBuilder.ts`, `scaleSpecBuilder.ts`, or `signalSpecBuilder.ts`.

---

## Implementation Steps

### Step 1: Types (`vega-spec-builder/src/types/marks/<mark>Spec.types.ts`)

Add the field to `<Mark>Options`:
```ts
/**
 * JSDoc description of the prop.
 * @default false
 */
myNewProp?: boolean;
```

If it has a runtime default, add the key to `<Mark>OptionsWithDefaults`:
```ts
type LineOptionsWithDefaults = 
  | 'existingField'
  | 'myNewProp';   // add here
```

If it has no default (absence means "skip the behavior"), do NOT add to `OptionsWithDefaults`. Use conditional spreading when consuming it.

### Step 2: Spec Builder (`vega-spec-builder/src/line/lineSpecBuilder.ts`)

Destructure the new field with its default in the `addLine` produce callback:
```ts
export const addLine = produce<ScSpec, [...]>((spec, {
  myNewProp = false,
  // ...existing fields
}) => {
  const lineOptions: LineSpecOptions = {
    myNewProp,
    // ...
  };
```

Then implement the behavior in whichever of `addData`, `addSignals`, `setScales`, or `addLineMarks` is appropriate.

### Step 3: Test Fixture (`vega-spec-builder/src/<mark>/<mark>TestUtils.ts`)

Add the field at its default value to the default fixture object:
```ts
export const defaultLineOptions: LineSpecOptions = {
  // ...existing fields
  myNewProp: false,  // add with default value
};
```

This is critical — any `toStrictEqual` test that uses this fixture will fail if the field is missing.

### Step 4: Unit Tests

Test the affected builder function directly with the new prop. Use `toHaveProperty` for Vega encode assertions — never direct property access (Vega uses `ProductionRule<T>` union types):
```ts
// Correct
expect(mark.encode?.enter?.fill).toHaveProperty('value', 'blue');

// Wrong — TypeScript error
expect(mark.encode?.enter?.fill?.value).toBe('blue');
```

### Step 5: React Component (`react-spectrum-charts/src/components/<Mark>/<Mark>.tsx`)

Add the prop to the destructure list with its default (for Storybook discovery):
```ts
const Line: FC<LineProps> = ({
  myNewProp = false,
  // ...
}) => { return null; };
```

### Step 6: React Props Type — Only If Needed

Edit `react-spectrum-charts/src/types/marks/<mark>.types.ts` only if:
- The prop is a callback that needs to be added to `<Mark>Props` (not in `<Mark>Options`)
- The prop type differs between the React boundary and the spec builder (rare)

For plain value props, `<Mark>Props` already inherits the field from `<Mark>Options` via the `Omit` pattern. No change needed.

### Step 7: Adapter — Only If Needed

Edit `react-spectrum-charts/src/rscToSbAdapter/<mark>Adapter.ts` only if:
- A callback needs conversion to a boolean flag
- Conditional spreading is needed (undefined vs absent distinction)
- The prop requires transformation

For props that pass through unchanged, the adapter's `...markProps` spread handles them automatically.

### Step 8: Storybook Story

Read the existing story file first to understand ordering and grouping. Add the story in a logical position relative to similar stories. Use `bindWithProps` and set only args that differ from `defaultArgs`.

### Step 9: S2 Parity

Check whether the mark exists in S2 (`packages/vega-spec-builder-s2/src/` and `packages/react-spectrum-charts-s2/src/`). If it does, apply the same changes. S2 files mirror S1 structurally but use S2-specific imports. S2 does not have Venn, does not have the `s2` boolean prop, and some marks have intentional behavioral differences (e.g., `staticPoint` in S2 only supports `true`, not `'hollow'`/`'solid'`).

---

## Checklist by Prop Type

**Plain value prop with default:**
- [ ] `<mark>Spec.types.ts` — add to Options + OptionsWithDefaults
- [ ] `<mark>SpecBuilder.ts` — destructure with default, add to options object, implement behavior
- [ ] `<mark>TestUtils.ts` — add to fixture at default value
- [ ] Unit test for the affected utility
- [ ] `<Mark>.tsx` — add to destructure with default
- [ ] Story
- [ ] S2 parity

**Plain value prop without default (optional behavior):**
- [ ] Same as above, but omit `OptionsWithDefaults` entry
- [ ] Use conditional spreading in the utility: `...(prop !== undefined && { prop })`

**Callback/event prop:**
- [ ] `<mark>.types.ts` — add to `<Mark>Props` with `MarkCallback` type
- [ ] `<mark>Adapter.ts` — destructure, compute boolean flag
- [ ] `<mark>Adapter.test.ts` — test flag computation
- [ ] `useMarkMouseInputDetails.tsx` or `useNewChartView.tsx` — wire the React callback
- [ ] Integration test exercising the callback
- [ ] Story with interactive demo
- [ ] No vega-spec-builder changes typically needed

---

## Common Mistakes to Avoid

**Missing fixture update** — Every `toStrictEqual` assertion that uses the fixture object will fail if the new field is absent. Update the fixture first.

**`undefined` leaking into the Vega spec** — Spreading `{ prop }` when prop is `undefined` injects `prop: undefined` into the Vega spec, which may override Vega's own internal defaults. When the distinction matters, use `...(prop !== undefined && { prop })`.

**Callback converted to flag incorrectly** — Marks split callbacks into separate boolean flags. Line uses `hasOnClick: Boolean(onClick)` and a separate `hasMouseInteraction: Boolean(onMouseOut || onMouseOver)`. Do not assume one flag covers all callbacks — always read the existing adapter for the mark you are modifying before adding new flag logic.

**Failing TypeScript but not failing tests** — `yarn test` does not type-check. Always run `yarn tsc --noEmit` after writing test files.

**Type literals widened with `| string`** — When a prop takes a fixed set of values, define it as a string literal union (`'left' | 'right' | 'center'`). Do not add `| string` to widen it — restrict to known valid values only. ESLint and TypeScript will not catch this, but SonarQube will flag it as a code smell.
