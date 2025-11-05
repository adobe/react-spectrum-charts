/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { GroupMark, NumericValueRef, ProductionRule, RectEncodeEntry, RectMark, TextMark } from 'vega';

import {
  ANNOTATION_FONT_SIZE,
  ANNOTATION_FONT_WEIGHT,
  ANNOTATION_PADDING,
  BACKGROUND_COLOR,
} from '@spectrum-charts/constants';

import {
  BarAnnotationOptions,
  BarAnnotationSpecOptions,
  BarAnnotationStyleOptions,
  BarSpecOptions,
  Orientation,
} from '../types';
import { getOrientationProperties, isDodgedAndStacked } from './barUtils';

type AnnotationWidth = { value: number } | { signal: string };

/**
 * Gets the Annotation component from the children if one exists and applies default options, returning the BarAnnotationSpecOptions
 * @param barOptions
 * @returns BarAnnotationSpecOptions | undefined
 */
const getAnnotation = (
  options: BarSpecOptions,
  dataName: string,
  dimensionScaleName: string,
  dimensionField: string
): BarAnnotationSpecOptions | undefined => {
  const annotation = options.barAnnotations[0];

  if (!annotation) {
    return;
  }
  return applyAnnotationPropDefaults(annotation, options, dataName, dimensionScaleName, dimensionField);
};

/**
 * Applies all default options, converting BarAnnotationOptions into BarAnnotationSpecOptions
 * @param annotationOptions
 * @param barOptions
 * @returns BarAnnotationSpecOptions
 */
const applyAnnotationPropDefaults = (
  { textKey, padding, ...options }: BarAnnotationOptions,
  barOptions: BarSpecOptions,
  dataName: string,
  dimensionScaleName: string,
  dimensionField: string
): BarAnnotationSpecOptions => ({
  barOptions,
  textKey: textKey || barOptions.metric,
  padding: padding ?? ANNOTATION_PADDING,
  dataName,
  dimensionScaleName,
  dimensionField,
  ...options,
});

/**
 * Gets the annotation marks for the bar chart. Returns an empty array if no annotation is provided on the bar children.
 * @param barOptions
 * @param dataName
 * @param dimensionScaleName
 * @param dimensionName
 * @returns GroupMark[]
 */
export const getAnnotationMarks = (
  barOptions: BarSpecOptions,

  // These have to be local fields because it could be used in a group,
  // in which case we don't want to use the "global" (full table) values.
  dataName: string,
  dimensionScaleName: string,
  dimensionName: string
): GroupMark[] => {
  const annotationOptions = getAnnotation(barOptions, dataName, dimensionScaleName, dimensionName);
  if (!annotationOptions) {
    return [];
  }

  return [
    {
      type: 'group',
      name: `${barOptions.name}_annotationGroup`,
      marks: [getAnnotationTextMark(annotationOptions), getAnnotationBackgroundMark(annotationOptions)],
    },
  ];
};

/**
 * Gets the annotation text mark for the bar chart
 * @param annotationOptions
 * @returns TextMark
 */
const getAnnotationTextMark = ({
  padding,
  barOptions,
  dataName,
  dimensionField,
  dimensionScaleName,
  textKey,
  style,
}: BarAnnotationSpecOptions): TextMark => {
  const { metricAxis, dimensionAxis } = getOrientationProperties(barOptions.orientation);
  const annotationWidth = getAnnotationWidth(textKey, padding, style);
  const annotationPosition = getAnnotationMetricAxisPosition(barOptions, annotationWidth, padding);

  return {
    name: `${barOptions.name}_annotationText`,
    type: 'text',
    from: { data: dataName },
    interactive: false,
    zindex: 1,
    encode: {
      enter: {
        [dimensionAxis]: {
          scale: dimensionScaleName,
          field: dimensionField,
          band: 0.5,
        },
        [metricAxis]: annotationPosition,
        text: [
          {
            test: `bandwidth('${dimensionScaleName}') > ${getMinBandwidth(barOptions.orientation, padding)}`,
            field: textKey,
          },
        ],
        fontSize: { value: ANNOTATION_FONT_SIZE },
        fontWeight: { value: ANNOTATION_FONT_WEIGHT },
        baseline: { value: 'middle' },
        align: { value: 'center' },
      },
    },
  };
};

