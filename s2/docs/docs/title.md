# Title

**Stage:** Alpha

`Title` adds a title to a chart. Add it as a child of `Chart`, alongside the marks; it works with every chart type.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Title text="Visitors by browser" />
  <Bar dimension="browser" metric="count" />
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `text` on `Title`: any text. Shown: `Visitors by browser`.
-   `position` on `Title`: `start`, `middle` or `end`. Shown: `start`.
-   `orient` on `Title`: `top`, `bottom`, `left` or `right`. Shown: `top`.
-   `fontWeight` on `Title`: `300`, `400`, `700` or `900`. Shown: `700`.
-   `fontSize` on `Title`: 12 to 32, in steps of 1. Shown: `24`.

## Data

`Title` doesn't read the chart's data. The examples on this page use a `Bar` chart of `browserData`:

```ts
const browserData = [
  { count: 10390, browser: 'Chrome' },
  { count: 8281, browser: 'Firefox' },
  { count: 7045, browser: 'Safari' },
  { count: 6166, browser: 'Opera' },
  { count: 4201, browser: 'Other' },
];
```

```tsx
<Chart data={browserData}>
  <Title text="Visitors by browser" />
  <Bar dimension="browser" metric="count" />
</Chart>
```

## Placement

-   `orient` picks the side of the chart the title is on: `top` (default), `bottom`, `left`, or `right`. Left and right titles are rotated to read along the side.
-   `position` aligns the title along that side: `start` (default), `middle`, or `end`. On a top or bottom title, `start` is the left edge of the plot.

The title is aligned to the plot area, not the whole chart, so a `start` title lines up with the left edge of the plot rather than the axis labels.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Title text="Visitors by browser" position="middle" />
  <Bar dimension="browser" metric="count" />
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `orient` on `Title`: `top`, `bottom`, `left` or `right`. Shown: `top`.
-   `position` on `Title`: `start`, `middle` or `end`. Shown: `middle`.

## Font

`fontWeight` and `fontSize` set the title's text style. The defaults are `700` and `24`. Any CSS font weight works, such as `400`, `'normal'`, or `'bold'`.

```jsx
import {
  Axis,
  Bar,
  Chart,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData}>
  <Title text="Visitors by browser" fontWeight={400} fontSize={18} />
  <Bar dimension="browser" metric="count" />
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `fontWeight` on `Title`: `300`, `400`, `700` or `900`. Shown: `400`.
-   `fontSize` on `Title`: 12 to 32, in steps of 1. Shown: `18`.

## Size

The title takes space from the chart, so the plot shrinks to fit it. A larger `fontSize`, or a title on the left or right, leaves less room for the plot.

## Chart title prop

`title` on `Chart` also draws a title, using a smaller theme style you can't change. A `Title` child replaces it. Use `Title` when you need to set the title's placement or font.

```jsx
import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

<Chart data={browserData} title="Visitors">
  <Bar dimension="browser" metric="count" />
  <Axis position="left" grid />
  <Axis position="bottom" baseline />
</Chart>
```

The interactive example has these controls. The code above uses the shown values.

-   `title` on `Chart`: any text. Shown: `Visitors`.
-   `Title`: included or left out. Shown: left out.

> **Note:**
> 
> A chart shows one title. If there's more than one `Title`, only the first is used. Subtitles, title color, and the spacing between the title and the plot aren't supported.

## API

### Title

| Prop | Type | Default |
| --- | --- | --- |
| `fontSize` — Font size of the title text in pixels. | `number` | `24` |
| `fontWeight` — Font weight of the title text. | `FontWeight` | `'bold'` |
| `orient` — Side of the chart the title is drawn on. | `"top" \| "bottom" \| "left" \| "right"` | `'top'` |
| `position` — Where the title sits along its side of the chart: `'start'`, `'middle'`, or `'end'`. | `"start" \| "end" \| "middle"` | `'middle'` |
| `text`required — Title text. | `string` | – |
