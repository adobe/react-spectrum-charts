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
import { FormulaTransform, WindowTransform } from 'vega';

/**
 * Gets the field name this util writes for a given field prefix and suffix
 * @param fieldPrefix
 * @param suffix
 * @returns field name
 */
const getCollisionField = (fieldPrefix: string, suffix: string): string => `${fieldPrefix}_${suffix}`;

/** Field holding which hemisphere ('left' | 'right') a row's label anchors in */
export const getHemisphereField = (fieldPrefix: string): string => getCollisionField(fieldPrefix, 'hemisphere');

/** Field holding a row's collision-adjusted absolute Y position */
export const getAdjustedYField = (fieldPrefix: string): string => getCollisionField(fieldPrefix, 'adjustedY');

/** Field holding the ring's horizontal half-width (plus ring gap) at a row's adjusted Y */
export const getCollisionHalfWidthField = (fieldPrefix: string): string =>
  getCollisionField(fieldPrefix, 'collisionHalfWidth');

/**
 * Gets the data transforms that cascade a hemisphere's labels vertically to avoid overlap (sorted by
 * their pre-collision ideal Y, closed-form running-max shortcut - see llm/skills/s2-donut/donut-label-collision),
 * then re-anchor each label horizontally against the ring's actual half-width at its adjusted Y, since
 * reusing the original angle-derived anchor after a Y-shift is an observed failure mode.
 * @param fieldPrefix unique prefix for the fields this util writes, so multiple label types can coexist
 * @param arcThetaExpr vega expression for the row's arc center angle, e.g. `datum['name_arcTheta']`
 * @param idealRadiusExpr vega expression for the label's pre-collision anchor radius (outer radius + ring gap)
 * @param outerRadiusExpr vega expression for the donut's (label-reserved) outer radius alone
 * @param ringGapExpr vega expression (or literal) for the ring gap, re-added after the horizontal re-anchor
 * @param minGapExpr vega expression for the minimum vertical gap enforced between adjacent labels
 * @returns transforms to append to a label-specific derived data source
 */
export const getLabelCollisionTransforms = (
  fieldPrefix: string,
  arcThetaExpr: string,
  idealRadiusExpr: string,
  outerRadiusExpr: string,
  ringGapExpr: string,
  minGapExpr: string
): (FormulaTransform | WindowTransform)[] => {
  const hemisphereField = getHemisphereField(fieldPrefix);
  const idealYField = getCollisionField(fieldPrefix, 'idealY');
  const rankField = getCollisionField(fieldPrefix, 'collisionRank');
  const helperField = getCollisionField(fieldPrefix, 'collisionHelper');
  const runningMaxField = getCollisionField(fieldPrefix, 'collisionRunningMax');
  const adjustedYField = getAdjustedYField(fieldPrefix);
  const halfWidthField = getCollisionHalfWidthField(fieldPrefix);

  return [
    { type: 'formula', as: hemisphereField, expr: `${arcThetaExpr} <= PI ? 'right' : 'left'` },
    // matches Vega's own theta/radius-to-xy conversion (vega-scenegraph text.js anchorPoint):
    // x = cx + r*sin(theta), y = cy - r*cos(theta) (theta=0 is top, increasing clockwise)
    { type: 'formula', as: idealYField, expr: `height / 2 - (${idealRadiusExpr}) * cos(${arcThetaExpr})` },
    {
      type: 'window',
      groupby: [hemisphereField],
      sort: { field: idealYField, order: 'ascending' },
      ops: ['row_number'],
      as: [rankField],
    },
    // row_number is 1-indexed; the cascade formula's rank is 0-indexed
    { type: 'formula', as: rankField, expr: `datum['${rankField}'] - 1` },
    { type: 'formula', as: helperField, expr: `datum['${idealYField}'] - ${minGapExpr} * datum['${rankField}']` },
    {
      type: 'window',
      groupby: [hemisphereField],
      sort: { field: idealYField, order: 'ascending' },
      ops: ['max'],
      fields: [helperField],
      frame: [null, 0],
      as: [runningMaxField],
    },
    {
      type: 'formula',
      as: adjustedYField,
      expr: `datum['${runningMaxField}'] + ${minGapExpr} * datum['${rankField}']`,
    },
    {
      type: 'formula',
      as: halfWidthField,
      expr: `sqrt(max(0, pow(${outerRadiusExpr}, 2) - pow(datum['${adjustedYField}'] - height / 2, 2))) + (${ringGapExpr})`,
    },
  ];
};
