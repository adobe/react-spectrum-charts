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

import { Axis } from '../components/Axis/index.js';
import { ChartInspect } from '../components/ChartInspect/index.js';
import { ChartPopover } from '../components/ChartPopover/index.js';
import { Histogram } from '../lab/index.js';
import { SanitizedSpecProps } from '../types/index.js';
import { rscPropsToSpecBuilderOptions } from './chartAdapter.js';
import { childrenToOptions } from './childrenAdapter.js';
import {
  applyHistogramAxisTitleDefaults,
  applyHistogramCellLegendTitleDefaults,
  getHistogramAxisTitleKey,
  getHistogramOptions,
} from './histogramAdapter.js';

describe('getHistogramOptions()', () => {
  it('should return all basic options', () => {
    const options = getHistogramOptions({}, childrenToOptions);
    expect(options.markType).toBe('histogram');
    expect(options.chartInspects).toHaveLength(0);
    expect(options.chartPopovers).toHaveLength(0);
    expect(options.hasOnClick).toBe(false);
  });
  it('should convert ChartInspect children to chartInspects array', () => {
    const options = getHistogramOptions({ children: [createElement(ChartInspect)] }, childrenToOptions);
    expect(options.chartInspects).toHaveLength(1);
  });
  it('should convert popover children to chartPopovers array', () => {
    const options = getHistogramOptions({ children: [createElement(ChartPopover)] }, childrenToOptions);
    expect(options.chartPopovers).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getHistogramOptions({ metric: 'ms', binSize: 50, extent: [0, 500] }, childrenToOptions);
    expect(options).toMatchObject({ metric: 'ms', binSize: 50, extent: [0, 500] });
  });
  it('should convert onClick to a flag', () => {
    const options = getHistogramOptions({ onClick: jest.fn() }, childrenToOptions);
    expect(options.hasOnClick).toBe(true);
    expect(options).not.toHaveProperty('onClick');
  });
});

describe('childrenToOptions()', () => {
  it('should add Histogram children to marks', () => {
    const { marks } = childrenToOptions([createElement(Histogram, { metric: 'ms' })]);
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveProperty('markType', 'histogram');
  });
});

describe('getHistogramAxisTitleKey()', () => {
  it.each([
    [{}, 'histogram.countTitle'],
    [{ yValue: 'percent' }, 'histogram.percentTitle'],
    [{ yValue: 'density' }, 'histogram.densityTitle'],
    [{ cumulative: true }, 'histogram.cumulativeCountTitle'],
    [{ cumulative: true, yValue: 'percent' }, 'histogram.cumulativePercentTitle'],
    [{ cumulative: true, yValue: 'density' }, 'histogram.cumulativePercentTitle'],
  ] as const)('should map %o to %s', (props, key) => {
    expect(getHistogramAxisTitleKey({ markType: 'histogram', ...props })).toBe(key);
  });
});

describe('applyHistogramAxisTitleDefaults()', () => {
  it('should title left and right axes that have no title', () => {
    const axes = applyHistogramAxisTitleDefaults(
      [{ position: 'left' }, { position: 'right' }, { position: 'bottom' }],
      [{ markType: 'histogram' }],
      'en-US'
    );
    expect(axes.map(({ title }) => title)).toStrictEqual(['Count', 'Count', undefined]);
  });
  it('should keep titles the user set, including empty ones', () => {
    const axes = applyHistogramAxisTitleDefaults(
      [
        { position: 'left', title: 'Requests' },
        { position: 'right', title: '' },
      ],
      [{ markType: 'histogram' }],
      'en-US'
    );
    expect(axes.map(({ title }) => title)).toStrictEqual(['Requests', '']);
  });
  it('should use the title for the plotted value', () => {
    const axes = applyHistogramAxisTitleDefaults(
      [{ position: 'left' }],
      [{ markType: 'histogram', yValue: 'percent' }],
      'en-US'
    );
    expect(axes[0].title).toBe('Percent');
  });
  it('should label share axes as percentages unless the user set a format', () => {
    const axes = applyHistogramAxisTitleDefaults(
      [{ position: 'left' }, { position: 'right', labelFormat: 'linear' }],
      [{ markType: 'histogram', yValue: 'density', cumulative: true }],
      'en-US'
    );
    expect(axes.map(({ labelFormat }) => labelFormat)).toStrictEqual(['percentage', 'linear']);
  });
  it('should leave the label format alone for counts', () => {
    const axes = applyHistogramAxisTitleDefaults([{ position: 'left' }], [{ markType: 'histogram' }], 'en-US');
    expect(axes[0].labelFormat).toBeUndefined();
  });
  it('should not title axes of 2D histograms or other marks', () => {
    const axes = [{ position: 'left' as const }];
    expect(applyHistogramAxisTitleDefaults(axes, [{ markType: 'histogram', yMetric: 'y' }], 'en-US')).toBe(axes);
    expect(applyHistogramAxisTitleDefaults(axes, [{ markType: 'bar' }], 'en-US')).toBe(axes);
  });
});

describe('rscPropsToSpecBuilderOptions() with a histogram', () => {
  it('should default the count axis title', () => {
    const options = rscPropsToSpecBuilderOptions({
      children: [createElement(Axis, { position: 'left' }), createElement(Histogram)],
    } as SanitizedSpecProps);
    expect(options.axes?.[0]?.title).toBe('Count');
  });
});

describe('histogram title defaults for newer options', () => {
  it('should title a weighted histogram with the summed field', () => {
    const axes = applyHistogramAxisTitleDefaults(
      [{ position: 'left' }],
      [{ markType: 'histogram', weight: 'revenue' }],
      'en-US'
    );
    expect(axes[0].title).toBe('Sum of revenue');
  });
  it('should title a weighted cumulative histogram as a running sum', () => {
    const axes = applyHistogramAxisTitleDefaults(
      [{ position: 'left' }],
      [{ markType: 'histogram', weight: 'revenue', cumulative: true }],
      'en-US'
    );
    expect(axes[0].title).toBe('Cumulative sum of revenue');
  });
  it('should title the bottom axis of a horizontal histogram', () => {
    const axes = applyHistogramAxisTitleDefaults(
      [{ position: 'left' }, { position: 'bottom' }],
      [{ markType: 'histogram', orientation: 'horizontal' }],
      'en-US'
    );
    expect(axes.map(({ title }) => title)).toStrictEqual([undefined, 'Count']);
  });
  it('should title the 2D cell legend unless one is set', () => {
    const marks = applyHistogramCellLegendTitleDefaults(
      [
        { markType: 'histogram', yMetric: 'y' },
        { markType: 'histogram', yMetric: 'y', weight: 'revenue' },
        { markType: 'histogram', yMetric: 'y', cellLegendTitle: 'Sessions' },
        { markType: 'histogram' },
      ],
      'en-US'
    );
    expect(marks.map((mark) => ('cellLegendTitle' in mark ? mark.cellLegendTitle : undefined))).toStrictEqual([
      'Count',
      'Sum of revenue',
      'Sessions',
      undefined,
    ]);
  });
});
