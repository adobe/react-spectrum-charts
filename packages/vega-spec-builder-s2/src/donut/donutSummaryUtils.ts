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
} from 'vega';

import {
  DONUT_SUMMARY_LABEL_FONT_SIZES,
  DONUT_SUMMARY_MIN_RADIUS_S2,
  DONUT_SUMMARY_VALUE_FONT_SIZES,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getTextNumberFormat } from '../textUtils';
import { DonutSpecOptions, DonutSummaryOptions, DonutSummarySpecOptions } from '../types';
import { getDonutCenterYSignal, getDonutInnerRadiusExpr, getSizeTierValueExpr } from './donutUtils';
import { getTextRuleExpr } from './segmentLabelUtils';

type DonutSummaryLayoutOptions = Pick<DonutSummarySpecOptions, 'donutOptions' | 'hideValue' | 'label' | 'delta'>;

/**
 * Gets the distance from the summary anchor to the bottom of its text stack.
 * @param options
 * @returns vega expression string
 */
const getDonutSummaryStackBottomExpr = ({
  donutOptions,
  hideValue,
  label,
  delta,
}: DonutSummaryLayoutOptions): string => {
  const { name } = donutOptions;
  const hasValue = !hideValue;
  const hasLabel = Boolean(label);
  const hasDelta = delta !== undefined;
  const valueGap = `ceil(${name}_summaryValueFontSize * 0.25)`;
  const labelGap = `ceil(${name}_summaryLabelFontSize * 0.25)`;

  if (hasValue && hasLabel && hasDelta) {
    return `${valueGap} + ${name}_summaryLabelFontSize + ${labelGap} + ${name}_summaryLabelFontSize`;
  }
  if (hasValue && (hasLabel || hasDelta)) {
    return `${valueGap} + ${name}_summaryLabelFontSize`;
  }
  if (!hasValue && hasLabel && hasDelta) {
    return `${labelGap} + ${name}_summaryLabelFontSize`;
  }
  const fontSize = hasValue ? `${name}_summaryValueFontSize` : `${name}_summaryLabelFontSize`;
  return `${fontSize} * 0.5`;
};

/**
 * Gets the summary height reserved below a semicircle's flat edge.
 * @param options
 * @returns vega expression string
 */
const getDonutSummaryBottomOffsetExpr = ({
  donutOptions,
  hideValue,
  label,
  delta,
}: DonutSummaryLayoutOptions): string => {
  if (delta === undefined || hideValue || !label) {
    return '0';
  }
  const { name } = donutOptions;
  const gapFontSize = label ? `${name}_summaryLabelFontSize` : `${name}_summaryValueFontSize`;
  return `ceil(${gapFontSize} * 0.25) + ${name}_summaryLabelFontSize`;
};

/**
 * Gets the vertical offset from the donut center to the summary anchor.
 * @param options
 * @returns vega expression string
 */
const getDonutSummaryAnchorOffsetExpr = (options: DonutSummaryLayoutOptions): string => {
  if (options.donutOptions.variant !== 'semicircle') {
    return '0';
  }
  const stackBottom = getDonutSummaryStackBottomExpr(options);
  const bottomOffset = getDonutSummaryBottomOffsetExpr(options);
  // Keep the summary stack 3px from the semicircle's bottom edge.
  return bottomOffset === '0' ? `3 + ${stackBottom}` : `3 + (${stackBottom}) - (${bottomOffset})`;
};

/**
 * Gets the y anchor signal for the donut summary's text marks.
 * @param options
 * @returns vega expression string
 */
