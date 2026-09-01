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
import { GroupMark, ProductionRule, Signal, SymbolMark, TextEncodeEntry, TextMark, TextValueRef, ThresholdScale } from 'vega';

import {
  DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
  DONUT_ADVANCED_LABEL_DETAIL_FONT_WEIGHT,
  DONUT_ADVANCED_LABEL_NAME_FONT_WEIGHT,
  DONUT_ADVANCED_LABEL_NAME_VALUE_GAP,
  DONUT_ADVANCED_LABEL_SWATCH_GAP,
  DONUT_ADVANCED_LABEL_SWATCH_SIZE,
  DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP,
  DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
  DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT,
  DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
  DONUT_SEGMENT_LABEL_MIN_ANGLE,
  DONUT_SIZE_TIER_CUTPOINTS,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule, getMarkOpacity } from '../marks/markUtils';
import { getPathFromSymbolShape } from '../specUtils';
import { getTextNumberFormat } from '../textUtils';
import { AdvancedLabelOptions, AdvancedLabelSpecOptions, DonutSpecOptions } from '../types';
import { getDonutEmptyStateTest, getDonutOuterRadiusExpr } from './donutUtils';
import { getLabelValueFill, getTextRuleExpr } from './segmentLabelUtils';

/**
 * Gets the AdvancedLabel component from the children if one exists
 * @param donutOptions
 * @returns advancedLabelOptions
 */
const getAdvancedLabel = (options: DonutSpecOptions): AdvancedLabelSpecOptions | undefined => {
  if (!options.advancedLabels.length) {
    return;
  }
  return applyAdvancedLabelPropDefaults(options.advancedLabels[0], options);
};

/**
 * Applies all default options, converting AdvancedLabelOptions into AdvancedLabelSpecOptions
 * @param advancedLabelOptions
 * @param donutOptions
 * @returns AdvancedLabelSpecOptions
 */
const applyAdvancedLabelPropDefaults = (
  {
    percent = false,
    percentFormat = '.0%',
    value = false,
    valueFormat = 'standardNumber',
    detail = false,
    ...options
  }: AdvancedLabelOptions,
  donutOptions: DonutSpecOptions
): AdvancedLabelSpecOptions => ({
  donutOptions,
  percent,
  percentFormat,
  value,
  valueFormat,
  detail,
  ...options,
});

/**
 * Gets the threshold scales that snap a donut's outer diameter to its nearest named size tier's
 * advanced-label font sizes. The name row reuses direct-labels' value font-size ramp exactly
 * (same documented px values), so only the value and detail rows need their own scale.
 * @param donutOptions
 * @returns ThresholdScale[]
 */
