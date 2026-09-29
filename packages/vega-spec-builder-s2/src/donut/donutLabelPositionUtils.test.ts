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
import { getLabelPositionTransforms } from './donutLabelPositionUtils';

/** Evaluates a transform's Vega expression against a fixed scope. */
const evalExpr = (expr: string, datum: Record<string, number>, height: number): number =>
  // eslint-disable-next-line no-new-func
  new Function(
    'datum',
    'height',
    'PI',
    'abs',
    'cos',
    'sin',
    'max',
    'sqrt',
    'pow',
    `return ${expr};`
  )(
    datum,
    height,
    Math.PI,
    Math.abs,
    Math.cos,
    Math.sin,
    Math.max,
    Math.sqrt,
    Math.pow
  );

/** Evaluates a hemisphere expression against a fixed Vega-compatible scope. */
const evalHemisphereExpr = (expr: string, arcTheta: number): string =>
  // eslint-disable-next-line no-new-func
  new Function('datum', 'PI', `return ${expr};`)({ arcTheta }, Math.PI);

describe('getLabelPositionTransforms', () => {
  const outerRadius = 120;
  const ringGap = 20;
  const height = 300;

  test.each([
    ['Active A', Math.PI / 2],
    ['Active B', (234 * Math.PI) / 180],
    ['Active C', (324 * Math.PI) / 180],
  ])('places %s at the slice midpoint on the 20px anchor ring', (_label, arcTheta) => {
    const anchorRadius = outerRadius + ringGap;
    const labelHeight = 28;
    const transforms = getLabelPositionTransforms('label', `datum['arcTheta']`, `${anchorRadius}`, `${labelHeight}`);
    const radiusTransform = transforms.find((transform) => 'as' in transform && transform.as === 'label_radius');
    const idealYTransform = transforms.find((transform) => 'as' in transform && transform.as === 'label_idealY');
    const halfWidthTransform = transforms.find(
      (transform) => 'as' in transform && transform.as === 'label_labelHalfWidth'
    );
    if (
      !idealYTransform ||
      !('expr' in idealYTransform) ||
      !radiusTransform ||
      !('expr' in radiusTransform) ||
      !halfWidthTransform ||
      !('expr' in halfWidthTransform)
    ) {
      throw new Error('Expected radius, idealY, and labelHalfWidth formula transforms');
    }

    const datum = { arcTheta };
    const radius = evalExpr(radiusTransform.expr, datum, height);
    const labelY = evalExpr(idealYTransform.expr, { ...datum, label_radius: radius }, height);
    const halfWidth = evalExpr(halfWidthTransform.expr, { ...datum, label_radius: radius }, height);
    const dy = labelY - height / 2;

    expect(labelY).toBeCloseTo(height / 2 - radius * Math.cos(arcTheta), 5);
    const nearestDy = Math.max(0, Math.abs(dy) - labelHeight / 2);
    expect(Math.hypot(halfWidth, nearestDy) - outerRadius).toBeCloseTo(ringGap, 5);
  });

  test.each([
    ['quarter turn', Math.PI / 2, 'right'],
    ['half turn', Math.PI, 'right'],
    ['negative quarter turn', -Math.PI / 2, 'left'],
    ['more than one full turn', (5 * Math.PI) / 2, 'right'],
  ])('normalizes %s before classifying the hemisphere', (_case, arcTheta, expected) => {
    const transforms = getLabelPositionTransforms('label', `datum['arcTheta']`, `${outerRadius + ringGap}`, '28');
    const hemisphereTransform = transforms.find(
      (transform) => 'as' in transform && transform.as === 'label_hemisphere'
    );
    if (!hemisphereTransform || !('expr' in hemisphereTransform)) {
      throw new Error('Expected hemisphere formula transform');
    }

    expect(evalHemisphereExpr(hemisphereTransform.expr, arcTheta)).toBe(expected);
  });
});
