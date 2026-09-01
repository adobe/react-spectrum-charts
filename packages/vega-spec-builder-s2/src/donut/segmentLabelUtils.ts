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
  GroupMark,
  NumericValueRef,
  ProductionRule,
  Signal,
  TextEncodeEntry,
  TextMark,
  TextValueRef,
  ThresholdScale,
} from 'vega';

import {
  DONUT_DIRECT_LABEL_NAME_FONT_SIZES,
  DONUT_DIRECT_LABEL_NAME_FONT_WEIGHT,
  DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
  DONUT_DIRECT_LABEL_VALUE_FONT_WEIGHT,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
  DONUT_SEGMENT_LABEL_MIN_ANGLE,
  DONUT_SIZE_TIER_CUTPOINTS,
  FILTERED_TABLE,
  HOVERED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule, getMarkOpacity } from '../marks/markUtils';
import { getTextNumberFormat } from '../textUtils';
import { DonutSpecOptions, SegmentLabelOptions, SegmentLabelSpecOptions } from '../types';
import { getDonutEmptyStateTest, getDonutOuterRadiusExpr } from './donutUtils';

/**
 * Gets the SegmentLabel component from the children if one exists
 * @param donutOptions
 * @returns segmentLabelOptions
 */
const getSegmentLabel = (options: DonutSpecOptions): SegmentLabelSpecOptions | undefined => {
  if (!options.segmentLabels.length) {
    return;
  }
  return applySegmentLabelPropDefaults(options.segmentLabels[0], options);
};

/**
 * Applies all default options, converting SegmentLabelOptions into SegmentLabelSpecOptions
 * @param segmentLabelOptions
 * @param donutOptions
 * @returns SegmentLabelSpecOptions
 */
const applySegmentLabelPropDefaults = (
  {
    percent = false,
    percentFormat = '.0%',
    value = false,
    valueFormat = 'standardNumber',
    ...options
  }: SegmentLabelOptions,
  donutOptions: DonutSpecOptions
): SegmentLabelSpecOptions => ({
  donutOptions,
  percent,
  percentFormat,
  value,
  valueFormat,
  ...options,
});

/**
 * Gets the threshold scales that snap a donut's outer diameter to its nearest named size tier's direct-label font sizes
 * @param donutOptions
 * @returns ThresholdScale[]
 */
export const getSegmentLabelScales = (donutOptions: DonutSpecOptions): ThresholdScale[] => {
  if (!getSegmentLabel(donutOptions)) return [];
  const { name } = donutOptions;
  return [
    {
      name: `${name}_segmentLabelNameFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_DIRECT_LABEL_NAME_FONT_SIZES,
    },
    {
      name: `${name}_segmentLabelValueFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
    },
  ];
};

/**
 * Gets the signals that resolve a donut's direct-label font sizes from its outer diameter
 * @param donutOptions
 * @returns Signal[]
 */
export const getSegmentLabelSignals = (donutOptions: DonutSpecOptions): Signal[] => {
  if (!getSegmentLabel(donutOptions)) return [];
  const { name } = donutOptions;
  const donutDiameter = `2 * ${getDonutOuterRadiusExpr(donutOptions)}`;
  return [
    {
      name: `${name}_segmentLabelNameFontSize`,
      update: `scale('${name}_segmentLabelNameFontSizeScale', ${donutDiameter})`,
    },
    {
      name: `${name}_segmentLabelValueFontSize`,
      update: `scale('${name}_segmentLabelValueFontSizeScale', ${donutDiameter})`,
    },
  ];
};

/**
 * Converts a text production rule into a single Vega expression string, for use inside getLabelWidth()
 * @param rule
 * @returns vega expression string
 */
