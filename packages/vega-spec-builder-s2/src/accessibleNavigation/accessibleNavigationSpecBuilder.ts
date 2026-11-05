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
import { produce } from 'immer';
import { RectMark, Signal } from 'vega';

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION } from '@spectrum-charts/core-s2/constants';

import { getGenericValueSignal } from '../signal/signalSpecBuilder.js';
import { AxisOptions, ColorScheme, LegendOptions, MarkOptions, ScSpec } from '../types/index.js';
import { FOCUS_RING_ROUNDED_RADIUS, getFocusRingStroke } from './focusRingUtils.js';
import { getNavigableChart } from './navigableChartUtils.js';

/** Mark types keyboard navigation supports */
const NAVIGABLE_MARK_TYPES = new Set<MarkOptions['markType']>(['bar']);

/**
 * Whether any of the chart's marks supports keyboard navigation.
 * @param marks
 * @returns boolean
 */
export const hasNavigableMark = (marks: MarkOptions[]): boolean =>
  marks.some((mark) => NAVIGABLE_MARK_TYPES.has(mark.markType));

/**
 * Gets the signals keyboard navigation writes the focused item, dimension and region to.
 * @returns Signal[]
 */
export const getFocusSignals = (): Signal[] => [
  getGenericValueSignal(FOCUSED_ITEM),
  getGenericValueSignal(FOCUSED_REGION),
  getGenericValueSignal(FOCUSED_DIMENSION),
];

/**
 * Gets the ring around the whole plot shown while the chart region is focused.
 * @param colorScheme
 * @returns RectMark
 */
export const getChartFocusRing = (colorScheme: ColorScheme): RectMark => ({
  name: 'chartFocusRing',
  type: 'rect',
  interactive: false,
  encode: {
    enter: {
      ...getFocusRingStroke(colorScheme),
      cornerRadius: { value: FOCUS_RING_ROUNDED_RADIUS },
    },
    update: {
      x: { value: 0 },
      x2: { signal: 'width' },
      y: { value: 0 },
      y2: { signal: 'height' },
      opacity: [{ test: `${FOCUSED_REGION} === 'chart'`, value: 1 }, { value: 0 }],
    },
  },
});

/**
 * Adds the chart-level focus signals and ring keyboard navigation drives, and records its configuration in usermeta.
 * @param spec
 * @param options
 * @returns ScSpec
 */
export const addAccessibleNavigation = produce<
  ScSpec,
  [{ colorScheme: ColorScheme; marks: MarkOptions[]; axes?: AxisOptions[]; legends?: LegendOptions[] }]
>((spec, { colorScheme, marks, axes, legends }) => {
  spec.signals = [...(spec.signals ?? []), ...getFocusSignals()];
  spec.marks = [...(spec.marks ?? []), getChartFocusRing(colorScheme)];
  const navigation = getNavigableChart({ marks, axes, legends });
  if (navigation) spec.usermeta = { ...spec.usermeta, navigation };
});
