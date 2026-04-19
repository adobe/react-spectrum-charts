# react-spectrum-charts: Adding a New Chart Mark

Use this skill when adding a new top-level chart mark (a new mark type like Scatter, Combo, or a hypothetical Heatmap) or a new supplemental visualization type. This is the most involved type of change in the library.

Read `/architecture` first — this is the most involved type of change and requires understanding the full pipeline, all four spec builder functions, the scale system, data sources, interactive mark system, encoding conventions, and alpha vs stable paths.

---

## Implementation Steps

### Step 1: Spec Builder Types

Create `packages/vega-spec-builder/src/types/marks/widgetSpec.types.ts`:

```ts
export interface WidgetOptions {
  markType: 'widget';        // required discriminant
  name?: string;
  metric?: string;
  dimension?: string;
  color?: ColorFacet;
  // Children (populated by the adapter):
  chartPopovers?: ChartPopoverOptions[];
  chartTooltips?: ChartTooltipOptions[];
}

type WidgetOptionsWithDefaults =
  | 'chartPopovers'
  | 'chartTooltips'
  | 'color'
  | 'dimension'
  | 'metric'
  | 'name';

export interface WidgetSpecOptions
    extends PartiallyRequired<WidgetOptions, WidgetOptionsWithDefaults> {
  // Injected by chartSpecBuilder.ts via specOptions spread — always present:
  colorScheme: ColorScheme;
  highlightedItem?: HighlightedItem;
  idKey: string;
  s2?: boolean;
  // Computed by addWidget:
  index: number;
  interactiveMarkName: string | undefined;
}
```

Export from `packages/vega-spec-builder/src/types/marks/index.ts`.

Add `WidgetOptions` to the `MarkOptions` union in `packages/vega-spec-builder/src/types/chartSpec.types.ts`. Do this in Step 1 — the union must be updated before the spec builder can compile.

### Step 2: Test Fixture

Create `packages/vega-spec-builder/src/widget/widgetTestUtils.ts` with a fully-populated `defaultWidgetOptions: WidgetSpecOptions`. Every required field must be present at its default value. This fixture is the baseline for all spec builder unit tests.

### Step 3: Mark Utils

Create `packages/vega-spec-builder/src/widget/widgetMarkUtils.ts`:

```ts
export const addWidgetMarks = produce<Mark[], [WidgetSpecOptions]>((marks, options) => {
  marks.push({
    name: `${options.name}_group`,
    type: 'group',
    marks: [
      getWidgetMark(options),
      ...getInteractiveMarks(options),  // voronoi overlay when interactive
    ],
  });
});

export const getWidgetMark = (options: WidgetSpecOptions): SymbolMark => {
  // Build the primary Vega mark
  // Use encode.enter for static encoding
  // Use encode.update for dynamic encoding (opacity, color that reacts to hover state)
};
```

Use `toHaveProperty` in tests — never direct property access on Vega `encode` objects due to `ProductionRule<T>` union types.

### Step 4: Spec Builder

Create `packages/vega-spec-builder/src/widget/widgetSpecBuilder.ts`:

```ts
export const addWidget = produce<ScSpec, [WidgetOptions & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string; s2?: boolean; }]>(
  (spec, {
    chartPopovers = [],
    chartTooltips = [],
    color = { value: 'categorical-100' },
    index = 0,
    metric = DEFAULT_METRIC,
    name,
    ...options  // colorScheme, highlightedItem, idKey, s2 arrive via ...specOptions spread in chartSpecBuilder
  }) => {
    const widgetName = toCamelCase(name || `widget${index}`);
    const widgetOptions: WidgetSpecOptions = {
      chartPopovers,
      chartTooltips,
      color,
      index,
      interactiveMarkName: getInteractiveMarkName({ chartPopovers, chartTooltips }, widgetName),
      metric,
      name: widgetName,
      ...options,
    };

    spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, widgetOptions.interactiveMarkName);
    spec.data = addData(spec.data ?? [], widgetOptions);
    spec.signals = addSignals(spec.signals ?? [], widgetOptions);
    spec.scales = setScales(spec.scales ?? [], widgetOptions);
    spec.marks = addWidgetMarks(spec.marks ?? [], widgetOptions);
  }
);

export const addData = produce<Data[], [WidgetSpecOptions]>((data, options) => {
  // Add time transform if dimension is time-based
  // Add filteredTableForTooltip when interactive
  // Add ${name}_selectedData when has popover
});

export const addSignals = produce<Signal[], [WidgetSpecOptions]>((signals, options) => {
  if (!isInteractive(options)) return;
  addHoveredItemSignal(signals, options.name, options.interactiveMarkName);
  addTooltipSignals(signals, options);
});

export const setScales = produce<Scale[], [WidgetSpecOptions]>((scales, options) => {
  addContinuousDimensionScale(scales, { scaleType: options.scaleType, dimension: options.dimension });
  addMetricScale(scales, [options.metric]);
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, options.color);
});
```

