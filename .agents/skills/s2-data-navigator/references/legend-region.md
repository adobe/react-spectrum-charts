# Legend region

`dataNavigator/legendRegion.ts`, built from `buildLegendStructure`. It works for any navigable chart type.

## Which legend

The spec builder records each legend in `usermeta.legends[]` (`NavigableLegend`: `name`, `entryFields`, `colorField`, `position`, `highlight`, `title`, `labels`, `descriptions`). The session's `pickLegend` uses the first legend whose `colorField` is undefined or equals the mark's `color`. Charts without a series get no legend region.

Series come from the rendered legend entries in layout order (`getLegendEntries`), falling back to the data. An entry value joins its `entryFields` with `" | "`, so multi-field series and legends with `keys` work.

## Levels

| Level  | Node                             | Ring and look                                                                                                                     |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| root   | `legend::root`                   | DOM ring (`.dn-legend-focus-ring`) around the whole legend                                                                        |
| series | one per entry                    | DOM ring around the entry, its `descriptions` tooltip, the legend's hover signal (`${name}_hoveredSeries`) when `highlight` is on |
| item   | one per chart mark in the series | delegates to the chart region with the content node                                                                               |

Hidden series (`hiddenSeries` signal) stay as series nodes, read as hidden, and have no items. Chart content skips their marks.

## Keys and events

- Series arrows use the rendered grid (`findLegendNeighbor` in `legendGeometry.ts`), not structure edges: along the layout direction they walk entries and wrap rows/columns; across it they move only to a directly adjacent entry.
- Space dispatches `'click'` on the entry's scene item, so the legend's own popover, `onClick` and `isToggleable` toggle all run. Shift+F10 dispatches `'contextmenu'` at the entry's center. Both keep focus through any legend popover.
- Focusing a series dispatches `mouseover`, and leaving it `mouseout`, through the legend's real handlers. The hovered series is tracked per container (`hoveredSeriesByContainer`) so the pair matches across remounts; a controlled `highlightedSeries` follows focus.
- Clicking an entry (group, symbol or label) moves focus to its series (`findNode`).

## Toggling

A toggle changes `hiddenSeries`. The controller remounts after `view.runAfter`, restores focus to the same series, and `getRestoredLabel` reads its toggled name ("… Hidden." / "… Shown.") once.
