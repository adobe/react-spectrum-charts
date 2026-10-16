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
  ColorValueRef,
  EncodeEntryName,
  GroupMark,
  Mark,
  NumericValueRef,
  ProductionRule,
  Signal,
  SourceData,
  TextEncodeEntry,
  TextValueRef,
} from 'vega';

import {
  DONUT_SUMMARY_LABEL_FONT_SIZES,
  DONUT_SUMMARY_MIN_RADIUS_S2,
  DONUT_SUMMARY_VALUE_FONT_SIZES,
  FILTERED_TABLE,
} from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { getTextNumberFormat } from '../textUtils.js';
import { DonutSpecOptions, DonutSummaryOptions, DonutSummarySpecOptions } from '../types/index.js';
import { getDonutCenterYSignal, getDonutInnerRadiusExpr, getSizeTierValueExpr } from './donutUtils.js';
import { getTextRuleExpr } from './segmentLabelUtils.js';

type DonutSummaryLayoutOptions = Pick<DonutSummarySpecOptions, 'donutOptions' | 'hideValue' | 'label' | 'delta'>;

/** Gets the delta font size, hiding semicircle deltas below M. */
const getSummaryDeltaFontSizeExpr = ({ name, variant }: DonutSpecOptions): string => {
  const fontSize = `${name}_summaryLabelFontSize`;
  return variant === 'semicircle' ? getSizeTierValueExpr(name, [0, 0, fontSize, fontSize, fontSize]) : fontSize;
};

/** Gets the summary anchor offset and each row's center within its stack. */
const getDonutSummaryLayout = (options: DonutSummaryLayoutOptions) => {
  const {
    donutOptions: { name, variant },
    hideValue,
    label,
    delta,
  } = options;
  const hasDelta = delta !== undefined;
  const valueFont = `${name}_summaryValueFontSize`;
  const labelFont = `${name}_summaryLabelFontSize`;
  const deltaFont = getSummaryDeltaFontSizeExpr(options.donutOptions);
  const valueHeight = hideValue ? '0' : valueFont;
  const labelHeight = label ? labelFont : '0';
  const deltaHeight = hasDelta ? deltaFont : '0';
  const nextRowHeight = label ? labelHeight : deltaHeight;
  // Keep the original value-to-label gap when positioning both rows by their vertical centers.
  const valueBaseline = `round(${valueFont} * 0.3)`;
  const nextRowBaseline = `round(${nextRowHeight} * 0.79) - round(${nextRowHeight} * 0.3)`;
  const rowGap = `ceil(${valueFont} * 0.25) + ${valueBaseline} + ${nextRowBaseline} - (${valueFont} + ${nextRowHeight}) / 2`;
  const valueGap = !hideValue && (label || hasDelta) ? `(${nextRowHeight} > 0 ? ${rowGap} : 0)` : '0';
  const labelGap = label && hasDelta ? `ceil(${deltaFont} * 0.25)` : '0';
  const height =
    [valueHeight, labelHeight, deltaHeight, valueGap, labelGap].filter((part) => part !== '0').join(' + ') || '0';
  return {
    anchorOffset: variant === 'semicircle' ? `2 + (${height}) / 2` : '0',
    value: `${valueFont} / 2 - (${height}) / 2`,
    label: `${valueHeight} + ${valueGap} + ${labelFont} / 2 - (${height}) / 2`,
    delta: `${valueHeight} + ${valueGap} + ${labelHeight} + ${labelGap} + ${deltaFont} / 2 - (${height}) / 2`,
  };
};

/** Gets the available chord width at a summary row's farthest edge. */
const getDonutSummaryTextLimit = (
  options: DonutSummaryLayoutOptions,
  fontSize: string,
  dy: string
): { signal: string } => {
  const innerRadius = getDonutInnerRadiusExpr(options.donutOptions);
  const centerOffset = getDonutSummaryLayout(options).anchorOffset;
  const distance = `abs((${dy}) - (${centerOffset})) + ${fontSize} / 2`;
  return {
    signal: `2 * sqrt(max(0, pow(${innerRadius}, 2) - pow(${distance}, 2)))`,
  };
};

