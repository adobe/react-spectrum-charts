---
sidebar_position: 5
---

# Keyboard Navigation (S2)

:::caution Work in progress
Keyboard navigation is an early, work-in-progress feature. It does not yet provide full chart accessibility or screen reader support — treat it as a keyboard-only enhancement, not a complete accessibility solution.
:::

:::caution Bar charts only
Keyboard navigation is currently only supported for `Bar` charts with a plain or stacked layout. Grouped (dodged) and trellis bar configurations, other mark types (Line, Area, Donut, Scatter, etc.), and legend/axis label navigation are not yet supported.
:::

Set `accessibleNavigation` on `Chart` to let keyboard users navigate bar chart content — individual bars, stacked segments, and their tooltips and popovers — without a mouse.

```jsx
<Chart data={data} accessibleNavigation>
  <Axis position="bottom" baseline title="Browser" />
  <Axis position="left" grid title="Downloads" />
  <Bar dimension="browser" color="operatingSystem">
    <ChartInspect>
      {(datum) => (
        <div>
          <div>Operating system: {datum.operatingSystem}</div>
          <div>Downloads: {datum.value}</div>
        </div>
      )}
    </ChartInspect>
    <ChartPopover>
      {(datum, close) => (
        <div>
          <div>Operating system: {datum.operatingSystem}</div>
          <button onClick={close}>Close</button>
        </div>
      )}
    </ChartPopover>
  </Bar>
</Chart>
```

---

## Keyboard interactions

| Key | Action |
|---|---|
| `Tab` | Focuses the "Enter navigation area" affordance, shown at the top-left of the chart |
| `Enter` | Enters the navigation area, or drills into the focused stack |
| `Escape` | Drills back out one layer; at the top level, exits the navigation area |
| `Arrow Right` / `Arrow Down` | Moves to the next sibling (bar, stack, or segment) |
| `Arrow Left` / `Arrow Up` | Moves to the previous sibling |
| `Space` | Opens the `ChartPopover` for the focused bar, segment, or stack, if one is configured |

Right and Down behave identically, as do Left and Up. Navigation does not wrap — arrowing past the last item stays there — and arrowing through a stack's segments never spills into the next stack.

Bars and segments with a value of exactly `0` are excluded from navigation, since they render invisibly and a mouse could never reach them either.

---

## Focus and hover parity

A keyboard-focused bar drives the same signals real mouse hover drives, so keyboard and mouse interactions look identical: other bars dim the same way, the real `ChartInspect` tooltip appears with the same content and positioning, and `Space` opens the real `ChartPopover` through the same trigger a click uses.

---

## Stacked bars

For a stacked `Bar` (`color` set), navigation has an extra layer: `Enter` on the chart root drills into a stack (column), and `Enter` again drills into an individual segment. `Escape` reverses this one layer at a time.

Focusing a stack — before drilling into a segment — shows the dimension-area tooltip or popover, if configured, the same one a mouse hovering the stack's exposed padding would show. See the `targets` prop on [`ChartInspect`](/docs/spectrum2/overview#chartinspect-props).