export const getTextRuleExpr = (rule: ProductionRule<TextValueRef> | undefined): string => {
  if (rule === undefined) return `''`;
  const rules = Array.isArray(rule) ? rule : [rule];
  const getValue = (r: TextValueRef): string => {
    if ('signal' in r && r.signal) return r.signal;
    if ('field' in r && typeof r.field === 'string') return `datum['${r.field}']`;
    if ('value' in r && r.value !== undefined) return `'${r.value}'`;
    return `''`;
  };
  const lastRule = rules.at(-1);
  if (lastRule === undefined) {
    throw new Error('getTextRuleExpr: empty production rule array');
  }
  let expr = getValue(lastRule);
  for (let i = rules.length - 2; i >= 0; i--) {
    const rule = rules[i] as { test?: string } & TextValueRef;
    expr = rule.test ? `${rule.test} ? (${getValue(rule)}) : (${expr})` : getValue(rule);
  }
  return expr;
};

/**
 * Gets the shared anchor radius for a label's name/value lines - always the ring-gap point. The
 * hemisphere-mirrored pull-back lives entirely in getLabelAnchorDxExpr as a horizontal pixel offset,
 * not folded into this radial value, since radius+theta positioning has a vertical component for any
 * label not exactly at the 9/3 o'clock cardinal points - baking the pull-back into radius there would
 * push the anchor up/down instead of sideways.
 * @param donutOptions
 * @returns vega expression string
 */
const getLabelAnchorRadiusExpr = (donutOptions: DonutSpecOptions): string =>
  `${getDonutOuterRadiusExpr(donutOptions)} + ${DONUT_LABEL_RING_GAP}`;

/**
 * Gets the shared horizontal pixel offset for a label's name/value lines. Right-hemisphere labels get
 * no offset (anchor sits at the ring-gap point and grows away from the ring). Left-hemisphere labels
 * get pulled left by the wider line's real rendered width, so that line's far (right) edge lands
 * exactly on the ring-gap point while both lines still share the same near (left) edge. This is a pure
 * horizontal (dx) adjustment, independent of theta, so it never distorts a label's vertical position.
 * @param segmentLabelOptions
 * @returns vega expression string
 */
const getLabelAnchorDxExpr = (options: SegmentLabelSpecOptions): string => {
  const { donutOptions, labelKey, percent, value } = options;
  const { color, name } = donutOptions;
  const nameTextExpr = `datum['${labelKey ?? color}']`;
  const nameWidthExpr = `getLabelWidth(${nameTextExpr}, ${DONUT_DIRECT_LABEL_NAME_FONT_WEIGHT}, ${name}_segmentLabelNameFontSize)`;
  const valueWidthExpr =
    value || percent
      ? `getLabelWidth(${getTextRuleExpr(
          getSegmentLabelValueText(options)
        )}, ${DONUT_DIRECT_LABEL_VALUE_FONT_WEIGHT}, ${name}_segmentLabelValueFontSize)`
      : '0';
  const widerWidthExpr = `max(${nameWidthExpr}, ${valueWidthExpr})`;
  // capped at the same ratio getDonutOuterRadiusExpr already reserved room for, so the worst-case
  // reach (ring + gap + this cap) exactly matches the space getDonutOuterRadiusExpr solved for
  const cappedWidthExpr = `min(${widerWidthExpr}, ${getDonutOuterRadiusExpr(
    donutOptions
  )} * ${DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO})`;
  return `(datum['${name}_arcTheta'] <= PI ? 0 : -(${cappedWidthExpr}))`;
};

/**
 * Gets the marks for the segment label. If there isn't a segment label, an empty array is returned.
 * @param donutOptions
 * @returns GroupMark[]
 */
export const getSegmentLabelMarks = (donutOptions: DonutSpecOptions): GroupMark[] => {
  const { isBoolean, name } = donutOptions;
  // segment labels are not supported for boolean variants
  if (isBoolean) return [];

  const segmentLabel = getSegmentLabel(donutOptions);
  // if there isn't a segment label, we don't need to do anything
  if (!segmentLabel) return [];

  return [
    {
      name: `${name}_segmentLabelGroup`,
      type: 'group',
      marks: [getSegmentLabelTextMark(segmentLabel), ...getSegmentLabelValueTextMark(segmentLabel)],
    },
  ];
};

