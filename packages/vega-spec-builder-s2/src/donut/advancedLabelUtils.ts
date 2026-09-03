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
  GroupMark,
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
  DONUT_LABEL_COLLISION_MIN_GAP_BUFFER,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_RADIUS,
  DONUT_SEGMENT_LABEL_MIN_ANGLE,
  DONUT_SIZE_TIER_CUTPOINTS,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule, getMarkOpacity } from '../marks/markUtils';
import { getPathFromSymbolShape } from '../specUtils';
import { getTextNumberFormat } from '../textUtils';
import { AdvancedLabelOptions, AdvancedLabelSpecOptions, DonutSpecOptions } from '../types';
import {
  getAdjustedYField,
  getCollisionHalfWidthField,
  getHemisphereField,
  getLabelCollisionTransforms,
} from './donutLabelCollisionUtils';
import { getDonutEmptyStateTest, getDonutOuterRadiusExpr } from './donutUtils';
import { getLabelValueFill, getTextRuleExpr } from './segmentLabelUtils';

/** Unique field/data-source prefix for advanced labels' collision fields, distinct from segment labels' */
const getAdvancedLabelFieldPrefix = (name: string): string => `${name}_advancedLabel`;

/** Name of the derived, collision-adjusted data source advanced label marks read from */
const getAdvancedLabelDataName = (name: string): string => `${name}_advancedLabelData`;

/**
 * Gets the expression testing whether a label's collision-adjusted (not original ideal) position
 * falls in the top half of the donut - collision can push a label across the vertical midpoint, so
 * the top/bottom split for dy/baseline must track where the label actually ends up, not its ideal angle
 * @param fieldPrefix
 * @returns vega expression string
 */
const getIsTopHalfExpr = (fieldPrefix: string): string => `datum['${getAdjustedYField(fieldPrefix)}'] <= height / 2`;

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
 * Gets the threshold scales that snap a donut's outer diameter to its named size tier's
 * advanced-label font sizes.
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
      range: DONUT_ADVANCED_LABEL_NAME_FONT_SIZES,
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
 * Gets the minimum vertical gap enforced between two colliding advanced labels - the swatch+text
 * block's full rendered height (name + any visible rows below it) plus a stacking buffer. Uses the
 * raw (unscaled) block height, not the vertical row-stacking cap's scaled-down height
 * (getAdvancedLabelRowDy) - collision spacing is about how much room two DIFFERENT labels need
 * between each other, which is unrelated to how one label's OWN rows compress to fit its own
 * reserved space near the ring's top/bottom pole.
 * @param advancedLabelOptions
 * @returns vega expression string
 */
const getAdvancedLabelMinGapExpr = ({ donutOptions, value, percent, detail }: AdvancedLabelSpecOptions): string => {
  const { name } = donutOptions;
  const hasValue = value || percent;
  const nameSize = `${name}_advancedLabelNameFontSize`;
  const valueSize = `${name}_advancedLabelValueFontSize`;
  const detailSize = `${name}_advancedLabelDetailFontSize`;
  const valueHeight = hasValue ? ` + ${DONUT_ADVANCED_LABEL_NAME_VALUE_GAP} + ${valueSize}` : '';
  const detailHeight = detail ? ` + ${DONUT_ADVANCED_LABEL_VALUE_DETAIL_GAP} + ${detailSize}` : '';
  return `${nameSize}${valueHeight}${detailHeight} + ${DONUT_LABEL_COLLISION_MIN_GAP_BUFFER}`;
};

/**
 * Gets the derived, collision-adjusted data source advanced label marks read from. Excludes
 * segments below the min-angle threshold entirely, mirroring getSegmentLabelData.
 * @param donutOptions
 * @returns SourceData[]
 */
