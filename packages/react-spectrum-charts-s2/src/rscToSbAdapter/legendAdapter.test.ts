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

import { DEFAULT_COLOR } from '@spectrum-charts/core-s2/constants';

import { ChartPopover } from '../components/ChartPopover';
import { childrenToOptions } from './childrenAdapter';
import { getLegendOptions } from './legendAdapter';

describe('getLegendOptions()', () => {
  it('should return all basic options', () => {
    const options = getLegendOptions({}, childrenToOptions);
    expect(options).toHaveProperty('hasOnClick', false);
    expect(options).toHaveProperty('hasMouseInteraction', false);
  });
  test('should set hasOnClick to true if onClickProp exists and is not undefined', () => {
    expect(getLegendOptions({ onClick: () => {} }, childrenToOptions).hasOnClick).toBe(true);
    expect(getLegendOptions({ onClick: undefined }, childrenToOptions).hasOnClick).toBe(false);
  });
  test('should set hasMouseInteraction to true if onMouseOut and/or onMouseOver are valid', () => {
    expect(getLegendOptions({ onMouseOut: () => {} }, childrenToOptions)).toHaveProperty('hasMouseInteraction', true);
    expect(getLegendOptions({ onMouseOut: undefined }, childrenToOptions)).toHaveProperty('hasMouseInteraction', false);
    expect(getLegendOptions({ onMouseOver: () => {} }, childrenToOptions)).toHaveProperty('hasMouseInteraction', true);
    expect(getLegendOptions({ onMouseOver: undefined }, childrenToOptions)).toHaveProperty(
      'hasMouseInteraction',
      false
    );
    expect(getLegendOptions({ onMouseOut: () => {}, onMouseOver: () => {} }, childrenToOptions)).toHaveProperty(
      'hasMouseInteraction',
      true
    );
    expect(getLegendOptions({ onMouseOut: undefined, onMouseOver: undefined }, childrenToOptions)).toHaveProperty(
      'hasMouseInteraction',
      false
    );
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getLegendOptions({ children: [createElement(ChartPopover)] }, childrenToOptions);
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getLegendOptions({ color: DEFAULT_COLOR }, childrenToOptions);
    expect(options).toHaveProperty('color', DEFAULT_COLOR);
  });
  it('should not add props that are not provided', () => {
    const options = getLegendOptions({}, childrenToOptions);
    expect(options).not.toHaveProperty('color');
  });
});
