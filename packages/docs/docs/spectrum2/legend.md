---
sidebar_position: 4
---

# Legend (S2)

The `Legend` component in the S2 package supports all props from the [base Legend component](/docs/api/components/Legend) plus the S2-exclusive `align` prop for controlling legend alignment along its edge.

```jsx
import { Chart, Axis, Line, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
```

---

## Legend alignment

The `align` prop controls where the legend is anchored along its edge — start, middle, or end. The meaning of each value depends on the legend's `position`:

| `position` | `align: 'start'` | `align: 'middle'` | `align: 'end'` |
|---|---|---|---|
| `'bottom'` / `'top'` | left-aligned | centered (default) | right-aligned |
| `'left'` / `'right'` | top-aligned | centered (default) | bottom-aligned |

```jsx
<Chart data={data}>
  <Axis position="bottom" labelFormat="time" />
  <Axis position="left" grid />
  <Line color="series" />
  <Legend position="bottom" align="start" title="Operating system" />
</Chart>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `align` | `'start' \| 'middle' \| 'end'` | `'middle'` | Alignment of the legend along its edge. For horizontal legends (bottom/top): `'start'` = left, `'middle'` = center, `'end'` = right. For vertical legends (left/right): `'start'` = top, `'middle'` = center, `'end'` = bottom. |

---

## Hidden series indicator (S2)

S2 uses a different visual pattern for hidden series than S1.

|                  | S1                   | S2                                                    |
| ---------------- | -------------------- | ----------------------------------------------------- |
| Color swatch     | Grayed to `gray-300` | Replaced by chart background (swatch disappears)      |
| Label            | Grayed to `gray-500` | Stays at full opacity (`gray-700`)                    |
| Visual indicator | Color change only    | `VisibilityOff` icon overlaid on the swatch position  |

This applies when `isToggleable` is `true` (user-controlled) or when series are hidden via the controlled `hiddenSeries` prop on `<Chart>`.

```jsx
// Toggleable — clicking a legend entry shows the eye icon
<Chart data={data}>
  <Line color="series" />
  <Legend isToggleable />
</Chart>
```

The icon is rendered as a React overlay (not inside the Vega SVG) and repositions automatically on chart resize.
