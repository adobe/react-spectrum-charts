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
import { View, expressionFunction, parse } from 'vega';

import { buildSpec, getVegaEmbedOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { getChartGeometry } from './chartGeometryUtils.js';

test.each([false, true])(
  'projects against actual temporal/dual-axis SVG geometry with hidden labels %s',
  async (hideDefaultLabels) => {
    const start = Date.UTC(2026, 0, 1);
    const end = start + 86400000 * 2;
    const rows = [
      { timestamp: start, value: 0, series: 'first' },
      { timestamp: end, value: 10, series: 'first' },
      { timestamp: start, value: 0, series: 'second' },
      { timestamp: end, value: 1000, series: 'second' },
    ];
    const spec = buildSpec({
      data: rows,
      animations: false,
      axes: [
        { position: 'bottom', labelFormat: 'time', hideDefaultLabels },
        { position: 'left', labelFormat: 'linear', range: [0, 10], hideDefaultLabels },
        { position: 'right', labelFormat: 'linear', range: [0, 1000], hideDefaultLabels },
      ],
      legends: [{ position: 'bottom' }],
      marks: [
        {
          markType: 'line',
          dimension: 'timestamp',
          color: 'series',
          dualMetricAxis: true,
          scaleType: 'time',
          chartInspects: [{}],
        },
      ],
    });
    const options = getVegaEmbedOptions({});
    Object.entries(options.expressionFunctions ?? {}).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', () => 400);
    const view = new View(parse(structuredClone(spec), options.config), { renderer: 'none' }).insert('table', rows);
    try {
      for (const width of [400, 520]) {
        await view.width(width).height(280).runAsync();
        await view.runAsync();
        const { plotBounds, projections } = getChartGeometry(view, spec, [
          { id: 'zero', position: 'left', value: 0 },
          { id: 'primary-mid', position: 'left', value: 5 },
          { id: 'secondary-mid', position: 'right', value: 500 },
          { id: 'start', position: 'bottom', value: start },
          { id: 'between', position: 'bottom', value: (start + end) / 2 },
          { id: 'end', position: 'bottom', value: end },
          { id: 'outside', position: 'bottom', value: end + 1 },
        ]);
        const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
        expect(svg.querySelector('svg > g')?.getAttribute('transform')).toBe(
          `translate(${plotBounds.x},${plotBounds.y})`
        );
        const linePaths = [...svg.querySelectorAll('.mark-line path')].map((path) => path.getAttribute('d'));
        expect(linePaths.some((path) => path?.startsWith(`M0,${plotBounds.height}`))).toBe(true);
        expect(linePaths.some((path) => path?.includes(`${plotBounds.width},0`))).toBe(true);
        expect(projections).toEqual([
          { id: 'zero', coordinate: plotBounds.y + plotBounds.height },
          { id: 'primary-mid', coordinate: plotBounds.y + plotBounds.height / 2 },
          { id: 'secondary-mid', coordinate: plotBounds.y + plotBounds.height / 2 },
          { id: 'start', coordinate: plotBounds.x },
          { id: 'between', coordinate: plotBounds.x + plotBounds.width / 2 },
          { id: 'end', coordinate: plotBounds.x + plotBounds.width },
          { id: 'outside', coordinate: null },
        ]);
      }
      expect(view.data('table')).toHaveLength(rows.length);
      expect(() => getChartGeometry(view, spec, [{ id: 'missing', position: 'top', value: start }])).toThrow(
        'one declared scale'
      );
      expect(() => getChartGeometry(view, spec, [{ id: 'invalid', position: 'bottom', value: NaN }])).toThrow(
        'finite numeric'
      );
      expect(() =>
        getChartGeometry(view, spec, [
          { id: 'duplicate', position: 'bottom', value: start },
          { id: 'duplicate', position: 'bottom', value: end },
        ])
      ).toThrow('unique nonempty IDs');
    } finally {
      view.finalize();
    }
  }
);

test('rejects categorical axes and clips even when the continuous scale clamps', async () => {
  const spec = {
    padding: { left: 7, top: 11 },
    scales: [
      { name: 'category', type: 'band' as const, domain: ['first', 'second'], range: 'width' as const },
      { name: 'metric', type: 'linear' as const, domain: [0, 10], range: 'height' as const, clamp: true },
    ],
    axes: [
      { orient: 'bottom' as const, scale: 'category' },
      { orient: 'left' as const, scale: 'metric' },
    ],
  };
  const view = new View(parse(spec), { renderer: 'none' });
  try {
    await view.width(300).height(200).runAsync();
    expect(() => getChartGeometry(view, spec, [{ id: 'category', position: 'bottom', value: 1 }])).toThrow(
      'continuous numeric'
    );
    const result = getChartGeometry(view, spec, [
      { id: 'zero', position: 'left', value: 0 },
      { id: 'outside', position: 'left', value: -1 },
    ]);
    const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
    expect(svg.querySelector('svg > g')?.getAttribute('transform')).toBe(
      `translate(${result.plotBounds.x},${result.plotBounds.y})`
    );
    expect(result.projections).toEqual([
      { id: 'zero', coordinate: result.plotBounds.y + result.plotBounds.height },
      { id: 'outside', coordinate: null },
    ]);
  } finally {
    view.finalize();
  }
});