const getDonutSummaryAnchorYSignal = (options: DonutSummaryLayoutOptions): string => {
  const offset = getDonutSummaryAnchorOffsetExpr(options);
  const bottomOffset = getDonutSummaryBottomOffsetExpr(options);
  const center =
    options.donutOptions.variant === 'semicircle' && bottomOffset !== '0'
      ? `height - (${bottomOffset})`
      : getDonutCenterYSignal(options.donutOptions);
  return offset === '0' ? center : `${center} - (${offset})`;
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
  const signals: Signal[] = [
    { name: `${name}_summaryValueFontSize`, update: getSizeTierValueExpr(name, DONUT_SUMMARY_VALUE_FONT_SIZES) },
    { name: `${name}_summaryLabelFontSize`, update: getSizeTierValueExpr(name, DONUT_SUMMARY_LABEL_FONT_SIZES) },
  ];
  if (donutOptions.variant === 'semicircle') {
    signals.push({
      name: `${name}_summaryBottomOffset`,
      update: getDonutSummaryBottomOffsetExpr(donutSummary),
    });
  }
  return signals;
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
      test: `(${limitSignal}) > 0 && ${textWidth} >= (${limitSignal}) && ${firstCharacterWidth} >= (${limitSignal}) - ${ellipsisWidth}`,
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
  const { donutOptions, label, delta } = options;
  const hasLineBelow = Boolean(label) || delta !== undefined;
  const text = getSummaryValueText(options);
  const fontSize = `${donutOptions.name}_summaryValueFontSize`;
  const limit = getSummaryValueLimit(options);
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: getDonutSummaryAnchorYSignal(options) },
      text,
      fontSize: getSummaryTextFontSize(donutOptions, getTextRuleExpr(text), fontSize, 800, limit.signal),
      fontWeight: { value: 800 }, // S2 font weight for value
      align: { value: 'center' },
      baseline: getSummaryValueBaseline(hasLineBelow),
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
export const getSummaryValueLimit = ({ donutOptions, label, delta }: DonutSummarySpecOptions): { signal: string } => {
  const { name } = donutOptions;
  const hasLineBelow = Boolean(label) || delta !== undefined;
  // if nothing renders below it, the height of the font from the center of the donut is 1/2 the font size
  const fontHeight = hasLineBelow ? `${name}_summaryValueFontSize` : `${name}_summaryValueFontSize * 0.5`;
  const donutInnerRadius = getDonutInnerRadiusExpr(donutOptions);
  const anchorOffset = getDonutSummaryAnchorOffsetExpr({ donutOptions, hideValue: false, label, delta });

  return {
    // This is the max length of the text that can be displayed in the donut summary
    // If the text is longer than this, it will be truncated
    // It is calculated using the Pythagorean theorem, offset by the anchor's own distance from
    // the arc's true center (0 for a full circle, non-zero for a semicircle)
    signal: `2 * sqrt(pow(${donutInnerRadius}, 2) - pow((${fontHeight}) + (${anchorOffset}), 2))`,
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
  const anchorOffset = getDonutSummaryAnchorOffsetExpr({ donutOptions, hideValue, label, delta });
  const verticalOffset =
    donutOptions.variant === 'semicircle' && baseline !== 'middle'
      ? `abs((${heightFromCenter}) - (${anchorOffset}))`
      : `(${heightFromCenter}) + (${anchorOffset})`;
  const limitSignal = `2 * sqrt(pow(${getDonutInnerRadiusExpr(donutOptions)}, 2) - pow(${verticalOffset}, 2))`;
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: getDonutSummaryAnchorYSignal({ donutOptions, hideValue, label, delta }) },
      dy: { signal: hasValue ? `ceil(${name}_summaryValueFontSize * 0.25)` : '0' },
      text: { value: label },
      fontSize: getSummaryTextFontSize(
        donutOptions,
        JSON.stringify(label),
        `${name}_summaryLabelFontSize`,
        700,
        limitSignal
      ),
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
  if (hasLabel && hasValue) {
    dyExpr = `${valueGapExpr}${name}_summaryLabelFontSize + ceil(${name}_summaryLabelFontSize * 0.25)`;
  } else if (hasLabel) {
    dyExpr = `ceil(${name}_summaryLabelFontSize * 0.25)`;
  } else if (hasValue) {
    dyExpr = `ceil(${name}_summaryValueFontSize * 0.25)`;
  } else {
    dyExpr = undefined;
  }
  const baseline = dyExpr === undefined ? 'middle' : 'top';
  const heightFromCenter =
    baseline === 'middle' ? `${name}_summaryLabelFontSize * 0.5` : `${dyExpr} + ${name}_summaryLabelFontSize`;
  const anchorOffset = getDonutSummaryAnchorOffsetExpr({ donutOptions, hideValue, label, delta });
  const holeLimit = `2 * sqrt(pow(${getDonutInnerRadiusExpr(
    donutOptions
  )}, 2) - pow((${heightFromCenter}) + (${anchorOffset}), 2))`;
  const isBelowSemicircle = donutOptions.variant === 'semicircle' && hasValue && hasLabel;
  const limitSignal = isBelowSemicircle ? 'width' : holeLimit;
  return {
    update: {
      x: { signal: 'width / 2' },
      y: { signal: getDonutSummaryAnchorYSignal({ donutOptions, hideValue, label, delta }) },
      dy: { signal: dyExpr ?? '0' },
      text: getSummaryDeltaText(delta),
      fontSize: getSummaryTextFontSize(
        donutOptions,
        getTextRuleExpr(getSummaryDeltaText(delta)),
        `${name}_summaryLabelFontSize`,
        800,
        limitSignal
      ),
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
