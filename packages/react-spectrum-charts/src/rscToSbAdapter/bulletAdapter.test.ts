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
import { createElement } from 'react';

import { ChartTooltip } from '../components/ChartTooltip';
import { getBulletOptions } from './bulletAdapter';

describe('getBulletOptions()', () => {
  it('should return all basic options', () => {
    const options = getBulletOptions({});
    expect(options.markType).toBe('bullet');
    expect(options.chartTooltips).toHaveLength(0);
  });

  it('should convert tooltip children to chartTooltips array', () => {
    const options = getBulletOptions({ children: [createElement(ChartTooltip)] });
    expect(options.chartTooltips).toHaveLength(1);
  });

  it('should pass through included props', () => {
    const options = getBulletOptions({ color: 'blue-900', metric: 'value' });
    expect(options).toHaveProperty('color', 'blue-900');
    expect(options).toHaveProperty('metric', 'value');
  });

  it('should not add props that are not provided', () => {
    const options = getBulletOptions({});
    expect(options).not.toHaveProperty('color');
  });
});