export const getAdvancedLabelScales = (donutOptions: DonutSpecOptions): ThresholdScale[] => {
  if (!getAdvancedLabel(donutOptions)) return [];
  const { name } = donutOptions;
  return [
    {
      name: `${name}_advancedLabelNameFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
    },
    {
      name: `${name}_advancedLabelValueFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
    },
    {
      name: `${name}_advancedLabelDetailFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
    },
  ];
};

/**
 * Gets the signals that resolve a donut's advanced-label font sizes from its outer diameter
 * @param donutOptions
 * @returns Signal[]
 */
export const getAdvancedLabelSignals = (donutOptions: DonutSpecOptions): Signal[] => {
  if (!getAdvancedLabel(donutOptions)) return [];
  const { name } = donutOptions;
  const donutDiameter = `2 * ${getDonutOuterRadiusExpr(donutOptions)}`;
  return [
    {
      name: `${name}_advancedLabelNameFontSize`,
      update: `scale('${name}_advancedLabelNameFontSizeScale', ${donutDiameter})`,
    },
    {
      name: `${name}_advancedLabelValueFontSize`,
      update: `scale('${name}_advancedLabelValueFontSizeScale', ${donutDiameter})`,
    },
    {
      name: `${name}_advancedLabelDetailFontSize`,
      update: `scale('${name}_advancedLabelDetailFontSizeScale', ${donutDiameter})`,
    },
  ];
};

/**
 * Gets the text value ref for the advanced label's value/percent row (same shape as SegmentLabel's)
 * @param advancedLabelOptions
 * @returns TextValueRef
 */
export const getAdvancedLabelValueText = ({
  donutOptions,
  percent,
  percentFormat,
  value,
  valueFormat,
}: AdvancedLabelSpecOptions): ProductionRule<TextValueRef> | undefined => {
  const percentSignal = `format(datum['${donutOptions.name}_arcPercent'], '${percentFormat}')`;
  if (value) {
    const rules = getTextNumberFormat(valueFormat, donutOptions.metric) as { test?: string; signal: string }[];
    if (percent) {
      return rules.map((rule) => ({
        ...rule,
        signal: `${percentSignal} + "\\u00a0\\u00a0" + ${rule.signal}`,
      }));
    }
    return rules;
  }
  if (percent) {
    return { signal: percentSignal };
  }
};

/**
 * Gets the text value ref for the advanced label's optional detail row ("{segment value} out of
 * {total value}"), reusing the existing donut-summary aggregate total rather than a duplicate data source
 * @param advancedLabelOptions
 * @returns TextValueRef
 */
const getAdvancedLabelDetailText = ({ donutOptions, valueFormat }: AdvancedLabelSpecOptions): TextValueRef => {
  const { metric, name } = donutOptions;
  const segmentRules = getTextNumberFormat(valueFormat, metric) as { test?: string; signal: string }[];
  const segmentExpr = getTextRuleExpr(segmentRules);
  const totalRules = getTextNumberFormat(valueFormat, 'sum') as { test?: string; signal: string }[];
  // the sum aggregate lives on a single-row derived data source (getSumData, donutUtils.ts) -
  // reference its one row's field directly rather than duplicating the aggregation here
  const totalExpr = getTextRuleExpr(totalRules).replace(/datum\[/g, `data('${name}_sumData')[0][`);
  return { signal: `${segmentExpr} + " out of " + ${totalExpr}` };
};

/**
 * Gets a label's pre-collision-avoidance ideal anchor radius (the ring-gap point) - matches
 * direct-labels' own anchor radius exactly, since both share the same ring-gap token.
 * @param donutOptions
 * @returns vega expression string
 */
const getAdvancedLabelAnchorRadiusExpr = (donutOptions: DonutSpecOptions): string =>
  `${getDonutOuterRadiusExpr(donutOptions)} + ${DONUT_LABEL_RING_GAP}`;

/**
 * Gets the shared horizontal pixel offset for the whole swatch+text block, mirroring
 * donut-direct-labels' single-line technique but measuring the widest of all rows (swatch+name,
 * value/%, and detail) rather than just two text lines.
 * @param advancedLabelOptions
 * @returns vega expression string
 */
const getAdvancedLabelAnchorDxExpr = (options: AdvancedLabelSpecOptions): string => {
  const { donutOptions, labelKey, percent, value, detail } = options;
  const { color, name } = donutOptions;
  const nameTextExpr = `datum['${labelKey ?? color}']`;
  const nameWidthExpr = `${DONUT_ADVANCED_LABEL_SWATCH_SIZE} + ${DONUT_ADVANCED_LABEL_SWATCH_GAP} + getLabelWidth(${nameTextExpr}, ${DONUT_ADVANCED_LABEL_NAME_FONT_WEIGHT}, ${name}_advancedLabelNameFontSize)`;
  const valueWidthExpr =
    value || percent
      ? `getLabelWidth(${getTextRuleExpr(
          getAdvancedLabelValueText(options)
        )}, ${DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT}, ${name}_advancedLabelValueFontSize)`
      : '0';
  const detailWidthExpr = detail
    ? `getLabelWidth(${getTextRuleExpr(
        getAdvancedLabelDetailText(options)
      )}, ${DONUT_ADVANCED_LABEL_DETAIL_FONT_WEIGHT}, ${name}_advancedLabelDetailFontSize)`
    : '0';
  const widerWidthExpr = `max(${nameWidthExpr}, max(${valueWidthExpr}, ${detailWidthExpr}))`;
  const cappedWidthExpr = `min(${widerWidthExpr}, ${getDonutOuterRadiusExpr(
    donutOptions
  )} * ${DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO})`;
  return `(datum['${name}_arcTheta'] <= PI ? 0 : -(${cappedWidthExpr}))`;
};

/**
 * Gets the row-stacking dy offsets for the name/value/detail rows, in both hemispheres of the
 * vertical split. Reading order (name, then value/%, then detail) never flips - only which row
 * sits nearest the ring-gap anchor point changes, mirroring donut-direct-labels' name-stays-above-value
 * technique extended to a third row. A hidden row is skipped entirely; the next visible row closes the gap.
 * @param advancedLabelOptions
 * @returns per-row dy expressions (undefined if that row isn't rendered)
 */
const getAdvancedLabelRowDy = (
  options: AdvancedLabelSpecOptions
): { name: string; value?: string; detail?: string } => {
  const { donutOptions, value, percent, detail } = options;
  const { name } = donutOptions;
  const hasValue = value || percent;
  const nameSize = `${name}_advancedLabelNameFontSize`;
  const valueSize = `${name}_advancedLabelValueFontSize`;
  const detailSize = `${name}_advancedLabelDetailFontSize`;

  // total stacked block height (name + any visible rows below it) - scales the whole stacking down
  // if it would exceed the exact same margin getDonutOuterRadiusExpr already reserves horizontally
  // (DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO), so a segment anchored near the very top/bottom of the
  // ring never overflows vertically without needing to shrink the ring any further than direct
  // labels already do
  const totalHeightExpr = `${nameSize}${hasValue ? ` + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} + ${valueSize}` : ''}${
    detail ? ` + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP} + ${detailSize}` : ''
  }`;
  const maxHeightExpr = `${getDonutOuterRadiusExpr(donutOptions)} * ${DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO}`;
  const scaleExpr = `min(1, (${maxHeightExpr}) / (${totalHeightExpr}))`;

  // bottom half (baseline 'top', grows downward): name anchors at dy 0, each visible row after it
  // stacks below the previous with its token gap
  const bottomValueDy = hasValue
    ? `(${nameSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr})`
    : undefined;
  const bottomDetailDy = !detail
    ? undefined
    : hasValue
    ? `(${nameSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} + ${valueSize} + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP}) * (${scaleExpr})`
    : `(${nameSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr})`;

  // top half (baseline 'bottom', grows upward): mirror image - the last visible row anchors at dy 0
  const topDetailDy = detail ? '0' : undefined;
  const topValueDy = !hasValue
    ? undefined
    : detail
    ? `-((${detailSize} + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP}) * (${scaleExpr}))`
    : '0';
  const topNameDy = detail
    ? `-((${detailSize} + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP} + ${valueSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr}))`
    : hasValue
    ? `-((${valueSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr}))`
    : '0';

  const isTopHalfExpr = `datum['${name}_arcTheta'] <= 0.5 * PI || datum['${name}_arcTheta'] >= 1.5 * PI`;
  return {
    name: `${isTopHalfExpr} ? (${topNameDy}) : 0`,
    value: hasValue ? `${isTopHalfExpr} ? (${topValueDy}) : (${bottomValueDy})` : undefined,
    detail: detail ? `${isTopHalfExpr} ? (${topDetailDy}) : (${bottomDetailDy})` : undefined,
  };
};

/**
 * Gets the shared x/align/baseline encodes common to every row and the swatch in an advanced label
 * block - all rows (and the swatch) share the same anchor x and hemisphere-mirrored dx.
 * @param advancedLabelOptions
 * @returns TextEncodeEntry
 */
const getAdvancedLabelSharedEncode = (options: AdvancedLabelSpecOptions): TextEncodeEntry => {
  const { name } = options.donutOptions;
  return {
    radius: { signal: getAdvancedLabelAnchorRadiusExpr(options.donutOptions) },
    theta: { field: `${name}_arcTheta` },
    dx: { signal: getAdvancedLabelAnchorDxExpr(options) },
    align: { value: 'left' },
    baseline: {
      signal: `datum['${name}_arcTheta'] <= 0.5 * PI || datum['${name}_arcTheta'] >= 1.5 * PI ? 'bottom' : 'top'`,
    },
  };
};

/**
 * Gets the font size for an advanced label row, hidden below the min-angle threshold or when the
 * donut has no data - mirrors SegmentLabel's getSegmentLabelFontSize exactly
 * @param name
 * @param fontSizeSignal
 * @returns ProductionRule<{ signal?: string; value?: number }>
 */
const getAdvancedLabelFontSize = (name: string, fontSizeSignal: string) => [
  { test: getDonutEmptyStateTest(name), value: 0 },
  { test: `datum['${name}_arcLength'] < ${DONUT_SEGMENT_LABEL_MIN_ANGLE}`, value: 0 },
  { signal: fontSizeSignal },
];

/**
 * Gets the swatch mark - always the leftmost element of the block, on both hemispheres. Symbol
 * marks have no radius/theta/dx encode channels (those are text-mark-only per Vega's spec), so
 * this replicates Vega's own polar-to-cartesian conversion (vega-scenegraph text.js anchorPoint:
 * x = cx + r*sin(theta), y = cy - r*cos(theta)) directly as x/y signal expressions, then nudges y
 * from the name row's own anchor to sit at that text's optical vertical center.
 * @param advancedLabelOptions
 * @returns SymbolMark
 */
const getAdvancedLabelSwatchMark = (options: AdvancedLabelSpecOptions): SymbolMark => {
  const { donutOptions } = options;
  const { color, colorScheme, name } = donutOptions;
  const arcThetaExpr = `datum['${name}_arcTheta']`;
  const radiusExpr = getAdvancedLabelAnchorRadiusExpr(donutOptions);
  const dxExpr = getAdvancedLabelAnchorDxExpr(options);
  const rowDy = getAdvancedLabelRowDy(options);
  const isTopHalfExpr = `${arcThetaExpr} <= 0.5 * PI || ${arcThetaExpr} >= 1.5 * PI`;
  const nameFontSize = `${name}_advancedLabelNameFontSize`;

  const polarX = `width / 2 + (${radiusExpr}) * sin(${arcThetaExpr})`;
  const polarY = `height / 2 - (${radiusExpr}) * cos(${arcThetaExpr})`;
  const nameAnchorY = `(${polarY}) + (${rowDy.name})`;
  // shift from the name row's baseline anchor to its optical vertical center
  const nameCenterY = `(${nameAnchorY}) + (${isTopHalfExpr} ? -(${nameFontSize} * 0.5) : (${nameFontSize} * 0.5))`;

  return {
    type: 'symbol',
    name: `${name}_advancedLabelSwatch`,
    from: { data: FILTERED_TABLE },
    encode: {
      enter: {
        shape: { value: getPathFromSymbolShape('rounded-square') },
        fill: getColorProductionRule(color, colorScheme),
      },
      update: {
        // symbol marks' x is their center, unlike text's left-aligned x+dx - shift right by half
        // the swatch so its rendered left edge lines up with the value/detail rows' left edge
        x: { signal: `(${polarX}) + (${dxExpr}) + ${DONUT_ADVANCED_LABEL_SWATCH_SIZE / 2}` },
        y: { signal: nameCenterY },
        size: getAdvancedLabelFontSize(name, `${DONUT_ADVANCED_LABEL_SWATCH_SIZE * DONUT_ADVANCED_LABEL_SWATCH_SIZE}`),
        opacity: getMarkOpacity(donutOptions),
      },
    },
  };
};

/**
 * Gets the text mark for the advanced label's name row (swatch + segment name)
 * @param advancedLabelOptions
 * @returns TextMark
 */
const getAdvancedLabelNameTextMark = (options: AdvancedLabelSpecOptions): TextMark => {
  const { labelKey, donutOptions } = options;
  const { color, name } = donutOptions;
  const shared = getAdvancedLabelSharedEncode(options);
  const rowDy = getAdvancedLabelRowDy(options);
  return {
    type: 'text',
    name: `${name}_advancedLabelName`,
    from: { data: FILTERED_TABLE },
    encode: {
      enter: {
        text: [{ test: getDonutEmptyStateTest(name), value: '' }, { field: labelKey ?? color }],
        fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
      },
      update: {
        x: { signal: 'width / 2' },
        y: { signal: 'height / 2' },
        ...shared,
        // name row starts after the swatch + its gap
        dx: { signal: `${getAdvancedLabelAnchorDxExpr(options)} + ${DONUT_ADVANCED_LABEL_SWATCH_SIZE} + ${DONUT_ADVANCED_LABEL_SWATCH_GAP}` },
        dy: { signal: rowDy.name },
        fontSize: getAdvancedLabelFontSize(name, `${name}_advancedLabelNameFontSize`),
        opacity: getMarkOpacity(donutOptions),
      },
    },
  };
};

/**
 * Gets the text mark for the advanced label's value/percent row - left-aligned to the swatch, not
 * the name, and switches to the segment's own categorical color on hover (matching donut-hover)
 * @param advancedLabelOptions
 * @returns TextMark[]
 */
const getAdvancedLabelValueTextMark = (options: AdvancedLabelSpecOptions): TextMark[] => {
  if (!options.value && !options.percent) return [];
  const { donutOptions } = options;
  const { name } = donutOptions;
  const valueText = getAdvancedLabelValueText(options) ?? [];
  const valueTextRules = Array.isArray(valueText) ? valueText : [valueText];
  const shared = getAdvancedLabelSharedEncode(options);
  const rowDy = getAdvancedLabelRowDy(options);
  return [
    {
      type: 'text',
      name: `${name}_advancedLabelValue`,
      from: { data: FILTERED_TABLE },
      encode: {
        enter: {
          text: [{ test: getDonutEmptyStateTest(name), value: '' }, ...valueTextRules],
          fontWeight: { value: DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT },
        },
        update: {
          x: { signal: 'width / 2' },
          y: { signal: 'height / 2' },
          ...shared,
          dy: { signal: rowDy.value as string },
          fontSize: getAdvancedLabelFontSize(name, `${name}_advancedLabelValueFontSize`),
          fill: getLabelValueFill(donutOptions, 'gray-800'),
          opacity: getMarkOpacity(donutOptions),
        },
      },
    },
  ];
};

/**
 * Gets the text mark for the advanced label's optional detail row ("{segment value} out of {total}")
 * @param advancedLabelOptions
 * @returns TextMark[]
 */
const getAdvancedLabelDetailTextMark = (options: AdvancedLabelSpecOptions): TextMark[] => {
  if (!options.detail) return [];
  const { donutOptions } = options;
  const { name } = donutOptions;
  const shared = getAdvancedLabelSharedEncode(options);
  const rowDy = getAdvancedLabelRowDy(options);
  return [
    {
      type: 'text',
      name: `${name}_advancedLabelDetail`,
      from: { data: FILTERED_TABLE },
      encode: {
        enter: {
          text: [{ test: getDonutEmptyStateTest(name), value: '' }, getAdvancedLabelDetailText(options)],
          fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
        },
        update: {
          x: { signal: 'width / 2' },
          y: { signal: 'height / 2' },
          ...shared,
          dy: { signal: rowDy.detail as string },
          fontSize: getAdvancedLabelFontSize(name, `${name}_advancedLabelDetailFontSize`),
          opacity: getMarkOpacity(donutOptions),
        },
      },
    },
  ];
};

/**
 * Gets the marks for the advanced label. If there isn't an advanced label, an empty array is returned.
 * @param donutOptions
 * @returns GroupMark[]
 */
export const getAdvancedLabelMarks = (donutOptions: DonutSpecOptions): GroupMark[] => {
  const { isBoolean, name } = donutOptions;
  // advanced labels are not supported for boolean variants, matching SegmentLabel's restriction
  if (isBoolean) return [];

  const advancedLabel = getAdvancedLabel(donutOptions);
  if (!advancedLabel) return [];

  return [
    {
      name: `${name}_advancedLabelGroup`,
      type: 'group',
      marks: [
        getAdvancedLabelSwatchMark(advancedLabel),
        getAdvancedLabelNameTextMark(advancedLabel),
        ...getAdvancedLabelValueTextMark(advancedLabel),
        ...getAdvancedLabelDetailTextMark(advancedLabel),
      ],
    },
  ];
};
