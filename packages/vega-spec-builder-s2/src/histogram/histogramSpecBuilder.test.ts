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
import {
  COLOR_SCALE,
  DRAW_IN_DONE,
  DRAW_IN_DURATION,
  DRAW_IN_GROW_DURATION_MS,
  DRAW_IN_START,
  DRAW_IN_SWEEP_DURATION_MS,
  HISTOGRAM_BIN_END,
  HISTOGRAM_BIN_START,
  HISTOGRAM_Y1,
  HISTOGRAM_Y_BIN_END,
  HISTOGRAM_Y_BIN_START,
  MARK_ID,
} from '@spectrum-charts/core-s2/constants';
import { getColorSchemeColors } from '@spectrum-charts/core-s2/tokens';

import { buildSpec } from '../chartSpecBuilder.js';
import { initializeSpec } from '../specUtils.js';
import {
  HISTOGRAM_CELL_COLOR_SCHEME,
  addData,
  addHistogram,
  addSignals,
  getHistogramCellColorScale,
  getHistogramCellLegends,
  getHistogramValueDomain,
  setScales,
} from './histogramSpecBuilder.js';
import {
  colorSplitHistogramOptions,
  defaultHistogramOptions,
  histogram2DOptions,
  interactiveHistogramOptions,
} from './histogramTestUtils.js';

describe('addHistogram()', () => {
  test('applies defaults', () => {
    const spec = addHistogram(initializeSpec(), { markType: 'histogram', idKey: MARK_ID });
    expect(spec.data?.map(({ name }) => name)).toContain('histogram0_bins');
    expect(spec.marks?.[0].name).toBe('histogram0_group');
    expect(spec.usermeta?.interactiveMarks ?? []).toHaveLength(0);
  });

  test('uses the name prop', () => {
    const spec = addHistogram(initializeSpec(), { markType: 'histogram', idKey: MARK_ID, name: 'Ages' });
    expect(spec.marks?.[0].name).toBe('ages_group');
  });

  test('registers the interactive mark when there is an inspect', () => {
    const spec = addHistogram(initializeSpec(), { markType: 'histogram', idKey: MARK_ID, chartInspects: [{}] });
    expect(spec.usermeta?.interactiveMarks).toEqual([{ name: 'histogram0' }]);
  });

  test('turns on draw-in unless animations are off', () => {
    const animated = addHistogram(initializeSpec(), { markType: 'histogram', idKey: MARK_ID });
    const still = addHistogram(initializeSpec(), { markType: 'histogram', idKey: MARK_ID, animations: false });
    expect(animated.signals?.some(({ name }) => name === DRAW_IN_START)).toBe(true);
    expect(still.signals?.some(({ name }) => name === DRAW_IN_START)).toBe(false);
  });
});

describe('addData()', () => {
  test('adds the values and bins data after the base data', () => {
    const data = addData(initializeSpec().data ?? [], defaultHistogramOptions);
    expect(data.map(({ name }) => name)).toStrictEqual([
      'table',
      'filteredTable',
      'histogram0_values',
      'histogram0_bins',
    ]);
  });
});

describe('addSignals()', () => {
  test('adds no signals when not interactive or animated', () => {
    expect(addSignals([], defaultHistogramOptions)).toStrictEqual([]);
  });

  test('adds the hovered item signal when interactive', () => {
    const signals = addSignals([], interactiveHistogramOptions);
    expect(signals.map(({ name }) => name)).toStrictEqual(['histogram0_hoveredItem']);
  });

  test('runs the sweep draw-in longer than grow', () => {
    const grow = addSignals([], { ...defaultHistogramOptions, isDrawInAnimate: true });
    const sweep = addSignals([], { ...defaultHistogramOptions, isDrawInAnimate: true, drawInEffect: 'sweep' });
    const duration = (signals: typeof grow) => signals.find(({ name }) => name === DRAW_IN_DURATION);
    expect(duration(grow)).toHaveProperty('value', DRAW_IN_GROW_DURATION_MS);
    expect(duration(sweep)).toHaveProperty('value', DRAW_IN_SWEEP_DURATION_MS);
  });

  test('adds the draw-in clock signals when animated', () => {
    const signals = addSignals([], { ...defaultHistogramOptions, isDrawInAnimate: true });
    expect(signals.some(({ name }) => name === DRAW_IN_START)).toBe(true);
    expect(signals.some(({ name }) => name === DRAW_IN_DONE)).toBe(true);
  });
});

