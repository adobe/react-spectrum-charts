# Architecture

## Layers

```
vega-spec-builder-s2                    focus signals + rings in the Vega spec, navigation + legend usermeta
  ↓ spec
hooks/useDataNavigator.ts (React)       maps usermeta, data and actions to NavigationInputs
  ↓ inputs, view
navigationController.ts                 keeps one session mounted; remounts and restores focus
  ↓
navigationSession.ts                    builds the structure, mounts data-navigator, routes keys and clicks to regions
  ↓
regions: chartRegion / axisRegion / legendRegion   what focusing and activating a node does
  ↓
chartNavStrategy (barNavStrategy, …)    everything about chart content that differs by chart type
```

Everything under `react-spectrum-charts-s2/src/dataNavigator/` is framework-agnostic: ESLint bans React imports in `dataNavigator/**/*.ts`. Only `useDataNavigator.ts` and `RscChart.tsx` touch React. Keep new logic out of the hook: anything derived from mark, axis or legend options belongs in the spec builder's `usermeta.navigation`. The hook only adds data, locale, title and actions (onClick, popovers, selection) and hands the controller the container and view.

## Structure

`buildChartStructure.ts` builds a [data-navigator](https://github.com/cmudig/data-navigator) `Structure` (nodes, edges, navigation rules):

- A content structure per chart type (`contentStructureBuilders`, e.g. `buildBarStructure`).
- Optional `xAxis` (`buildAxisStructure`) and `legend` (`buildLegendStructure`) regions.
- `composeRegions` merges them. Content node ids stay raw because the spec's focus-ring tests compare them directly; auxiliary regions are namespaced (`legend::…`, `xAxis::…`, via `prefixed`). Every node carries its `region`.
- `getRegionLinks` joins region roots spatially: Down from content goes to the x-axis; the legend is reached with the arrow toward its `position` (a bottom legend sits below the x-axis).
- `navigationRules.ts`: Enter is `child`, Escape is `parent`. `getBaseNavigationRules(orientation)` rebinds arrows for horizontal charts without touching the graph.

Node levels: `dimensionLevel` 1 is a region root, 2 a division (a stack or category), and a missing `dimensionLevel` is a leaf (one mark).

## Session

`mountNavigationSession` (one view, one structure):

- Renders the invisible `.dn-node` overlays, the entry button and the exit element. The visible look is canvas rings and DOM rings, never the overlay itself.
- Creates the regions and dispatches to them by `node.region` (`regionFor`). A focused node's keydown goes to `region.handleKey` first; unhandled keys fall through to data-navigator moves.
- Escape first dismisses a visible tooltip (WCAG 1.4.13), then drills out.
- Focus leaving the widget clears only the visuals (`clearFocusVisuals`); the node stays so Shift+Tab returns to it. Only the exit element fully clears focus.
- `suppressNextLeave` / `keepFocusThroughPopover`: opening a popover moves focus into it, which looks like leaving. Every path that opens a popover must call it so the node survives for React Spectrum's focus restore.
- `mousedown` on a mark moves keyboard focus to the matching node (`region.findNode`), before the click opens its popover. Hover never moves focus.
- `guardFocusedLookAgainstMouseClear`: a real mouseout nulls hover signals; the focused node's region `restore`s its look while focus is inside.

## Controller and focus restore

`createNavigationController(container, chartId)` exposes `update(inputs)`, `setView(view)` and `destroy()`:

- `getStructureKey` ignores the action refs (`ACTION_KEYS`), so changing a callback or popover ref just calls `session.setActions`. Any other input change remounts.
- It also remounts on a new view and on the `hiddenSeries` signal (a legend toggle changes the structure without a new view; it waits for `view.runAfter`).
- On remount with focus inside, it reads `session.getFocusedNode()`, destroys with `handOff` (keeps the look so nothing flickers), waits for `view.runAsync()`, mounts, then `restoreFocus(node)`. If the node no longer exists, focus goes to the entry button.
- `restoreFocus` reads `region.getRestoredLabel(node, previous)` once when it returns a label (e.g. a legend series' "Hidden." / "Shown."); otherwise the node's usual name is re-read. `getFocusedNode` returns the pre-rebuild node until the next key press, so a change across several rebuilds is still announced.

## Spec builder

`vega-spec-builder-s2/src/accessibleNavigation/`:

- `focusRingUtils.ts`: shared ring constants, `getFocusRingStroke(colorScheme)` (`blue-800`, 2px, transparent fill) and `toNavigationKey` (keys values with JS `String()`, which Vega's `toString` doesn't match for `''`/`null`).
- `accessibleNavigationSpecBuilder.ts`: `buildSpec` calls `addAccessibleNavigation` once, after the marks, when `accessibleNavigation` is on and `hasNavigableMark(marks)`. It adds the `FOCUSED_ITEM`, `FOCUSED_REGION` and `FOCUSED_DIMENSION` signals and the `chartFocusRing` mark. Add a mark type to `NAVIGABLE_MARK_TYPES` when it becomes navigable.
- Mark-specific rings stay with the mark (`bar/barFocusRingUtils.ts`: `${name}_focusRing`, `${name}_stackFocusRing`) and use the shared stroke and offsets.
- `navigableChartUtils.ts`: `getNavigableChart` records `usermeta.navigation` (`NavigableChart`) from the first navigable mark with its defaults applied: the mark's spec name, series fields, axis/legend field labels, dual-axis titles and the bottom-axis region. `addAccessibleNavigation` writes it.
- Legends record `usermeta.legends[]` (`NavigableLegend`) only when `accessibleNavigation` is on (`addUserMetaNavigableLegend`); `RscChart` passes them and `usermeta.navigation` to the hook.

DOM rings (`.dn-axis-focus-ring`, `.dn-legend-focus-ring` in `dataNavigator.css`) use the same `--spectrum-blue-800`, 2px, 6px radius look as the canvas rings.

## Rules

- **Mirror the mouse, don't reimplement it.** Keyboard actions go through the chart's real handlers: hover signals, `triggerPopover` / the popover's DOM button, and `dispatchViewEvent(view, type, item, event)` from `utils/viewEvents.ts`, which reaches every listener `useNewChartView` registered. Never call a prop callback directly when a view event exists for it.
- **Signals can be missing.** A rebuilding or finalized view may not have the focus or hover signals; wrap `view.signal` in try/catch (see `applyFocusSignals`).
- **One dataflow pulse.** Set hover/look signals before `applyFocusSignals`'s `runAsync()` so both flush together.
- **Chart-agnostic regions.** The session, axis and legend regions never branch on chart type; that belongs in a `ChartNavStrategy` or a content structure builder.
- Update `keyboard-navigation.md` and add a changeset for consumer-visible changes.
