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

import { Axis } from '../components';
import { ChartChildElement } from '../types';
import useAxisLabelOnClickDetails from './useAxisLabelOnClickDetails';

describe('useAxisLabelOnClickDetails()', () => {
  it('should return an empty array when there are no Axis children', () => {
    const { result } = renderHook(() => useAxisLabelOnClickDetails([]));
    expect(result.current).toHaveLength(0);
  });

  it('should ignore Axis elements without an onClick prop', () => {
    const children = [createElement(Axis, { position: 'bottom' })] as unknown as ChartChildElement[];
    const { result } = renderHook(() => useAxisLabelOnClickDetails(children));
    expect(result.current).toHaveLength(0);
  });

  it('should return the markName and onClick for an Axis with onClick set', () => {
    const onClick = jest.fn();
    const children = [createElement(Axis, { position: 'bottom', onClick })] as unknown as ChartChildElement[];
    const { result } = renderHook(() => useAxisLabelOnClickDetails(children));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].markName).toBe('axis0');
    expect(result.current[0].onClick).toBe(onClick);
  });

  it('should map multiple Axis elements with onClick to separate details, indexed in order', () => {
    const onClick1 = jest.fn();
    const onClick2 = jest.fn();
    const children = [
      createElement(Axis, { position: 'bottom', onClick: onClick1 }),
      createElement(Axis, { position: 'left', onClick: onClick2 }),
    ] as unknown as ChartChildElement[];
    const { result } = renderHook(() => useAxisLabelOnClickDetails(children));
    expect(result.current).toHaveLength(2);
    expect(result.current.map((detail) => detail.markName)).toStrictEqual(['axis0', 'axis1']);
  });
});
