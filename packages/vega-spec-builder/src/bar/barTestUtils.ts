/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { NumericValueRef, ProductionRule, RectEncodeEntry } from 'vega';

import {
  BACKGROUND_COLOR,
  COLOR_SCALE,
  CORNER_RADIUS,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_SECONDARY_COLOR,
  FILTERED_TABLE,
  MARK_ID,
  PADDING_RATIO,
  STACK_ID,
  TRELLIS_PADDING,
} from '@spectrum-charts/constants';

import { BarSpecOptions } from '../types';

export const defaultBarOptions: BarSpecOptions = {
  barAnnotations: [],
  chartPopovers: [],
  chartTooltips: [],
  color: DEFAULT_COLOR,
  colorScheme: DEFAULT_COLOR_SCHEME,
  dimension: DEFAULT_CATEGORICAL_DIMENSION,
  dimensionScaleType: 'band',
  hasOnClick: false,
  hasSquareCorners: false,
  idKey: MARK_ID,
  index: 0,
  interactiveMarkName: 'bar0',
  lineType: { value: 'solid' },
  lineWidth: 0,
  markType: 'bar',
  metric: DEFAULT_METRIC,
  name: 'bar0',
  orientation: 'vertical',
  opacity: { value: 1 },
  paddingRatio: PADDING_RATIO,
  trellisOrientation: 'horizontal',
  trellisPadding: TRELLIS_PADDING,
  trendlines: [],
  type: 'stacked',
};

export const defaultBarOptionsWithSecondayColor: BarSpecOptions = {
  ...defaultBarOptions,
  color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR],
};

export const defaultStackedYEncodings: RectEncodeEntry = {
  y: [
    { test: `datum.${DEFAULT_METRIC}0 === 0`, signal: `scale('yLinear', datum.${DEFAULT_METRIC}0)` },
    {
      test: `datum.${DEFAULT_METRIC}1 > 0`,
      signal: `max(scale('yLinear', datum.${DEFAULT_METRIC}0) - 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))`,
    },
    { signal: `min(scale('yLinear', datum.${DEFAULT_METRIC}0) + 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))` },
  ],
  y2: { scale: 'yLinear', field: `${DEFAULT_METRIC}1` },
};

export const defaultDodgedYEncodings: RectEncodeEntry = {
  y: { scale: 'yLinear', value: 0 },
  y2: { scale: 'yLinear', field: `${DEFAULT_METRIC}` },
};

export const defaultCornerRadiusEncodings: RectEncodeEntry = {
  cornerRadiusTopLeft: [
    {
      test: `datum.${DEFAULT_METRIC}1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${DEFAULT_METRIC}1 === datum.${DEFAULT_METRIC}1`,
      value: CORNER_RADIUS,
    },
    { value: 0 },
  ],
  cornerRadiusTopRight: [
    {
      test: `datum.${DEFAULT_METRIC}1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${DEFAULT_METRIC}1 === datum.${DEFAULT_METRIC}1`,
      value: CORNER_RADIUS,
    },
    { value: 0 },
  ],
  cornerRadiusBottomLeft: [
    {
      test: `datum.${DEFAULT_METRIC}1 < 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), '${STACK_ID}'), datum.${STACK_ID})].min_${DEFAULT_METRIC}1 === datum.${DEFAULT_METRIC}1`,
      value: CORNER_RADIUS,
    },
    { value: 0 },
  ],
  cornerRadiusBottomRight: [
    {
      test: `datum.${DEFAULT_METRIC}1 < 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), '${STACK_ID}'), datum.${STACK_ID})].min_${DEFAULT_METRIC}1 === datum.${DEFAULT_METRIC}1`,
      value: CORNER_RADIUS,
    },
    { value: 0 },
  ],
};

export const defaultDodgedCornerRadiusEncodings: RectEncodeEntry = {
  cornerRadiusBottomLeft: [{ test: 'datum.value < 0', value: CORNER_RADIUS }, { value: 0 }],
  cornerRadiusBottomRight: [{ test: 'datum.value < 0', value: CORNER_RADIUS }, { value: 0 }],
  cornerRadiusTopLeft: [{ test: 'datum.value > 0', value: CORNER_RADIUS }, { value: 0 }],
  cornerRadiusTopRight: [{ test: 'datum.value > 0', value: CORNER_RADIUS }, { value: 0 }],
};

export const defaultBarFillOpacity: ProductionRule<NumericValueRef> = [{ value: 1 }];

export const stackedXScale = 'xBand';
export const dodgedXScale = `${defaultBarOptions.name}_position`;
export const dodgedGroupField = `${defaultBarOptions.name}_dodgeGroup`;
export const stackedLabelWithStyles = {
  type: 'rect',
  from: { data: FILTERED_TABLE },
  name: 'bar0_annotationBackground',
  interactive: false,
  encode: {
    enter: {
      align: { value: 'center' },
      baseline: { value: 'middle' },
      fill: [{ test: `datum.textLabel && bandwidth('${stackedXScale}') >= 48`, signal: BACKGROUND_COLOR }],
      height: { value: 22 },
      width: { value: 48 },
      xc: { scale: stackedXScale, field: defaultBarOptions.dimension, band: 0.5 },
      yc: [
        {
          test: `datum.${defaultBarOptions.metric}1 < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 13.5)`,
        },
      ],
      cornerRadius: { value: 4 },
    },
  },
};

