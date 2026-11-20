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

import { ChartPopover } from '../components/ChartPopover/index.js';
import { ChartInspect } from '../components/ChartInspect/index.js';
import { DonutSummary } from '../components/DonutSummary/index.js';
import { SegmentLabel } from '../components/SegmentLabel/index.js';
import { childrenToOptions } from './childrenAdapter.js';
import { getDonutOptions } from './donutAdapter.js';

describe('getDonutOptions()', () => {
  it('should return all basic options', () => {
    const options = getDonutOptions({}, childrenToOptions);
    expect(options.markType).toBe('donut');
    expect(options.chartPopovers).toHaveLength(0);
    expect(options.chartInspects).toHaveLength(0);
    expect(options.donutSummaries).toHaveLength(0);
    expect(options.hasOnClick).toBe(false);
    expect(options.hasOnContextMenu).toBe(false);
    expect(options.hasOnMouseInput).toBeUndefined();
  });
  it.each(['onClick', 'onContextMenu', 'onMouseOver', 'onMouseOut'] as const)(
    'converts %s to interaction flags without serializing the callback',
    (callback) => {
      const options = getDonutOptions({ [callback]: jest.fn() }, childrenToOptions);
      expect(options).not.toHaveProperty(callback);
      expect(options.hasOnClick).toBe(callback === 'onClick');
      expect(options.hasOnContextMenu).toBe(callback === 'onContextMenu');
      expect(options.hasOnMouseInput).toBe(
        callback === 'onMouseOver' || callback === 'onMouseOut' ? true : undefined
      );
    }
  );
  it('preserves externally formatted summary text and labels', () => {
    const options = getDonutOptions(
      {
        children: [
          createElement(DonutSummary, { valueText: '1,234 units' }),
          createElement(SegmentLabel, { labelKey: 'shareLabel', value: false, percent: false }),
        ],
      },
      childrenToOptions
    );
    expect(options.donutSummaries).toEqual([{ valueText: '1,234 units' }]);
    expect(options.segmentLabels).toEqual([{ labelKey: 'shareLabel', value: false, percent: false }]);
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getDonutOptions({ children: [createElement(ChartPopover)] }, childrenToOptions);
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should convert ChartInspect children to chartInspects array', () => {
    const options = getDonutOptions({ children: [createElement(ChartInspect)] }, childrenToOptions);
    expect(options.chartInspects).toHaveLength(1);
  });
  it('should convert donnut summary children to donutSummaries array', () => {
    const options = getDonutOptions({ children: [createElement(DonutSummary)] }, childrenToOptions);
    expect(options.donutSummaries).toHaveLength(1);
  });
  it('should convert segment label children to segmentLabels array', () => {
    const options = getDonutOptions({ children: [createElement(SegmentLabel)] }, childrenToOptions);
    expect(options.segmentLabels).toHaveLength(1);
  });
  it('should preserve two mode-specific segment label children', () => {
    const options = getDonutOptions(
      {
        children: [
          createElement(SegmentLabel, { labelMode: 'emphasized' }),
          createElement(SegmentLabel, { labelMode: 'deemphasized' }),
        ],
      },
      childrenToOptions
    );
    expect(options.segmentLabels).toEqual([{ labelMode: 'emphasized' }, { labelMode: 'deemphasized' }]);
  });
  it('should pass through included props', () => {
    const options = getDonutOptions({ color: DEFAULT_COLOR }, childrenToOptions);
    expect(options).toHaveProperty('color', DEFAULT_COLOR);
  });
  it('should pass through the variant prop unchanged', () => {
    const options = getDonutOptions({ variant: 'semicircle' }, childrenToOptions);
    expect(options).toHaveProperty('variant', 'semicircle');
  });
  it('should pass through the sortOrder prop unchanged', () => {
    const options = getDonutOptions({ sortOrder: 'data' }, childrenToOptions);
    expect(options).toHaveProperty('sortOrder', 'data');
  });
  it('should not add props that are not provided', () => {
    const options = getDonutOptions({}, childrenToOptions);
    expect(options).not.toHaveProperty('color');
  });
});
