# Sizing

A chart fills the width of its container and is 300px tall unless you set `width` and `height` on `Chart`. This page covers how those props work together. See [Size](/react-spectrum-charts/s2/docs/docs/chart#size) for a live example and the [Chart API](/react-spectrum-charts/s2/docs/docs/chart#api) for each prop.

## Width

`width` takes one of:

-   `'auto'` (default): the container's width.
-   A number of pixels, like `600`.
-   A whole-number percentage of the container's width, like `'75%'`.

`Chart` watches its container with a `ResizeObserver`, so `auto` and percentage widths follow the container as it resizes. Resizing updates the chart in place; it doesn't redraw it or replay the draw-in animation.

`minWidth` (default `100`) and `maxWidth` (default none) clamp `auto` and percentage widths. They don't change a pixel `width`.

```tsx
<Chart data={data} maxWidth={960}>
  {/* ... */}
</Chart>
```

> **Note:**
> 
> A chart in a container with no width, like one inside an element with `display: none`, isn't drawn. It draws when the container gets a width.

## Height

`height` takes a number of pixels (default `300`) or a whole-number percentage of the container's height, like `'100%'`. There's no `auto` height.

A percentage height needs a container with an explicit height. The chart can't measure a container that's sized by its content, and isn't drawn.

```tsx
<div style={{ height: 400 }}>
  <Chart data={data} height="100%">
    {/* ... */}
  </Chart>
</div>
```

`minHeight` (default `100`) and `maxHeight` (default none) clamp a percentage height. They don't change a pixel `height`.

## What the size includes

`width` and `height` are the size of the whole chart: axes, legend, title, and `padding`. The plot area gets the space that's left, so adding a legend or a title makes the plot smaller.

`padding` adds space between the chart's edge and its contents, as one number or per side, like `{ top: 8, left: 16 }`. See [Padding](/react-spectrum-charts/s2/docs/docs/chart#padding).

## Size tiers

Some styles scale with the chart's width, in three tiers:

| Tier | Chart width | Line stroke | Line points | Direct label text |
| --- | --- | --- | --- | --- |
| S | Under 400px | 1.5px | 6px | 14px |
| M | 400px to 799px | 2px | 8px | 16px |
| L | 800px and over | 2.5px | 10px | 18px |

The tier applies to line strokes and their hover and highlight states, line points, and the text of `LineDirectLabel`, `BarDirectLabel`, and `ReferenceLine` labels. It updates as the chart resizes. To fix a size instead, set `pointSize` on `Line` or `fontSize` on `LineDirectLabel`. See [Line size](/react-spectrum-charts/s2/docs/docs/line#size).

`Donut` sizes itself differently: its ring, labels, and `DonutSummary` scale with the smaller of the chart's width and height (twice the height for a semicircle). See [Donut size](/react-spectrum-charts/s2/docs/docs/donut#size).