export const stackedLabelBackground = {
  type: 'rect',
  from: { data: FILTERED_TABLE },
  name: 'bar0_annotationBackground',
  interactive: false,
  encode: {
    enter: {
      align: { value: 'center' },
      baseline: { value: 'middle' },
      fill: [{ test: `datum.textLabel && bandwidth('${stackedXScale}') >= 48`, signal: BACKGROUND_COLOR }],
      height: { value: 22 },
      width: { signal: "getLabelWidth(datum.textLabel, 'bold', 12) + 10" },
      xc: { scale: stackedXScale, field: defaultBarOptions.dimension, band: 0.5 },
      yc: [
        {
          test: `datum.${defaultBarOptions.metric}1 < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 13.5)`,
        },
      ],
      cornerRadius: { value: 4 },
    },
  },
};

export const stackedLabelText = {
  type: 'text',
  from: { data: FILTERED_TABLE },
  name: 'bar0_annotationText',
  interactive: false,
  encode: {
    enter: {
      x: { scale: stackedXScale, field: defaultBarOptions.dimension, band: 0.5 },
      y: [
        {
          test: `datum.${defaultBarOptions.metric}1 < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 13.5)`,
        },
      ],
      text: [{ test: `bandwidth('${stackedXScale}') >= 48`, field: 'textLabel' }],
      fontSize: { value: 12 },
      fontWeight: { value: 'bold' },
      baseline: { value: 'middle' },
      align: { value: 'center' },
    },
  },
};

export const dodgedLabelWithStyles = {
  ...stackedLabelWithStyles,
  from: { data: `${defaultBarOptions.name}_facet` },
  encode: {
    ...stackedLabelWithStyles.encode,
    enter: {
      ...stackedLabelWithStyles.encode.enter,
      xc: { scale: dodgedXScale, field: dodgedGroupField, band: 0.5 },
      yc: [
        {
          test: `datum.${defaultBarOptions.metric} < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) - 13.5)`,
        },
      ],
      fill: [{ test: `datum.textLabel && bandwidth('${dodgedXScale}') >= 48`, signal: BACKGROUND_COLOR }],
    },
  },
};

export const dodgedLabelBackground = {
  ...stackedLabelBackground,
  from: { data: `${defaultBarOptions.name}_facet` },
  encode: {
    ...stackedLabelBackground.encode,
    enter: {
      ...stackedLabelBackground.encode.enter,
      xc: { scale: dodgedXScale, field: dodgedGroupField, band: 0.5 },
      yc: [
        {
          test: `datum.${defaultBarOptions.metric} < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) - 13.5)`,
        },
      ],
      fill: [{ test: `datum.textLabel && bandwidth('${dodgedXScale}') >= 48`, signal: BACKGROUND_COLOR }],
    },
  },
};

export const dodgedLabelText = {
  ...stackedLabelText,
  from: { data: `${defaultBarOptions.name}_facet` },
  encode: {
    ...stackedLabelText.encode,
    enter: {
      ...stackedLabelText.encode.enter,
      x: { scale: dodgedXScale, field: dodgedGroupField, band: 0.5 },
      y: [
        {
          test: `datum.${defaultBarOptions.metric} < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}), scale('yLinear', 0) - 13.5)`,
        },
      ],
      text: [{ test: `bandwidth('${dodgedXScale}') >= 48`, field: 'textLabel' }],
    },
  },
};

export const dodgedSubSeriesLabelBackground = {
  ...dodgedLabelBackground,
  encode: {
    ...dodgedLabelBackground.encode,
    enter: {
      ...dodgedLabelBackground.encode.enter,
      yc: [
        {
          test: `datum.${defaultBarOptions.metric}1 < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 13.5)`,
        },
      ],
    },
  },
};

export const dodgedSubSeriesLabelText = {
  ...dodgedLabelText,
  encode: {
    ...dodgedLabelText.encode,
    enter: {
      ...dodgedLabelText.encode.enter,
      y: [
        {
          test: `datum.${defaultBarOptions.metric}1 < 0`,
          signal: `max(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) + 13.5)`,
        },
        {
          signal: `min(scale('yLinear', datum.${defaultBarOptions.metric}1), scale('yLinear', 0) - 13.5)`,
        },
      ],
    },
  },
};

export const stackedAnnotationMarks = [stackedLabelBackground, stackedLabelText];
export const stackedAnnotationMarksWithStyles = [stackedLabelWithStyles, stackedLabelText];
export const dodgedAnnotationMarks = [dodgedLabelBackground, dodgedLabelText];
export const dodgedAnnotationMarksWithStyles = [dodgedLabelWithStyles, dodgedLabelText];
export const dodgedSubSeriesAnnotationMarks = [dodgedSubSeriesLabelBackground, dodgedSubSeriesLabelText];

export const defaultBarEnterEncodings: RectEncodeEntry = {
  ...defaultStackedYEncodings,
  ...defaultCornerRadiusEncodings,
};

export const defaultBarStrokeEncodings: RectEncodeEntry = {
  stroke: [{ scale: COLOR_SCALE, field: DEFAULT_COLOR }],
  strokeDash: [{ value: [] }],
  strokeWidth: [{ value: 0 }],
};
