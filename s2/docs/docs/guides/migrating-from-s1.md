# Migrating from S1

This guide moves a chart from `@adobe/react-spectrum-charts` (S1) to `@spectrum-charts/react-spectrum-charts-s2` (S2). It also applies if you used the S1 `s2` prop: S2 always uses Spectrum 2 styling, so that prop is gone.

Most chart code carries over unchanged. The work is in four places: packages and imports, `ChartTooltip` becoming `ChartInspect`, a few components and props with no S2 equivalent, and a few changed defaults. Each section below has a table to scan, and the [checklist](#checklist) at the end sums it up.

## Packages

S2 is a separate package. It's built on [React Spectrum S2](https://react-spectrum.adobe.com/s2/) instead of React Spectrum v3, and it needs React 19.

| Dependency | S1 | S2 |
| --- | --- | --- |
| Chart package | `@adobe/react-spectrum-charts` | `@spectrum-charts/react-spectrum-charts-s2` |
| React Spectrum | `@adobe/react-spectrum >=3.23.0` | `@react-spectrum/s2 >=1.0.0` |
| `react`, `react-dom` | `>=17.0.2` | `>=19.0.0` |
| `react-aria-components` | not needed | `^1.14.0` |
| `vega`, `vega-lite` | `^6.2.0`, `^6.4.2` | `^6.2.0`, `^6.4.2` (same) |
| Module format | `require` or `import` | ESM only (`import`) |
| Node | No requirement | `>=22.12.0` |

```bash
yarn remove @adobe/react-spectrum-charts
yarn add @spectrum-charts/react-spectrum-charts-s2 @react-spectrum/s2 react-aria-components
```

You can install both packages side by side and migrate one chart at a time.

S2 ships ESM only, so `require()` and deep imports into `dist` don't work. Jest needs to transform the package; see [Testing and troubleshooting](/react-spectrum-charts/s2/docs/docs/guides/testing-and-troubleshooting#jest).

## Imports

S1 split components across `@adobe/react-spectrum-charts`, `@adobe/react-spectrum-charts/alpha`, and `@adobe/react-spectrum-charts/rc`. S2 has two entry points: `@spectrum-charts/react-spectrum-charts-s2` for alpha and later components, and `@spectrum-charts/react-spectrum-charts-s2/lab` for components still being designed. See [Stages and lab](/react-spectrum-charts/s2/docs/docs/guides/stages-and-lab).

| Component | S1 import | S2 import |
| --- | --- | --- |
| `Chart`, `Axis`, `AxisThumbnail`, `Bar`, `ChartPopover`, `EmptyState`, `Legend`, `Line`, `LinePointAnnotation`, `ReferenceLine`, `Title` | `@adobe/react-spectrum-charts` | `@spectrum-charts/react-spectrum-charts-s2` |
| `ChartTooltip` | `@adobe/react-spectrum-charts` | `ChartInspect` from `@spectrum-charts/react-spectrum-charts-s2` |
| `Donut`, `DonutSummary`, `SegmentLabel` | `@adobe/react-spectrum-charts/rc` | `@spectrum-charts/react-spectrum-charts-s2` |
| `Area`, `Scatter`, `ScatterAnnotation`, `ScatterPath`, `Trendline`, `TrendlineAnnotation` | `@adobe/react-spectrum-charts` | `@spectrum-charts/react-spectrum-charts-s2/lab` |
| `Bullet`, `Combo` | `@adobe/react-spectrum-charts/alpha` | `@spectrum-charts/react-spectrum-charts-s2/lab` |
| `Annotation`, `AxisAnnotation`, `BigNumber`, `MetricRange`, `Venn` | `@adobe/react-spectrum-charts`, `@adobe/react-spectrum-charts/rc`, or `@adobe/react-spectrum-charts/alpha` | Not in S2. See [Removed components](#removed-components). |
| `BarDirectLabel`, `LineDirectLabel`, `LineForecast`, `LoadingState` | Not in S1 | `@spectrum-charts/react-spectrum-charts-s2` |
| `ChartActionBar` | Not in S1 | `@spectrum-charts/react-spectrum-charts-s2/lab` |

```tsx
// Before
import { Axis, Chart, ChartTooltip, Line, Scatter } from '@adobe/react-spectrum-charts';
import { Donut, DonutSummary } from '@adobe/react-spectrum-charts/rc';

// After
import { Axis, Chart, ChartInspect, Donut, DonutSummary, Line } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';
```

Type names follow the components: `ChartTooltipProps` is `ChartInspectProps`, and `TooltipHandler` is `InspectHandler`.

## Chart

| S1 | S2 |
| --- | --- |
| `s2` | Removed. S2 always uses Spectrum 2 styling. |
| `theme` | Removed. Use `colorScheme` and `backgroundColor`. |
| `colors` default `categorical16` | Default `s2Categorical20`, the same as S1 with `s2`. |
| Not available | `animations`, `animationTypes`. See [Animation](/react-spectrum-charts/s2/docs/docs/chart#animation). |

Every other `Chart` prop, its default, and the `ChartHandle` ref methods are the same.

### theme and s2

S1 read colors from an `@adobe/react-spectrum` theme. S2 charts render their own S2 `Provider`, so pass the color scheme directly. See [Color and theme](/react-spectrum-charts/s2/docs/docs/chart#color-and-theme).

```tsx
// Before
<Chart data={data} theme={darkTheme} colorScheme="dark" s2>

// After
<Chart data={data} colorScheme="dark">
```

S2 charts use the Spectrum 2 palette, `s2Categorical20`, by default. If you passed an S1 palette such as `categorical12` or `categorical16` to `colors`, remove it so the chart uses Spectrum 2 colors. See [Colors and theming](/react-spectrum-charts/s2/docs/docs/guides/colors-and-theming).

### Popover and inspect content

Content you return from `ChartInspect` and `ChartPopover` renders inside an S2 `Provider`. Build it with `@react-spectrum/s2` components, not React Spectrum v3 components.

## ChartTooltip → ChartInspect

`ChartTooltip` is renamed `ChartInspect`. Its props are the same: `children`, `excludeDataKeys`, `highlightBy`, and `targets`. It works as a child of the same marks. See [ChartInspect](/react-spectrum-charts/s2/docs/docs/interaction#chartinspect).

```tsx
// Before
<Line dimension="month" metric="visitors" color="device">
  <ChartTooltip>{(datum) => <div>{datum.visitors} visitors</div>}</ChartTooltip>
</Line>

// After
<Line dimension="month" metric="visitors" color="device">
  <ChartInspect>{(datum) => <div>{datum.visitors} visitors</div>}</ChartInspect>
</Line>
```

The children function no longer receives a second argument. S1's `TooltipHandler` was `(datum, hoverType) => ReactNode`; S2's `InspectHandler` is `(datum) => ReactNode`.

On `Line`, adding `ChartInspect` turns off the built-in [hover label](/react-spectrum-charts/s2/docs/docs/line#hover).

`ChartPopover` is unchanged. See [ChartPopover](/react-spectrum-charts/s2/docs/docs/interaction#chartpopover).

## Removed components

| S1 component | Where it went in S2 |
| --- | --- |
| `ChartTooltip` | Renamed `ChartInspect`. See [above](#charttooltip--chartinspect). |
| `MetricRange` | `Line`'s `metricRanges` prop. See [Metric ranges](/react-spectrum-charts/s2/docs/docs/line#metric-ranges). |
| `Annotation` (Bar labels) | `BarDirectLabel`, for value labels. See [BarDirectLabel](/react-spectrum-charts/s2/docs/docs/bar#bardirectlabel). |
| `AxisAnnotation` | Not available. |
| `BigNumber` | Not available. |
| `Venn` | Not available. |

### MetricRange

`MetricRange` children become objects in `Line`'s `metricRanges` array. `metricStart` and `metricEnd` are required, and `color`, `lineType`, `lineWidth`, `rangeOpacity`, `metric`, `displayOnHover`, and `scaleAxisToFit` keep their S1 names. S2 doesn't support `lineOpacity`, `hoverPoint`, `displayOnHoverTrigger`, or the `'metric'` and `'range'` values of `displayOnHover`; `displayOnHover` is `true` or `false`.

```tsx
// Before
<Line dimension="datetime" metric="value">
  <MetricRange metricStart="low" metricEnd="high" displayOnHover />
</Line>

// After
<Line dimension="datetime" metric="value" metricRanges={[{ metricStart: 'low', metricEnd: 'high', displayOnHover: true }]} />
```

### Bar Annotation

S1's `Annotation` drew a label on each bar from a `textKey` field. S2's `BarDirectLabel` labels each bar with its value, formatted with `format`. Text from a separate field isn't supported.

```tsx
// Before
<Bar dimension="browser" metric="downloads">
  <Annotation textKey="label" />
</Bar>

// After
<Bar dimension="browser" metric="downloads">
  <BarDirectLabel />
</Bar>
```

## Line

| S1 | S2 |
| --- | --- |
| `onMouseOver`, `onMouseOut` | Removed. |
| `MetricRange` child | `metricRanges` prop. See [MetricRange](#metricrange). |
| `ChartTooltip` child | `ChartInspect` child. |
| `Trendline` child | Not supported. `Trendline` only works inside `Scatter`. |
| Fixed stroke width | Width scales with the chart's width. See [Size](/react-spectrum-charts/s2/docs/docs/line#size). |
| No hover label | `showHoverLabel` defaults to `true`. See [Hover](/react-spectrum-charts/s2/docs/docs/line#hover). |

New in S2: `gradient`, `interpolate`, `lineCap`, `alternateSegmentKey`, `alternateSegmentLineType`, `primarySeries`, `otherSeriesColor`, `dimensionHover`, `hoverLabelKey`, and the `LineDirectLabel`, `LineForecast`, and `ChartActionBar` children. See [Line](/react-spectrum-charts/s2/docs/docs/line).

## Bar

| S1 | S2 |
| --- | --- |
| `Annotation` child | `BarDirectLabel` child. See [Bar Annotation](#bar-annotation). |
| `Trendline` child | Not supported. See [Not supported yet](/react-spectrum-charts/s2/docs/docs/bar#not-supported-yet). |
| `ChartTooltip` child | `ChartInspect` child. |

`onMouseOver`, `onMouseOut`, and `onClick` still work. New in S2: `diverging`. See [Diverging](/react-spectrum-charts/s2/docs/docs/bar#diverging).

## Donut, DonutSummary, and SegmentLabel

These moved from `@adobe/react-spectrum-charts/rc` to `@spectrum-charts/react-spectrum-charts-s2`.

| S1 | S2 |
| --- | --- |
| `startAngle` | Removed. Use `variant="semicircle"` for a half donut. See [Semicircle](/react-spectrum-charts/s2/docs/docs/donut#semicircle). |
| `ChartTooltip` child | `ChartInspect` child. |
| Empty inspect or popover shows nothing | Shows the segment's color, name, share, and value. |

New in S2: `Donut` `variant`, `sortOrder`, `emphasizedItems`, and `hideDeemphasizedLabels`; `DonutSummary` `delta`; `SegmentLabel` `labelMode`, `swatch`, `showValueRow`, and `showTotal`. See [Donut](/react-spectrum-charts/s2/docs/docs/donut).

## Area, Scatter, Bullet, and Combo

These are lab components in S2: import them from `@spectrum-charts/react-spectrum-charts-s2/lab`. Their APIs may change between releases.

| Component | S1 | S2 |
| --- | --- | --- |
| `Area` | `ChartTooltip` child | `ChartInspect` child. |
| `Scatter` | `onMouseOver`, `onMouseOut` | Removed. |
| `Scatter` | `ChartTooltip` child | `ChartInspect` child. |
| `Trendline` | `displayOnHoverTrigger` | Removed. |
| `Trendline` | Child of `Line`, `Bar`, `Scatter` | Child of `Scatter` only. See [Trendline](/react-spectrum-charts/s2/docs/docs/scatter#trendline). |
| `Bullet` | `ChartTooltip` child | `ChartInspect` child. |

## Axis

| S1 | S2 |
| --- | --- |
| `hasPopover` | Removed. |
| `AxisAnnotation` child | Not available. |
| `ChartTooltip` child | Removed. Use `hasTooltip` and `tooltipText`. See [Label tooltips](/react-spectrum-charts/s2/docs/docs/axis#label-tooltips). |

New in S2: `onClick` for label clicks and `tooltipText`. See [Interaction](/react-spectrum-charts/s2/docs/docs/axis#interaction).

## ReferenceLine

S2 reference lines use a fixed Spectrum 2 style, so most styling props are gone. `value`, `position`, and `label` are unchanged.

| S1 | S2 |
| --- | --- |
| `color`, `lineType` | Removed. Use `secondary` for the lighter style. |
| `icon`, `iconColor` | Removed. |
| `labelColor`, `labelFontWeight`, `labelPosition` | Removed. |
| `layer` | Removed. |
| Not available | `size`, `secondary`. |

```tsx
// Before
<ReferenceLine value={100} label="Target" color="gray-500" lineType="dashed" icon="date" />

// After
<ReferenceLine value={100} label="Target" secondary />
```

See [ReferenceLine](/react-spectrum-charts/s2/docs/docs/axis#referenceline).

## Legend

| S1 | S2 |
| --- | --- |
| `_labelWrap`, `_preferredColumns`, `_maxRows` | Removed. |
| Top and bottom legends centered by default | Left-aligned by default (`align="start"`). |

Spectrum 2 aligns top and bottom legends to the start of the chart. Left and right legends are still centered. See [Position and alignment](/react-spectrum-charts/s2/docs/docs/legend#position-and-alignment).

## Title

`Title` is unchanged. New in S2: `fontSize`.

## Changed defaults

The S2 defaults are the recommended Spectrum 2 behavior. Don't keep an S1 default just to avoid a visual change. The last column says whether the S1 behavior can be kept.

If you're an agent applying this guide:

-   If a changed default can be turned off, tell the user what changed and ask whether to adopt the S2 default (recommended) or keep the S1 behavior. Change the code only to match their answer.
-   If a changed default can't be turned off, tell the user what changed. Don't ask, and don't try to recreate the S1 behavior.

| Prop | S1 | S2 | Keep the S1 behavior |
| --- | --- | --- | --- |
| `Chart` `colors` | `categorical16` | `s2Categorical20` | Not possible. Remove S1 palettes. |
| `Legend` `align` (top and bottom) | `middle` | `start` | `align="middle"` on `Legend`. |
| `Line` stroke width | Fixed | Scales with chart width | Not possible. |
| `Line` hover label | None | Shown (`showHoverLabel`) | `showHoverLabel={false}`. |
| Draw-in animation | None | On (`animationTypes`) | `animationTypes={['hover']}`. To turn off all animation, `animations={false}`. |
| `Donut` inspect and popover content | Empty | Default segment details | Not possible. Pass children to show your own content. |
| `Donut` segment order | Data order | Largest first | `sortOrder="data"`. |

Charts with `s2` already used `s2Categorical20`.

## Behavior changes

-   `Chart` props explicitly set to `undefined` fall back to their defaults instead of overriding them.
-   Charts render their own S2 `Provider` with the chart's `colorScheme`, so they don't read an outer React Spectrum v3 `Provider`.
-   Hover fades and draw-in animate by default. Draw-in plays once per mount and is skipped when the user prefers reduced motion. See [Changed defaults](#changed-defaults) and [Animation](/react-spectrum-charts/s2/docs/docs/guides/animation).

## Checklist

-   [ ]  Install `@spectrum-charts/react-spectrum-charts-s2`, `@react-spectrum/s2`, and `react-aria-components`, and upgrade to React 19 and Node 22.12 or later.
-   [ ]  Change imports to `@spectrum-charts/react-spectrum-charts-s2`, and import `Area`, `Scatter`, `Bullet`, `Combo`, `Trendline`, and their children from `@spectrum-charts/react-spectrum-charts-s2/lab`.
-   [ ]  Configure Jest to transform the package. See [Testing and troubleshooting](/react-spectrum-charts/s2/docs/docs/guides/testing-and-troubleshooting#jest).
-   [ ]  Remove `s2` and `theme` from `Chart`.
-   [ ]  Remove S1 palettes such as `categorical16` from `colors`.
-   [ ]  Rename `ChartTooltip` to `ChartInspect`, and drop any use of the `hoverType` argument.
-   [ ]  Rebuild popover and inspect content with `@react-spectrum/s2` components.
-   [ ]  Replace `MetricRange` with `metricRanges` on `Line`.
-   [ ]  Replace bar `Annotation` with `BarDirectLabel`.
-   [ ]  Remove `AxisAnnotation`, `BigNumber`, `Venn`, and `Trendline` under `Line` or `Bar`.
-   [ ]  Remove `onMouseOver` and `onMouseOut` from `Line` and `Scatter`.
-   [ ]  Remove `ReferenceLine` styling props; use `secondary` or `size`.
-   [ ]  Replace Donut `startAngle` with `variant="semicircle"` or remove it.
-   [ ]  Remove Legend `_labelWrap`, `_preferredColumns`, and `_maxRows`.
-   [ ]  Check line widths at your chart sizes.
-   [ ]  For each [changed default](#changed-defaults), ask the user whether to adopt the S2 default (recommended) or keep the S1 behavior where that's possible. Otherwise, tell them what changed.
