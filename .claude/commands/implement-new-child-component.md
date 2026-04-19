# react-spectrum-charts: Adding a New Child Component

Use this skill when adding a new child component — a React element that carries props into the Vega spec pipeline but renders nothing itself. Examples: `ChartTooltip`, `MetricRange`, `Trendline`, `AxisThumbnail`, `LinePointAnnotation`, `BarAnnotation`.

Read `/architecture` for the dispatch pipeline, the sanitize gate (all 6 sanitize functions), and the three dispatch patterns (direct cast, adapter call, recursive).

---

## Implementation Steps

### Step 1: Define types in `vega-spec-builder`

Create `packages/vega-spec-builder/src/types/marks/supplemental/<name>Spec.types.ts`:

```ts
export interface <Name>Options {
  /** JSDoc for every field */
  someField?: SomeType;
  // If it owns child components (tooltip, popover):
  chartTooltips?: ChartTooltipOptions[];
}

type <Name>OptionsWithDefaults = 'someField' | 'chartTooltips';

export interface <Name>SpecOptions
    extends PartiallyRequired<<Name>Options, <Name>OptionsWithDefaults> {
  index: number;
  name: string;
  // Parent context (add what the mark utilities need):
  lineOptions: LineSpecOptions;  // only if parent context is needed
}
```

Export from `supplemental/index.ts`.

Also update the parent mark's types (`lineSpec.types.ts`) to add the new collection:
```ts
// In LineOptions:
<names>?: <Name>Options[];

// In LineOptionsWithDefaults:
| '<names>'
```

### Step 2: Implement the mark logic in `vega-spec-builder`

Create `packages/vega-spec-builder/src/line/<name>/<name>Utils.ts` with the functions that produce Vega marks from `<Name>SpecOptions`.

Update the parent spec builder (`lineSpecBuilder.ts`) to call the new utils when the collection is non-empty.

Update `lineTestUtils.ts` — add `<names>: []` to every existing fixture object.

### Step 3: Define React types

Create `packages/react-spectrum-charts/src/types/marks/supplemental/<name>.types.ts`:

```ts
import { <Name>Options } from '@spectrum-charts/vega-spec-builder';

// Simple case: props == options (most supplemental marks)
export interface <Name>Props extends <Name>Options {}
export type <Name>Element = ReactElement<<Name>Props, JSXElementConstructor<<Name>Props>>;

// Complex case: component has children (ChartTooltip, ChartPopover pattern)
export interface <Name>Props extends Omit<<Name>Options, 'chartTooltips'> {
  children?: (datum: Datum, close: () => void) => ReactNode;
}
```

Export from `supplemental/index.ts`.

Update the parent mark's types (`line.types.ts`) to add `<Name>Element` to the child union type and add `'<names>'` to the `Omit` list in `LineProps`.

### Step 4: Create the component file

`packages/react-spectrum-charts/src/components/<Name>/<Name>.tsx`:

```tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC } from 'react';
import { <Name>Props } from '../../types';

// Destructure with defaults so Storybook discovers them as controls
const <Name>: FC<<Name>Props> = ({
  fieldWithDefault = defaultValue,
  optionalField,
}) => {
  return null;
};

<Name>.displayName = '<Name>';
export { <Name> };
```

Create the barrel `index.ts` and add to `components/index.ts`.

### Step 5: Register in the correct sanitize function(s)

In `packages/react-spectrum-charts/src/utils/utils.ts`:
1. Import the component
2. Identify the correct sanitize function(s) for the component's valid nesting location(s): `sanitizeRscChartChildren`, `sanitizeMarkChildren`, `sanitizeAxisChildren`, `sanitizeAxisAnnotationChildren`, `sanitizeTrendlineChildren`, or `sanitizeBigNumberChildren`
3. Add `<Name>.displayName` to each applicable function's allowlist

A component may need to appear in more than one function if it is valid in multiple nesting contexts.

### Step 6: Register in childrenAdapter

