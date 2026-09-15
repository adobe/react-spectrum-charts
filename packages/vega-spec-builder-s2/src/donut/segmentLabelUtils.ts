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
  SymbolMark,
  TextEncodeEntry,
  TextMark,
  TextValueRef,
  ThresholdScale,
} from 'vega';

import {
  DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
  DONUT_ADVANCED_LABEL_DETAIL_FONT_WEIGHT,
  DONUT_ADVANCED_LABEL_NAME_FONT_SIZES,
  DONUT_ADVANCED_LABEL_NAME_FONT_WEIGHT,
  DONUT_ADVANCED_LABEL_NAME_VALUE_GAP,
  DONUT_ADVANCED_LABEL_RING_GAP,
  DONUT_ADVANCED_LABEL_SWATCH_GAP,
  DONUT_ADVANCED_LABEL_SWATCH_SIZE,
  DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP,
  DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
  DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT,
  DONUT_DIRECT_LABEL_NAME_FONT_SIZES,
  DONUT_DIRECT_LABEL_NAME_FONT_WEIGHT,
  DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
  DONUT_DIRECT_LABEL_VALUE_FONT_WEIGHT,
  DONUT_LABEL_COLLISION_MIN_GAP_BUFFER,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
  DONUT_RADIUS,
  DONUT_SEGMENT_LABEL_MIN_ANGLE,
  DONUT_SIZE_TIER_CUTPOINTS,
  FILTERED_TABLE,
  HOVERED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule, getMarkOpacity } from '../marks/markUtils';
import { getPathFromSymbolShape } from '../specUtils';
import { getTextNumberFormat } from '../textUtils';
import { DonutSpecOptions, SegmentLabelOptions, SegmentLabelSpecOptions } from '../types';
import {
  getAdjustedYField,
  getCollisionHalfWidthField,
  getHemisphereField,
  getLabelCollisionTransforms,
} from './donutLabelCollisionUtils';
import { getDonutEmptyStateTest, getDonutOuterRadiusExpr } from './donutUtils';

const getSegmentLabelName = ({ donutOptions, labelMode }: SegmentLabelSpecOptions): string => {
  const suffix = labelMode ? `${labelMode}SegmentLabel` : 'segmentLabel';
  return `${donutOptions.name}_${suffix}`;
};

const getRichSegmentLabelName = ({ donutOptions, labelMode }: SegmentLabelSpecOptions): string => {
  const suffix = labelMode ? `${labelMode}RichSegmentLabel` : 'richSegmentLabel';
  return `${donutOptions.name}_${suffix}`;
};

/** Unique field/data-source prefix for direct labels' collision fields, distinct from rich labels' */
const getSegmentLabelFieldPrefix = (options: SegmentLabelSpecOptions): string => getSegmentLabelName(options);

/** Name of the derived, collision-adjusted data source direct label marks read from */
const getSegmentLabelDataName = (options: SegmentLabelSpecOptions): string => `${getSegmentLabelName(options)}Data`;

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
const getSegmentLabels = (options: DonutSpecOptions): SegmentLabelSpecOptions[] => {
  if (!options.segmentLabels.length) {
    return [];
  }
  const hasLabelModes =
    Boolean(options.emphasizedItems?.length) && options.segmentLabels.some((label) => label.labelMode !== undefined);
  const labels = hasLabelModes
    ? options.segmentLabels.filter((label) => label.labelMode !== undefined)
    : options.segmentLabels.slice(0, 1);
  return labels
    .filter(
      ({ labelMode }) =>
        !(options.emphasizedItems?.length && options.hideDeemphasizedLabels && labelMode === 'deemphasized')
    )
    .map((label) => applySegmentLabelPropDefaults(label, options));
};

const isRichSegmentLabel = (options: SegmentLabelSpecOptions): boolean => options.swatch || options.showValueRow;

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
    value = true,
    valueFormat = 'standardNumber',
    swatch = false,
    showValueRow = false,
    showTotal = false,
    ...options
  }: SegmentLabelOptions,
  donutOptions: DonutSpecOptions
): SegmentLabelSpecOptions => ({
  donutOptions,
  percent,
  percentFormat,
  swatch,
  value,
  valueFormat,
  showValueRow,
  showTotal,
  ...options,
});

const getLabelModeFilter = ({ donutOptions, labelMode }: SegmentLabelSpecOptions): string | undefined => {
  const { emphasizedItems, color } = donutOptions;
  if (!labelMode || !emphasizedItems?.length) return;
  const items = JSON.stringify(emphasizedItems);
  return `indexof(${items}, datum.${color}) ${labelMode === 'deemphasized' ? '< 0' : '>= 0'}`;
};

/**
 * Gets the threshold scales that snap a donut's outer diameter to its nearest named size tier's direct-label font sizes
 * @param donutOptions
 * @returns ThresholdScale[]
 */
