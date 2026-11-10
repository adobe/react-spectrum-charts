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
import { FOCUSED_REGION } from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { getChartFocusRing } from './accessibleNavigationSpecBuilder.js';

describe('getChartFocusRing()', () => {
  test('covers the full plot area and keys opacity on the chart region', () => {
    const ring = getChartFocusRing('light');
    expect(ring).toHaveProperty('name', 'chartFocusRing');
    expect(ring.encode?.update?.x).toEqual({ value: 0 });
    expect(ring.encode?.update?.x2).toEqual({ signal: 'width' });
    expect(ring.encode?.update?.opacity).toEqual([{ test: `${FOCUSED_REGION} === 'chart'`, value: 1 }, { value: 0 }]);
  });

  test('uses the color scheme for the ring stroke', () => {
    expect(getChartFocusRing('dark').encode?.enter?.stroke).toEqual({ value: getS2ColorValue('blue-800', 'dark') });
  });
});
