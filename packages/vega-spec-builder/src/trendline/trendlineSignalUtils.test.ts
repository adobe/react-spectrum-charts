/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Signal } from 'vega';

import { CONTROLLED_HIGHLIGHTED_ITEM, HOVERED_ITEM } from '@spectrum-charts/constants';

import { defaultSignals } from '../specTestUtils';
import { setTrendlineSignals } from './trendlineSignalUtils';
import { defaultLineOptions } from './trendlineTestUtils';

describe('getTrendlineSignals()', () => {
  let signals: Signal[];
  beforeEach(() => {
    signals = JSON.parse(JSON.stringify(defaultSignals));
  });
  test('should add voronoi hover signal events if ChartTooltip exists', () => {
    setTrendlineSignals(signals, {
      ...defaultLineOptions,
      trendlines: [{ chartTooltips: [{}] }],
    });
    expect(signals).toHaveLength(defaultSignals.length + 1);
    expect(signals[0]).toHaveProperty('name', CONTROLLED_HIGHLIGHTED_ITEM);
    expect(signals[0].on).toBeUndefined();
    expect(signals.at(-1)).toHaveProperty('name', `line0Trendline_${HOVERED_ITEM}`);
    expect(signals.at(-1)?.on).toHaveLength(2);
  });

  test('should not modify any signals if there is not a ChartTooltip', () => {
    setTrendlineSignals(signals, defaultLineOptions);
    expect(signals).toStrictEqual(defaultSignals);
  });
});
