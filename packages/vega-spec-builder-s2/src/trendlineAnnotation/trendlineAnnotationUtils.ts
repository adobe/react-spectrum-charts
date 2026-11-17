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
import { ColorValueRef, GroupMark, NumericValueRef, ProductionRule, RectMark, SymbolMark, TextMark } from 'vega';

import {
  LINE_POINT_ANNOTATION_OFFSET,
  REFERENCE_LINE_SIZE_STROKE_WIDTHS,
  SERIES_ID,
  TRENDLINE_VALUE,
} from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { getLabelTransformTextMarks } from '../line/directLabelUtils.js';
import { getColorProductionRule, getColorProductionRuleSignalString } from '../marks/markUtils.js';
import { getScaleName } from '../scale/scaleSpecBuilder.js';
import {
  getEndDimensionExtentProductionRule,
  getStartDimensionExtentProductionRule,
} from '../trendline/trendlineExtentUtils.js';
import {
  ColorFacet,
  TrendlineAnnotationOptions,
  TrendlineAnnotationSpecOptions,
  TrendlineSpecOptions,
} from '../types/index.js';

/**
 * Applies all trendline annotation defaults
 * @param trenlineAnnotationOptions
 * @param index
 * @param trendlineOptions
 * @param markName
 * @returns TrendlineAnnotationSpecOptions
 */
export const getTrendlineAnnotationSpecOptions = (
  { badge = false, dimensionValue = 'end', numberFormat = '', prefix = '' }: TrendlineAnnotationOptions,
  index: number,
  {
    colorScheme,
    dimensionExtent,
    dimensionScaleType,
    displayOnHover,
    size,
    orientation,
    trendlineColor,
    trendlineDimension,
    name: trendlineName,
  }: TrendlineSpecOptions,
  markName: string,
  seriesFadeData?: string
): TrendlineAnnotationSpecOptions => ({
  badge,
  colorScheme,
  dimensionValue,
  displayOnHover,
  markName,
  name: `${trendlineName}Annotation${index}`,
  numberFormat,
  prefix,
  seriesFadeData,
  trendlineColor,
  trendlineDimension,
  trendlineDimensionExtent: dimensionExtent,
  trendlineDimensionScaleType: dimensionScaleType,
  trendlineName: trendlineName,
  trendlineOrientation: orientation,
  trendlineWidth: REFERENCE_LINE_SIZE_STROKE_WIDTHS[size ?? 'M'],
});

const TRENDLINE_ANNOTATION_BADGE_CORNER_RADIUS = 6;

/**
 * Gets all the annotations on a trendline
 * @param trendlineOptions
 * @param markName
 * @returns TrendlineAnnotationSpecOptions[]
 */
export const getTrendlineAnnotations = (
  trendlineOptions: TrendlineSpecOptions,
  markName: string,
  seriesFadeData?: string
): TrendlineAnnotationSpecOptions[] => {
  return trendlineOptions.trendlineAnnotations.map((annotationOptions, index) =>
    getTrendlineAnnotationSpecOptions(annotationOptions, index, trendlineOptions, markName, seriesFadeData)
  );
};

/**
 * Gets all the trendline annotation marks
 * @param trendlineOptions
 * @param markName
 * @returns GroupMark[]
 */
export const getTrendlineAnnotationMarks = (
  trendlineOptions: TrendlineSpecOptions,
  markName: string,
  seriesFadeData?: string
): GroupMark[] => {
  const marks: GroupMark[] = [];
  const annotations = getTrendlineAnnotations(trendlineOptions, markName, seriesFadeData);

  for (const annotation of annotations) {
    marks.push({
      name: `${annotation.name}_group`,
      type: 'group',
      interactive: false,
      marks: [
        getTrendlineAnnotationPoints(annotation),
        ...getTrendlineAnnotationTextMarks(annotation),
        ...getTrendlineAnnotationBadgeMark(annotation),
      ],
    });
  }
  return marks;
};

