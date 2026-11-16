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
import { Blend, ColorValueRef, GroupMark, Mark, NumericValueRef, SymbolMark } from 'vega';

import {
  BACKGROUND_COLOR,
  DEFAULT_OPACITY_RULE,
  FADE_FACTOR,
  FILTERED_TABLE,
  SELECTED_ITEM,
} from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue, spectrumColors } from '@spectrum-charts/core-s2/tokens';

import {
  addHoveredItemOpacityRules,
  getControlledHighlightedItemOpacityRule,
} from '../chartInspect/chartInspectUtils.js';
import { getRowKeyField } from '../data/rowKeyUtils.js';
import {
  getColorProductionRule,
  getColorProductionRuleSignalString,
  getLineWidthProductionRule,
  getOpacityProductionRule,
  getPointsForVoronoi,
  getStrokeDashProductionRule,
  getSymbolSizeProductionRule,
  getVoronoiPath,
  getXProductionRule,
  hasPopover,
  isInteractive,
} from '../marks/markUtils.js';
import { getScatterPathMarks } from '../scatterPath/scatterPathUtils.js';
import { getTrendlineMarks } from '../trendline/index.js';
import { ScatterSpecOptions, SymbolSizeFacet } from '../types/index.js';
import {
  fadeInAfterScatterDrawIn,
  fadeInLabelsAfterScatterDrawIn,
  getScatterAnimatedOpacity,
  getScatterDrawInBoundsMark,
  getScatterDrawInSize,
} from './scatterAnimationUtils.js';
import { getScatterAnnotationMarks } from './scatterAnnotation/index.js';

export const addScatterMarks = produce<Mark[], [ScatterSpecOptions]>((marks, options) => {
  const { isDrawInAnimate, name } = options;
  const annotationMarks = getScatterAnnotationMarks(options);
  const pathMarks = getScatterPathMarks(options);
  const trendlineMarks = getTrendlineMarks(options);
  if (isDrawInAnimate) {
    fadeInAfterScatterDrawIn([...pathMarks, ...trendlineMarks]);
    fadeInLabelsAfterScatterDrawIn(annotationMarks, options);
  }

  const scatterGroup: GroupMark = {
    name: `${name}_group`,
    type: 'group',
    clip: options.clip ?? false,
    marks: [
      ...(isDrawInAnimate ? [getScatterDrawInBoundsMark(options)] : []),
      getScatterMark(options),
      ...annotationMarks,
      ...getScatterHoverMarks(options),
      ...getScatterSelectMarks(options),
    ],
  };

  marks.push(...pathMarks, scatterGroup, ...trendlineMarks);
});

/**
 * Gets the blend encoding based on the blend prop
 * - 'normal': no blend (returns undefined to omit from encoding)
 * - other values: uses the specified blend mode
 * - defaults to multiply (light) / screen (dark)
 */
const getBlendEncoding = (
  blend: ScatterSpecOptions['blend'],
  colorScheme: ScatterSpecOptions['colorScheme']
): { value: Blend } | undefined => {
  if (blend === 'normal') {
    return undefined; // omit blend from encoding
  }
  if (blend) {
    return { value: blend };
  }
  // default behavior: multiply in light mode, screen in dark mode
  return { value: colorScheme === 'light' ? 'multiply' : 'screen' };
};

/**
 * Gets the primary scatter mark
 * @param scatterOptions scatterSpecOptions
 * @returns SymbolMark
 */
export const getScatterMark = (options: ScatterSpecOptions): SymbolMark => {
  const {
    blend,
    color,
    colorScaleType,
    colorScheme,
    dimension,
    dimensionScaleType,
    lineType,
    lineWidth,
    metric,
    name,
    opacity,
    size,
    stroke,
  } = options;

  const blendEncoding = getBlendEncoding(blend, colorScheme);
  const sizeRule = getSymbolSizeProductionRule(size);

  return {
    name,
    description: name,
    type: 'symbol',
    from: {
      data: FILTERED_TABLE,
    },
    key: getRowKeyField(options),
    encode: {
      enter: {
        ...(blendEncoding && { blend: blendEncoding }),
        shape: { value: 'circle' },
        strokeCap: { value: 'round' },
      },
      update: {
        fill: getColorProductionRule(color, colorScheme, colorScaleType),
        fillOpacity: getOpacityProductionRule(opacity),
        size: options.isDrawInAnimate ? getScatterDrawInSize(sizeRule, options) : sizeRule,
        strokeDash: getStrokeDashProductionRule(lineType),
        strokeWidth: getLineWidthProductionRule(lineWidth),
        stroke: getColorProductionRule(stroke ?? color, colorScheme, colorScaleType),
        ...getScatterOutlineEncoding(options),
        opacity: options.isHoverAnimate ? getScatterAnimatedOpacity(options) : getOpacity(options),
        x: getXProductionRule(dimensionScaleType, dimension),
        y: { scale: 'yLinear', field: metric },
      },
    },
  };
};

