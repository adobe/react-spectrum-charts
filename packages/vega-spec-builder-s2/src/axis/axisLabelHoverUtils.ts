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

import { DIMENSION_HOVER_AREA, HOVERED_ITEM, FADE_FACTOR } from '@spectrum-charts/constants';

import { InteractiveMark } from '../types';

type MatchedInteractiveMark = Required<InteractiveMark>;

/**
 * Returns the Vega mark name to stamp onto an axis's primary label encode block so that
 * hover/mouseout events can be bound to it via `@<name>:mouseover` event selectors.
 */
export const getAxisLabelHoverMarkName = (axisName: string): string => `${axisName}_labelHover`;

/** Filters `usermeta.interactiveMarks` to entries matching this axis's dimension field. */
export const getMatchingInteractiveBarDimensionFields = (
  interactiveMarks: InteractiveMark[] = [],
  scaleField: string | undefined
): MatchedInteractiveMark[] => {
  if (!scaleField) return [];
  return interactiveMarks.filter(
    (mark): mark is MatchedInteractiveMark => mark.dimension === scaleField
  );
};

/**
 * Appends mouseover/mouseout handlers onto each matching bar's existing dimension-hover-area signal.
 * Never creates the signal itself, so this is a no-op for non-interactive bars.
 */
export const addAxisLabelHoverSignalWiring = (
  signals: Signal[],
  matchingBars: MatchedInteractiveMark[],
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
 * Fade rule for axis labels, keyed on the same dimension-hover-area signal(s) the bars fade on.
 * Intentionally ignores item-level bar hover - a single hovered segment isn't "this category is hovered."
 */
export const getAxisLabelDimensionFillOpacity = (
  matchingBars: MatchedInteractiveMark[]
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