/**
 * Gets the y anchor signal for the donut summary's text marks.
 * @param options
 * @returns vega expression string
 */
const getDonutSummaryAnchorYSignal = (options: DonutSummaryLayoutOptions): string => {
  const center = getDonutCenterYSignal(options.donutOptions);
  const { anchorOffset } = getDonutSummaryLayout(options);
  return anchorOffset === '0' ? center : `${center} - (${anchorOffset})`;
};

/**
 * Gets the DonutSummary component from the children if one exists
 * @param donutOptions
 * @returns
 */
const getDonutSummary = (options: DonutSpecOptions): DonutSummarySpecOptions | undefined => {
  if (!options.donutSummaries.length) {
    return;
  }
  return applyDonutSummaryPropDefaults(options.donutSummaries[0], options);
};

/**
 * Applies all default options, converting DonutSummaryOptions into DonutSummarySpecOptions
 * @param donutSummaryOptions
 * @param donutOptions
 * @returns
 */
const applyDonutSummaryPropDefaults = (
  { numberFormat = 'shortNumber', hideValue = false, ...options }: DonutSummaryOptions,
  donutOptions: DonutSpecOptions
): DonutSummarySpecOptions => ({
  donutOptions,
  hideValue,
  numberFormat,
  ...options,
});

/**
 * Gets the data for the donut summary
 * @param donutOptions
 * @returns SourceData[]
 */
export const getDonutSummaryData = (donutOptions: DonutSpecOptions): SourceData[] => {
  const donutSummary = getDonutSummary(donutOptions);
  if (!donutSummary || donutOptions.isBoolean) {
    return [];
  }
  return [
    {
      name: `${donutOptions.name}_summaryData`,
      source: FILTERED_TABLE,
      transform: [
        {
          type: 'aggregate',
          fields: [donutOptions.metric],
          ops: ['sum'],
          as: ['sum'],
        },
      ],
    },
  ];
};

/**
 * Gets the signals for the donut summary
 * @param donutOptions
 * @returns Signal[]
 */
export const getDonutSummarySignals = (donutOptions: DonutSpecOptions): Signal[] => {
  const donutSummary = getDonutSummary(donutOptions);
  if (!donutSummary) {
    return [];
  }
  const { name } = donutOptions;
  return [
    { name: `${name}_summaryValueFontSize`, update: getSizeTierValueExpr(name, DONUT_SUMMARY_VALUE_FONT_SIZES) },
    { name: `${name}_summaryLabelFontSize`, update: getSizeTierValueExpr(name, DONUT_SUMMARY_LABEL_FONT_SIZES) },
  ];
};

/**
 * Gets all the marks for the donut summary
 * @param donutOptions
 * @returns GroupMark[]
 */
export const getDonutSummaryMarks = (options: DonutSpecOptions): GroupMark[] => {
  const donutSummary = getDonutSummary(options);
  if (!donutSummary) {
    return [];
  }
  const marks: GroupMark[] = [];
  if (options.isBoolean) {
    marks.push(getBooleanDonutSummaryGroupMark(donutSummary));
  } else {
    marks.push(getDonutSummaryGroupMark(donutSummary));
  }
  return marks;
};

/**
 * Gets the group mark for the donut summary
 * @param donutSummaryOptions
 * @returns GorupMark
 */
