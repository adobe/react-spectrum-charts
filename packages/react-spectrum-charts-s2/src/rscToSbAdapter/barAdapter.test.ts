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

import { DEFAULT_COLOR } from '@spectrum-charts/constants';

import { BarDirectLabel } from '../components/BarDirectLabel';
import { ChartInspect } from '../components/ChartInspect';
import { ChartPopover } from '../components/ChartPopover';
import { getBarOptions } from './barAdapter';
import { childrenToOptions } from './childrenAdapter';

describe('getBarOptions()', () => {
  it('should return all basic options', () => {
    const options = getBarOptions({}, childrenToOptions);
    expect(options.markType).toBe('bar');
    expect(options.hasOnClick).toBe(false);
    expect(options.chartPopovers).toHaveLength(0);
    expect(options.chartInspects).toHaveLength(0);
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getBarOptions({ children: [createElement(ChartPopover)] }, childrenToOptions);
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should convert ChartInspect children to chartInspects array', () => {
    const options = getBarOptions({ children: [createElement(ChartInspect)] }, childrenToOptions);
    expect(options.chartInspects).toHaveLength(1);
  });
  it('should convert ChartInspect children to chartInspects array', () => {
    const options = getBarOptions({ children: [createElement(ChartInspect)] }, childrenToOptions);
    expect(options.chartInspects).toHaveLength(1);
  });
  it('should convert BarDirectLabel children to barDirectLabels array', () => {
    const options = getBarOptions({ children: [createElement(BarDirectLabel)] }, childrenToOptions);
    expect(options.barDirectLabels).toHaveLength(1);
  });
  test('should set hasOnClick to true if onClickProp exists and is not undefined', () => {
    expect(getBarOptions({ onClick: () => {} }, childrenToOptions).hasOnClick).toBe(true);
    expect(getBarOptions({ onClick: undefined }, childrenToOptions).hasOnClick).toBe(false);
  });
  it('should pass through included props', () => {
    const options = getBarOptions({ color: DEFAULT_COLOR }, childrenToOptions);
    expect(options).toHaveProperty('color', DEFAULT_COLOR);
  });
  it('should not add props that are not provided', () => {
    const options = getBarOptions({}, childrenToOptions);
    expect(options).not.toHaveProperty('color');
  });
});