/**
 * Gets the text mark for the segment label
 * @param segmentLabelOptions
 * @returns TextMark
 */
export const getSegmentLabelTextMark = (options: SegmentLabelSpecOptions): TextMark => {
  const { labelKey, value, percent, donutOptions } = options;
  const { name, color } = donutOptions;
  return {
    type: 'text',
    name: `${name}_segmentLabel`,
    from: { data: FILTERED_TABLE },
    encode: {
      enter: {
        // drop all labels when there isn't any data to display, the empty state ring is shown instead
        text: [{ test: getDonutEmptyStateTest(name), value: '' }, { field: labelKey ?? color }],
        fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
      },
      update: {
        ...positionEncodings,
        ...getSegmentLabelUpdateEncode(options, `${name}_segmentLabelNameFontSize`),
        // top half: shift up by the value line's own font size so the two lines sit flush (0px gap
        // token) regardless of size tier - a fixed px shift would leave a mismatched gap at every
        // tier except the one it was tuned for
        dy:
          value || percent
            ? {
                signal: `datum['${name}_arcTheta'] <= 0.5 * PI || datum['${name}_arcTheta'] >= 1.5 * PI ? -${name}_segmentLabelValueFontSize : 0`,
              }
            : undefined,
        // fades in step with the arc's own hover/controlled-highlight fade (getMarkOpacity is the
        // exact mechanism getArcMark uses) - the name line's color never switches, only its opacity
        opacity: getMarkOpacity(donutOptions),
      },
    },
  };
};

/**
 * Gets the text mark for the segment label values (percent and/or value)
 * @param segmentLabelOptions
 * @returns TextMark[]
 */
export const getSegmentLabelValueTextMark = (options: SegmentLabelSpecOptions): TextMark[] => {
  if (!options.value && !options.percent) return [];
  const { donutOptions } = options;
  const valueText = getSegmentLabelValueText(options) ?? [];
  const valueTextRules = Array.isArray(valueText) ? valueText : [valueText];

  return [
    {
      type: 'text',
      name: `${donutOptions.name}_segmentLabelValue`,
      from: { data: FILTERED_TABLE },
      encode: {
        enter: {
          // drop all labels when there isn't any data to display, the empty state ring is shown instead
          text: [{ test: getDonutEmptyStateTest(donutOptions.name), value: '' }, ...valueTextRules],
          fontWeight: { value: 'bold' },
        },
        update: {
          ...positionEncodings,
          ...getSegmentLabelUpdateEncode(options, `${donutOptions.name}_segmentLabelValueFontSize`),
          // bottom half: shift down by the name line's own font size, mirroring the top-half case
          dy: {
            signal: `datum['${donutOptions.name}_arcTheta'] <= 0.5 * PI || datum['${donutOptions.name}_arcTheta'] >= 1.5 * PI ? 0 : ${donutOptions.name}_segmentLabelNameFontSize`,
          },
          fill: getLabelValueFill(donutOptions, 'gray-700'),
          opacity: getMarkOpacity(donutOptions),
        },
      },
    },
  ];
};

/**
 * Gets the standard position/size encodes for segment label text marks. These must live in the
 * `update` set, not `enter` - Vega only evaluates `enter` once per mark instance at creation, but
 * radius/dx/fontSize here all derive from `width`/`height`-dependent signals that change on resize.
 * @param segmentLabelOptions
 * @param fontSizeSignal - the tier-based font size signal name for this specific line (name or value)
 * @returns TextEncodeEntry
 */
