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
import { ScatterPath } from '../components/ScatterPath';
import { Trendline } from '../components/Trendline';
import { getScatterOptions } from './scatterAdapter';

describe('getScatterOptions()', () => {
  it('should return all basic options', () => {
    const options = getScatterOptions({});
    expect(options.markType).toBe('scatter');
    expect(options.chartPopovers).toHaveLength(0);
    expect(options.chartTooltips).toHaveLength(0);
    expect(options.trendlines).toHaveLength(0);
    expect(options.scatterPaths).toHaveLength(0);
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getScatterOptions({ children: [createElement(ChartPopover)] });
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should convert tooltip children to chartTooltips array', () => {
    const options = getScatterOptions({ children: [createElement(ChartTooltip)] });
    expect(options.chartTooltips).toHaveLength(1);
  });
  it('should convert trendline children to trendlines array', () => {
    const options = getScatterOptions({ children: [createElement(Trendline)] });
    expect(options.trendlines).toHaveLength(1);
  });
  it('should convert scatterPath children to scatterPaths array', () => {
    const options = getScatterOptions({ children: [createElement(ScatterPath)] });
    expect(options.scatterPaths).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getScatterOptions({ color: DEFAULT_COLOR });
    expect(options).toHaveProperty('color', DEFAULT_COLOR);
  });
  it('should not add props that are not provided', () => {
    const options = getScatterOptions({});
    expect(options).not.toHaveProperty('color');
  });
});
