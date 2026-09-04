# react-spectrum-charts: System Architecture — Core

Always read this file first, on every feature or bug fix, regardless of change type. It
covers how the library actually works — not just the public API, but the internal pipeline
that connects React props to a rendered Vega chart. Other `.claude/architecture-*.md` files
cover specific topics (rendering, signals, S2 parity, etc.) — the skill file for your change
type names which of those also apply; you don't need to read all of them.

---

## The Full Pipeline

```
<Chart>
  <Line metric="value" dimension="datetime">
    <ChartTooltip />
  </Line>
</Chart>

1. childrenAdapter.ts: rscPropsToSpecBuilderOptions()
   → walks the React tree, dispatches each element by displayName
   → builds ChartOptions: { marks: [{ markType: 'line', metric: 'value', ... }] }

2. buildSpec(chartOptions) in chartSpecBuilder.ts
   → for each mark, calls addLine(acc, { ...mark, ...specOptions, index: lineCount })
   → addLine mutates the Vega spec draft via immer's produce

3. vega-embed renders the spec in VegaChart.tsx
```

Key entry points:
- `buildSpec` — `vega-spec-builder/src/chartSpecBuilder.ts`
- `rscPropsToSpecBuilderOptions` — `react-spectrum-charts/src/rscToSbAdapter/childrenAdapter.ts`
- `Chart.tsx` — `react-spectrum-charts/src/Chart.tsx`

---

## The Three-Type Pattern

Every mark has three related types across two packages:

**`<Mark>Options`** (`vega-spec-builder/src/types/marks/<mark>Spec.types.ts`)
All fields optional. This is the public contract — what callers of `buildSpec` pass. Includes the `markType` discriminant and child collection arrays (`chartTooltips?: ChartTooltipOptions[]`).

**`<Mark>SpecOptions`** (same file)
Internal working type used only inside the spec builder. Extends `PartiallyRequired<MarkOptions, MarkOptionsWithDefaults>`, which makes all defaulted fields required. Also carries internal fields injected by `chartSpecBuilder.ts`:
- `colorScheme` — active color scheme
- `highlightedItem` — current highlighted item from chart state
- `idKey` — the field name used for row identity
- `s2` — whether the chart is rendering in S2 mode

These four arrive via the `specOptions` spread in `chartSpecBuilder.ts`:
```ts
const specOptions = { colorScheme, idKey, highlightedItem, s2 };
// ...
return addLine(acc, { ...mark, ...specOptions, index: lineCount });
```

**`<Mark>Props`** (`react-spectrum-charts/src/types/marks/<mark>.types.ts`)
React component props. Extends `<Mark>Options` via `Omit` — replaces child-type fields with `children?: ReactElement`, and callback fields with typed function props (`onClick?`, `onMouseOver?`).

**`<Mark>OptionsWithDefaults`** — string literal union of every field that has a runtime default applied in the spec builder. Adding a key here makes that field required (non-nullable) in `<Mark>SpecOptions`.
