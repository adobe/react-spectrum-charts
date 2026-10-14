---
'@spectrum-charts/react-spectrum-charts-s2': minor
---

Add keyboard navigation for the S2 bar legend. With `accessibleNavigation` on, the legend is its own navigation region. Moving between regions is now spatial: from the chart root, the arrow pointing toward a region moves to it (Down for the bottom axis, the legend's side for the legend), and the opposite arrow comes back.

- `Enter` drills into series, and `Enter` again drills into that series' bars.
- Arrow keys follow the legend's rendered rows and columns for every legend position.
- `Space` does what clicking the legend entry does: opens its popover, calls `onClick`, or toggles the series.
- A focused series gets a focus ring on its legend entry, shows its description tooltip, and gets the legend's hover highlight.
- The legend's `onMouseOver`/`onMouseOut` fire as keyboard focus enters and leaves a series, so controlled legends (`highlightedSeries`) follow focus.
- Legends with `keys`, and series that span several fields (e.g. time comparisons with `color="series"` and `opacity="period"`), drill into every bar in the entry.
- `Shift+F10` or the `ContextMenu` key is the keyboard right-click: it opens `rightClick` popovers on legend series and bars, and calls the `Bar`'s `onContextMenu`.
- Toggled-off series can't be drilled into, and chart content navigation skips their bars.
- A series reads the legend's title and its displayed label (`legendLabels`), then its `descriptions` entry and its bars; the legend reads its series count and how many are hidden.
- Focus is restored after the chart re-renders. After a toggle, the restored entry's name says what changed (e.g. "Operating system: Windows. Hidden."), so a screen reader announces it once, even through follow-up re-renders.
