# Chart region

`dataNavigator/chartRegion.ts` handles chart content nodes. It picks a `ChartNavStrategy` from `chartNavStrategies[chartType]` and runs a `StrategyContext` (`markName`, `dimension`, series `color`, `metric`) through it.

## Focus

`nodeFocusSignals(node)` maps a node to the spec's focus signals:

| Node                             | Signal set                                   | Ring shown                                            |
| -------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| region root (`dimensionLevel` 1) | `FOCUSED_REGION = 'chart'`                   | `chartFocusRing` around the plot                      |
| division (`dimensionLevel` 2)    | `FOCUSED_DIMENSION = toNavigationKey(value)` | the mark's group ring (bar: `${name}_stackFocusRing`) |
| leaf                             | `FOCUSED_ITEM = node.id`                     | the mark's ring (bar: `${name}_focusRing`)            |

On focus the strategy also applies the "focused" look (`applyFocusedLook`, the mark's real hover signals, so other marks dim exactly as on hover) and then shows the tooltip:

- leaf: `showLeafTooltip` with the full datum when the mark has a `ChartInspect`, else only the axis/legend-titled fields (`fieldLabels`)
- division: `showDivisionTooltip` (the dimension-area `ChartInspect`/popover target)
- root: hides it

`getBounds` sizes the `.dn-node` overlay to the focused mark so screen magnifiers follow focus. `restoreSignals` (`strategy.getHoverSignals`) are the signals the mouse can clear.

## Keys

| Key                                          | Leaf              | Division                                    | Root     |
| -------------------------------------------- | ----------------- | ------------------------------------------- | -------- |
| Enter                                        | activate          | drill in                                    | drill in |
| Space                                        | activate          | division popover (`resolveDivisionPopover`) | nothing  |
| Shift+F10 / ContextMenu (`isContextMenuKey`) | `openContextMenu` | nothing                                     | nothing  |

- **activate**: `findLeafRow` → `resolveLeafPopoverBounds` → `openPopover` (sets the `selectedData*` refs and `keyboardPopoverComponentName`, calls `triggerPopover(chartId, markName, 'click')`, then `keepFocusThroughPopover` and `SELECTED_ITEM`), then `onNodeClick` — the same pair a real click runs.
- **openContextMenu**: `findLeafSceneItem`; if a `rightClick` popover button exists, keep focus through it; then `dispatchViewEvent(view, 'contextmenu', item, contextMenuEventAt(bounds))`, a synthetic event at the mark's center.

## Clicks

`findNode(item)` maps a clicked scene item to a leaf id via `getNodeIdForDatum`, falling back to a nested `datum.datum` (overlay marks such as voronoi cells wrap the real row). `getClickPopover` returns the mark name when it has a `ChartPopover`, so the session keeps focus through it.

## Other regions use it

- The axis region calls `highlightDimension(node)` to highlight a category like hovering its label.
- Legend item nodes delegate `getBounds`, `focus`, `handleKey`, `getClickPopover` and `restore` to the chart region with the matching content node.
