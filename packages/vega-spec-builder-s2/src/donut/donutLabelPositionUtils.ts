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
import { FormulaTransform } from 'vega';

/** Suffixes of the derived label position fields */
type LabelFieldSuffix =
  | 'hemisphere'
  | 'idealY'
  | 'radius'
  | 'labelY'
  | 'centerY'
  | 'topY'
  | 'bottomY'
  | 'labelHalfWidth'
  | 'leftX'
  | 'rightX';

/**
 * Gets the derived label field name for a given field prefix and suffix
 * @param fieldPrefix
 * @param suffix
 * @returns field name
 */
export const getLabelField = (fieldPrefix: string, suffix: LabelFieldSuffix): string => `${fieldPrefix}_${suffix}`;

type LabelPositionFields = {
  hemisphere: string;
  idealY: string;
  radius: string;
  labelY: string;
  centerY: string;
  topY: string;
  bottomY: string;
  halfWidth: string;
};

type LabelGeometryExpressions = {
  normalizedTheta: string;
  halfHeight: string;
  radius: string;
};

/** Gets the derived field names written by the label position transforms. */
const getLabelPositionFields = (fieldPrefix: string): LabelPositionFields => ({
  hemisphere: getLabelField(fieldPrefix, 'hemisphere'),
  idealY: getLabelField(fieldPrefix, 'idealY'),
  radius: getLabelField(fieldPrefix, 'radius'),
  labelY: getLabelField(fieldPrefix, 'labelY'),
  centerY: getLabelField(fieldPrefix, 'centerY'),
  topY: getLabelField(fieldPrefix, 'topY'),
  bottomY: getLabelField(fieldPrefix, 'bottomY'),
  halfWidth: getLabelField(fieldPrefix, 'labelHalfWidth'),
});

/**
 * Gets the geometry expressions that keep the rendered label edge at the target radius.
 * @param arcTheta
 * @param targetRadius
 * @param labelHeight
 * @param inwardExtent
 * @returns label geometry expressions
 */
const getLabelGeometryExpressions = (
  arcTheta: string,
  targetRadius: string,
  labelHeight: string,
  inwardExtent?: string
): LabelGeometryExpressions => {
  const normalizedTheta = `(((${arcTheta}) % (2 * PI)) + 2 * PI) % (2 * PI)`;
  const safeHeight = `max(1, (${labelHeight}))`;
  const halfHeight = `(${safeHeight}) / 2`;
  const safeInwardExtent = `max(0, (${inwardExtent ?? halfHeight}))`;
  const horizontalRatio = `abs(sin(${arcTheta}))`;
  const verticalRatio = `abs(cos(${arcTheta}))`;
  const centerlineRadius = `(${targetRadius}) / max(0.001, ${horizontalRatio})`;
  const remainingRadius = `sqrt(max(0, pow(${targetRadius}, 2) - pow(${safeInwardExtent}, 2) * pow(${horizontalRatio}, 2)))`;
  const outsideCenterlineRadius = `${verticalRatio} * ${safeInwardExtent} + ${remainingRadius}`;
  const crossesCenterline = `(${centerlineRadius}) * ${verticalRatio} <= ${safeInwardExtent}`;
  const radius = `${crossesCenterline} ? ${centerlineRadius} : ${outsideCenterlineRadius}`;

  return { normalizedTheta, halfHeight, radius };
};

/**
 * Gets fixed label positions at the segment midpoint.
 * @param fieldPrefix unique prefix for the fields this util writes
 * @param arcThetaExpr vega expression for the row's arc center angle
 * @param anchorRadiusExpr vega expression for the donut's outer radius plus the label gap
 * @param labelHeightExpr vega expression for the rendered label block height
 * @param inwardExtentExpr vega expression for the label height extending toward the chart center
 * @returns transforms to append to a label candidate data source
 */
export const getLabelPositionTransforms = (
  fieldPrefix: string,
  arcThetaExpr: string,
  anchorRadiusExpr: string,
  labelHeightExpr: string,
  inwardExtentExpr?: string
): FormulaTransform[] => {
  const fields = getLabelPositionFields(fieldPrefix);
  const geometry = getLabelGeometryExpressions(arcThetaExpr, anchorRadiusExpr, labelHeightExpr, inwardExtentExpr);

  return [
    // Choose the label side after normalizing rotated or negative angles.
    { type: 'formula', as: fields.hemisphere, expr: `${geometry.normalizedTheta} <= PI ? 'right' : 'left'` },
    // Move the anchor outward until the rendered label edge reaches the target gap.
    { type: 'formula', as: fields.radius, expr: geometry.radius },
    // Project the polar anchor onto the chart's vertical axis.
    {
      type: 'formula',
      as: fields.idealY,
      expr: `height / 2 - datum['${fields.radius}'] * cos(${arcThetaExpr})`,
    },
    { type: 'formula', as: fields.labelY, expr: `datum['${fields.idealY}']` },
    // Record the label's vertical bounds for collision detection.
    { type: 'formula', as: fields.centerY, expr: `datum['${fields.labelY}']` },
    { type: 'formula', as: fields.topY, expr: `datum['${fields.centerY}'] - ${geometry.halfHeight}` },
    { type: 'formula', as: fields.bottomY, expr: `datum['${fields.centerY}'] + ${geometry.halfHeight}` },
    // Project the polar anchor onto the horizontal axis.
    {
      type: 'formula',
      as: fields.halfWidth,
      expr: `abs(datum['${fields.radius}'] * sin(${arcThetaExpr}))`,
    },
  ];
};
