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
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  FADE_FACTOR,
  HOVERED_ITEM,
  SELECTED_ITEM,
  TRENDLINE_EMPHASIS_FADE_OPACITY,
} from '@spectrum-charts/core-s2/constants';

import { getHoverDeemphasisOpacitySignal } from '../marks/hoverAnimationUtils.js';
import { hasInspect, hasPopover } from '../marks/markUtils.js';
import { ScatterSpecOptions, TrendlineEmphasis, TrendlineOptions } from '../types/index.js';

/**
 * Gets the emphasis of a trendline that is always shown, or `none` for display-on-hover trendlines.
 * @param trendline
 * @returns TrendlineEmphasis
 */
export const getTrendlineEmphasis = ({ displayOnHover, emphasis = 'none' }: TrendlineOptions): TrendlineEmphasis =>
  displayOnHover ? 'none' : emphasis;

/**
 * Whether any trendline on the scatter de-emphasizes the points.
 * @param options
 * @returns boolean
 */
export const isScatterPointsDeemphasized = ({ trendlines }: ScatterSpecOptions): boolean =>
  trendlines.some((trendline) => getTrendlineEmphasis(trendline) === 'trendline');

/**
 * Gets an expression for whether any highlight is active, which lifts the emphasis fade so it doesn't stack with it.
 * @param options
 * @returns expression string
 */
export const getScatterHighlightActiveExpr = (options: ScatterSpecOptions): string => {
  const { interactiveMarkName, name, trendlines } = options;
  const tests = [
    `(isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && length(${CONTROLLED_HIGHLIGHTED_ITEM}) > 0)`,
    `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
  ];
  if (interactiveMarkName === name) tests.push(`isValid(${name}_${HOVERED_ITEM})`);
  if (trendlines.some((trendline) => hasInspect(trendline))) tests.push(`isValid(${name}Trendline_${HOVERED_ITEM})`);
  if (hasPopover(options)) tests.push(`isValid(${SELECTED_ITEM})`);
  return tests.join(' || ');
};

/**
 * Gets a 0-1 expression for how much a series is faded by the animated hover engine.
 * @param seriesFadeOpacity - expression for the series' animated fade opacity
 * @returns expression string
 */
const getSeriesFadeAmountExpr = (seriesFadeOpacity: string): string =>
  `(1 - ${seriesFadeOpacity}) / ${1 - FADE_FACTOR}`;

/**
 * Lifts the emphasis fade toward full opacity by a 0-1 amount.
 * @param amount - expression for how far the fade is lifted
 * @returns expression string
 */
export const getEmphasisOpacityExpr = (amount: string): string =>
  `${TRENDLINE_EMPHASIS_FADE_OPACITY} + ${1 - TRENDLINE_EMPHASIS_FADE_OPACITY} * clamp(${amount}, 0, 1)`;

/**
 * Gets the de-emphasized points' fill opacity factor; hover and highlight fades replace it instead of stacking.
 * @param options
 * @returns expression string
 */
export const getScatterPointsEmphasisExpr = (options: ScatterSpecOptions): string => {
  const { isHoverAnimate, name } = options;
  if (!isHoverAnimate) return `(${getScatterHighlightActiveExpr(options)}) ? 1 : ${TRENDLINE_EMPHASIS_FADE_OPACITY}`;
  const seriesFade = getSeriesFadeAmountExpr(getHoverDeemphasisOpacitySignal(name));
  return getEmphasisOpacityExpr(`max(${name}_itemDim, ${seriesFade})`);
};

/**
 * Gets a de-emphasized trendline's stroke opacity; hovering it or any highlight restores it.
 * @param options - the parent scatter
 * @param seriesFadeData - the parent's animated series fraction data, when it animates
 * @returns expression string
 */
export const getScatterTrendlineEmphasisExpr = (options: ScatterSpecOptions, seriesFadeData?: string): string => {
  const active = getScatterHighlightActiveExpr(options);
  if (!seriesFadeData) return `(${active}) ? 1 : ${TRENDLINE_EMPHASIS_FADE_OPACITY}`;
  const seriesFadeOpacity = `hoverDeemphasisOpacity(data('${seriesFadeData}'), 'rscSeriesId', datum.rscSeriesId)`;
  const seriesFade = getSeriesFadeAmountExpr(seriesFadeOpacity);
  if (!options.trendlines.some((trendline) => hasInspect(trendline))) return getEmphasisOpacityExpr(seriesFade);
  const hovered = `isValid(${options.name}Trendline_${HOVERED_ITEM}) ? 1 : 0`;
  return getEmphasisOpacityExpr(`max(${hovered}, ${seriesFade})`);
};