const getSegmentLabelUpdateEncode = (options: SegmentLabelSpecOptions, fontSizeSignal: string): TextEncodeEntry => {
  const { name } = options.donutOptions;
  return {
    radius: { signal: getLabelAnchorRadiusExpr(options.donutOptions) },
    theta: { field: `${name}_arcTheta` },
    // pulls left-hemisphere labels back horizontally by the wider line's width - see getLabelAnchorDxExpr
    dx: { signal: getLabelAnchorDxExpr(options) },
    fontSize: getSegmentLabelFontSize(name, fontSizeSignal),
    // both hemispheres anchor at their near (left) edge - only the dx offset differs by hemisphere
    align: { value: 'left' },
    baseline: {
      // if the center of the arc is in the top half of the donut, the text baseline should be bottom, else top
      signal: `datum['${name}_arcTheta'] <= 0.5 * PI || datum['${name}_arcTheta'] >= 1.5 * PI ? 'bottom' : 'top'`,
    },
  };
};

/**
 * Gets the fill for a donut label's value line - switches to the hovered/highlighted segment's own
 * categorical color (matching the arc's color resolution) when either this donut's own arc is
 * hovered or a paired Legend's hovered entry matches this segment, falling back to restColor
 * otherwise. Shared by direct labels (gray-700) and advanced labels (gray-800) - only the name
 * line's color never changes, this value line always can.
 * @param donutOptions
 * @param restColor fallback S2 color token when no hover/highlight matches this segment
 * @returns ProductionRule<ColorValueRef>
 */
export const getLabelValueFill = (
  donutOptions: DonutSpecOptions,
  restColor: string
): ProductionRule<ColorValueRef> => {
  const { color, colorScheme, idKey, legendHighlightSignals, name } = donutOptions;
  const hoveredItemSignal = `${name}_${HOVERED_ITEM}`;
  const colorRule = getColorProductionRule(color, colorScheme);
  return [
    {
      test: `isValid(${hoveredItemSignal}) && ${hoveredItemSignal}.${idKey} === datum.${idKey}`,
      ...colorRule,
    },
    ...(legendHighlightSignals ?? []).map((signal) => ({
      test: `isValid(${signal}) && ${signal} === datum.${SERIES_ID}`,
      ...colorRule,
    })),
    { value: getS2ColorValue(restColor, colorScheme) },
  ];
};

/**
 * position encodings
 */
const positionEncodings: TextEncodeEntry = {
  x: { signal: 'width / 2' },
  y: { signal: 'height / 2' },
};

/**
 * Gets the text value ref for the segment label values (percent and/or value)
 * @param segmentLabelOptions
 * @returns TextValueRef
 */
export const getSegmentLabelValueText = ({
  donutOptions,
  percent,
  percentFormat,
  value,
  valueFormat,
}: SegmentLabelSpecOptions): ProductionRule<TextValueRef> | undefined => {
  const percentSignal = `format(datum['${donutOptions.name}_arcPercent'], '${percentFormat}')`;
  if (value) {
    // to support `shortNumber` and `shortCurrency` we need to use the consistent logic
    const rules = getTextNumberFormat(valueFormat, donutOptions.metric) as { test?: string; signal: string }[];
    if (percent) {
      // rules will be an array so we need to add the percent to each signal
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
 * Gets the font size for the segment label based on the arc length
 * If the arc length is less than 0.3 radians, the font size is 0
 * @param name
 * @param fontSizeSignal - the tier-based font size signal name for this line (name or value)
 * @returns NumericValueRef
 */
const getSegmentLabelFontSize = (name: string, fontSizeSignal: string): ProductionRule<NumericValueRef> => {
  // need to use radians for this. 0.3 radians is about 17 degrees
  // if we used arc length, then showing a label could shrink the overall donut size which could make the arc to small
  // that would hide the label which would make the arc bigger which would show the label and so on
  return [
    // hide all labels when there isn't any data to display, the empty state ring is shown instead
    { test: getDonutEmptyStateTest(name), value: 0 },
    { test: `datum['${name}_arcLength'] < ${DONUT_SEGMENT_LABEL_MIN_ANGLE}`, value: 0 },
    { signal: fontSizeSignal },
  ];
};
