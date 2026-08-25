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
import { RectMark, Signal } from 'vega';

import { getS2ColorValue } from '@spectrum-charts/themes';

import { ColorScheme } from '../types';

/**
 * Keyboard-focus ring for axis ticks/labels. Unlike the legend ring (per-entry marks positioned from
 * scales), axis labels can be rotated, multi-line, or hidden by Vega's overlap removal — none of which
 * a scale-computed position can track. So this is ONE signal-driven rect whose box is set by the React
 * data-navigator from the focused label's REAL rendered bounds (read from the scenegraph, unioned with
 * its sublabel). `axisFocusRing` = `{ x, y, width, height }` in view coordinates, or `null` when nothing
 * is focused. A top-level mark (not inside the plot group) so those absolute bounds map directly.
 */
export const AXIS_FOCUS_RING = 'axisFocusRing';
const FOCUS_RING_STROKE_WIDTH = 2;
const FOCUS_RING_CORNER_RADIUS = 6;

export const getAxisFocusRingSignals = (): Signal[] => [{ name: AXIS_FOCUS_RING, value: null }];

export const getAxisFocusRingMark = (colorScheme: ColorScheme): RectMark => {
  const focusColor = getS2ColorValue('blue-800', colorScheme);
  const box = (prop: string): string => `${AXIS_FOCUS_RING} ? ${AXIS_FOCUS_RING}.${prop} : 0`;
  return {
    type: 'rect',
    name: `${AXIS_FOCUS_RING}Mark`,
    interactive: false,
    encode: {
      update: {
        x: { signal: box('x') },
        y: { signal: box('y') },
        width: { signal: box('width') },
        height: { signal: box('height') },
        cornerRadius: { value: FOCUS_RING_CORNER_RADIUS },
        strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
        fill: { value: 'transparent' },
        stroke: [
          { test: `isValid(${AXIS_FOCUS_RING})`, value: focusColor },
          { value: 'transparent' },
        ],
      },
    },
  };
};