In `packages/react-spectrum-charts/src/rscToSbAdapter/childrenAdapter.ts`:
1. Import the component and types
2. Add the collection array: `const <names>: <Name>Options[] = [];`
3. Add the dispatch case (Pattern A, B, or C based on the component's nature)
4. Add `<names>` to the return object

Update the parent mark's adapter (`lineAdapter.ts`) to destructure `<names>` from `childrenToOptions` and pass it through.

### Step 7: Write tests

**Adapter test** (`lineAdapter.test.ts`):
```ts
it('should convert <Name> children to <names> array', () => {
  const options = getLineOptions({ children: [createElement(<Name>)] });
  expect(options.<names>).toHaveLength(1);
});
```

**Snapshot test** (`chartAdapter.test.ts`): Find every `toStrictEqual` assertion that includes the parent mark type and add `<names>: []` to the expected shape.

**Spec builder unit tests**: Test the mark utils with `produce` directly using fixture objects.

**Integration test**: Render a story with the child component and assert the correct Vega marks exist in the DOM.

**Pseudo-element test** (for SonarQube coverage):
```ts
test('<Name> pseudo element', () => { render(<<Name> />); });
```

### Step 8: Storybook story

Story goes in `stories/components/<Name>/`. The `component:` in the story meta should reference the child component, and `{...args}` should be spread onto the child — not the parent mark:

```tsx
export default { title: 'RSC/<ParentMark>/<Name>', component: <Name> };

const Story: StoryFn<typeof <Name>> = (args) => (
  <Chart {...chartProps}>
    <Axis ... />
    <<ParentMark> ...requiredProps>
      <<Name> {...args} />
    </<ParentMark>>
  </Chart>
);
```

### Step 9: S2 parity

If the parent mark exists in S2, mirror the changes in:
- `packages/vega-spec-builder-s2/src/types/marks/supplemental/` — same type file
- `packages/react-spectrum-charts-s2/src/components/<Name>/` — same component file
- `packages/react-spectrum-charts-s2/src/rscToSbAdapter/childrenAdapter.ts` — same dispatch case
- `packages/react-spectrum-charts-s2/src/utils/utils.ts` — same sanitize registrations

S2-exclusive components (like `BarDirectLabel`, `LineDirectLabel`) only exist in S2 — they have no S1 equivalent.

---

## Checklist

- [ ] `vega-spec-builder/src/types/marks/supplemental/<name>Spec.types.ts` — created
- [ ] `vega-spec-builder/src/types/marks/supplemental/index.ts` — export added
- [ ] Parent `<mark>Spec.types.ts` — collection field added to `Options` and `OptionsWithDefaults`
- [ ] `vega-spec-builder/src/<mark>/<name>/<name>Utils.ts` — mark logic implemented
- [ ] Parent `<mark>TestUtils.ts` — new collection added to all fixtures as `[]`
- [ ] `react-spectrum-charts/src/types/marks/supplemental/<name>.types.ts` — created
- [ ] `react-spectrum-charts/src/types/marks/supplemental/index.ts` — export added
- [ ] Parent `<mark>.types.ts` — child union updated, Omit list updated
- [ ] `components/<Name>/<Name>.tsx` — created with displayName and return null
- [ ] `components/<Name>/index.ts` — barrel created
- [ ] `components/index.ts` — export added
- [ ] `utils/utils.ts` — added to `sanitizeChildren` AND appropriate scoped set
- [ ] `childrenAdapter.ts` — case added, collection in return
- [ ] Parent `<mark>Adapter.ts` — destructures and passes new collection
- [ ] `<mark>Adapter.test.ts` — createElement test added
- [ ] `chartAdapter.test.ts` — snapshots updated with `<names>: []`
- [ ] Story and integration test created
- [ ] S2 parity applied where parent mark exists in S2
- [ ] `yarn tsc --noEmit` passes

---

## Key Things That Go Wrong

**Silent drop with no error** — If `displayName` is missing from `sanitizeChildren`, the component is filtered before the switch runs. Always verify by writing the adapter test first; a passing test (`toHaveLength(1)`) confirms the pipeline is wired.

**Wrong sanitize function** — There is no master list. Each `sanitize*Children` function is independent. A component registered only in `sanitizeMarkChildren` but not in `sanitizeRscChartChildren` will be dropped when used as a top-level chart child. Register in every function matching the component's valid nesting locations.

**Snapshot tests in `chartAdapter.test.ts`** — These assert the complete `ChartOptions` shape. Every new collection added to a mark's options (even as `[]`) must appear in the expected objects or the test fails with a strict equality error.

**Missing fixture update** — If `<mark>TestUtils.ts` doesn't include the new collection, all existing spec builder unit tests that use the fixture will fail with shape mismatches.

**`displayName` on the wrong object** — Set `displayName` on the component function itself, not on the import. It must be set before the component is used in the `sanitizeChildren` set or the switch case.

**Copyright header missing** — Every new `.ts`/`.tsx` source file requires the Apache 2.0 copyright block at the top. ESLint enforces this as a hard error. See `architecture.md` for the exact header text. Story files (`.story.tsx`) are exempt.
