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
  TextBaselineValueRef,
  TextEncodeEntry,
  TextValueRef,
  ThresholdScale,
} from 'vega';

import {
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SUMMARY_LABEL_FONT_SIZES,
  DONUT_SUMMARY_MIN_RADIUS_S2,
  DONUT_SUMMARY_VALUE_FONT_SIZES,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getTextNumberFormat } from '../textUtils';
import { DonutSpecOptions, DonutSummaryOptions, DonutSummarySpecOptions } from '../types';
import { getDonutInnerRadiusExpr, getDonutOuterRadiusExpr } from './donutUtils';

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
 * Gets the required scales for the donut summary
 * @param donutOptions
 * @returns ThresholdScale[]
 */
export const getDonutSummaryScales = (donutOptions: DonutSpecOptions): ThresholdScale[] => {
  const donutSummary = getDonutSummary(donutOptions);
  if (!donutSummary) {
    return [];
  }
  const { name } = donutOptions;
  // snaps the donut's outer diameter to the nearest named size tier's (XS/S/M/L/XL) font size
  return [
    {
      name: `${name}_summaryValueFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_SUMMARY_VALUE_FONT_SIZES,
    },
    {
      name: `${name}_summaryLabelFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_SUMMARY_LABEL_FONT_SIZES,
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
  const donutDiameter = `2 * ${getDonutOuterRadiusExpr(donutOptions)}`;
  return [
    {
      name: `${name}_summaryValueFontSize`,
      update: `scale('${name}_summaryValueFontSizeScale', ${donutDiameter})`,
    },
    {
      name: `${name}_summaryLabelFontSize`,
      update: `scale('${name}_summaryLabelFontSizeScale', ${donutDiameter})`,
    },
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
 * Gets the encode for the summary value
 * @param donutSummaryOptions
 * @returns encode
 */
export const getSummaryValueEncode = (
  options: DonutSummarySpecOptions
): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
  const { donutOptions, label, delta } = options;
  const hasLineBelow = Boolean(label) || delta !== undefined;
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: 'height / 2' },
      text: getSummaryValueText(options),
      fontSize: [
        { test: `${getDonutInnerRadiusExpr(donutOptions)} < ${DONUT_SUMMARY_MIN_RADIUS_S2}`, value: 0 },
        { signal: `${donutOptions.name}_summaryValueFontSize` },
      ],
      fontWeight: { value: 800 }, // S2 font weight for value
      align: { value: 'center' },
      baseline: getSummaryValueBaseline(hasLineBelow),
      limit: getSummaryValueLimit(options),
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
 * Gets the baseline for the summary value
 * @param hasLineBelow whether a label or delta line renders below the value
 * @returns TextBaselineValueRef
 */
export const getSummaryValueBaseline = (hasLineBelow?: string | boolean): TextBaselineValueRef => {
  if (hasLineBelow) {
    return { value: 'alphabetic' };
  }
  // If nothing renders below it, the text should be vertically centered
  return { value: 'middle' };
};

/**
 * Gets the limit for the summary value
 * @param donutSummaryOptions
 * @returns NumericValueRef
 */
export const getSummaryValueLimit = ({ donutOptions, label, delta }: DonutSummarySpecOptions): NumericValueRef => {
  const { name } = donutOptions;
  const hasLineBelow = Boolean(label) || delta !== undefined;
  // if nothing renders below it, the height of the font from the center of the donut is 1/2 the font size
  const fontHeight = hasLineBelow ? `${name}_summaryValueFontSize` : `${name}_summaryValueFontSize * 0.5`;
  const donutInnerRadius = getDonutInnerRadiusExpr(donutOptions);

  return {
    // This is the max length of the text that can be displayed in the donut summary
    // If the text is longer than this, it will be truncated
    // It is calculated using the Pythagorean theorem
    signal: `2 * sqrt(pow(${donutInnerRadius}, 2) - pow(${fontHeight}, 2))`,
  };
};

/**
 * Gets the encode for the metric label
 * @param donutSummaryOptions
 * @returns encode
 */
export const getSummaryLabelEncode = ({
  donutOptions,
  hideValue,
  label,
  delta,
}: DonutSummarySpecOptions & { label: string }): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
  const { name } = donutOptions;
  const hasValue = !hideValue;
  const hasDelta = delta !== undefined;
  // label always continues below the value when it's shown; otherwise it becomes the anchor line
  // (flush at center) if a delta follows it, or renders centered alone if nothing else is present
  let baseline: 'top' | 'alphabetic' | 'middle';
  if (hasValue) {
    baseline = 'top';
  } else if (hasDelta) {
    baseline = 'alphabetic';
  } else {
    baseline = 'middle';
  }
  // height of the label block from the donut's center, matching its own baseline: half its own font
  // size when centered alone, its full font size when flush at center with a delta below it, or the
  // value's dy offset plus the label's full font size when stacked below the value
  let heightFromCenter: string;
  if (baseline === 'middle') {
    heightFromCenter = `${name}_summaryLabelFontSize * 0.5`;
  } else if (baseline === 'alphabetic') {
    heightFromCenter = `${name}_summaryLabelFontSize`;
  } else {
    heightFromCenter = `ceil(${name}_summaryValueFontSize * 0.25) + ${name}_summaryLabelFontSize`;
  }
  const limitSignal = `2 * sqrt(pow(${getDonutInnerRadiusExpr(donutOptions)}, 2) - pow(${heightFromCenter}, 2))`;
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: 'height / 2' },
      ...(hasValue && { dy: { signal: `ceil(${name}_summaryValueFontSize * 0.25)` } }),
      text: { value: label },
      fontSize: [
        { test: `${getDonutInnerRadiusExpr(donutOptions)} < ${DONUT_SUMMARY_MIN_RADIUS_S2}`, value: 0 },
        { signal: `${name}_summaryLabelFontSize` },
      ],
      fontWeight: { value: 700 },
      align: { value: 'center' },
      baseline: { value: baseline },
      limit: {
        signal: limitSignal,
      },
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
  const { name, colorScheme } = donutOptions;
  const hasValue = !hideValue;
  const hasLabel = Boolean(label);
  // delta always renders last: below the label if present, otherwise directly below the value
  // (taking over the label's usual gap), or centered alone if neither value nor label render
  const valueGapExpr = hasValue ? `ceil(${name}_summaryValueFontSize * 0.25) + ` : '';
  let dyExpr: string | undefined;
  if (hasLabel) {
    dyExpr = `${valueGapExpr}${name}_summaryLabelFontSize + ceil(${name}_summaryLabelFontSize * 0.25)`;
  } else if (hasValue) {
    dyExpr = `ceil(${name}_summaryValueFontSize * 0.25)`;
  } else {
    dyExpr = undefined;
  }
  const baseline = dyExpr === undefined ? 'middle' : 'top';
  const heightFromCenter =
    baseline === 'middle' ? `${name}_summaryLabelFontSize * 0.5` : `${dyExpr} + ${name}_summaryLabelFontSize`;
  const limitSignal = `2 * sqrt(pow(${getDonutInnerRadiusExpr(donutOptions)}, 2) - pow(${heightFromCenter}, 2))`;
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: 'height / 2' },
      ...(dyExpr !== undefined && { dy: { signal: dyExpr } }),
      text: getSummaryDeltaText(delta),
      fontSize: [
        { test: `${getDonutInnerRadiusExpr(donutOptions)} < ${DONUT_SUMMARY_MIN_RADIUS_S2}`, value: 0 },
        { signal: `${name}_summaryLabelFontSize` },
      ],
      fontWeight: { value: 800 },
      fill: getSummaryDeltaFill(delta, colorScheme),
      align: { value: 'center' },
      baseline: { value: baseline },
      limit: {
        signal: limitSignal,
      },
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