const getSegmentLabelScalesForLabel = (segmentLabel: SegmentLabelSpecOptions): ThresholdScale[] => {
  if (!segmentLabel || isRichSegmentLabel(segmentLabel)) return [];
  const labelName = getSegmentLabelName(segmentLabel);
  return [
    {
      name: `${labelName}NameFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_DIRECT_LABEL_NAME_FONT_SIZES,
    },
    {
      name: `${labelName}ValueFontSizeScale`,
      type: 'threshold',
      domain: DONUT_SIZE_TIER_CUTPOINTS,
      range: DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
    },
  ];
};

export const getSegmentLabelScales = (donutOptions: DonutSpecOptions): ThresholdScale[] =>
  getSegmentLabels(donutOptions).flatMap(getSegmentLabelScalesForLabel);

/**
 * Gets the signals that resolve a donut's direct-label font sizes from its outer diameter
 * @param donutOptions
 * @returns Signal[]
 */
const getSegmentLabelSignalsForLabel = (segmentLabel: SegmentLabelSpecOptions): Signal[] => {
  if (!segmentLabel || isRichSegmentLabel(segmentLabel)) return [];
  const labelName = getSegmentLabelName(segmentLabel);
  const donutDiameter = `2 * ${getDonutOuterRadiusExpr(segmentLabel.donutOptions)}`;
  return [
    {
      name: `${labelName}NameFontSize`,
      update: `scale('${labelName}NameFontSizeScale', ${donutDiameter})`,
    },
    {
      name: `${labelName}ValueFontSize`,
      update: `scale('${labelName}ValueFontSizeScale', ${donutDiameter})`,
    },
  ];
};

export const getSegmentLabelSignals = (donutOptions: DonutSpecOptions): Signal[] =>
  getSegmentLabels(donutOptions).flatMap(getSegmentLabelSignalsForLabel);

/**
 * Gets the minimum vertical gap enforced between two colliding direct labels - the rendered
 * (name + optional value line) block height plus a stacking buffer
 * @param segmentLabelOptions
 * @returns vega expression string
 */
const getSegmentLabelMinGapExpr = (options: SegmentLabelSpecOptions): string => {
  const { value, percent } = options;
  const labelName = getSegmentLabelName(options);
  const valueLineHeight = value || percent ? ` + ${labelName}ValueFontSize` : '';
  return `${labelName}NameFontSize${valueLineHeight} + ${DONUT_LABEL_COLLISION_MIN_GAP_BUFFER}`;
};

/**
 * Gets the derived, collision-adjusted data source direct label marks read from. Excludes segments
 * below the min-angle threshold entirely (rather than rendering them at fontSize 0) so they don't
 * consume a collision rank slot and needlessly push visible labels further apart.
 * @param donutOptions
 * @returns SourceData[]
 */
const getSegmentLabelDataForLabel = (segmentLabel: SegmentLabelSpecOptions): SourceData[] => {
  if (!segmentLabel || isRichSegmentLabel(segmentLabel)) return [];
  const { donutOptions } = segmentLabel;
  const { name } = donutOptions;
  const arcThetaExpr = `datum['${name}_arcTheta']`;
  const outerRadiusExpr = getDonutOuterRadiusExpr(donutOptions);
  const labelModeFilter = getLabelModeFilter(segmentLabel);
  return [
    {
      name: getSegmentLabelDataName(segmentLabel),
      source: FILTERED_TABLE,
      transform: [
        { type: 'filter', expr: `datum['${name}_arcLength'] >= ${DONUT_SEGMENT_LABEL_MIN_ANGLE}` },
        ...(labelModeFilter ? [{ type: 'filter' as const, expr: labelModeFilter }] : []),
        ...getLabelCollisionTransforms(
          getSegmentLabelFieldPrefix(segmentLabel),
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

export const getSegmentLabelData = (donutOptions: DonutSpecOptions): SourceData[] =>
  getSegmentLabels(donutOptions).flatMap(getSegmentLabelDataForLabel);

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
 * Gets the pieces behind the widest-line-capped pixel width shared by a label's name/value lines:
 * the real (uncapped) widest-line width, the max horizontal reach available before hitting the
 * container's edge, and the smaller of the two. Returned separately (not just the final capped
 * value) so callers can tell whether the cap actually did anything - see getLimitExpr.
 * @param segmentLabelOptions
 * @returns vega expression strings for the widest real line width, the max available reach, and the capped result
 */
const getWidthExprs = (
  options: SegmentLabelSpecOptions
): { widerWidthExpr: string; maxReachExpr: string; cappedWidthExpr: string } => {
  const { donutOptions, labelKey, percent, value } = options;
  const { color } = donutOptions;
  const labelName = getSegmentLabelName(options);
  const nameTextExpr = `datum['${labelKey ?? color}']`;
  const nameWidthExpr = `getLabelWidth(${nameTextExpr}, ${DONUT_DIRECT_LABEL_NAME_FONT_WEIGHT}, ${labelName}NameFontSize)`;
  const valueWidthExpr =
    value || percent
      ? `getLabelWidth(${getTextRuleExpr(
          getSegmentLabelValueText(options)
        )}, ${DONUT_DIRECT_LABEL_VALUE_FONT_WEIGHT}, ${labelName}ValueFontSize)`
      : '0';
  const widerWidthExpr = `max(${nameWidthExpr}, ${valueWidthExpr})`;
  // the cap is per-label, not a flat outerRadius*ratio - it's however much horizontal room remains
  // between this label's own anchor point (collisionHalfWidth, which shrinks away from the ring's
  // equator) and the container's actual edge (DONUT_RADIUS). A flat ratio-based cap matches this
  // exactly only at the equator (the original worst-case it was derived for); away from the equator
  // it leaves real, visible unused space between the label and the container edge.
  const halfWidthField = getCollisionHalfWidthField(getSegmentLabelFieldPrefix(options));
  const maxReachExpr = `${DONUT_RADIUS} - datum['${halfWidthField}']`;
  return { widerWidthExpr, maxReachExpr, cappedWidthExpr: `min(${widerWidthExpr}, ${maxReachExpr})` };
};

/**
 * Gets a line's truncation limit - only the left hemisphere is ever capped (its shift is what's
 * bounded by getCappedWidthExpr); the right hemisphere has no shift at all (dx is always 0,
 * growing freely away from the ring) and must not be truncated by that same cap, or every line -
 * even ones that fit comfortably - gets needlessly cut off. `0` is Vega's "no limit" value.
 *
 * Left-hemisphere lines are ALSO only limited when their real width genuinely exceeds the available
 * reach (widerWidth > maxReach) - when it doesn't, the cap equals the line's own exact natural
 * width, and setting `limit` to that exact value is a razor's-edge boundary: our own width estimate
 * and Vega's internal text-measurement can round against each other by a fraction of a pixel,
 * truncating a character that didn't need to go. Passing `0` (no limit) whenever nothing was
 * actually capped avoids that boundary entirely.
 * @param segmentLabelOptions
 * @returns vega expression string
 */
const getLimitExpr = (options: SegmentLabelSpecOptions): string => {
  const hemisphereField = getHemisphereField(getSegmentLabelFieldPrefix(options));
  const { widerWidthExpr, maxReachExpr, cappedWidthExpr } = getWidthExprs(options);
  return `datum['${hemisphereField}'] === 'right' || (${widerWidthExpr}) <= (${maxReachExpr}) ? 0 : ${cappedWidthExpr}`;
};

/**
 * Gets the marks for the segment label. If there isn't a segment label, an empty array is returned.
 * @param donutOptions
 * @returns GroupMark[]
 */
const getSegmentLabelMarksForLabel = (segmentLabel: SegmentLabelSpecOptions): GroupMark[] => {
  const { isBoolean } = segmentLabel.donutOptions;
  const labelName = getSegmentLabelName(segmentLabel);
  // segment labels are not supported for boolean variants
  if (isBoolean) return [];

  // if there isn't a segment label, we don't need to do anything
  if (isRichSegmentLabel(segmentLabel)) return [];

  return [
    {
      name: `${labelName}Group`,
      type: 'group',
      marks: [getSegmentLabelTextMark(segmentLabel), ...getSegmentLabelValueTextMark(segmentLabel)],
    },
  ];
};

export const getSegmentLabelMarks = (donutOptions: DonutSpecOptions): GroupMark[] =>
  getSegmentLabels(donutOptions).flatMap(getSegmentLabelMarksForLabel);

/**
 * Gets the text mark for the segment label
 * @param segmentLabelOptions
 * @returns TextMark
 */
export const getSegmentLabelTextMark = (options: SegmentLabelSpecOptions): TextMark => {
  const { labelKey, value, percent, donutOptions } = options;
  const { name, color } = donutOptions;
  const labelName = getSegmentLabelName(options);
  return {
    type: 'text',
    name: labelName,
    from: { data: getSegmentLabelDataName(options) },
    encode: {
      enter: {
        // drop all labels when there isn't any data to display, the empty state ring is shown instead
        text: [{ test: getDonutEmptyStateTest(name), value: '' }, { field: labelKey ?? color }],
        fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
      },
      update: {
        ...getSegmentLabelUpdateEncode(options, `${labelName}NameFontSize`),
        // top half: shift up by the value line's own font size so the two lines sit flush (0px gap
        // token) regardless of size tier - a fixed px shift would leave a mismatched gap at every
        // tier except the one it was tuned for
        dy:
          value || percent
            ? {
                signal: `${getIsTopHalfExpr(getSegmentLabelFieldPrefix(options))} ? -${labelName}ValueFontSize : 0`,
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
  const labelName = getSegmentLabelName(options);
  const valueText = getSegmentLabelValueText(options) ?? [];
  const valueTextRules = Array.isArray(valueText) ? valueText : [valueText];

  return [
    {
      type: 'text',
      name: `${labelName}Value`,
      from: { data: getSegmentLabelDataName(options) },
      encode: {
        enter: {
          // drop all labels when there isn't any data to display, the empty state ring is shown instead
          text: [{ test: getDonutEmptyStateTest(donutOptions.name), value: '' }, ...valueTextRules],
          fontWeight: { value: 'bold' },
        },
        update: {
          ...getSegmentLabelUpdateEncode(options, `${labelName}ValueFontSize`),
          // bottom half: shift down by the name line's own font size, mirroring the top-half case
          dy: {
            signal: `${getIsTopHalfExpr(getSegmentLabelFieldPrefix(options))} ? 0 : ${labelName}NameFontSize`,
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
  const fieldPrefix = getSegmentLabelFieldPrefix(options);
  const hemisphereField = getHemisphereField(fieldPrefix);
  const halfWidthField = getCollisionHalfWidthField(fieldPrefix);
  return {
    x: {
      signal: `datum['${hemisphereField}'] === 'right' ? width / 2 + datum['${halfWidthField}'] : width / 2 - datum['${halfWidthField}']`,
    },
    y: { field: getAdjustedYField(fieldPrefix) },
    // truncates (ellipsis) if this line alone is what pushed the pair past their shared cap, so its
    // real rendered width can never exceed the distance the shift already assumed
    limit: { signal: getLimitExpr(options) },
    fontSize: getSegmentLabelFontSize(options, fontSizeSignal),
    align: {
      signal: `datum['${hemisphereField}'] === 'right' ? 'left' : 'right'`,
    },
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
 * otherwise. Shared by direct labels (gray-700) and rich SegmentLabels (gray-800) - only the name
 * line's color never changes, this value line always can.
 * @param donutOptions
 * @param restColor fallback S2 color token when no hover/highlight matches this segment
 * @returns ProductionRule<ColorValueRef>
 */
export const getLabelValueFill = (donutOptions: DonutSpecOptions, restColor: string): ProductionRule<ColorValueRef> => {
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
const getSegmentLabelFontSize = (
  options: SegmentLabelSpecOptions,
  fontSizeSignal: string
): ProductionRule<NumericValueRef> => {
  const { name } = options.donutOptions;
  // segments below DONUT_SEGMENT_LABEL_MIN_ANGLE are already excluded from the label data source
  // (getSegmentLabelData) entirely, so there's no need to zero their font size here too
  return [
    // hide all labels when there isn't any data to display, the empty state ring is shown instead
    {
      test: `${getDonutEmptyStateTest(name)} || 2 * ${getDonutOuterRadiusExpr(options.donutOptions)} < 120`,
      value: 0,
    },
    { signal: fontSizeSignal },
  ];
};

/** Gets the rich SegmentLabel options when swatch or showValueRow is enabled. */
const getRichSegmentLabels = (options: DonutSpecOptions): SegmentLabelSpecOptions[] =>
  getSegmentLabels(options).filter(isRichSegmentLabel);

/**
 * Gets the threshold scales that snap a donut's outer diameter to its rich SegmentLabel font sizes
 * @param donutOptions
 * @returns ThresholdScale[]
 */
export const getRichSegmentLabelScales = (donutOptions: DonutSpecOptions): ThresholdScale[] => {
  return getRichSegmentLabels(donutOptions).flatMap((segmentLabel) => {
    const labelName = getRichSegmentLabelName(segmentLabel);
    return [
      {
        name: `${labelName}NameFontSizeScale`,
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_NAME_FONT_SIZES,
      },
      {
        name: `${labelName}ValueFontSizeScale`,
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
      },
      {
        name: `${labelName}DetailFontSizeScale`,
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
      },
    ];
  });
};

/**
 * Gets the signals that resolve rich SegmentLabel font sizes from the donut's outer diameter
 * @param donutOptions
 * @returns Signal[]
 */
export const getRichSegmentLabelSignals = (donutOptions: DonutSpecOptions): Signal[] => {
  return getRichSegmentLabels(donutOptions).flatMap((segmentLabel) => {
    const labelName = getRichSegmentLabelName(segmentLabel);
    const donutDiameter = `2 * ${getDonutOuterRadiusExpr(donutOptions)}`;
    return [
      {
        name: `${labelName}NameFontSize`,
        update: `scale('${labelName}NameFontSizeScale', ${donutDiameter})`,
      },
      {
        name: `${labelName}ValueFontSize`,
        update: `scale('${labelName}ValueFontSizeScale', ${donutDiameter})`,
      },
      {
        name: `${labelName}DetailFontSize`,
        update: `scale('${labelName}DetailFontSizeScale', ${donutDiameter})`,
      },
    ];
  });
};

/**
 * Gets the minimum vertical gap enforced between two colliding rich SegmentLabels
 * @param options
 * @returns vega expression string
 */
const getRichSegmentLabelMinGapExpr = (options: SegmentLabelSpecOptions): string => {
  const { percent, value, showValueRow } = options;
  const labelName = getRichSegmentLabelName(options);
  const nameSize = `${labelName}NameFontSize`;
  const valueSize = `${labelName}ValueFontSize`;
  const detailSize = `${labelName}DetailFontSize`;
  const valueHeight = value || percent ? ` + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} + ${valueSize}` : '';
  const detailHeight = showValueRow ? ` + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP} + ${detailSize}` : '';
  return `${nameSize}${valueHeight}${detailHeight} + ${DONUT_LABEL_COLLISION_MIN_GAP_BUFFER}`;
};

/**
 * Gets the derived, collision-adjusted data source rich SegmentLabel marks read from
 * @param donutOptions
 * @returns SourceData[]
 */
export const getRichSegmentLabelData = (donutOptions: DonutSpecOptions): SourceData[] => {
  return getRichSegmentLabels(donutOptions).flatMap((richSegmentLabel) => {
    const { name } = donutOptions;
    const labelName = getRichSegmentLabelName(richSegmentLabel);
    const arcThetaExpr = `datum['${name}_arcTheta']`;
    const outerRadiusExpr = getDonutOuterRadiusExpr(donutOptions);
    const labelModeFilter = getLabelModeFilter(richSegmentLabel);
    return [
      {
        name: `${labelName}Data`,
        source: FILTERED_TABLE,
        transform: [
          { type: 'filter', expr: `datum['${name}_arcLength'] >= ${DONUT_SEGMENT_LABEL_MIN_ANGLE}` },
          ...(labelModeFilter ? [{ type: 'filter' as const, expr: labelModeFilter }] : []),
          ...getLabelCollisionTransforms(
            labelName,
            arcThetaExpr,
            getRichSegmentLabelAnchorRadiusExpr(donutOptions),
            outerRadiusExpr,
            `${DONUT_ADVANCED_LABEL_RING_GAP}`,
            getRichSegmentLabelMinGapExpr(richSegmentLabel)
          ),
        ],
      },
    ];
  });
};

/**
 * Gets the text value ref for a rich SegmentLabel's value/percent row
 * @param options
 * @returns TextValueRef
 */
export const getRichSegmentLabelValueText = (
  options: SegmentLabelSpecOptions
): ProductionRule<TextValueRef> | undefined => getSegmentLabelValueText(options);

/**
 * Gets the text value ref for a rich SegmentLabel's optional detail row
 * @param options
 * @returns TextValueRef
 */
const getRichSegmentLabelDetailTextParts = ({
  donutOptions,
  valueFormat,
  showTotal,
}: SegmentLabelSpecOptions): {
  value: ProductionRule<TextValueRef>;
  suffix?: ProductionRule<TextValueRef>;
} => {
  const { metric, name } = donutOptions;
  const segmentRules = getTextNumberFormat(valueFormat, metric) as { test?: string; signal: string }[];
  const totalRules = getTextNumberFormat(valueFormat, 'sum') as { test?: string; signal: string }[];
  const totalExpr = getTextRuleExpr(totalRules).replace(/datum\[/g, `data('${name}_sumData')[0][`);
  //TODO: Review "/" with localization updates
  return {
    value: segmentRules,
    suffix: showTotal ? { signal: `" / " + ${totalExpr}` } : undefined,
  };
};

/**
 * Gets a rich SegmentLabel's pre-collision-avoidance ideal anchor radius
 * @param donutOptions
 * @returns vega expression string
 */
const getRichSegmentLabelAnchorRadiusExpr = (donutOptions: DonutSpecOptions): string =>
  `${getDonutOuterRadiusExpr(donutOptions)} + ${DONUT_ADVANCED_LABEL_RING_GAP}`;

/**
 * Gets the width expressions shared by a rich SegmentLabel's rows
 * @param options
 * @returns vega expression strings
 */
const getRichSegmentLabelWidthExprs = (
  options: SegmentLabelSpecOptions
): { widerWidthExpr: string; maxReachExpr: string; cappedWidthExpr: string } => {
  const { donutOptions, labelKey, percent, value, showValueRow, swatch } = options;
  const { color } = donutOptions;
  const labelName = getRichSegmentLabelName(options);
  const nameTextExpr = `datum['${labelKey ?? color}']`;
  const swatchVisibleExpr = `2 * ${getDonutOuterRadiusExpr(donutOptions)} >= 160`;
  const swatchWidthExpr = swatch
    ? `(${swatchVisibleExpr} ? ${DONUT_ADVANCED_LABEL_SWATCH_SIZE + DONUT_ADVANCED_LABEL_SWATCH_GAP} : 0)`
    : '0';
  const nameWidthExpr = `${swatchWidthExpr} + getLabelWidth(${nameTextExpr}, ${DONUT_ADVANCED_LABEL_NAME_FONT_WEIGHT}, ${labelName}NameFontSize)`;
  const valueWidthExpr =
    value || percent
      ? `getLabelWidth(${getTextRuleExpr(
          getRichSegmentLabelValueText(options)
        )}, ${DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT}, ${labelName}ValueFontSize)`
      : '0';
  const detailParts = showValueRow ? getRichSegmentLabelDetailTextParts(options) : undefined;
  let detailWidthExpr = '0';
  if (detailParts) {
    const suffixWidthExpr = detailParts.suffix
      ? ` + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} + getLabelWidth(${getTextRuleExpr(
          detailParts.suffix
        )}, ${DONUT_ADVANCED_LABEL_DETAIL_FONT_WEIGHT}, ${labelName}DetailFontSize)`
      : '';
    detailWidthExpr = `getLabelWidth(${getTextRuleExpr(
      detailParts.value
    )}, ${DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT}, ${labelName}DetailFontSize)${suffixWidthExpr}`;
  }
  const widerWidthExpr = `max(${nameWidthExpr}, max(${valueWidthExpr}, ${detailWidthExpr}))`;
  const halfWidthField = getCollisionHalfWidthField(labelName);
  const maxReachExpr = `${DONUT_RADIUS} - datum['${halfWidthField}']`;
  return { widerWidthExpr, maxReachExpr, cappedWidthExpr: `min(${widerWidthExpr}, ${maxReachExpr})` };
};

/**
 * Gets a rich SegmentLabel row's truncation limit
 * @param options
 * @param extraReservedWidthExpr width reserved outside the text itself
 * @returns vega expression string
 */
const getRichSegmentLabelLimitExpr = (options: SegmentLabelSpecOptions, extraReservedWidthExpr = '0'): string => {
  const hemisphereField = getHemisphereField(getRichSegmentLabelName(options));
  const { widerWidthExpr, maxReachExpr, cappedWidthExpr } = getRichSegmentLabelWidthExprs(options);
  return `datum['${hemisphereField}'] === 'right' || (${widerWidthExpr}) <= (${maxReachExpr}) ? 0 : (${cappedWidthExpr}) - (${extraReservedWidthExpr})`;
};

const getRichSegmentLabelBottomDetailDy = (
  showValueRow: boolean,
  hasValue: boolean,
  nameSize: string,
  valueSize: string,
  scaleExpr: string
): string | undefined => {
  if (!showValueRow) return;
  if (hasValue) {
    return `(${nameSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} + ${valueSize} + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP}) * (${scaleExpr})`;
  }
  return `(${nameSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr})`;
};

const getRichSegmentLabelTopRowDy = (
  showValueRow: boolean,
  hasValue: boolean,
  valueSize: string,
  detailSize: string,
  scaleExpr: string
): { name: string; value?: string } => {
  if (showValueRow) {
    return {
      name: `-((${detailSize} + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP} + ${valueSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr}))`,
      value: hasValue ? `-((${detailSize} + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP}) * (${scaleExpr}))` : undefined,
    };
  }
  return {
    name: hasValue ? `-((${valueSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr}))` : '0',
    value: hasValue ? '0' : undefined,
  };
};

/**
 * Gets row-stacking dy offsets for rich SegmentLabel name, value, and detail rows
 * @param options
 * @returns per-row dy expressions
 */
const getRichSegmentLabelRowDy = (
  options: SegmentLabelSpecOptions
): { name: string; value?: string; detail?: string } => {
  const { donutOptions, percent, value, showValueRow } = options;
  const labelName = getRichSegmentLabelName(options);
  const nameSize = `${labelName}NameFontSize`;
  const valueSize = `${labelName}ValueFontSize`;
  const detailSize = `${labelName}DetailFontSize`;
  const hasValue = value || percent;
  const valueHeightExpr = hasValue ? ` + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} + ${valueSize}` : '';
  const detailHeightExpr = showValueRow ? ` + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP} + ${detailSize}` : '';
  const totalHeightExpr = `${nameSize}${valueHeightExpr}${detailHeightExpr}`;
  const maxHeightExpr = `${getDonutOuterRadiusExpr(donutOptions)} * ${DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO}`;
  const scaleExpr = `min(1, (${maxHeightExpr}) / (${totalHeightExpr}))`;

  const bottomValueDy = hasValue
    ? `(${nameSize} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP}) * (${scaleExpr})`
    : undefined;
  const bottomDetailDy = getRichSegmentLabelBottomDetailDy(showValueRow, hasValue, nameSize, valueSize, scaleExpr);
  const topDetailDy = showValueRow ? '0' : undefined;
  const { name: topNameDy, value: topValueDy } = getRichSegmentLabelTopRowDy(
    showValueRow,
    hasValue,
    valueSize,
    detailSize,
    scaleExpr
  );

  const isTopHalfExpr = getIsTopHalfExpr(labelName);
  return {
    name: `${isTopHalfExpr} ? (${topNameDy}) : 0`,
    value: hasValue ? `${isTopHalfExpr} ? (${topValueDy}) : (${bottomValueDy})` : undefined,
    detail: showValueRow ? `${isTopHalfExpr} ? (${topDetailDy}) : (${bottomDetailDy})` : undefined,
  };
};

/** Gets shared position encodes for every row in a rich SegmentLabel block. */
const getRichSegmentLabelSharedEncode = (options: SegmentLabelSpecOptions): TextEncodeEntry => {
  const fieldPrefix = getRichSegmentLabelName(options);
  const hemisphereField = getHemisphereField(fieldPrefix);
  const halfWidthField = getCollisionHalfWidthField(fieldPrefix);
  return {
    x: {
      signal: `datum['${hemisphereField}'] === 'right' ? width / 2 + datum['${halfWidthField}'] : width / 2 - datum['${halfWidthField}']`,
    },
    y: { field: getAdjustedYField(fieldPrefix) },
    align: {
      signal: `datum['${hemisphereField}'] === 'right' ? 'left' : 'right'`,
    },
    baseline: {
      signal: `${getIsTopHalfExpr(fieldPrefix)} ? 'bottom' : 'top'`,
    },
  };
};

/**
 * Gets the font size for a rich SegmentLabel row
 * @param options
 * @param fontSizeSignal
 * @param minimumDiameter
 * @returns production rules
 */
const getRichSegmentLabelFontSize = (
  options: SegmentLabelSpecOptions,
  fontSizeSignal: string,
  minimumDiameter: number
) => [
  {
    test: `${getDonutEmptyStateTest(options.donutOptions.name)} || 2 * ${getDonutOuterRadiusExpr(
      options.donutOptions
    )} < ${minimumDiameter}`,
    value: 0,
  },
  { signal: fontSizeSignal },
];

/** Gets the swatch mark for a rich SegmentLabel. */
const getRichSegmentLabelSwatchMark = (options: SegmentLabelSpecOptions): SymbolMark => {
  const { donutOptions } = options;
  const { color, colorScheme } = donutOptions;
  const labelName = getRichSegmentLabelName(options);
  const fieldPrefix = labelName;
  const hemisphereField = getHemisphereField(fieldPrefix);
  const halfWidthField = getCollisionHalfWidthField(fieldPrefix);
  const rowDy = getRichSegmentLabelRowDy(options);
  const isTopHalfExpr = getIsTopHalfExpr(fieldPrefix);
  const nameFontSize = `${labelName}NameFontSize`;
  const anchorX = `datum['${hemisphereField}'] === 'right' ? width / 2 + datum['${halfWidthField}'] : width / 2 - datum['${halfWidthField}']`;
  const anchorY = `datum['${getAdjustedYField(fieldPrefix)}']`;
  const nameAnchorY = `(${anchorY}) + (${rowDy.name})`;
  const nameCenterY = `(${nameAnchorY}) + (${isTopHalfExpr} ? -(${nameFontSize} * 0.5) : (${nameFontSize} * 0.5))`;

  return {
    type: 'symbol',
    name: `${labelName}Swatch`,
    from: { data: `${labelName}Data` },
    encode: {
      enter: {
        shape: { value: getPathFromSymbolShape('rounded-square') },
        fill: getColorProductionRule(color, colorScheme),
      },
      update: {
        x: {
          signal: `(${anchorX}) + (datum['${hemisphereField}'] === 'right' ? 1 : -1) * ${
            DONUT_ADVANCED_LABEL_SWATCH_SIZE / 2
          }`,
        },
        y: { signal: nameCenterY },
        size: getRichSegmentLabelFontSize(
          options,
          `${DONUT_ADVANCED_LABEL_SWATCH_SIZE * DONUT_ADVANCED_LABEL_SWATCH_SIZE}`,
          160
        ),
        opacity: getMarkOpacity(donutOptions),
      },
    },
  };
};

/** Gets the text mark for a rich SegmentLabel's name row. */
const getRichSegmentLabelNameTextMark = (options: SegmentLabelSpecOptions): TextMark => {
  const { labelKey, donutOptions } = options;
  const { color, name } = donutOptions;
  const labelName = getRichSegmentLabelName(options);
  const shared = getRichSegmentLabelSharedEncode(options);
  const rowDy = getRichSegmentLabelRowDy(options);
  const swatchVisibleExpr = `2 * ${getDonutOuterRadiusExpr(donutOptions)} >= 160`;
  const swatchOffsetExpr = `${swatchVisibleExpr} ? ${
    DONUT_ADVANCED_LABEL_SWATCH_SIZE + DONUT_ADVANCED_LABEL_SWATCH_GAP
  } : 0`;
  return {
    type: 'text',
    name: `${labelName}Name`,
    from: { data: `${labelName}Data` },
    encode: {
      enter: {
        text: [{ test: getDonutEmptyStateTest(name), value: '' }, { field: labelKey ?? color }],
        fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
      },
      update: {
        ...shared,
        dx: {
          signal: options.swatch
            ? `(datum['${getHemisphereField(labelName)}'] === 'right' ? 1 : -1) * (${swatchOffsetExpr})`
            : '0',
        },
        dy: { signal: rowDy.name },
        fontSize: getRichSegmentLabelFontSize(options, `${labelName}NameFontSize`, 120),
        limit: {
          signal: getRichSegmentLabelLimitExpr(
            options,
            options.swatch
              ? `(${swatchVisibleExpr} ? ${DONUT_ADVANCED_LABEL_SWATCH_SIZE + DONUT_ADVANCED_LABEL_SWATCH_GAP} : 0)`
              : '0'
          ),
        },
        opacity: getMarkOpacity(donutOptions),
      },
    },
  };
};

/** Gets the text mark for a rich SegmentLabel's value/percent row. */
const getRichSegmentLabelValueTextMark = (options: SegmentLabelSpecOptions): TextMark[] => {
  if (!options.value && !options.percent) return [];
  const { donutOptions } = options;
  const { name } = donutOptions;
  const labelName = getRichSegmentLabelName(options);
  const valueText = getRichSegmentLabelValueText(options) ?? [];
  const valueTextRules = Array.isArray(valueText) ? valueText : [valueText];
  const shared = getRichSegmentLabelSharedEncode(options);
  const rowDy = getRichSegmentLabelRowDy(options);
  return [
    {
      type: 'text',
      name: `${labelName}Value`,
      from: { data: `${labelName}Data` },
      encode: {
        enter: {
          text: [{ test: getDonutEmptyStateTest(name), value: '' }, ...valueTextRules],
          fontWeight: { value: DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT },
        },
        update: {
          ...shared,
          dy: { signal: rowDy.value as string },
          fontSize: getRichSegmentLabelFontSize(options, `${labelName}ValueFontSize`, 120),
          limit: { signal: getRichSegmentLabelLimitExpr(options) },
          fill: getLabelValueFill(donutOptions, 'gray-800'),
          opacity: getMarkOpacity(donutOptions),
        },
      },
    },
  ];
};

/** Gets the optional detail row marks for a rich SegmentLabel. */
const getRichSegmentLabelDetailTextMark = (options: SegmentLabelSpecOptions): TextMark[] => {
  if (!options.showValueRow) return [];
  const { donutOptions } = options;
  const { name } = donutOptions;
  const labelName = getRichSegmentLabelName(options);
  const shared = getRichSegmentLabelSharedEncode(options);
  const rowDy = getRichSegmentLabelRowDy(options);
  const { value, suffix } = getRichSegmentLabelDetailTextParts(options);
  const fieldPrefix = labelName;
  const hemisphereField = getHemisphereField(fieldPrefix);
  const detailFontSize = `${labelName}DetailFontSize`;
  const valueWidth = `getLabelWidth(${getTextRuleExpr(
    value
  )}, ${DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT}, ${detailFontSize})`;
  const suffixWidth = suffix
    ? `getLabelWidth(${getTextRuleExpr(suffix)}, ${DONUT_ADVANCED_LABEL_DETAIL_FONT_WEIGHT}, ${detailFontSize})`
    : '0';
  const commonUpdate = {
    ...shared,
    dy: { signal: rowDy.detail as string },
    fontSize: getRichSegmentLabelFontSize(options, detailFontSize, 200),
    limit: { signal: getRichSegmentLabelLimitExpr(options) },
    opacity: getMarkOpacity(donutOptions),
  };
  const valueTextRules = Array.isArray(value) ? value : [value];
  const suffixTextRules = suffix && (Array.isArray(suffix) ? suffix : [suffix]);
  const suffixMark: TextMark | undefined = suffix
    ? {
        type: 'text',
        name: `${labelName}DetailSuffix`,
        from: { data: `${labelName}Data` },
        encode: {
          enter: {
            text: [{ test: getDonutEmptyStateTest(name), value: '' }, ...(suffixTextRules ?? [])],
            fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
          },
          update: {
            ...commonUpdate,
            dx: {
              signal: `datum['${hemisphereField}'] === 'right' ? ${valueWidth} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} : 0`,
            },
          },
        },
      }
    : undefined;
  return [
    {
      type: 'text',
      name: `${labelName}DetailValue`,
      from: { data: `${labelName}Data` },
      encode: {
        enter: {
          text: [{ test: getDonutEmptyStateTest(name), value: '' }, ...valueTextRules],
          fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
          fontWeight: { value: DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT },
        },
        update: {
          ...commonUpdate,
          dx: {
            signal: `datum['${hemisphereField}'] === 'right' ? 0 : -(${suffixWidth} + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP})`,
          },
        },
      },
    },
    ...(suffixMark ? [suffixMark] : []),
  ];
};

/**
 * Gets the marks for a rich SegmentLabel
 * @param donutOptions
 * @returns GroupMark[]
 */
export const getRichSegmentLabelMarks = (donutOptions: DonutSpecOptions): GroupMark[] => {
  if (donutOptions.isBoolean) return [];
  return getRichSegmentLabels(donutOptions).flatMap((richSegmentLabel) => {
    const labelName = getRichSegmentLabelName(richSegmentLabel);
    return [
      {
        name: `${labelName}Group`,
        type: 'group',
        marks: [
          ...(richSegmentLabel.swatch ? [getRichSegmentLabelSwatchMark(richSegmentLabel)] : []),
          getRichSegmentLabelNameTextMark(richSegmentLabel),
          ...getRichSegmentLabelValueTextMark(richSegmentLabel),
          ...getRichSegmentLabelDetailTextMark(richSegmentLabel),
        ],
      },
    ];
  });
};
