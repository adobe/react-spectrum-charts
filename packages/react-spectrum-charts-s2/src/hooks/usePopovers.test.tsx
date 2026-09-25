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

import { renderHook } from '@testing-library/react';

import { Bar, ChartPopover } from '../components';
import { Donut } from '../pre-alpha';
import { ChartChildElement } from '../types';
import usePopovers from './usePopovers';

const run = (children: ChartChildElement[]) => renderHook(() => usePopovers(children)).result.current;
const callback = () => null;

describe('usePopovers', () => {
  test('uses the donut color and metric keys for default content', () => {
    const [detail] = run([createElement(Donut, { color: 'browser', metric: 'count' }, createElement(ChartPopover))]);
    expect(detail.defaultDonutContent).toEqual({ colorKey: 'browser', metricKey: 'count' });
  });

  test('falls back to default color and metric keys', () => {
    const [detail] = run([createElement(Donut, {}, createElement(ChartPopover))]);
    expect(detail.defaultDonutContent).toEqual({ colorKey: 'series', metricKey: 'value' });
  });

  test('keeps a donut child without children and exposes its callback when provided', () => {
    const details = run([createElement(Donut, {}, <ChartPopover>{callback}</ChartPopover>)]);
    expect(details).toHaveLength(1);
    expect(details[0].defaultDonutContent).toBeDefined();
  });

  test('ignores a non-donut child without children', () => {
    expect(run([createElement(Bar, {}, createElement(ChartPopover))])).toHaveLength(0);
  });

  test('does not add default donut content for non-donut marks', () => {
    const [detail] = run([createElement(Bar, {}, <ChartPopover>{callback}</ChartPopover>)]);
    expect(detail.defaultDonutContent).toBeUndefined();
  });
});
