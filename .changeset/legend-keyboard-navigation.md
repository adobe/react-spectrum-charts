---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
---

Add keyboard navigation for the S2 legend. With `accessibleNavigation` on, the legend for the navigable mark's series is its own navigation region, reached with the arrow pointing toward its position.

- `Enter` drills into series, and `Enter` again drills into that series' marks.
- Arrow keys follow the legend's rendered rows and columns for every legend position.
- `Space` does what clicking the legend entry does: opens its popover, calls `onClick`, or toggles the series.
- `Shift+F10` or the `ContextMenu` key is the keyboard right-click: it opens `rightClick` popovers on legend series and marks, and calls the mark's `onContextMenu`.
- A focused series gets a focus ring on its legend entry, shows its description tooltip, and gets the legend's hover highlight.
- The legend's `onMouseOver`/`onMouseOut` fire as keyboard focus enters and leaves a series, so controlled legends (`highlightedSeries`) follow focus.
- Toggled-off series can't be drilled into, and chart content navigation skips their marks.
- A series reads the legend's title and its displayed label (`legendLabels`), then its `descriptions` entry and its marks; the legend reads its series count and how many are hidden.
- Focus returns to the same node after the chart re-renders. After a toggle, the restored entry's name says what changed (e.g. "Operating system: Windows. Hidden."), so a screen reader announces it once.
