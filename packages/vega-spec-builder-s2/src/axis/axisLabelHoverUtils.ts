/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Data, NumericValueRef, ProductionRule, Signal } from 'vega';

import { DIMENSION_HOVER_AREA, HOVERED_ITEM, FADE_FACTOR } from '@spectrum-charts/constants';

/**
 * Returns the Vega mark name to stamp onto an axis's primary label encode block so that
 * hover/mouseout events can be bound to it via `@<name>:mouseover` event selectors.
 */
export const getAxisLabelHoverMarkName = (axisName: string): string => `${axisName}_labelHover`;

/**
 * Matches this axis's dimension field (`scaleField`) against every interactive Bar in the already-built
 * spec, without any cross-builder metadata channel (e.g. usermeta). Bar marks don't carry their dimension
 * field as a directly readable property, but every stacked/dodged bar unconditionally creates a named,
 * plain-data aggregate source keyed by that field:
 *   - `${barName}_stacks` (stacked bars) - groupby includes the dimension (and trellis field, if any)
 *   - `${barName}_groups` (dodged bars)  - groupby is exactly [dimension]
 * created in barSpecBuilder.ts's addData (`getStackAggregateData`/`getDodgedGroupAggregateData`), regardless
 * of interactivity. A bar only counts as "interactive" here if its `${barName}_dimensionHoverArea_hoveredItem`
 * signal already exists (created in barSpecBuilder.ts's addSignals only when the bar is interactive).
 */
export const getMatchingInteractiveBarDimensionFields = (
  data: Data[],
  signals: Signal[],
  scaleField: string | undefined
): { name: string; dimension: string }[] => {
  if (!scaleField) return [];

  const matches: { name: string; dimension: string }[] = [];
  for (const source of data) {
    const barName = getMatchingInteractiveBarName(source, signals, scaleField);
    if (!barName) continue;
    if (matches.some((existing) => existing.name === barName)) continue;
    matches.push({ name: barName, dimension: scaleField });
  }
  return matches;
};

/**
 * Returns the bar name backing this data source if it's a `_stacks`/`_groups` aggregate source
 * grouped by `scaleField` AND the bar is interactive, otherwise undefined. Split out of
 * `getMatchingInteractiveBarDimensionFields` to keep cognitive complexity down.
 */
function getMatchingInteractiveBarName(source: Data, signals: Signal[], scaleField: string): string | undefined {
  if (!source.name) return undefined;
  const match = /^(.+)_(?:stacks|groups)$/.exec(source.name);
  if (!match) return undefined;

  const barName = match[1];
  const aggregateTransform = source.transform?.find((transform) => transform.type === 'aggregate');
  const groupby = aggregateTransform && 'groupby' in aggregateTransform ? aggregateTransform.groupby : undefined;
  const groupsByScaleField = Array.isArray(groupby) && groupby.includes(scaleField);
  if (!groupsByScaleField) return undefined;

  const hasInteractiveSignal = signals.some(
    (signal) => signal.name === `${barName}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`
  );
  return hasInteractiveSignal ? barName : undefined;
}

/**
 * Wires axis label mouseover/mouseout events into any Bar mark's existing dimension-hover-area
 * signal, so that hovering an axis label highlights bar(s) sharing that dimension value the same
 * way hovering the bar's own dimension area already does.
 *
 * This only appends `on` handlers to a signal that already exists (created by the bar spec builder
 * whenever the bar is interactive) - it never creates the signal itself, so axis label hover has no
 * effect on bars that aren't otherwise interactive.
 */
export const addAxisLabelHoverSignalWiring = (
  signals: Signal[],
  matchingBars: { name: string; dimension: string }[],
  axisLabelMarkName: string
): Signal[] => {
  for (const { name, dimension } of matchingBars) {
    const signalName = `${name}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;
    const signal = signals.find((s) => s.name === signalName);
    if (!signal) continue;

    signal.on = signal.on ?? [];
    const alreadyWired = signal.on.some((on) => on.events === `@${axisLabelMarkName}:mouseover`);
    if (alreadyWired) continue;

    signal.on.push(
      { events: `@${axisLabelMarkName}:mouseover`, update: `{ ${dimension}: datum.value }` },
      { events: `@${axisLabelMarkName}:mouseout`, update: 'null' }
    );
  }

  return signals;
};

/**
 * Returns a fillOpacity production rule for axis labels that fades every label except the one
 * matching the currently-hovered dimension value, mirroring the fade applied to bars by the same
 * dimension-hover-area signal(s). Reuses `datum.value` (the label's own dimension value) rather
 * than a named field, since that's how Vega represents an axis label's datum.
 *
 * Only reacts to the dimension-hover-area signal (axis label hover, or hovering the dimension area
 * on stacked/dodged bars) - direct item-level bar hover (`<bar>_hoveredItem`) is intentionally not
 * included, since a single hovered segment doesn't represent "this whole category is hovered."
 */
export const getAxisLabelDimensionFillOpacity = (
  matchingBars: { name: string; dimension: string }[]
): ProductionRule<NumericValueRef> => {
  const rules: ({ test?: string } & NumericValueRef)[] = matchingBars.map(({ name, dimension }) => {
    const signalName = `${name}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;
    return {
      test: `isValid(${signalName})`,
      signal: `${signalName}.${dimension} === datum.value ? 1 : ${FADE_FACTOR}`,
    };
  });
  rules.push({ value: 1 });
  return rules;
};
