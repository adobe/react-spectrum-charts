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
  SourceData,
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
  DONUT_LABEL_COLLISION_MIN_GAP_BUFFER,
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
import {
  getAdjustedYField,
  getCollisionHalfWidthField,
  getHemisphereField,
  getLabelCollisionTransforms,
} from './donutLabelCollisionUtils';
import { getDonutEmptyStateTest, getDonutOuterRadiusExpr } from './donutUtils';

/** Unique field/data-source prefix for direct labels' collision fields, distinct from advanced labels' */
const getSegmentLabelFieldPrefix = (name: string): string => `${name}_segmentLabel`;

/** Name of the derived, collision-adjusted data source direct label marks read from */
const getSegmentLabelDataName = (name: string): string => `${name}_segmentLabelData`;

/**
 * Gets the expression testing whether a label's collision-adjusted (not original ideal) position
 * falls in the top half of the donut - collision can push a label across the vertical midpoint, so
 * the top/bottom split for dy/baseline must track where the label actually ends up, not its ideal angle
 * @param fieldPrefix
 * @returns vega expression string
 */
const getIsTopHalfExpr = (fieldPrefix: string): string => `datum['${getAdjustedYField(fieldPrefix)}'] <= height / 2`;

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
 * Gets the minimum vertical gap enforced between two colliding direct labels - the rendered
 * (name + optional value line) block height plus a stacking buffer
 * @param segmentLabelOptions
 * @returns vega expression string
 */
const getSegmentLabelMinGapExpr = ({ donutOptions, value, percent }: SegmentLabelSpecOptions): string => {
  const { name } = donutOptions;
  const valueLineHeight = value || percent ? ` + ${name}_segmentLabelValueFontSize` : '';
  return `${name}_segmentLabelNameFontSize${valueLineHeight} + ${DONUT_LABEL_COLLISION_MIN_GAP_BUFFER}`;
};

/**
 * Gets the derived, collision-adjusted data source direct label marks read from. Excludes segments
 * below the min-angle threshold entirely (rather than rendering them at fontSize 0) so they don't
 * consume a collision rank slot and needlessly push visible labels further apart.
 * @param donutOptions
 * @returns SourceData[]
 */
export const getSegmentLabelData = (donutOptions: DonutSpecOptions): SourceData[] => {
  const segmentLabel = getSegmentLabel(donutOptions);
  if (!segmentLabel) return [];
  const { name } = donutOptions;
  const arcThetaExpr = `datum['${name}_arcTheta']`;
  const outerRadiusExpr = getDonutOuterRadiusExpr(donutOptions);
  return [
    {
      name: getSegmentLabelDataName(name),
      source: FILTERED_TABLE,
      transform: [
        { type: 'filter', expr: `datum['${name}_arcLength'] >= ${DONUT_SEGMENT_LABEL_MIN_ANGLE}` },
        ...getLabelCollisionTransforms(
          getSegmentLabelFieldPrefix(name),
          arcThetaExpr,
          getLabelAnchorRadiusExpr(donutOptions),
          outerRadiusExpr,
          `${DONUT_LABEL_RING_GAP}`,
          getSegmentLabelMinGapExpr(segmentLabel)
        ),
      ],
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
 * Gets a label's pre-collision ideal anchor radius (the ring-gap point) - used only to compute its
 * ideal Y for the collision cascade (donutLabelCollisionUtils.ts), not as a mark encode field directly,
 * since the actual rendered position re-anchors horizontally against the ring's real half-width at
 * whatever Y the label ends up at after collision adjustment.
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
  const hemisphereField = getHemisphereField(getSegmentLabelFieldPrefix(name));
  return `(datum['${hemisphereField}'] === 'right' ? 0 : -(${cappedWidthExpr}))`;
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
    from: { data: getSegmentLabelDataName(name) },
    encode: {
      enter: {
        // drop all labels when there isn't any data to display, the empty state ring is shown instead
        text: [{ test: getDonutEmptyStateTest(name), value: '' }, { field: labelKey ?? color }],
        fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
      },
      update: {
        ...getSegmentLabelUpdateEncode(options, `${name}_segmentLabelNameFontSize`),
        // top half: shift up by the value line's own font size so the two lines sit flush (0px gap
        // token) regardless of size tier - a fixed px shift would leave a mismatched gap at every
        // tier except the one it was tuned for
        dy:
          value || percent
            ? {
                signal: `${getIsTopHalfExpr(
                  getSegmentLabelFieldPrefix(name)
                )} ? -${name}_segmentLabelValueFontSize : 0`,
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
      from: { data: getSegmentLabelDataName(donutOptions.name) },
      encode: {
        enter: {
          // drop all labels when there isn't any data to display, the empty state ring is shown instead
          text: [{ test: getDonutEmptyStateTest(donutOptions.name), value: '' }, ...valueTextRules],
          fontWeight: { value: 'bold' },
        },
        update: {
          ...getSegmentLabelUpdateEncode(options, `${donutOptions.name}_segmentLabelValueFontSize`),
          // bottom half: shift down by the name line's own font size, mirroring the top-half case
          dy: {
            signal: `${getIsTopHalfExpr(getSegmentLabelFieldPrefix(donutOptions.name))} ? 0 : ${
              donutOptions.name
            }_segmentLabelNameFontSize`,
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
 * x/y/dx/fontSize here all derive from `width`/`height`-dependent signals that change on resize.
 * Position is collision-adjusted (see donutLabelCollisionUtils.ts): x/y come from the derived
 * data source's per-hemisphere cascade fields, not a fixed radius+theta polar anchor, since the
 * ring's horizontal half-width must be re-measured at each label's (possibly shifted) Y.
 * @param segmentLabelOptions
 * @param fontSizeSignal - the tier-based font size signal name for this specific line (name or value)
 * @returns TextEncodeEntry
 */
const getSegmentLabelUpdateEncode = (options: SegmentLabelSpecOptions, fontSizeSignal: string): TextEncodeEntry => {
  const { name } = options.donutOptions;
  const fieldPrefix = getSegmentLabelFieldPrefix(name);
  const hemisphereField = getHemisphereField(fieldPrefix);
  const halfWidthField = getCollisionHalfWidthField(fieldPrefix);
  return {
    x: {
      signal: `datum['${hemisphereField}'] === 'right' ? width / 2 + datum['${halfWidthField}'] : width / 2 - datum['${halfWidthField}']`,
    },
    y: { field: getAdjustedYField(fieldPrefix) },
    // pulls left-hemisphere labels back horizontally by the wider line's width - see getLabelAnchorDxExpr
    dx: { signal: getLabelAnchorDxExpr(options) },
    fontSize: getSegmentLabelFontSize(name, fontSizeSignal),
    // both hemispheres anchor at their near (left) edge - only the dx offset differs by hemisphere
    align: { value: 'left' },
    // uses the collision-adjusted position, not the ideal arcTheta - collision can push a label
    // across the vertical midpoint, and baseline must track where it actually ends up
    baseline: {
      signal: `${getIsTopHalfExpr(fieldPrefix)} ? 'bottom' : 'top'`,
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
  // segments below DONUT_SEGMENT_LABEL_MIN_ANGLE are already excluded from the label data source
  // (getSegmentLabelData) entirely, so there's no need to zero their font size here too
  return [
    // hide all labels when there isn't any data to display, the empty state ring is shown instead
    { test: getDonutEmptyStateTest(name), value: 0 },
    { signal: fontSizeSignal },
  ];
};
