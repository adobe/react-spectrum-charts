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
import { NumericValueRef, ProductionRule, Signal } from 'vega';

import { DIMENSION_HOVER_AREA, FADE_FACTOR, HOVERED_ITEM } from '@spectrum-charts/constants';

/**
 * Returns the Vega mark name to stamp onto an axis's primary label encode block so that
 * hover/mouseout events can be bound to it via `@<name>:mouseover` event selectors.
 */
export const getAxisLabelHoverMarkName = (axisName: string): string => `${axisName}_labelHover`;

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
  barDimensionFields: { name: string; dimension: string }[],
  scaleField: string | undefined,
  axisLabelMarkName: string
): Signal[] => {
  if (!scaleField) return signals;

  const matchingBars = barDimensionFields.filter(({ dimension }) => dimension === scaleField);
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
  barDimensionFields: { name: string; dimension: string }[],
  scaleField: string | undefined
): ProductionRule<NumericValueRef> => {
  const matchingBars = barDimensionFields.filter(({ dimension }) => dimension === scaleField);
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
