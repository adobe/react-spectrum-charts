# s2-charts

A TypeScript implementation of Spectrum 2 **Line** and **Donut** charts, built from the
`S2 / Charts` design (Figma page 3816-108061, read from the `line.pdf` and `donut.pdf` exports).

- Runtime dependencies: d3 modules (`d3-array`, `d3-scale`, `d3-shape`, `d3-format`, `d3-time`,
  `d3-time-format`, `d3-interpolate`, `d3-ease`, `d3-delaunay`) and the `data-navigator` npm package.
- Everything drawn, including the title and legend, goes into one scene drawn by an **SVG** or a **Canvas**
  renderer, so what you see on screen matches PNG/SVG export. Tooltips, popovers and notices are HTML
  and aren't exported.

## Architecture

```
src/
  core/            shared chart shell: layout, axes frame, title, legend, interaction state,
                   tooltip/popover, keyboard + screen reader (data-navigator), animation, export
    chart.ts       the shell (Chart class) – drives a ChartModule
    module.ts      the ChartModule contract
    assumptions.ts every design value not given by the spec (see below)
    cartesian/     axes and grid shared by cartesian chart types
  render/          scene graph + SVG and Canvas renderers
  charts/line/     line module: data → shapes, hit testing, nav tree, hover/selection looks, tweens
  charts/donut/    donut module (same contract)
```

A chart-type module only describes what is specific to that chart: its shapes, which axes and legend
entries it needs, which item is at a given position, its keyboard navigation tree, how hover and
selection look, and how its shapes animate. No module draws axes, legends or titles.

The scene has four layers: `back` (title, axes), `marks`, `front` (reference lines, legend) and
`overlay` (hover and selection visuals). Each layer redraws only when its inputs change, so moving the
pointer redraws just the overlay. The legend, title and keyboard focus targets are
lightweight HTML elements placed over the drawn entries; they're transparent and only handle focus and
interaction.

## Quick start

```ts
import { createLineChart } from 's2-charts';

const chart = createLineChart(document.getElementById('chart')!, {
  title: 'Visits by browser',
  data, // [{ date: '2024-07-01', browser: 'Chrome', visits: 5_200_000 }, ...]
  x: 'date',
  y: 'visits',
  series: 'browser',
  yAxis: { format: 'compact' },
  directLabels: { category: 'end' },
});

chart.update({ renderer: 'canvas', theme: 'dark' });
chart.destroy();
```

The chart fills its container. If the container has no height, it defaults to 360px
(48px for minimal charts). You can also pass `width` and `height`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Demo gallery at http://localhost:5173 |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run build` | Library bundle (`dist/s2-charts.js`) and types (`dist/types`) |
| `npm run build:demo` | Static demo in `dist-demo/` |

## Options

Accessors are a field name or a `(datum, index) => value` function.

| Option | Description |
| --- | --- |
| `data`, `x`, `y` | Rows and accessors. `x` may be dates (ISO strings or `Date`), numbers, or categories. Scale type is inferred; override with `xAxis.type`. |
| `series` | Field that identifies a line. Omit for a single line. |
| `color` | Field that drives color, when it differs from `series` (e.g. highlight two games, gray "Other"). |
| `lineStyle`, `lineStyles` | Field driving solid / dashed / dotted, e.g. `{ '2023': 'dashed' }` for year over year. |
| `estimated` | Boolean field. Segments touching an estimated point are dotted (forecasts). |
| `facet`, `layout: 'trellis'`, `facetColumns` | Small multiples with shared scales. |
| `renderer` | `'svg'` (default) or `'canvas'`. |
| `theme` | `'light'`, `'dark'` or `'auto'`. Forced-colors mode is detected automatically. |
| `size` | `'L'` (default), `'M'` or `'S'`; sets line width and type scale. |
| `palette`, `colors`, `seriesStyles` | Color overrides and per-series `{ color, lineStyle, area, shape }`. |
| `curve` | `'linear'` (default) or `'monotone'`. |
| `points` | `'auto'` (shown when sparse or around gaps), `'all'` or `'none'`. `shapes: true` varies the marker shape per series. |
| `area` | Gradient fill under the line. |
| `title`, `subtitle`, `description` | Header text. `description` replaces the generated screen-reader summary. |
| `legend` | `true` or `{ position, title, swatch: 'square' \| 'line', hidden }`. Shown by default when there are several lines and no category labels. Click to toggle a line; hover to highlight. |
| `directLabels` | `true` or `{ category: 'end' \| 'start' \| false, value: 'end' \| false, include }`. |
| `xAxis`, `yAxis` | `{ title, format, ticks, grid, domain, zero, nice, hidden }`. `yAxis.position` is `'right'` (default) or `'left'`. `format` accepts d3 specifiers plus `'compact'` / `'$compact'` (9.5M, $400M). |
| `y2Axis` | Secondary axis `{ series: [...] , ...AxisOptions }`. |
| `referenceLines` | `[{ axis, value, label, kind: 'primary' \| 'secondary' }]`. Primary is a target line with end triangles. |
| `ranges` | Shaded bands `[{ axis, from, to, label }]`. |
| `annotations` | Callouts `[{ x, series?, y?, text, side? }]`. |
| `trendline` | `true` or `{ series, label }`. Least-squares fit, listed in the legend. |
| `hover` | `'point'` (default: nearest point with a value label), `'x'` (all lines at a date with a crosshair) or `'none'`. |
| `tooltip` | `true` for the default tooltip, or `(ctx) => string \| Node`. |
| `selectable`, `popover` | Click or Enter selects a point. `popover(item, close)` renders an action dialog. |
| `state` | Controlled `{ hovered, selected, highlighted, hidden }`. Any key you pass is owned by you. |
| `animation` | `true`, `false` or `{ duration }`. Respects `prefers-reduced-motion`. |
| `locale` | d3 number and time locale definitions. |
| `minimal`, `endMarker`, `trailingLabel` | Sparkline building blocks. |