/** Opacity of the outline color; matches the Spectrum 2 color swatch border (gray-1000 at 42%). */
export const SCATTER_OUTLINE_OPACITY = 0.42;
/** Minimum contrast between a point's fill and the background before `auto` outlines it (WCAG non-text contrast). */
export const SCATTER_OUTLINE_MIN_CONTRAST = 3;

/**
 * Gets the outline encodings for scatter points, or none when `outline` is `never` or `stroke`/`lineWidth` are set.
 * @param options ScatterSpecOptions
 * @returns stroke, strokeOpacity, and strokeWidth encodings
 */
export const getScatterOutlineEncoding = ({
  color,
  colorScaleType,
  colorScheme,
  lineWidth,
  outline,
  stroke,
}: ScatterSpecOptions): { stroke?: ColorValueRef; strokeOpacity?: NumericValueRef; strokeWidth?: NumericValueRef } => {
  const hasCustomLineWidth = typeof lineWidth !== 'object' || lineWidth.value !== 0;
  if (outline === 'never' || stroke !== undefined || hasCustomLineWidth) return {};
  const fill = getColorProductionRuleSignalString(color, colorScheme, colorScaleType);
  const strokeWidth: NumericValueRef =
    outline === 'always'
      ? { value: 1 }
      : { signal: `contrast(${fill}, ${BACKGROUND_COLOR}) < ${SCATTER_OUTLINE_MIN_CONTRAST} ? 1 : 0` };
  return {
    stroke: { value: getS2ColorValue('gray-1000', colorScheme) },
    strokeOpacity: { value: SCATTER_OUTLINE_OPACITY },
    strokeWidth,
  };
};

/**
 * Gets the opacity production rule for the scatter mark.
 * This is used for highlighting points on hover and selection.
 * @param scatterOptions ScatterSpecOptions
 * @returns opacity production rule
 */
export const getOpacity = (scatterOptions: ScatterSpecOptions): ({ test?: string } & NumericValueRef)[] => {
  const { idKey } = scatterOptions;
  if (!isInteractive(scatterOptions)) {
    return [getControlledHighlightedItemOpacityRule(idKey), DEFAULT_OPACITY_RULE];
  }
  const rules: ({ test?: string } & NumericValueRef)[] = [];
  addHoveredItemOpacityRules(rules, scatterOptions);
  if (hasPopover(scatterOptions)) {
    rules.push({
      test: `isValid(${SELECTED_ITEM})`,
      signal: `${SELECTED_ITEM} === datum.${idKey} ? 1 : ${FADE_FACTOR}`,
    });
  }

  return [...rules, DEFAULT_OPACITY_RULE];
};

/**
 * Gets the vornoi path mark if there are any interactive children
 * @param scatterOptions ScatterSpecOptions
 * @returns Mark[]
 */
export const getScatterHoverMarks = (scatterOptions: ScatterSpecOptions): Mark[] => {
  const { dimension, dimensionScaleType, metric, name } = scatterOptions;
  if (!isInteractive(scatterOptions)) {
    return [];
  }

  return [
    getPointsForVoronoi(`${FILTERED_TABLE}ForInspect`, dimension, metric, name, dimensionScaleType),
    getVoronoiPath(scatterOptions, `${name}_pointsForVoronoi`),
  ];
};

const getScatterSelectMarks = (scatterOptions: ScatterSpecOptions): SymbolMark[] => {
  const { dimension, dimensionScaleType, metric, name, size } = scatterOptions;
  if (!hasPopover(scatterOptions)) {
    return [];
  }
  return [
    {
      name: `${name}_selectRing`,
      type: 'symbol',
      from: {
        data: `${name}_selectedData`,
      },
      encode: {
        enter: {
          fill: { value: 'transparent' },
          shape: { value: 'circle' },
          strokeWidth: { value: 2 },
          stroke: { value: spectrumColors.light['static-blue'] },
        },
        update: {
          size: getSelectRingSize(size),
          x: getXProductionRule(dimensionScaleType, dimension),
          y: { scale: 'yLinear', field: metric },
        },
      },
    },
  ];
};

/**
 * Gets the size of the select ring based on the size of the scatter points
 * @param size SymbolSizeFacet
 * @returns NumericValueRef
 */
export const getSelectRingSize = (size: SymbolSizeFacet): NumericValueRef => {
  const baseSize = getSymbolSizeProductionRule(size);
  if ('value' in baseSize && typeof baseSize.value === 'number') {
    // the select ring is 4px widr and taller
    // to calculate: (sqrt(baseSize) + 4)^2
    return { value: Math.pow(Math.sqrt(baseSize.value) + 4, 2) };
  }
  if ('scale' in baseSize && 'field' in baseSize) {
    return { signal: `pow(sqrt(scale('${baseSize.scale as string}', datum.${baseSize.field as string})) + 4, 2)` };
  }
  return baseSize;
};
