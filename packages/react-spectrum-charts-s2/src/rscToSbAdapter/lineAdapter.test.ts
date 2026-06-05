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
import { ChartInspect } from '../components/ChartInspect';
import { LineForecast } from '../components/LineForecast';
import { LinePointAnnotation } from '../components/LinePointAnnotation';
import { getLineOptions } from './lineAdapter';

describe('getLineOptions()', () => {
  it('should return all basic options', () => {
    const options = getLineOptions({});
    expect(options.markType).toBe('line');
    expect(options.hasOnClick).toBe(false);
    expect(options.chartPopovers).toHaveLength(0);
    expect(options.chartInspects).toHaveLength(0);
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getLineOptions({ children: [createElement(ChartPopover)] });
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should convert ChartInspect children to chartInspects array', () => {
    const options = getLineOptions({ children: [createElement(ChartInspect)] });
    expect(options.chartInspects).toHaveLength(1);
  });
  test('should set hasOnClick to true if onClickProp exists and is not undefined', () => {
    expect(getLineOptions({ onClick: () => {} }).hasOnClick).toBe(true);
    expect(getLineOptions({ onClick: undefined }).hasOnClick).toBe(false);
  });
  test('should set hasOnContextMenu to true if onContextMenu prop exists and is not undefined', () => {
    expect(getLineOptions({ onContextMenu: () => {} }).hasOnContextMenu).toBe(true);
    expect(getLineOptions({ onContextMenu: undefined }).hasOnContextMenu).toBe(false);
  });
  it('should convert LineForecast children to forecasts array', () => {
    const options = getLineOptions({
      children: [createElement(LineForecast, { metric: 'forecastValue', start: 1725148800000 })],
    });
    expect(options.forecasts).toHaveLength(1);
    expect(options.forecasts?.[0]).toHaveProperty('metric', 'forecastValue');
    expect(options.forecasts?.[0]).toHaveProperty('start', 1725148800000);
  });
  it('should return empty forecasts array when no LineForecast children', () => {
    const options = getLineOptions({});
    expect(options.forecasts).toHaveLength(0);
  });
  it('should convert LinePointAnnotation children to linePointAnnotations array', () => {
    const options = getLineOptions({
      children: [createElement(LinePointAnnotation, { textKey: 'label', anchor: 'left' })],
    });
    expect(options.linePointAnnotations).toHaveLength(1);
    expect(options.linePointAnnotations?.[0]).toEqual({ textKey: 'label', anchor: 'left' });
  });
  it('should return empty linePointAnnotations array when no LinePointAnnotation children', () => {
    const options = getLineOptions({});
    expect(options.linePointAnnotations).toHaveLength(0);
  });
  it('should pass through included props', () => {
    const options = getLineOptions({ color: DEFAULT_COLOR });
    expect(options).toHaveProperty('color', DEFAULT_COLOR);
  });
  it('should not add props that are not provided', () => {
    const options = getLineOptions({});
    expect(options).not.toHaveProperty('color');
  });
});