export const getAdvancedLabelData = (donutOptions: DonutSpecOptions): SourceData[] => {
  const advancedLabel = getAdvancedLabel(donutOptions);
  if (!advancedLabel) return [];
  const { name } = donutOptions;
  const arcThetaExpr = `datum['${name}_arcTheta']`;
  const outerRadiusExpr = getDonutOuterRadiusExpr(donutOptions);
  return [
    {
      name: getAdvancedLabelDataName(name),
      source: FILTERED_TABLE,
      transform: [
        { type: 'filter', expr: `datum['${name}_arcLength'] >= ${DONUT_SEGMENT_LABEL_MIN_ANGLE}` },
        ...getLabelCollisionTransforms(
          getAdvancedLabelFieldPrefix(name),
          arcThetaExpr,
          getAdvancedLabelAnchorRadiusExpr(donutOptions),
          outerRadiusExpr,
          `${DONUT_ADVANCED_LABEL_RING_GAP}`,
          getAdvancedLabelMinGapExpr(advancedLabel)
        ),
      ],
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
  `${getDonutOuterRadiusExpr(donutOptions)} + ${DONUT_ADVANCED_LABEL_RING_GAP}`;

/**
 * Gets the pieces behind the widest-row-capped pixel width shared by the whole swatch+text block:
 * the real (uncapped) widest-row width, the max horizontal reach available before hitting the
 * container's edge, and the smaller of the two. Returned separately (not just the final capped
 * value) so callers can tell whether the cap actually did anything - see getAdvancedLabelLimitExpr.
 * @param advancedLabelOptions
 * @returns vega expression strings for the widest real row width, the max available reach, and the capped result
 */
const getAdvancedLabelWidthExprs = (
  options: AdvancedLabelSpecOptions
): { widerWidthExpr: string; maxReachExpr: string; cappedWidthExpr: string } => {
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
  // the cap is per-label, not a flat outerRadius*ratio - it's however much horizontal room remains
  // between this label's own anchor point (collisionHalfWidth, which shrinks away from the ring's
  // equator) and the container's actual edge (DONUT_RADIUS). A flat ratio-based cap matches this
  // exactly only at the equator (the original worst-case it was derived for); away from the equator
  // it leaves real, visible unused space between the label and the container edge.
  const halfWidthField = getCollisionHalfWidthField(getAdvancedLabelFieldPrefix(name));
  const maxReachExpr = `${DONUT_RADIUS} - datum['${halfWidthField}']`;
  return { widerWidthExpr, maxReachExpr, cappedWidthExpr: `min(${widerWidthExpr}, ${maxReachExpr})` };
};

/**
 * Gets the widest-row-capped pixel width shared by the whole swatch+text block - the same value
 * used both to cap the left-hemisphere pull-back (getAdvancedLabelAnchorDxExpr) and as each row's
 * truncation limit (getAdvancedLabelLimitExpr), so a row's real rendered width can never exceed the
 * distance it was pulled back by. Without both using this same capped value, a row wider than the
 * cap would undershoot its pull-back and its near-ring edge would land past the anchor, into the
 * ring itself - confirmed live (a long detail row overlapping the ring at ~195px outer diameter).
 * @param advancedLabelOptions
 * @returns vega expression string
 */
const getAdvancedLabelCappedWidthExpr = (options: AdvancedLabelSpecOptions): string =>
  getAdvancedLabelWidthExprs(options).cappedWidthExpr;

/**
 * Gets the shared horizontal pixel offset for the whole swatch+text block, mirroring
 * donut-direct-labels' single-line technique but measuring the widest of all rows (swatch+name,
 * value/%, and detail) rather than just two text lines.
 * @param advancedLabelOptions
 * @returns vega expression string
 */
const getAdvancedLabelAnchorDxExpr = (options: AdvancedLabelSpecOptions): string => {
  const { donutOptions } = options;
  const { name } = donutOptions;
  const hemisphereField = getHemisphereField(getAdvancedLabelFieldPrefix(name));
  return `(datum['${hemisphereField}'] === 'right' ? 0 : -(${getAdvancedLabelCappedWidthExpr(options)}))`;
};

/**
 * Gets a row's truncation limit - only the left hemisphere is ever capped (its pull-back is what's
 * bounded by getAdvancedLabelCappedWidthExpr); the right hemisphere has no pull-back at all (dx is
 * always 0, growing freely away from the ring) and must not be truncated by that same cap, or every
 * row - even ones that fit comfortably - gets needlessly cut off. `0` is Vega's "no limit" value.
 *
 * Left-hemisphere rows are ALSO only limited when their real width genuinely exceeds the available
 * reach (widerWidth > maxReach) - when it doesn't, the cap equals the row's own exact natural width
 * (min(widerWidth, maxReach) picks widerWidth), and setting `limit` to that exact value is a
 * razor's-edge boundary: our own width estimate and Vega's internal text-measurement can round
 * against each other by a fraction of a pixel, truncating a character that didn't need to go.
 * Passing `0` (no limit) whenever nothing was actually capped avoids that boundary entirely -
 * confirmed live (a "7,045 out of 40,365" detail row losing its last two digits despite its full,
 * untruncated width measuring under the available margin).
 * @param advancedLabelOptions
 * @param extraReservedWidthExpr width already reserved outside the text itself (e.g. the name row's
 * swatch + gap), subtracted from the cap before truncating
 * @returns vega expression string
 */
const getAdvancedLabelLimitExpr = (options: AdvancedLabelSpecOptions, extraReservedWidthExpr = '0'): string => {
  const { donutOptions } = options;
  const { name } = donutOptions;
  const hemisphereField = getHemisphereField(getAdvancedLabelFieldPrefix(name));
  const { widerWidthExpr, maxReachExpr, cappedWidthExpr } = getAdvancedLabelWidthExprs(options);
  return `datum['${hemisphereField}'] === 'right' || (${widerWidthExpr}) <= (${maxReachExpr}) ? 0 : (${cappedWidthExpr}) - (${extraReservedWidthExpr})`;
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

  const isTopHalfExpr = getIsTopHalfExpr(getAdvancedLabelFieldPrefix(name));
  return {
    name: `${isTopHalfExpr} ? (${topNameDy}) : 0`,
    value: hasValue ? `${isTopHalfExpr} ? (${topValueDy}) : (${bottomValueDy})` : undefined,
    detail: detail ? `${isTopHalfExpr} ? (${topDetailDy}) : (${bottomDetailDy})` : undefined,
  };
};

/**
 * Gets the shared x/align/baseline encodes common to every row and the swatch in an advanced label
 * block - all rows (and the swatch) share the same collision-adjusted anchor x/y and
 * hemisphere-mirrored dx. Position comes from the derived data source's per-hemisphere cascade
 * fields (donutLabelCollisionUtils.ts), not a fixed radius+theta polar anchor, since the ring's
 * horizontal half-width must be re-measured at each label's (possibly collision-shifted) Y.
 * @param advancedLabelOptions
 * @returns TextEncodeEntry
 */
const getAdvancedLabelSharedEncode = (options: AdvancedLabelSpecOptions): TextEncodeEntry => {
  const { name } = options.donutOptions;
  const fieldPrefix = getAdvancedLabelFieldPrefix(name);
  const hemisphereField = getHemisphereField(fieldPrefix);
  const halfWidthField = getCollisionHalfWidthField(fieldPrefix);
  return {
    x: {
      signal: `datum['${hemisphereField}'] === 'right' ? width / 2 + datum['${halfWidthField}'] : width / 2 - datum['${halfWidthField}']`,
    },
    y: { field: getAdjustedYField(fieldPrefix) },
    dx: { signal: getAdvancedLabelAnchorDxExpr(options) },
    align: { value: 'left' },
    baseline: {
      signal: `${getIsTopHalfExpr(fieldPrefix)} ? 'bottom' : 'top'`,
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
  // hide all labels when there isn't any data to display, the empty state ring is shown instead.
  // segments below DONUT_SEGMENT_LABEL_MIN_ANGLE are already excluded from the label data source
  // (getAdvancedLabelData) entirely, so there's no need to zero their font size here too
  { test: getDonutEmptyStateTest(name), value: 0 },
  { signal: fontSizeSignal },
];

/**
 * Gets the swatch mark - always the leftmost element of the block, on both hemispheres. Symbol
 * marks have no radius/theta/dx encode channels (those are text-mark-only per Vega's spec), so its
 * x/y read the same collision-adjusted fields (donutLabelCollisionUtils.ts) the text rows use,
 * rather than re-deriving polar position independently - the ideal-Y-to-pixel conversion happens
 * once, inside the shared derived data source, not per-mark. y is then nudged from the name row's
 * own anchor to sit at that text's optical vertical center.
 * @param advancedLabelOptions
 * @returns SymbolMark
 */
const getAdvancedLabelSwatchMark = (options: AdvancedLabelSpecOptions): SymbolMark => {
  const { donutOptions } = options;
  const { color, colorScheme, name } = donutOptions;
  const fieldPrefix = getAdvancedLabelFieldPrefix(name);
  const hemisphereField = getHemisphereField(fieldPrefix);
  const halfWidthField = getCollisionHalfWidthField(fieldPrefix);
  const dxExpr = getAdvancedLabelAnchorDxExpr(options);
  const rowDy = getAdvancedLabelRowDy(options);
  const isTopHalfExpr = getIsTopHalfExpr(fieldPrefix);
  const nameFontSize = `${name}_advancedLabelNameFontSize`;

  const anchorX = `datum['${hemisphereField}'] === 'right' ? width / 2 + datum['${halfWidthField}'] : width / 2 - datum['${halfWidthField}']`;
  const anchorY = `datum['${getAdjustedYField(fieldPrefix)}']`;
  const nameAnchorY = `(${anchorY}) + (${rowDy.name})`;
  // shift from the name row's baseline anchor to its optical vertical center
  const nameCenterY = `(${nameAnchorY}) + (${isTopHalfExpr} ? -(${nameFontSize} * 0.5) : (${nameFontSize} * 0.5))`;

  return {
    type: 'symbol',
    name: `${name}_advancedLabelSwatch`,
    from: { data: getAdvancedLabelDataName(name) },
    encode: {
      enter: {
        shape: { value: getPathFromSymbolShape('rounded-square') },
        fill: getColorProductionRule(color, colorScheme),
      },
      update: {
        // symbol marks' x is their center, unlike text's left-aligned x+dx - shift right by half
        // the swatch so its rendered left edge lines up with the value/detail rows' left edge
        x: { signal: `(${anchorX}) + (${dxExpr}) + ${DONUT_ADVANCED_LABEL_SWATCH_SIZE / 2}` },
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
    from: { data: getAdvancedLabelDataName(name) },
    encode: {
      enter: {
        text: [{ test: getDonutEmptyStateTest(name), value: '' }, { field: labelKey ?? color }],
        fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
      },
      update: {
        ...shared,
        // name row starts after the swatch + its gap
        dx: { signal: `${getAdvancedLabelAnchorDxExpr(options)} + ${DONUT_ADVANCED_LABEL_SWATCH_SIZE} + ${DONUT_ADVANCED_LABEL_SWATCH_GAP}` },
        dy: { signal: rowDy.name },
        fontSize: getAdvancedLabelFontSize(name, `${name}_advancedLabelNameFontSize`),
        // truncates (ellipsis) if the text alone would push the row past the same cap the pull-back
        // already assumed - the swatch+gap are already reserved out of the cap, so only the
        // remainder is available to the text itself
        limit: {
          signal: getAdvancedLabelLimitExpr(
            options,
            `${DONUT_ADVANCED_LABEL_SWATCH_SIZE} + ${DONUT_ADVANCED_LABEL_SWATCH_GAP}`
          ),
        },
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
      from: { data: getAdvancedLabelDataName(name) },
      encode: {
        enter: {
          text: [{ test: getDonutEmptyStateTest(name), value: '' }, ...valueTextRules],
          fontWeight: { value: DONUT_ADVANCED_LABEL_VALUE_FONT_WEIGHT },
        },
        update: {
          ...shared,
          dy: { signal: rowDy.value as string },
          fontSize: getAdvancedLabelFontSize(name, `${name}_advancedLabelValueFontSize`),
          // truncates (ellipsis) if this row alone is what pushed the block past its cap
          limit: { signal: getAdvancedLabelLimitExpr(options) },
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
      from: { data: getAdvancedLabelDataName(name) },
      encode: {
        enter: {
          text: [{ test: getDonutEmptyStateTest(name), value: '' }, getAdvancedLabelDetailText(options)],
          fill: { value: getS2ColorValue('gray-700', donutOptions.colorScheme) },
        },
        update: {
          ...shared,
          dy: { signal: rowDy.detail as string },
          fontSize: getAdvancedLabelFontSize(name, `${name}_advancedLabelDetailFontSize`),
          // truncates (ellipsis) if this row alone is what pushed the block past its cap - fixes
          // the observed overlap where a long "X out of Y" detail row extended past the pull-back
          // and into the ring itself
          limit: { signal: getAdvancedLabelLimitExpr(options) },
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