export const getDonutSummaryGroupMark = (options: DonutSummarySpecOptions): GroupMark => {
  const { donutOptions, hideValue, label, delta } = options;
  const groupMark: Mark = {
    type: 'group',
    name: `${donutOptions.name}_summaryGroup`,
    marks: [],
  };
  if (!hideValue) {
    groupMark.marks?.push({
      type: 'text',
      name: `${donutOptions.name}_summaryValue`,
      from: { data: `${donutOptions.name}_summaryData` },
      encode: getSummaryValueEncode(options),
    });
  }
  if (label) {
    groupMark.marks?.push({
      type: 'text',
      name: `${donutOptions.name}_summaryLabel`,
      from: { data: `${donutOptions.name}_summaryData` },
      encode: getSummaryLabelEncode({ ...options, label }),
    });
  }
  if (delta !== undefined) {
    groupMark.marks?.push({
      type: 'text',
      name: `${donutOptions.name}_summaryDelta`,
      from: { data: `${donutOptions.name}_summaryData` },
      encode: getSummaryDeltaEncode({ ...options, delta }),
    });
  }
  return groupMark;
};

/**
 * Gets the group mark for a boolean donut summary
 * @param donutSummaryOptions
 * @returns GroupMark
 */
export const getBooleanDonutSummaryGroupMark = (options: DonutSummarySpecOptions): GroupMark => {
  const { donutOptions, hideValue, label, delta } = options;
  const groupMark: Mark = {
    type: 'group',
    name: `${donutOptions.name}_percentText`,
    marks: [],
  };
  if (!hideValue) {
    groupMark.marks?.push({
      type: 'text',
      name: `${donutOptions.name}_booleanSummaryValue`,
      from: { data: `${donutOptions.name}_booleanData` },
      encode: getSummaryValueEncode(options),
    });
  }
  if (label) {
    groupMark.marks?.push({
      type: 'text',
      name: `${donutOptions.name}_booleanSummaryLabel`,
      from: { data: `${donutOptions.name}_booleanData` },
      encode: getSummaryLabelEncode({ ...options, label }),
    });
  }
  if (delta !== undefined) {
    groupMark.marks?.push({
      type: 'text',
      name: `${donutOptions.name}_booleanSummaryDelta`,
      from: { data: `${donutOptions.name}_booleanData` },
      encode: getSummaryDeltaEncode({ ...options, delta }),
    });
  }
  return groupMark;
};

/**
 * Hides summary text when it is too small or truncates to only an ellipsis.
 * @param donutOptions
 * @param textExpr
 * @param fontSize
 * @param fontWeight
 * @param limitSignal
 * @returns font size production rule
 */
export const getSummaryTextFontSize = (
  donutOptions: DonutSpecOptions,
  textExpr: string,
  fontSize: string,
  fontWeight: number,
  limitSignal: string
): ProductionRule<NumericValueRef> => {
  const trimmedText = `trim(toString(${textExpr}) || '')`;
  const textWidth = `getLabelWidth(${trimmedText}, ${fontWeight}, ${fontSize})`;
  const firstCharacterWidth = `getLabelWidth(substring(${trimmedText}, 0, 1), ${fontWeight}, ${fontSize})`;
  const ellipsisWidth = String.raw`getLabelWidth('\u2026', ${fontWeight}, ${fontSize})`;
  return [
    { test: `${getDonutInnerRadiusExpr(donutOptions)} < ${DONUT_SUMMARY_MIN_RADIUS_S2}`, value: 0 },
    {
      test: `(${fontSize}) <= 0 || (${limitSignal}) <= 0 || (${textWidth} >= (${limitSignal}) && ${firstCharacterWidth} >= (${limitSignal}) - ${ellipsisWidth})`,
      value: 0,
    },
    { signal: fontSize },
  ];
};

/**
 * Gets the encode for the summary value
 * @param donutSummaryOptions
 * @returns encode
 */
export const getSummaryValueEncode = (
  options: DonutSummarySpecOptions
): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
  const { donutOptions } = options;
  const text = getSummaryValueText(options);
  const fontSize = `${donutOptions.name}_summaryValueFontSize`;
  const limit = getSummaryValueLimit(options);
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: getDonutSummaryAnchorYSignal(options) },
      dy: { signal: getDonutSummaryLayout(options).value },
      text,
      fontSize: getSummaryTextFontSize(donutOptions, getTextRuleExpr(text), fontSize, 800, limit.signal),
      fontWeight: { value: 800 }, // S2 font weight for value
      align: { value: 'center' },
      baseline: { value: 'middle' },
      limit,
    },
  };
};