### Step 5: Register in `chartSpecBuilder.ts`

1. Add import: `import { addWidget } from './widget/widgetSpecBuilder';`
2. Add to `initializeComponentCounts()`: `widgetCount: -1`
3. Add switch case:
```ts
case 'widget':
  widgetCount++;
  return addWidget(acc, { ...mark, ...specOptions, index: widgetCount });
```

### Step 6: React Types

Create `packages/react-spectrum-charts/src/types/marks/widget.types.ts`:

```ts
type WidgetChildElement = ChartPopoverElement | ChartTooltipElement;

export interface WidgetProps
    extends Omit<WidgetOptions, 'chartPopovers' | 'chartTooltips' | 'markType'> {
  children?: Children<WidgetChildElement>;
}

export type WidgetElement = ReactElement<WidgetProps, JSXElementConstructor<WidgetProps>>;
```

The `Omit` list contains only fields replaced at the React boundary. Plain value props from `WidgetOptions` flow through automatically.

### Step 7: React Component

Create `packages/react-spectrum-charts/src/components/Widget/Widget.tsx`:

```tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC } from 'react';
import { WidgetProps } from '../../types';

const Widget: FC<WidgetProps> = ({
  color = { value: 'categorical-100' },
  metric = DEFAULT_METRIC,
  children,
}) => { return null; };

Widget.displayName = 'Widget';
export { Widget };
```

Create the barrel `index.ts`. Add to `components/index.ts`.

### Step 8: Adapter

Create `packages/react-spectrum-charts/src/rscToSbAdapter/widgetAdapter.ts`:

```ts
export const getWidgetOptions = ({ children, ...widgetProps }: WidgetProps): WidgetOptions => {
  const { chartPopovers, chartTooltips } = childrenToOptions(children);
  return {
    ...widgetProps,
    chartPopovers,
    chartTooltips,
    markType: 'widget',
  };
};
```

### Step 9: Register in `childrenAdapter.ts`

Add the import and dispatch case:
```ts
case Widget.displayName:
  marks.push(getWidgetOptions(child.props as WidgetProps));
  break;
```

Add `Widget.displayName` to `sanitizeRscChartChildren` in `utils.ts`.

### Step 10: Tests

**`widgetSpecBuilder.test.ts`** — test `addData`, `addSignals`, `setScales` independently using `initializeSpec()` and `defaultWidgetOptions` fixture.

**`widgetMarkUtils.test.ts`** — test `addWidgetMarks` group structure, mark names, interactive mark additions.

**`widgetAdapter.test.ts`** — test `getWidgetOptions` with `createElement(ChartTooltip)` and `createElement(ChartPopover)` children, assert collections have correct length.

**`chartAdapter.test.ts`** — update the `toStrictEqual` snapshot to include the new mark type with all fields at default values.

**`Widget.story.tsx`** — at minimum: Basic, Color, WithTooltip stories.

**`Widget.test.tsx`** — integration test using `findChart` and `findAllMarksByGroupName`.

After writing tests: `yarn tsc --noEmit`.

### Step 11: Alpha vs Stable

If the mark is not ready for the public API, place the component in `packages/react-spectrum-charts/src/alpha/components/Widget/` and import it in `childrenAdapter.ts` from `'../alpha/components/Widget'`. The spec builder, types, and registration in `chartSpecBuilder.ts` are identical — only the component's export path changes.

