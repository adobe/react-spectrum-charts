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
import { toEngineOptions } from './toEngineOptions.js';

describe('toEngineOptions', () => {
  test('maps a line mark and its axes', () => {
    const config = toEngineOptions({
      marks: [{ markType: 'line', color: 'channel', metric: 'visits', interpolate: 'monotone', dimensionHover: true }],
      axes: [
        { position: 'left', title: 'Visits', grid: true, numberFormat: 'shortNumber', referenceLines: [{ value: 5 }] },
        { position: 'bottom', labelFormat: 'time' },
      ],
      legends: [{ position: 'bottom' }],
      titles: [{ text: 'Visits' }],
    });
    expect(config).toMatchObject({
      type: 'line',
      options: {
        x: 'datetime',
        y: 'visits',
        series: 'channel',
        curve: 'monotone',
        hover: 'x',
        title: 'Visits',
        legend: { position: 'bottom' },
        xAxis: { type: 'time' },
        yAxis: { position: 'left', title: 'Visits', grid: true, format: '.3~s' },
        referenceLines: [{ axis: 'y', value: 5, kind: 'primary' }],
      },
    });
  });

  test('hides axes and the legend the chart does not declare', () => {
    const config = toEngineOptions({ marks: [{ markType: 'line' }] });
    expect(config).toMatchObject({ options: { legend: false, xAxis: { hidden: true }, yAxis: { hidden: true } } });
  });

  test('maps a donut mark and its summary', () => {
    const config = toEngineOptions({
      marks: [
        {
          markType: 'donut',
          color: 'browser',
          metric: 'count',
          sortOrder: 'data',
          variant: 'semicircle',
          donutSummaries: [{ label: 'Visitors' }],
        },
      ],
    });
    expect(config).toMatchObject({
      type: 'donut',
      options: {
        category: 'browser',
        value: 'count',
        sort: 'none',
        variant: 'semicircle',
        center: { label: 'Visitors' },
        directLabels: false,
      },
    });
  });

  test('returns a reason for charts the engine cannot draw', () => {
    expect(toEngineOptions({ marks: [{ markType: 'bar' }] })).toBe("the engine doesn't support the bar mark");
    expect(toEngineOptions({ marks: [{ markType: 'line' }, { markType: 'line' }] })).toBe(
      'the engine draws exactly one mark (got 2)'
    );
  });
});
