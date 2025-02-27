/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { toCamelCase } from '@utils';
import { DEFAULT_COLOR_SCHEME, DEFAULT_BULLET_DIRECTION } from '@constants';
import { Spec } from 'vega';
import { ColorScheme, BulletProps, BulletSpecProps } from '../../types';
import { getBulletData, getBulletScales, getBulletSignals, getBulletMarks } from './bulletMarkUtils';
import { sanitizeMarkChildren } from '../../utils';
import { getColorValue } from '../specUtils';
import { spectrumColors } from '@themes';

const DEFAULT_COLOR = spectrumColors.light['static-blue']

export const addBullet = (
  spec: Spec,
  {
    children,
    colorScheme = DEFAULT_COLOR_SCHEME,
    index = 0,
    name,
    metric,
    dimension,
    target,
    color = DEFAULT_COLOR,
    direction = DEFAULT_BULLET_DIRECTION,
    ...props
  }: BulletProps & { colorScheme?: ColorScheme; index?: number; idKey: string }
): Spec => {

  const bulletProps: BulletSpecProps = {
    children: sanitizeMarkChildren(children),
    colorScheme: colorScheme,
    index,
    color: getColorValue(color, colorScheme),
    metric: metric ?? 'currentAmount',
    dimension: dimension ?? 'graphLabel',
    target: target ?? 'target',
    name: toCamelCase(name ?? `bullet${index}`),
    direction,
    ...props,
  };
  return {
    ...spec,
    data: getBulletData(bulletProps),
    marks: [getBulletMarks(bulletProps)],
    scales: getBulletScales(bulletProps),
    signals: getBulletSignals(bulletProps)
  };
};
