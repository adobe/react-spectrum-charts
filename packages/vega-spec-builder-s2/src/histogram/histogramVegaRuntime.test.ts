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
import { Data, Spec, View, expressionFunction, parse } from 'vega';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { HistogramOptions } from '../types/index.js';

type Row = Record<string, unknown>;

type BinRow = { binStart: number; binEnd: number; count: number; sum?: number; rscHistogramY1: number };

beforeAll(() => {
  expressionFunction('rscContainerWidth', () => 400);
  for (const [name, fn] of Object.entries(getExpressionFunctions('en-US'))) {
    expressionFunction(name, fn as (...args: unknown[]) => unknown);
  }
});

const values = [63, 70, 120, 180, 199, 240, 260, 410, 455, 980];

/**
 * Builds a headless Vega view for a histogram with the rows in its table.
 * @param mark - histogram options
 * @param rows - chart data
 * @returns view
 */
const getView = (mark: Omit<HistogramOptions, 'markType'>, rows: Row[]): View => {
  const spec: Spec = buildSpec({ marks: [{ markType: 'histogram', ...mark }], animations: false, data: rows });
  const [table, ...rest] = spec.data ?? [];
  spec.data = [{ ...table, values: rows } as Data, ...rest];
  return new View(parse(spec), { renderer: 'none' });
};

/**
 * Runs a histogram spec in a headless Vega view and returns its bin rows.
 * @param mark - histogram options
 * @param rows - chart data
 * @returns bin rows
 */
const getBins = async (mark: Omit<HistogramOptions, 'markType'>, rows: Row[] = values.map((value) => ({ value }))) => {
  const view = getView(mark, rows);
  await view.runAsync();
  const bins = view.data('histogram0_bins') as BinRow[];
  view.finalize();
  return bins;
};

const total = (bins: BinRow[]) => bins.reduce((sum, bin) => sum + bin.count, 0);

describe('histogram in Vega', () => {
  test('keeps every finite row and fills empty interior bins', async () => {
    const bins = await getBins({ binSize: 100 }, [...values.map((value) => ({ value })), { value: null }]);
    expect(total(bins)).toBe(values.length);
    expect(bins.find(({ binStart }) => binStart === 500)).toMatchObject({ count: 0 });
  });

  test('keeps every row when bins are anchored past the minimum', async () => {
    const bins = await getBins({ binSize: 100, binAnchor: 75 });
    expect(total(bins)).toBe(values.length);
    expect(bins.map(({ binStart }) => binStart)).toStrictEqual([-25, 75, 175, 275, 375, 475, 575, 675, 775, 875, 975]);
    expect(bins[0]).toMatchObject({ binEnd: 75, count: 2 });
  });

  test('keeps anchored bins inside a custom extent', async () => {
    const bins = await getBins({ binSize: 100, binAnchor: 50, extent: [0, 500] });
    expect(bins[0]).toMatchObject({ binStart: -50, binEnd: 50, count: 0 });
    expect(total(bins)).toBe(9);
  });

  test('sums the weight per bin', async () => {
    const bins = await getBins({ binSize: 500, weight: 'units' }, [
      { value: 10, units: 2 },
      { value: 20, units: 3 },
      { value: 600, units: 5 },
    ]);
    expect(bins.map(({ count, sum }) => [count, sum])).toStrictEqual([
      [2, 5],
      [1, 5],
    ]);
  });

  test('scales the density curve to the bar heights', async () => {
    const rows = Array.from({ length: 400 }, (_, i) => ({ value: (i * 37) % 100 }));
    const view = getView({ binSize: 10, densityCurve: true }, rows);
    await view.runAsync();
    const curve = view.data('histogram0_curveData') as { rscHistogramCurveY: number }[];
    const bars = view.data('histogram0_bins') as BinRow[];
    const curveMax = Math.max(...curve.map(({ rscHistogramCurveY }) => rscHistogramCurveY));
    const barMax = Math.max(...bars.map(({ rscHistogramY1 }) => rscHistogramY1));
    view.finalize();
    expect(curveMax / barMax).toBeGreaterThan(0.7);
    expect(curveMax / barMax).toBeLessThan(1.3);
  });
});
