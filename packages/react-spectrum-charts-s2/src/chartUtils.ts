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
import {
  AnimationType,
  DEFAULT_ANIMATION_TYPES,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_HIDDEN_SERIES,
  DEFAULT_LINE_TYPES,
  DEFAULT_LINE_WIDTHS,
  DEFAULT_LOCALE,
  MARK_ID,
} from '@spectrum-charts/core-s2/constants';
import { LineType, LineWidth, PartiallyRequired } from '@spectrum-charts/vega-spec-builder-s2';

import './Chart.css';
import { ChartProps } from './types/index.js';

type ChartPropsWithDefaults =
  | 'backgroundColor'
  | 'colors'
  | 'colorScheme'
  | 'debug'
  | 'emptyStateText'
  | 'height'
  | 'hiddenSeries'
  | 'idKey'
  | 'lineTypes'
  | 'lineWidths'
  | 'locale'
  | 'minHeight'
  | 'maxHeight'
  | 'minWidth'
  | 'maxWidth'
  | 'padding'
  | 'renderer'
  | 'tooltipAnchor'
  | 'tooltipPlacement'
  | 'width';

// S2 package defaults - S2 behavior is always enabled (no s2 prop needed)
const baseDefaults: Required<Pick<ChartProps, ChartPropsWithDefaults>> = {
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  colors: 's2Categorical20', // S2-specific default color scheme
  colorScheme: DEFAULT_COLOR_SCHEME,
  debug: false,
  emptyStateText: 'No data found',
  height: 300,
  hiddenSeries: DEFAULT_HIDDEN_SERIES,
  idKey: MARK_ID,
  lineTypes: DEFAULT_LINE_TYPES as LineType[],
  lineWidths: DEFAULT_LINE_WIDTHS as LineWidth[],
  locale: DEFAULT_LOCALE,
  minHeight: 100,
  maxHeight: Infinity,
  minWidth: 100,
  maxWidth: Infinity,
  padding: 0,
  renderer: 'svg' as const,
  tooltipAnchor: 'cursor' as const,
  tooltipPlacement: 'top' as const,
  width: 'auto' as const,
};

export const applyChartPropsDefaults = (props: ChartProps): PartiallyRequired<ChartProps, ChartPropsWithDefaults> => {
  // Explicit undefined values fall back to the defaults instead of overriding them.
  const definedProps = Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined)
  ) as ChartProps;
  return {
    ...baseDefaults,
    ...definedProps,
  };
};

/** Whether an animation only changes appearance (`fade`) or moves/resizes marks (`motion`, WCAG 2.3.3). */
type AnimationEffect = 'fade' | 'motion';

const ANIMATION_EFFECTS = {
  hover: 'fade',
  drawIn: 'motion',
} as const satisfies Record<AnimationType, AnimationEffect>;

/**
 * Gets the animation types to run, dropping motion effects when the user prefers reduced motion.
 * @param animationTypes
 * @param prefersReducedMotion
 * @returns animation types
 */
export const resolveAnimationTypes = (
  animationTypes: AnimationType[] | undefined,
  prefersReducedMotion: boolean
): AnimationType[] | undefined => {
  if (!prefersReducedMotion) return animationTypes;
  return (animationTypes ?? DEFAULT_ANIMATION_TYPES).filter((type) => ANIMATION_EFFECTS[type] === 'fade');
};
