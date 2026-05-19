# react-spectrum-charts: Adding a New Chart Mark (S2)

Use this skill when adding a new top-level chart mark to the S2 package (a new mark type like Scatter, Combo, or a hypothetical Heatmap). This is the most involved type of change in the library.

Read `.claude/architecture.md` first — this requires understanding the full pipeline, all four spec builder functions, the scale system, data sources, interactive mark system, and encoding conventions.

**S2 notes:** Use `getS2ColorValue` (not `getColorValue`) for color resolution. There is no `s2` boolean prop — you are always in S2 context. No Venn support.

---

## Implementation Steps

### Step 1: Spec Builder Types

Create `packages/vega-spec-builder-s2/src/types/marks/widgetSpec.types.ts`:

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
  // Computed by addWidget:
  index: number;
  interactiveMarkName: string | undefined;
}
```

Export from `packages/vega-spec-builder-s2/src/types/marks/index.ts`.

Add `WidgetOptions` to the `MarkOptions` union in `packages/vega-spec-builder-s2/src/types/chartSpec.types.ts`. Do this in Step 1 — the union must be updated before the spec builder can compile.

### Step 2: Test Fixture

Create `packages/vega-spec-builder-s2/src/widget/widgetTestUtils.ts` with a fully-populated `defaultWidgetOptions: WidgetSpecOptions`. Every required field must be present at its default value. This fixture is the baseline for all spec builder unit tests.

### Step 3: Mark Utils

Create `packages/vega-spec-builder-s2/src/widget/widgetMarkUtils.ts`:

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
  // Use getS2ColorValue for color resolution
  // Use { signal: BACKGROUND_COLOR } for fills/strokes that track backgroundColor
  // Use getMarkOpacity() for opacity
};
```

Use `toHaveProperty` in tests — never direct property access on Vega `encode` objects due to `ProductionRule<T>` union types.

### Step 4: Spec Builder

Create `packages/vega-spec-builder-s2/src/widget/widgetSpecBuilder.ts`:

```ts
export const addWidget = produce<ScSpec, [WidgetOptions & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string; }]>(
  (spec, {
    chartPopovers = [],
    chartTooltips = [],
    color = { value: 'categorical-100' },
    index = 0,
    metric = DEFAULT_METRIC,
    name,
    ...options  // colorScheme, highlightedItem, idKey arrive via ...specOptions spread in chartSpecBuilder
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

Create `packages/react-spectrum-charts-s2/src/types/marks/widget.types.ts`:

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

Create `packages/react-spectrum-charts-s2/src/components/Widget/Widget.tsx`:

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

Create `packages/react-spectrum-charts-s2/src/rscToSbAdapter/widgetAdapter.ts`:

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

Add the import and dispatch case in `packages/react-spectrum-charts-s2/src/rscToSbAdapter/childrenAdapter.ts`:
```ts
case Widget.displayName:
  marks.push(getWidgetOptions(child.props as WidgetProps));
  break;
```

Add `Widget.displayName` to `sanitizeRscChartChildren` in `packages/react-spectrum-charts-s2/src/utils/utils.ts`.

### Step 10: Tests

**`widgetSpecBuilder.test.ts`** — test `addData`, `addSignals`, `setScales` independently using `initializeSpec()` and `defaultWidgetOptions` fixture.

**`widgetMarkUtils.test.ts`** — test `addWidgetMarks` group structure, mark names, interactive mark additions.

**`widgetAdapter.test.ts`** — test `getWidgetOptions` with `createElement(ChartTooltip)` and `createElement(ChartPopover)` children, assert collections have correct length.

**`chartAdapter.test.ts`** — update the `toStrictEqual` snapshot to include the new mark type with all fields at default values.

**`Widget.story.tsx`** — at minimum: Basic, Color, WithTooltip stories. Place in `packages/react-spectrum-charts-s2/src/stories/Widget/`. Use title prefix `'React Spectrum Charts 2/Widget/...'`.

**`Widget.test.tsx`** — integration test using `findChart` and `findAllMarksByGroupName`.

After writing tests: run `yarn build:s2` then `yarn tsc --noEmit`.

---

## Checklist

**vega-spec-builder-s2:**
- [ ] `types/marks/widgetSpec.types.ts` — Options, OptionsWithDefaults, SpecOptions
- [ ] `types/marks/index.ts` — export added
- [ ] `types/chartSpec.types.ts` — WidgetOptions in MarkOptions union
- [ ] `widget/widgetTestUtils.ts` — fully-populated fixture
- [ ] `widget/widgetMarkUtils.ts` — mark factory functions
- [ ] `widget/widgetSpecBuilder.ts` — addWidget, addData, addSignals, setScales
- [ ] `widget/widgetMarkUtils.test.ts` — mark structure tests
- [ ] `widget/widgetSpecBuilder.test.ts` — per-function tests
- [ ] `chartSpecBuilder.ts` — counter, import, switch case

**react-spectrum-charts-s2:**
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
- [ ] `stories/Widget/Widget.story.tsx` — created
- [ ] `stories/Widget/Widget.test.tsx` — created
- [ ] `yarn build:s2` succeeds
- [ ] `yarn tsc --noEmit` passes

---

## Key Things That Go Wrong

**Counter initialized wrong** — The count starts at `-1` so the first mark gets index `0`. Initializing at `0` shifts all names by one and breaks snapshot tests.

**Snapshot in `chartAdapter.test.ts`** — This test asserts the complete `ChartOptions` shape. Every field with a default must appear in the expected object. Missing any field (even `chartPopovers: []`) causes a strict equality failure.

**`removeUnusedScales` removes empty scales** — `addFieldToFacetScaleDomain` only adds domain fields when the value is a field reference (string), not a static value `{ value: ... }`. If your mark always uses a static color, no color scale domain field gets added, and the color scale gets removed from the final spec. This is correct behavior — don't fight it.

**`interactiveMarkName` vs mark name** — The interactive mark name is what Vega event listeners attach to. For most marks it equals the mark name. For marks with a separate hover layer (like a voronoi overlay), it should reference the voronoi mark name so events fire on the overlay, not the data mark.

**Using `getColorValue` instead of `getS2ColorValue`** — S2 spec builder files must use `getS2ColorValue` for color resolution. Using the S1 utility produces incorrect color output.

**Hardcoded background color** — Any fill/stroke that must track the chart's `backgroundColor` prop at runtime must use `{ signal: BACKGROUND_COLOR }`, not a hardcoded result of `getS2ColorValue(...)`.

**Failing TypeScript but not failing tests** — `yarn test` doesn't type-check. Always run `yarn tsc --noEmit` when done.

**Cognitive complexity** — SonarQube flags functions whose cognitive complexity exceeds the threshold. When a function grows complex, extract inline conditional chains or loops into named helper functions. The `addData` and `addMarks` functions are the most likely candidates.

**Copyright header missing** — Every new `.ts`/`.tsx` source file requires the Apache 2.0 copyright block at the top. ESLint enforces this as a hard error. See `.claude/architecture.md` for the exact header text. Story files (`.story.tsx`) are exempt.