Callbacks: `onHover`, `onClick`, `onSelect`, `onHighlight`, `onLegendHover`, `onLegendClick`,
`onHiddenChange`.

Methods: `update(partial)`, `setData(data)`, `getState()`, `select(item)`,
`setHighlight(series)`, `setHidden(keys)`, `resize()`, `destroy()`.

### Sparklines

```ts
import { createSparkline } from 's2-charts';
createSparkline(el, { data, x: 'i', y: 'v', trailingLabel: '131K', average: true });
```

## Donut chart

```ts
import { createDonutChart } from 's2-charts';

createDonutChart(el, {
  title: 'More than 80% visitors are from mobile devices',
  data, // [{ device: 'Phone', visitors: 22_800 }, ...]
  category: 'device',
  value: 'visitors',
  center: { label: 'Visitors' },
  legend: { position: 'left' },
});
```

| Option | Description |
| --- | --- |
| `category`, `value` | Accessors for segments. Segments start at 12 o'clock and run clockwise, largest first (`sort: 'none'` keeps data order for ordinal data). |
| `variant` | `'full'` (default) or `'semicircle'`. |
| `center` | `{ value: 'total' \| 'primary' \| number \| string \| false, label, delta }`, or `false`. |
| `binary` | Two-segment donut with the second segment in neutral gray, or `{ secondary }`. |
| `benchmark` | `{ value, label, showValue, sentiment }`: a marker on the ring; the primary segment turns positive or negative. |
| `directLabels` | `true`, `'lightweight'`, `'advanced'` or `{ style, advanced: [...], include: [...] }`. |
| `facet`, `facetColumns`, `colorByFacet` | Trellis of donuts with a shared legend. |
| `thickness`, `maxDiameter` | Ring size; thickness is interpolated from the diameter by default. |
| `valueFormat`, `percentFormat` | d3-format specifiers. |
| `multiSelect` | Shift-click or Shift+Enter adds to the selection (default `true`). `onSelect` receives an array. |

Keyboard: Enter enters the donut at 12 o'clock and the arrow keys move clockwise. In a trellis,
↑/↓ move to the same category in the neighbouring donut.

## Export

```ts
chart.toSVG();             // string, including title and legend
await chart.toPNG(2);      // Blob
await chart.download('svg', 'chart.svg');
```

Export works the same with either renderer.

## Accessibility

- The chart is a `figure` labelled by its title and described by a generated summary.
- Keyboard navigation via data-navigator:
  - **Tab** focuses the chart and **Enter** moves into its lines.
  - **↑/↓** switch lines and **Enter** explores a line's values.
  - **←/→** step through values; **Home/End** jump to the first or last value.
  - **Enter** or **Space** selects a value; **Backspace** goes up a level; **Escape** returns to the chart.
- Every focusable node has a descriptive label, for example "Safari, May 15, 2024, 2.3M. 3 of 16."
- The legend uses real buttons with `aria-pressed`.
- The popover is a dialog that takes focus when opened from the keyboard, then returns focus to the point.
- Supports forced colors and reduced motion. Line style, point shapes and direct labels give cues that don't rely on color.

## Notes and assumptions

All design values the PDFs did not specify are in `src/core/assumptions.ts`. That includes dark-theme
colors, animation timings and easing, tooltip and popover layout, focus offsets, donut label offsets,
benchmark marker sizes, selection halo widths and export scale. Each value is commented, and you can
replace any of them in that one file.