/**
 * Gets the annotation points
 * @param trendlineAnnotationOptions
 * @returns SymbolMark
 */
const getTrendlineAnnotationPoints = (annotationOptions: TrendlineAnnotationSpecOptions): SymbolMark => {
  const { name, trendlineName, trendlineWidth, displayOnHover } = annotationOptions;
  const data = displayOnHover ? `${trendlineName}_highlightedData` : `${trendlineName}_highResolutionData`;
  return {
    name: `${name}_points`,
    type: 'symbol',
    from: { data },
    interactive: false,
    encode: {
      enter: {
        opacity: { value: 0 },
        size: { value: Math.pow(trendlineWidth, 2) },
      },
      update: {
        x: getTrendlineAnnotationPointX(annotationOptions),
        y: getTrendlineAnnotationPointY(annotationOptions),
      },
    },
  };
};

/**
 * Gets the correct x rule for the annotation point
 * @param trendlineAnnotationOptions
 * @returns NumericValueRef
 */
export const getTrendlineAnnotationPointX = ({
  dimensionValue,
  trendlineDimension,
  trendlineDimensionExtent,
  trendlineDimensionScaleType,
  trendlineOrientation,
}: TrendlineAnnotationSpecOptions): NumericValueRef => {
  const scale = getScaleName('x', trendlineDimensionScaleType);
  if (trendlineOrientation === 'vertical') {
    return { scale, field: TRENDLINE_VALUE };
  }
  switch (dimensionValue) {
    case 'start':
      return getStartDimensionExtentProductionRule(trendlineDimensionExtent[0], trendlineDimension, scale, 'x');
    case 'end':
      return getEndDimensionExtentProductionRule(trendlineDimensionExtent[1], trendlineDimension, scale, 'x');
    default:
      return { scale, value: dimensionValue };
  }
};

/**
 * Gets the correct y rule for the annotation point
 * @param trendlineAnnotationOptions
 * @returns NumericValueRef
 */
export const getTrendlineAnnotationPointY = ({
  dimensionValue,
  trendlineDimension,
  trendlineDimensionExtent,
  trendlineOrientation,
}: TrendlineAnnotationSpecOptions): NumericValueRef => {
  const scale = 'yLinear';
  if (trendlineOrientation === 'horizontal') {
    return { scale, field: TRENDLINE_VALUE };
  }
  switch (dimensionValue) {
    case 'start':
      return getStartDimensionExtentProductionRule(trendlineDimensionExtent[0], trendlineDimension, scale, 'y');
    case 'end':
      return getEndDimensionExtentProductionRule(trendlineDimensionExtent[1], trendlineDimension, scale, 'y');
    default:
      return { scale, value: dimensionValue };
  }
};

/**
 * Gets the annotation halo and text marks, placed by a label transform.
 * @param annotation
 * @returns TextMark[]
 */
export const getTrendlineAnnotationTextMarks = (annotation: TrendlineAnnotationSpecOptions): TextMark[] => {
  const { colorScheme, name, numberFormat, prefix, trendlineName, markName } = annotation;
  const textPrefix = prefix ? `'${prefix} ' + ` : '';
  const diagonalOffset = LINE_POINT_ANNOTATION_OFFSET * Math.SQRT2;
  const [background, foreground] = getLabelTransformTextMarks(
    `${name}_background`,
    name,
    `${name}_points`,
    `${textPrefix}format(datum.datum.${TRENDLINE_VALUE}, '${numberFormat}')`,
    colorScheme,
    {
      type: 'label',
      size: { signal: '[width, height]' },
      avoidMarks: [trendlineName, `${markName}_group`],
      offset: [...new Array(4).fill(LINE_POINT_ANNOTATION_OFFSET), ...new Array(4).fill(diagonalOffset)],
      anchor: ['top', 'bottom', 'right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'],
    },
    getTextFill(annotation)
  );
  const backgroundFade = getAnnotationSeriesFade(annotation, 2);
  const foregroundFade = getAnnotationSeriesFade(annotation, 3);
  if (backgroundFade && foregroundFade && background.encode?.update && foreground.encode?.update) {
    Object.assign(background.encode.update, { fillOpacity: backgroundFade, strokeOpacity: backgroundFade });
    Object.assign(foreground.encode.update, { fillOpacity: foregroundFade });
  }
  // draws the text in front of the badge
  return [background, { ...foreground, zindex: 1 }];
};

