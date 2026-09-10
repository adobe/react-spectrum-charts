# Architecture: Child Component Dispatch Pipeline

Read this when: adding a new child component (a component that nests inside a mark or
`<Chart>` but renders nothing itself), or diagnosing a "child silently dropped" bug. Assumes
you've already read `architecture-core.md`.

---

```
<Line>
  <MetricRange metric="range" />
</Line>

↓ childrenAdapter.ts: childrenToOptions(children)
  case MetricRange.displayName:
    metricRanges.push(child.props as MetricRangeProps)

↓ lineAdapter.ts: getLineOptions({ children })
  const { metricRanges } = childrenToOptions(children)
  return { ...lineProps, metricRanges, markType: 'line' }

↓ lineSpecBuilder.ts: addLine(spec, { metricRanges: [...], ... })
```

## Sanitize Gate

Before `childrenToOptions` sees any element, the component's `displayName` must be registered in the correct sanitize function in `utils.ts`. All 6 functions are independent — there is no master list:
- `sanitizeRscChartChildren` — direct children of `<Chart>`
- `sanitizeMarkChildren` — inside any mark
- `sanitizeAxisChildren` — inside `<Axis>`
- `sanitizeAxisAnnotationChildren` — inside `<AxisAnnotation>`
- `sanitizeTrendlineChildren` — inside `<Trendline>`
- `sanitizeBigNumberChildren` — inside `<BigNumber>`

A component not registered is silently dropped with no error.

## Three Dispatch Patterns

**Pattern A — Direct cast**: props map 1-to-1, no transformation needed.
```ts
case MetricRange.displayName:
  metricRanges.push(child.props as MetricRangeProps);
  break;
```

**Pattern B — Adapter call**: component has a render-function `children` prop or callbacks that must be stripped.
```ts
case ChartTooltip.displayName:
  chartTooltips.push(getChartTooltipOptions(child.props as ChartTooltipProps));
  break;
```

**Pattern C — Recursive**: component has its own children that need parsing.
```ts
case Axis.displayName:
  axes.push(getAxisOptions(child.props as AxisProps)); // calls childrenToOptions internally
  break;
```
