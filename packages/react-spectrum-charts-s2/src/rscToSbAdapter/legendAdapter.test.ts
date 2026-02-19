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

import { ChartPopover } from '../components/ChartPopover';
import { getLegendOptions } from './legendAdapter';

describe('getLegendOptions()', () => {
  it('should return all basic options', () => {
    const options = getLegendOptions({});
    expect(options).toHaveProperty('hasOnClick', false);
    expect(options).toHaveProperty('hasMouseInteraction', false);
  });
  test('should set hasOnClick to true if onClickProp exists and is not undefined', () => {
    expect(getLegendOptions({ onClick: () => {} }).hasOnClick).toBe(true);
    expect(getLegendOptions({ onClick: undefined }).hasOnClick).toBe(false);
  });
  test('should set hasMouseInteraction to true if onMouseOut and/or onMouseOver are valid', () => {
    expect(getLegendOptions({ onMouseOut: () => {} })).toHaveProperty('hasMouseInteraction', true);
    expect(getLegendOptions({ onMouseOut: undefined })).toHaveProperty('hasMouseInteraction', false);
    expect(getLegendOptions({ onMouseOver: () => {} })).toHaveProperty('hasMouseInteraction', true);
    expect(getLegendOptions({ onMouseOver: undefined })).toHaveProperty('hasMouseInteraction', false);
    expect(getLegendOptions({ onMouseOut: () => {}, onMouseOver: () => {} })).toHaveProperty(
      'hasMouseInteraction',
      true
    );
    expect(getLegendOptions({ onMouseOut: undefined, onMouseOver: undefined })).toHaveProperty(
      'hasMouseInteraction',
      false
    );
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getLegendOptions({ children: [createElement(ChartPopover)] });
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getLegendOptions({ color: DEFAULT_COLOR });
    expect(options).toHaveProperty('color', DEFAULT_COLOR);
  });
  it('should not add props that are not provided', () => {
    const options = getLegendOptions({});
    expect(options).not.toHaveProperty('color');
  });
});