/**
 * Gets the annotation background mark
 * @param annotationOptions
 * @returns RectMark
 */
const getAnnotationBackgroundMark = ({
  barOptions,
  dimensionScaleName,
  padding,
  textKey,
  style,
}: BarAnnotationSpecOptions): RectMark => ({
  name: `${barOptions.name}_annotationBackground`,
  description: `${barOptions.name}_annotationBackground`,
  type: 'rect',
  from: { data: `${barOptions.name}_annotationText` },
  interactive: false,
  encode: {
    enter: {
      ...getAnnotationXEncode(padding, style?.width),
      y: { signal: `datum.bounds.y1  - ${padding}` },
      y2: { signal: `datum.bounds.y2  + ${padding}` },
      cornerRadius: { value: 4 },
      fill: [
        {
          test: `datum.datum.${textKey} && bandwidth('${dimensionScaleName}') > ${getMinBandwidth(
            barOptions.orientation,
            padding
          )}`,
          signal: BACKGROUND_COLOR,
        },
      ],
    },
  },
});

/**
 * Gets the minimum band width needed to display the annotations based on the bar orientation
 * @param orientation
 * @returns number
 */
export const getMinBandwidth = (orientation: Orientation, padding: number): number =>
  orientation === 'vertical' ? 48 : ANNOTATION_FONT_SIZE + 2 * padding;

/**
 * Gets the x position encoding for the annotation background
 * @param width
 * @returns RectEncodeEntry
 */
export const getAnnotationXEncode = (padding: number, width?: number): RectEncodeEntry => {
  if (width) {
    return {
      xc: { signal: '(datum.bounds.x1 + datum.bounds.x2) / 2' },
      width: { value: width },
    };
  }
  return {
    x: { signal: `datum.bounds.x1 - ${padding}` },
    x2: { signal: `datum.bounds.x2 + ${padding}` },
  };
};

export const getAnnotationWidth = (
  textKey: string,
  padding: number,
  style?: BarAnnotationStyleOptions
): AnnotationWidth => {
  if (style?.width) return { value: style.width };
  return {
    signal: `getLabelWidth(datum.${textKey}, '${ANNOTATION_FONT_WEIGHT}', ${ANNOTATION_FONT_SIZE}) + ${2 * padding}`,
  };
};

/**
 * Offset calculation to make sure the annotation does not overlap the baseline
 * @param barOptions
 * @param annotationWidth
 * @returns string
 */
export const getAnnotationPositionOffset = (
  { orientation }: BarSpecOptions,
  annotationWidth: AnnotationWidth,
  padding: number
): string => {
  const pixelGapFromBaseline = 2.5;

  if (orientation === 'vertical') {
    return `${(2 * padding + ANNOTATION_FONT_SIZE) / 2 + pixelGapFromBaseline}`;
  }

  if ('value' in annotationWidth) {
    return `${annotationWidth.value / 2 + pixelGapFromBaseline}`;
  }

  // Need parens for order of operations
  // Evaluate signal expression first, then divide by 2, then add extra offset
  return `((${annotationWidth.signal}) / 2 + ${pixelGapFromBaseline})`;
};

/**
 * Gets the metric position for the annotation text.
 * This ensures that the annotation does not overlap the baseline.
 * @param barOptions
 * @param annotationWidth
 * @returns NumericValueref
 */
export const getAnnotationMetricAxisPosition = (
  options: BarSpecOptions,
  annotationWidth: AnnotationWidth,
  padding: number
): ProductionRule<NumericValueRef> => {
  const { type, metric, orientation } = options;
  const field = type === 'stacked' || isDodgedAndStacked(options) ? `${metric}1` : metric;
  const { metricScaleKey: scaleKey } = getOrientationProperties(orientation);
  const positionOffset = getAnnotationPositionOffset(options, annotationWidth, padding);

  if (orientation === 'vertical') {
    return [
      {
        test: `datum.${field} < 0`,
        signal: `max(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) + ${positionOffset})`,
      },
      {
        signal: `min(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) - ${positionOffset})`,
      },
    ];
  }

  return [
    {
      test: `datum.${field} < 0`,
      signal: `min(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) - ${positionOffset})`,
    },
    {
      signal: `max(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) + ${positionOffset})`,
    },
  ];
};