To graduate from alpha to stable later: move the component to `components/`, update the import in `childrenAdapter.ts`. No spec builder changes needed.

### Step 12: S2 Parity

If the mark ships in S2:
1. Create an S2 spec builder in `packages/vega-spec-builder-s2/src/widget/` (often identical to S1 except using S2 color utilities)
2. Register it in `packages/vega-spec-builder-s2/src/chartSpecBuilder.ts`
3. Create the S2 React component in `packages/react-spectrum-charts-s2/src/components/Widget/`
4. Register in `packages/react-spectrum-charts-s2/src/rscToSbAdapter/childrenAdapter.ts`
5. Build with `yarn build:s2`

S2 differences: uses `getS2ColorValue` instead of `getColorValue`, no `s2` boolean prop (always S2), no Venn support.

---

## Checklist

**vega-spec-builder:**
- [ ] `types/marks/widgetSpec.types.ts` — Options, OptionsWithDefaults, SpecOptions
- [ ] `types/marks/index.ts` — export added
- [ ] `types/chartSpec.types.ts` — WidgetOptions in MarkOptions union
- [ ] `widget/widgetTestUtils.ts` — fully-populated fixture
- [ ] `widget/widgetMarkUtils.ts` — mark factory functions
- [ ] `widget/widgetSpecBuilder.ts` — addWidget, addData, addSignals, setScales
- [ ] `widget/widgetMarkUtils.test.ts` — mark structure tests
- [ ] `widget/widgetSpecBuilder.test.ts` — per-function tests
- [ ] `chartSpecBuilder.ts` — counter, import, switch case

**react-spectrum-charts:**
- [ ] `types/marks/widget.types.ts` — WidgetProps, WidgetElement
- [ ] `types/marks/index.ts` — export added
- [ ] `components/Widget/Widget.tsx` — render-null component with displayName
- [ ] `components/Widget/index.ts` — barrel
- [ ] `components/index.ts` — export added
- [ ] `rscToSbAdapter/widgetAdapter.ts` — getWidgetOptions
- [ ] `rscToSbAdapter/widgetAdapter.test.ts` — adapter tests
- [ ] `rscToSbAdapter/childrenAdapter.ts` — case added
- [ ] `rscToSbAdapter/chartAdapter.test.ts` — snapshot updated
- [ ] `utils/utils.ts` — sanitizeRscChartChildren updated
- [ ] `stories/components/Widget/Widget.story.tsx` — created
- [ ] `stories/components/Widget/Widget.test.tsx` — created
- [ ] `yarn tsc --noEmit` — passes

---

## Key Things That Go Wrong

**Counter initialized wrong** — The count starts at `-1` so the first mark gets index `0`. Initializing at `0` shifts all names by one and breaks snapshot tests.

**Snapshot in `chartAdapter.test.ts`** — This test asserts the complete `ChartOptions` shape. Every field with a default must appear in the expected object. Missing any field (even `chartPopovers: []`) causes a strict equality failure.

**`removeUnusedScales` removes empty scales** — `addFieldToFacetScaleDomain` only adds domain fields when the value is a field reference (string), not a static value `{ value: ... }`. If your mark always uses a static color, no color scale domain field gets added, and the color scale gets removed from the final spec. This is correct behavior — don't fight it.

**`interactiveMarkName` vs mark name** — The interactive mark name is what Vega event listeners attach to. For most marks it equals the mark name. For marks with a separate hover layer (like a voronoi overlay), it should reference the voronoi mark name so events fire on the overlay, not the data mark.

**Failing TypeScript but not tests** — `yarn test` doesn't type-check. Always run `yarn tsc --noEmit` when done.

**Cognitive complexity** — SonarQube flags functions whose cognitive complexity exceeds the threshold. Spec builder functions with many conditionals are the most common trigger. When a function grows complex, extract inline conditional chains or loops into named helper functions rather than inlining them. The `addData` and `addMarks` functions are the most likely candidates.

**Copyright header missing** — Every new `.ts`/`.tsx` source file requires the Apache 2.0 copyright block at the top. ESLint enforces this as a hard error. See `architecture.md` for the exact header text. Story files (`.story.tsx`) are exempt.