/**
 * Gets the opacity that fades the annotation with its trendline's series, or undefined when the parent doesn't animate.
 * @param annotation
 * @param datumOrder how many levels deep the row is
 * @returns NumericValueRef | undefined
 */
export const getAnnotationSeriesFade = (
  { seriesFadeData }: TrendlineAnnotationSpecOptions,
  datumOrder: number
): NumericValueRef | undefined => {
  if (!seriesFadeData) return undefined;
  const seriesId = `${new Array(datumOrder).fill('datum.').join('')}${SERIES_ID}`;
  return { signal: `hoverDeemphasisOpacity(data('${seriesFadeData}'), '${SERIES_ID}', ${seriesId})` };
};

/**
 * Get's the encoding for the annotation text fill.
 * Includes a color contrast check to ensure the text is visually a11y.
 * @param trendlineAnnotationOptions
 * @returns fill ProductionRule
 */
export const getTextFill = ({
  badge,
  colorScheme,
  trendlineColor,
}: TrendlineAnnotationSpecOptions): ProductionRule<ColorValueRef> | undefined => {
  if (!badge) {
    // undefined falls back to the shared direct label color
    return undefined;
  }
  const color = getColorKey(trendlineColor, 2);
  const colorString = getColorProductionRuleSignalString(color, colorScheme);
  const textColors = [getS2ColorValue('gray-50', colorScheme), getS2ColorValue('gray-900', colorScheme)];
  return [
    { test: `contrast(${colorString}, '${textColors[0]}') >= 4.5`, value: textColors[0] },
    { value: textColors[1] },
  ];
};

export const getTrendlineAnnotationBadgeMark = (annotation: TrendlineAnnotationSpecOptions): RectMark[] => {
  const { badge, colorScheme, name, trendlineColor } = annotation;
  if (!badge) {
    return [];
  }
  const color = getColorKey(trendlineColor, 3);
  const fade = getAnnotationSeriesFade(annotation, 4);
  return [
    {
      name: `${name}_badge`,
      description: `${name}_badge`,
      type: 'rect',
      from: { data: `${name}` },
      interactive: false,
      encode: {
        enter: {
          cornerRadius: { value: TRENDLINE_ANNOTATION_BADGE_CORNER_RADIUS },
        },
        update: {
          fill: getColorProductionRule(color, colorScheme),
          ...(fade ? { fillOpacity: fade } : {}),
          opacity: { field: 'opacity' },
          x: { signal: 'datum.bounds.x1 - 3' },
          x2: { signal: 'datum.bounds.x2 + 3' },
          y: { signal: 'datum.bounds.y1 - 3' },
          y2: { signal: 'datum.bounds.y2 + 3' },
        },
      },
    },
  ];
};

/**
 * Gets the key used for color.
 * Since some of the marks base their data off of previous marks, the datum might be nested.
 * @param trendlineColor
 * @param datumOrder how many levels deep the datum is (ex. 1 becomes datum.color, 2 becomes datum.datum.color, etc.)
 * @returns
 */
export const getColorKey = (trendlineColor: ColorFacet, datumOrder: number = 1): ColorFacet => {
  if (typeof trendlineColor === 'string') {
    return `${new Array(datumOrder).fill('datum.').join('')}${trendlineColor}`;
  }
  return trendlineColor;
};
