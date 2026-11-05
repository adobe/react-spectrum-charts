# Adding a chart type

Line is the next one. Keep the session, axis region and legend region untouched; a new chart type plugs in at these points.

## Spec builder (`vega-spec-builder-s2`)

1. Add the mark type to `NAVIGABLE_MARK_TYPES` in `accessibleNavigation/accessibleNavigationSpecBuilder.ts`. That adds the focus signals and the chart ring.
2. Add the mark's own rings next to the mark (as `bar/barFocusRingUtils.ts` does), using `getFocusRingStroke`, `FOCUS_RING_OFFSET` and `toNavigationKey` from `accessibleNavigation/focusRingUtils.ts`. A leaf ring's opacity tests `FOCUSED_ITEM`; a division ring's tests `FOCUSED_DIMENSION`. Hide rings while an item is selected (`isValid(SELECTED_ITEM)`), as bar does.
3. If keyboard hover parity needs hover signals the mark only adds for interactive children, add them when `accessibleNavigation` is on.
4. Extend `getNavigableChart` in `accessibleNavigation/navigableChartUtils.ts` (and `NavigableChart` in `types/specUtil.types.ts`) to record the mark's navigation config with its defaults applied, including the mark's spec name (`toCamelCase(name || '<type>0')`).

## React (`react-spectrum-charts-s2/src/dataNavigator`)

1. `buildChartStructure.ts`: add a content builder to `contentStructureBuilders`, and leaf ids to `getNodeIdForDatum`. Leaf ids must equal what the mark's ring compares `FOCUSED_ITEM` against.
2. Write a `ChartNavStrategy` (`chartNavStrategy.ts` documents each method) and register it in `chartNavStrategies` in `chartRegion.ts`. Use `barNavStrategy.ts` as the model; `findLeafSceneItem` is needed for the keyboard right-click.
3. Add any new session inputs to `NavigationSessionOptions`. The hook spreads `usermeta.navigation` into the inputs, so it shouldn't need changes; don't read mark props from React children there.

## Then

- Update the "Bar charts only" caution and key table in `keyboard-navigation.md`.
- Add Coverage stories and tests under `src/dev/<Chart>/Coverage/AccessibleNavigation/` (see `testing.md`).
- Changeset: minor for the S2 pair.