/**
 * Gets the text value for the summary value
 * @param donutSummaryOptions
 * @returns TextValueref
 */
export const getSummaryValueText = ({
  donutOptions,
  numberFormat,
}: DonutSummarySpecOptions): ProductionRule<TextValueRef> => {
  if (donutOptions.isBoolean) {
    return { signal: `format(datum['${donutOptions.metric}'], '.0%')` };
  }
  return [...getTextNumberFormat(numberFormat, 'sum'), { field: 'sum' }];
};

/**
 * Gets the limit for the summary value
 * @param donutSummaryOptions
 * @returns NumericValueRef
 */
export const getSummaryValueLimit = (options: DonutSummarySpecOptions): { signal: string } => {
  return getDonutSummaryTextLimit(
    options,
    `${options.donutOptions.name}_summaryValueFontSize`,
    getDonutSummaryLayout(options).value
  );
};

/**
 * Gets the encode for the metric label
 * @param donutSummaryOptions
 * @returns encode
 */
export const getSummaryLabelEncode = (
  options: DonutSummarySpecOptions & { label: string }
): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
  const { donutOptions, label } = options;
  const { name } = donutOptions;
  const dy = getDonutSummaryLayout(options).label;
  const limit = getDonutSummaryTextLimit(options, `${name}_summaryLabelFontSize`, dy);
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: getDonutSummaryAnchorYSignal(options) },
      dy: { signal: dy },
      text: { value: label },
      fontSize: getSummaryTextFontSize(
        donutOptions,
        JSON.stringify(label),
        `${name}_summaryLabelFontSize`,
        700,
        limit.signal
      ),
      fontWeight: { value: 700 },
      align: { value: 'center' },
      baseline: { value: 'middle' },
      limit,
    },
  };
};

/**
 * Gets the encode for the sentiment-colored delta line, always the last visible line
 * @param donutSummaryOptions
 * @returns encode
 */
export const getSummaryDeltaEncode = ({
  donutOptions,
  hideValue,
  label,
  delta,
}: DonutSummarySpecOptions & { delta: number }): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
  const { colorScheme } = donutOptions;
  const options = { donutOptions, hideValue, label, delta };
  const dy = getDonutSummaryLayout(options).delta;
  const fontSize = getSummaryDeltaFontSizeExpr(donutOptions);
  const limit = getDonutSummaryTextLimit(options, fontSize, dy);
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: getDonutSummaryAnchorYSignal(options) },
      dy: { signal: dy },
      text: getSummaryDeltaText(delta),
      fontSize: getSummaryTextFontSize(
        donutOptions,
        getTextRuleExpr(getSummaryDeltaText(delta)),
        fontSize,
        800,
        limit.signal
      ),
      fontWeight: { value: 800 },
      fill: getSummaryDeltaFill(delta, colorScheme),
      align: { value: 'center' },
      baseline: { value: 'middle' },
      limit,
    },
  };
};

/**
 * Gets the text value for the delta line, an explicit-sign one-decimal percent (e.g. "+2.5%")
 * @param delta
 * @returns TextValueRef
 */
export const getSummaryDeltaText = (delta: number): TextValueRef => ({
  signal: `format(${delta}, '+.1%')`,
});

/**
 * Gets the sentiment-based fill for the delta line - green for non-negative, red for negative
 * @param delta
 * @param colorScheme
 * @returns ColorValueRef
 */
export const getSummaryDeltaFill = (delta: number, colorScheme: DonutSpecOptions['colorScheme']): ColorValueRef => ({
  value: getS2ColorValue(delta >= 0 ? 'green-800' : 'red-800', colorScheme),
});