describe('setScales()', () => {
  test('adds a linear x scale over the bin edges and a zero-based y scale', () => {
    const scales = setScales([], defaultHistogramOptions);
    expect(scales[0]).toMatchObject({
      name: 'xLinear',
      type: 'linear',
      zero: false,
      domain: { data: 'histogram0_bins', fields: [HISTOGRAM_BIN_START, HISTOGRAM_BIN_END] },
    });
    expect(scales[1]).toMatchObject({
      name: 'yLinear',
      type: 'linear',
      nice: true,
      zero: true,
      domain: { data: 'histogram0_bins', fields: [HISTOGRAM_Y1] },
    });
  });

  test('adds the color key to the color scale', () => {
    const scales = setScales([{ name: COLOR_SCALE, type: 'ordinal' }], colorSplitHistogramOptions);
    expect(scales[0]).toHaveProperty('domain', { data: 'table', fields: ['series'] });
  });

  test('bins the y scale and adds a cell color scale for 2D histograms', () => {
    const scales = setScales([], histogram2DOptions);
    expect(scales[1]).toMatchObject({
      name: 'yLinear',
      nice: false,
      zero: false,
      domain: { data: 'histogram0_bins', fields: [HISTOGRAM_Y_BIN_START, HISTOGRAM_Y_BIN_END] },
    });
    expect(scales[2]).toStrictEqual(
      getHistogramCellColorScale(histogram2DOptions, 'histogram0_bins', 'sequentialCerulean9', 'light')
    );
  });
});

describe('getHistogramCellColorScale()', () => {
  test('maps count to the sequential scheme', () => {
    expect(
      getHistogramCellColorScale(histogram2DOptions, 'histogram0_bins', HISTOGRAM_CELL_COLOR_SCHEME, 'dark')
    ).toStrictEqual({
      name: 'histogram0_cellColor',
      type: 'linear',
      range: getColorSchemeColors(HISTOGRAM_CELL_COLOR_SCHEME, 'dark'),
      domain: { data: 'histogram0_bins', field: 'count' },
      zero: true,
    });
  });
});

describe('buildSpec() with a histogram', () => {
  test('builds the histogram mark and keeps its scales', () => {
    const spec = buildSpec({ marks: [{ markType: 'histogram' }] });
    expect(spec.marks?.map(({ name }) => name)).toContain('histogram0_group');
    expect(spec.scales?.map(({ name }) => name)).toEqual(expect.arrayContaining(['xLinear', 'yLinear']));
  });

  test('counts histograms separately', () => {
    const spec = buildSpec({ marks: [{ markType: 'histogram' }, { markType: 'histogram' }] });
    expect(spec.marks?.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['histogram0_group', 'histogram1_group'])
    );
  });
});

describe('horizontal histograms', () => {
  test('bin on y and measure on x', () => {
    const scales = setScales([], { ...defaultHistogramOptions, orientation: 'horizontal' });
    expect(scales.find(({ name }) => name === 'yLinear')).toMatchObject({
      zero: false,
      domain: { data: 'histogram0_bins', fields: [HISTOGRAM_BIN_START, HISTOGRAM_BIN_END] },
    });
    expect(scales.find(({ name }) => name === 'xLinear')).toMatchObject({ nice: true, zero: true });
  });

  test('mark the chart as horizontal for the axes', () => {
    const spec = addHistogram(initializeSpec(), { markType: 'histogram', idKey: MARK_ID, orientation: 'horizontal' });
    expect(spec.usermeta?.chartOrientation).toBe('horizontal');
  });
});

describe('getHistogramValueDomain()', () => {
  test('includes the density curve', () => {
    expect(getHistogramValueDomain({ ...defaultHistogramOptions, densityCurve: true })).toStrictEqual({
      fields: [
        { data: 'histogram0_bins', field: HISTOGRAM_Y1 },
        { data: 'histogram0_curveData', field: 'rscHistogramCurveY' },
      ],
    });
  });
});

describe('getHistogramCellLegends()', () => {
  test('adds a gradient legend for 2D cells', () => {
    const legends = getHistogramCellLegends({ ...histogram2DOptions, cellLegendTitle: 'Count' });
    expect(legends).toHaveLength(1);
    expect(legends[0]).toMatchObject({ fill: 'histogram0_cellColor', type: 'gradient', title: 'Count' });
  });

  test('adds nothing for 1D histograms or when turned off', () => {
    expect(getHistogramCellLegends(defaultHistogramOptions)).toStrictEqual([]);
    expect(getHistogramCellLegends({ ...histogram2DOptions, cellLegend: false })).toStrictEqual([]);
  });

  test('uses the chosen cell colors', () => {
    const scales = setScales([], { ...histogram2DOptions, cellColors: 'sequentialMagma9' });
    expect(scales[2]).toHaveProperty('range', getColorSchemeColors('sequentialMagma9', 'light'));
  });
});
