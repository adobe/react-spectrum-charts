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
import { createElement } from 'react';

import { DEFAULT_COLOR } from '@spectrum-charts/constants';

import { ChartPopover } from '../components/ChartPopover';
import { ChartTooltip } from '../components/ChartTooltip';
import { DonutSummary, SegmentLabel } from '../rc';
import { getDonutOptions } from './donutAdapter';

describe('getDonutOptions()', () => {
  it('should return all basic options', () => {
    const options = getDonutOptions({});
    expect(options.markType).toBe('donut');
    expect(options.chartPopovers).toHaveLength(0);
    expect(options.chartTooltips).toHaveLength(0);
    expect(options.donutSummaries).toHaveLength(0);
    expect(options.segmentLabels).toHaveLength(0);
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getDonutOptions({ children: [createElement(ChartPopover)] });
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should convert tooltip children to chartTooltips array', () => {
    const options = getDonutOptions({ children: [createElement(ChartTooltip)] });
    expect(options.chartTooltips).toHaveLength(1);
  });
  it('should convert donnut summary children to donutSummaries array', () => {
    const options = getDonutOptions({ children: [createElement(DonutSummary)] });
    expect(options.donutSummaries).toHaveLength(1);
  });
  it('should convert segment label children to segmentLabels array', () => {
    const options = getDonutOptions({ children: [createElement(SegmentLabel)] });
    expect(options.segmentLabels).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getDonutOptions({ color: DEFAULT_COLOR });
    expect(options).toHaveProperty('color', DEFAULT_COLOR);
  });
  it('should not add props that are not provided', () => {
    const options = getDonutOptions({});
    expect(options).not.toHaveProperty('color');
  });
});
