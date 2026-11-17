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
import { Data, SourceData, View, changeset, expressionFunction, parse } from 'vega';

import {
  CHART_SIZE_FONT_SIZE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_TIME_DIMENSION,
  DIRECT_LABEL_FONT_WEIGHT,
  FILTERED_TABLE,
  MARK_ID,
  SERIES_ID,
  TABLE,
} from '@spectrum-charts/core-s2/constants';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { getHoverDeemphasisOpacitySignal } from '../marks/hoverAnimationUtils.js';
import { LineDirectLabelOptions, LineDirectLabelSpecOptions, LineSpecOptions } from '../types/index.js';
import {
  getLineDirectLabelData,
  getLineDirectLabelMarks,
  getLineDirectLabelSpecOptions,
} from './lineDirectLabelUtils.js';

const asArray = (val: unknown): string[] => val as string[];
const asSourceData = (data: Data): SourceData => data as SourceData;
const getTransforms = (data: Data) => asSourceData(data).transform ?? [];

const defaultLineOptions: LineSpecOptions = {
  chartActionBars: [],
  chartPopovers: [],
  chartInspects: [],
  color: DEFAULT_COLOR,
  colorScheme: DEFAULT_COLOR_SCHEME,
  dimension: DEFAULT_TIME_DIMENSION,
  forecasts: [],
  gradient: false,
  hasOnClick: false,
  hasOnContextMenu: false,
  idKey: MARK_ID,
  index: 0,
  interactiveMarkName: undefined,
  lineDirectLabels: [],
  linePointAnnotations: [],
  lineType: { value: 'solid' },
  markType: 'line',
  metric: DEFAULT_METRIC,
  metricRanges: [],
  name: 'line0',
  opacity: { value: 1 },
  popoverMarkName: undefined,
  scaleType: 'time',
  trendlines: [],
  lineCap: 'round',
  interpolate: undefined,
  dimensionHover: false,
  showHoverLabel: true,
};

const defaultLabelSpecOptions: LineDirectLabelSpecOptions = {
  color: DEFAULT_COLOR,
  colorScheme: DEFAULT_COLOR_SCHEME,
  dimension: DEFAULT_TIME_DIMENSION,
  excludeSeries: [],
  format: '',
  index: 0,
  lineName: 'line0',
  metric: DEFAULT_METRIC,
  position: 'end',
  prefix: '',
  scaleType: 'time',
  value: 'last',
  fontSize: undefined,
};

describe('field-based direct label rendering', () => {
  async function draw(
    data: Record<string, unknown>[],
    labelOptions: LineDirectLabelOptions = {},
    forecasts: LineSpecOptions['forecasts'] = []
  ) {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', () => 360);
    const spec = buildSpec({
      animations: false,
      data,
      marks: [
        {
          markType: 'line',
          name: 'line0',
          dimension: 'x',
          scaleType: 'linear',
          color: 'series',
          forecasts,
          lineDirectLabels: [{ textKey: 'label', ...labelOptions }],
        },
      ],
    });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data.');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(360).height(216);
    await view.runAsync();
    return view;
  }

  test('uses the last finite metric point, preserving zero/negative values and excluding all-missing series', async () => {
    const view = await draw([
      { x: 2, value: 0, series: 'A', label: 'A: zero' },
      { x: 3, value: null, series: 'A', label: 'not drawable' },
      { x: 1, value: -2, series: 'A', label: 'A: negative' },
      { x: 3, value: null, series: 'B', label: 'missing' },
    ]);
    try {
      expect(view.data('line0DirectLabel0_data').map((d) => d.directLabel_text)).toEqual(['A: zero']);
    } finally {
      view.finalize();
    }
  });

  test('reads the first finite point for start labels', async () => {
    const view = await draw(
      [
        { x: 0, value: null, series: 'A', label: 'missing' },
        { x: 1, value: -2, series: 'A', label: 'A: negative' },
        { x: 2, value: 0, series: 'A', label: 'A: zero' },
      ],
      { position: 'start' }
    );
    try {
      expect(view.data('line0DirectLabel0_data')[0].directLabel_text).toBe('A: negative');
    } finally {
      view.finalize();
    }
  });

  test.each([undefined, '', 42])(
    'omits missing/invalid endpoint text (%s) instead of relabeling an earlier value',
    async (label) => {
      const view = await draw([
        { x: 1, value: 1, series: 'A', label: 'old label' },
        { x: 2, value: 2, series: 'A', label },
      ]);
      try {
        expect(view.data('line0DirectLabel0_data')).toEqual([]);
      } finally {
        view.finalize();
      }
    }
  );

  test('overrides value/format, retains prefixes, and safely reads literal field names', async () => {
    const textKey = 'quoted".label';
    const view = await draw([{ x: 1, value: 10, series: 'A', [textKey]: 'Revenue: $1,234.50' }], {
      textKey,
      value: 'average',
      format: 'not-a-format',
      prefix: 'Last',
    });
    try {
      const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
      expect(svg.querySelector('.line0DirectLabel0 text')?.textContent).toBe('Last Revenue: $1,234.50');
    } finally {
      view.finalize();
    }
  });

  test('respects excluded and controlled hidden series', async () => {
    const view = await draw(
      ['A', 'B', 'C'].flatMap((series) => [1, 2].map((x) => ({ x, value: x, series, label: `${series}: ${x}` }))),
      { excludeSeries: ['C'] }
    );
    try {
      await view.signal('hiddenSeries', ['B']).runAsync();
      expect(view.data('line0DirectLabel0_data').map((d) => d.directLabel_text)).toEqual(['A: 2']);
    } finally {
      view.finalize();
    }
  });

  test('uses the forecast effective metric at the endpoint', async () => {
    const view = await draw(
      [
        { x: 1, value: 10, series: 'A', label: 'Actual: 10' },
        { x: 2, value: null, prediction: 20, series: 'A', label: 'Forecast: 20' },
      ],
      {},
      [{ metric: 'prediction', start: 2 }]
    );
    try {
      expect(view.data('line0DirectLabel0_data')[0].directLabel_text).toBe('Forecast: 20');
    } finally {
      view.finalize();
    }
  });

  test('updates text in place and constrains narrow-chart text without invalid SVG geometry', async () => {
    const view = await draw([{ x: 1, value: 10, series: 'A', label: 'Old' }]);
    try {
      await view.change(TABLE, changeset().modify(view.data(TABLE)[0], 'label', 'New')).runAsync();
      await view.width(140).resize().runAsync();
      const svg = await view.toSVG();
      expect(svg).not.toMatch(/NaN|undefined/);
      expect(
        new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('.line0DirectLabel0 text')?.textContent
      ).toBe('New');
      const longText = 'A very long synthetic series name '.repeat(12);
      await view.change(TABLE, changeset().modify(view.data(TABLE)[0], 'label', longText)).runAsync();
      const longLabel = new DOMParser()
        .parseFromString(await view.toSVG(), 'image/svg+xml')
        .querySelector('.line0DirectLabel0 text');
      if (!longLabel?.textContent) throw new Error('Expected a rendered, truncated direct label.');
      expect(longLabel.textContent.length).toBeLessThan(longText.length);
      expect(longLabel.textContent).toMatch(/\u2026$/);
    } finally {
      view.finalize();
    }
  });
});

describe('getLineDirectLabelSpecOptions', () => {
  test('applies defaults when no options provided', () => {
    const result = getLineDirectLabelSpecOptions({}, 0, defaultLineOptions);
    expect(result).toEqual(defaultLabelSpecOptions);
  });

  test('preserves user-provided values', () => {
    const labelOptions: LineDirectLabelOptions = {
      value: 'average',
      textKey: 'label',
      format: ',.0f',
      prefix: '$',
      excludeSeries: ['seriesA'],
    };
    const result = getLineDirectLabelSpecOptions(labelOptions, 2, defaultLineOptions);
    expect(result).toEqual({
      ...defaultLabelSpecOptions,
      value: 'average',
      textKey: 'label',
      format: ',.0f',
      prefix: '$',
      excludeSeries: ['seriesA'],
      index: 2,
    });
  });

  test('inherits color, dimension, metric, scaleType from line options', () => {
    const lineOptions: LineSpecOptions = {
      ...defaultLineOptions,
      color: 'category',
      dimension: 'date',
      metric: 'revenue',
      scaleType: 'linear',
      name: 'myLine',
    };
    const result = getLineDirectLabelSpecOptions({}, 0, lineOptions);
    expect(result.color).toBe('category');
    expect(result.dimension).toBe('date');
    expect(result.metric).toBe('revenue');
    expect(result.scaleType).toBe('linear');
    expect(result.lineName).toBe('myLine');
  });

  test('defaults position to end', () => {
    const result = getLineDirectLabelSpecOptions({}, 0, defaultLineOptions);
    expect(result.position).toBe('end');
  });

  test('preserves position=start', () => {
    const result = getLineDirectLabelSpecOptions({ position: 'start' }, 0, defaultLineOptions);
    expect(result.position).toBe('start');
  });

  test('defaults fontSize to undefined', () => {
    const result = getLineDirectLabelSpecOptions({}, 0, defaultLineOptions);
    expect(result.fontSize).toBeUndefined();
  });

  test('passes through explicit fontSize', () => {
    const result = getLineDirectLabelSpecOptions({ fontSize: 18 }, 0, defaultLineOptions);
    expect(result.fontSize).toBe(18);
  });
});

describe('getLineDirectLabelData', () => {
  test('creates data source from FILTERED_TABLE', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    expect(data.name).toBe('line0DirectLabel0_data');
    expect(asSourceData(data).source).toBe(FILTERED_TABLE);
  });

  test('filters to max dimension for value=last', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const joinagg = transforms.find(
      (t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('_extremeDim')
    );
    expect(joinagg).toBeDefined();
    expect(joinagg).toHaveProperty('ops', ['max']);
  });

  test('includes mean aggregate for value=average', () => {
    const opts = { ...defaultLabelSpecOptions, value: 'average' as const };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const meanAgg = transforms.find(
      (t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('directLabel_avg')
    );
    expect(meanAgg).toBeDefined();
    expect(meanAgg).toHaveProperty('ops', ['mean']);
  });

  test('does not include mean aggregate for non-average values', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const meanAgg = transforms.find(
      (t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('directLabel_avg')
    );
    expect(meanAgg).toBeUndefined();
  });

  test('adds excludeSeries filter as inline literal', () => {
    const opts = { ...defaultLabelSpecOptions, excludeSeries: ['seriesA', 'seriesB'] };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const excludeFilter = transforms.find((t) => t.type === 'filter' && 'expr' in t && t.expr.includes('indexof'));
    expect(excludeFilter).toBeDefined();
    expect((excludeFilter as { expr: string }).expr).toBe(`indexof(["seriesA","seriesB"], datum.${SERIES_ID}) === -1`);
  });

  test('omits excludeSeries filter when empty', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const excludeFilter = transforms.find((t) => t.type === 'filter' && 'expr' in t && t.expr.includes('indexof'));
    expect(excludeFilter).toBeUndefined();
  });

  test('includes rank window transform', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const rankWindow = transforms.find(
      (t) => t.type === 'window' && 'as' in t && asArray(t.as).includes('_metricRank')
    );
    expect(rankWindow).toBeDefined();
  });

  test('includes _scaledY formula transform', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === '_scaledY');
    expect(formula).toBeDefined();
    expect((formula as { expr: string }).expr).toContain(`scale('yLinear', datum["${DEFAULT_METRIC}"])`);
  });

  test('includes _adjustedY formula transform', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === '_adjustedY');
    expect(formula).toBeDefined();
    expect((formula as { expr: string }).expr).toBe('datum._scaledY - datum._metricRank * rscChartSizeLabelGap');
  });

  test('includes _cumMaxAdjusted cumulative window transform', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const window = transforms.find(
      (t) => t.type === 'window' && 'as' in t && asArray(t.as).includes('_cumMaxAdjusted')
    );
    expect(window).toBeDefined();
    expect(window).toHaveProperty('ops', ['max']);
    expect(window).toHaveProperty('fields', ['_adjustedY']);
  });

  test('uses line name and index in data name', () => {
    const opts = { ...defaultLabelSpecOptions, index: 3 };
    const data = getLineDirectLabelData('myLine', opts, defaultLineOptions);
    expect(data.name).toBe('myLineDirectLabel3_data');
  });

  test('generates formula with default number format for last', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
    expect(formula).toBeDefined();
    expect((formula as { expr: string }).expr).toBe(`format(datum["${DEFAULT_METRIC}"], ",.2~f")`);
  });

  test('generates formula for series value', () => {
    const opts: LineDirectLabelSpecOptions = { ...defaultLabelSpecOptions, value: 'series', color: 'category' };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
    expect((formula as { expr: string }).expr).toBe('datum["category"]');
  });

  test('uses custom format when provided', () => {
    const opts = { ...defaultLabelSpecOptions, format: ',.0f' };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
    expect((formula as { expr: string }).expr).toBe(`format(datum["${DEFAULT_METRIC}"], ",.0f")`);
  });

  test('generates formula for average value with default format', () => {
    const opts = { ...defaultLabelSpecOptions, value: 'average' as const };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
    expect((formula as { expr: string }).expr).toBe('format(datum.directLabel_avg, ",.2~f")');
  });

  test('generates empty string for series value when color is not a string', () => {
    const opts: LineDirectLabelSpecOptions = {
      ...defaultLabelSpecOptions,
      value: 'series',
      color: { value: 'blue' },
    };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
    expect((formula as { expr: string }).expr).toBe("''");
  });

  test('escapes quotes in format string', () => {
    const opts = { ...defaultLabelSpecOptions, format: '$"0.0"' };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
    expect((formula as { expr: string }).expr).toContain('\\"');
  });

  test('escapes quotes and backslashes so the generated expression stays a single well-formed call', () => {
    const maliciousFormat = '.1f\\"'; // ends with a literal backslash followed by a quote
    const opts = { ...defaultLabelSpecOptions, format: maliciousFormat };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const formula = transforms.find((t) => t.type === 'formula' && 'as' in t && t.as === 'directLabel_text');
    const { expr } = formula as { expr: string };
    const match = expr.match(/^format\(datum\["[^"]*"\], "(.*)"\)$/);
    expect(match).not.toBeNull();
    const [, escapedSpec] = match as RegExpMatchArray;
    expect(JSON.parse(`"${escapedSpec}"`)).toEqual(maliciousFormat);
  });

  test('includes dimension filter expression', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const filter = transforms.find((t) => t.type === 'filter' && 'expr' in t && t.expr.includes('_extremeDim'));
    expect(filter).toBeDefined();
    expect((filter as { expr: string }).expr).toBe('datum["datetime0"] === datum._extremeDim');
  });

  test('filters to min dimension for position=start', () => {
    const opts = { ...defaultLabelSpecOptions, position: 'start' as const };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const joinagg = transforms.find(
      (t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('_extremeDim')
    );
    expect(joinagg).toHaveProperty('ops', ['min']);
  });

  test('filters to max dimension for position=end', () => {
    const opts = { ...defaultLabelSpecOptions, position: 'end' as const };
    const data = getLineDirectLabelData('line0', opts, defaultLineOptions);
    const transforms = getTransforms(data);
    const joinagg = transforms.find(
      (t) => t.type === 'joinaggregate' && 'as' in t && asArray(t.as).includes('_extremeDim')
    );
    expect(joinagg).toHaveProperty('ops', ['max']);
  });

  test('adds primarySeries filter when lineOptions.primarySeries is set', () => {
    const lineOptsWithPrimary: LineSpecOptions = { ...defaultLineOptions, primarySeries: ['series1', 'series2'] };
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, lineOptsWithPrimary);
    const transforms = getTransforms(data);
    const primaryFilter = transforms.find(
      (t) => t.type === 'filter' && 'expr' in t && (t as { expr: string }).expr.startsWith('!(')
    );
    expect(primaryFilter).toBeDefined();
    expect((primaryFilter as { expr: string }).expr).toContain('["series1","series2"]');
  });

  test('omits primarySeries filter when lineOptions.primarySeries is not set', () => {
    const data = getLineDirectLabelData('line0', defaultLabelSpecOptions, defaultLineOptions);
    const transforms = getTransforms(data);
    const primaryFilter = transforms.find(
      (t) => t.type === 'filter' && 'expr' in t && (t as { expr: string }).expr.startsWith('!(')
    );
    expect(primaryFilter).toBeUndefined();
  });
});

describe('getLineDirectLabelMarks', () => {
  test('returns two marks (background halo + foreground)', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks).toHaveLength(2);
    expect(marks[0].type).toBe('text');
    expect(marks[1].type).toBe('text');
  });

  test('background mark has stroke and background-color fill', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    const bgMark = marks[0];
    const stroke = bgMark.encode?.enter?.stroke as { value: string };
    expect(bgMark.encode?.enter).toHaveProperty('strokeWidth', { value: 4 });
    expect(bgMark.encode?.enter?.fill).toEqual(bgMark.encode?.enter?.stroke);
    expect(stroke?.value).toBeTruthy();
  });

  test('foreground mark has color fill', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    const mainMark = marks[1];
    expect(mainMark.encode?.update).toHaveProperty('fill');
    expect(mainMark.encode?.update?.fill).not.toEqual({ value: 'transparent' });
  });

  test('marks are non-interactive', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].interactive).toBe(false);
    expect(marks[1].interactive).toBe(false);
  });

  test('marks have correct names using lineName and index', () => {
    const opts = { ...defaultLabelSpecOptions, index: 2 };
    const marks = getLineDirectLabelMarks('myLine', opts, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].name).toBe('myLineDirectLabel2_bg');
    expect(marks[1].name).toBe('myLineDirectLabel2');
  });

  test('x is anchored to chart width', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].encode?.update?.x).toEqual({ signal: 'width' });
  });

  test('text is right-aligned', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].encode?.enter?.align).toEqual({ value: 'right' });
  });

  describe('y offset signal evaluation', () => {
    const evalOffsetSignal = (datum: Record<string, number>): number => {
      const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
      const signal = (marks[0].encode?.update?.y as { offset: { signal: string } }).offset.signal;
      // rscChartSizeLabelGap is a Vega signal; inject its M-tier value (12) for unit evaluation
      return new Function('datum', 'rscChartSizeLabelGap', `return ${signal}`)(datum, 12);
    };

    test('rank 1 always places label 12px above the line terminus', () => {
      // cumMaxAdjusted = _scaledY - 1*12 for rank 1
      // offset = (100 - 12) + 1*12 - 12 - 100 = -12
      expect(evalOffsetSignal({ _metricRank: 1, _scaledY: 100, _cumMaxAdjusted: 88 })).toBe(-12);
    });

    test('rank 2 well-separated from rank 1: also placed 12px above', () => {
      // rank2 adjustedY (200 - 24 = 176) > rank1 adjustedY, so cumMaxAdjusted = 176
      // offset = 176 + 2*12 - 12 - 200 = -12
      expect(evalOffsetSignal({ _metricRank: 2, _scaledY: 200, _cumMaxAdjusted: 176 })).toBe(-12);
    });

    test('rank 2 close to rank 1: pushed above natural position to avoid overlap', () => {
      // rank1 adjustedY (100 - 12 = 88) > rank2 adjustedY (108 - 24 = 84), so cumMaxAdjusted = 88
      // offset = 88 + 2*12 - 12 - 108 = -8 (less negative than -12, meaning pushed further up)
      expect(evalOffsetSignal({ _metricRank: 2, _scaledY: 108, _cumMaxAdjusted: 88 })).toBe(-8);
    });

    test('rank 3 very close to preceding labels: stacked exactly MIN_LABEL_GAP below rank 2', () => {
      // rank1 adjustedY (100 - 12 = 88) dominates cumMaxAdjusted for all three
      // offset = 88 + 3*12 - 12 - 112 = 0 (at line terminus, pushed down from natural -12)
      expect(evalOffsetSignal({ _metricRank: 3, _scaledY: 112, _cumMaxAdjusted: 88 })).toBe(0);
    });

    test('y field is the metric', () => {
      const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
      const y = marks[0].encode?.update?.y as { field: string };
      expect(y.field).toBe(DEFAULT_METRIC);
    });
  });

  test('uses metricAxis for y scale when provided', () => {
    const lineOpts = { ...defaultLineOptions, metricAxis: 'yCustom' };
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, lineOpts, 'gray-50', 'light');
    const y = marks[0].encode?.update?.y as { scale: string };
    expect(y.scale).toBe('yCustom');
  });

  test('defaults to yLinear when no metricAxis', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    const y = marks[0].encode?.update?.y as { scale: string };
    expect(y.scale).toBe('yLinear');
  });

  test('background mark opacity is always 1 (never dimmed during hover)', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].encode?.update).toHaveProperty('opacity', { value: 1 });
  });

  test('foreground mark has opacity rules for hover dimming', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks[1].encode?.update).toHaveProperty('opacity');
  });

  test('foreground mark uses the animated deemphasis-ramp signal when isHoverAnimate is true, background stays opaque', () => {
    const lineOpts = { ...defaultLineOptions, interactiveMarkName: 'line0', isHoverAnimate: true };
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, lineOpts, 'gray-50', 'light');
    expect(marks[1].encode?.update).toHaveProperty('opacity', {
      signal: getHoverDeemphasisOpacitySignal('line0'),
    });
    expect(marks[0].encode?.update).toHaveProperty('opacity', { value: 1 });
  });

  test('both marks have fixed fontWeight from DIRECT_LABEL_FONT_WEIGHT', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].encode?.update).toHaveProperty('fontWeight', { value: DIRECT_LABEL_FONT_WEIGHT });
    expect(marks[1].encode?.update).toHaveProperty('fontWeight', { value: DIRECT_LABEL_FONT_WEIGHT });
  });

  test('both marks use fontSize signal when fontSize is not set', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].encode?.update).toHaveProperty('fontSize', { signal: CHART_SIZE_FONT_SIZE });
    expect(marks[1].encode?.update).toHaveProperty('fontSize', { signal: CHART_SIZE_FONT_SIZE });
  });

  test('explicit fontSize overrides the signal', () => {
    const opts = { ...defaultLabelSpecOptions, fontSize: 20 };
    const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].encode?.update).toHaveProperty('fontSize', { value: 20 });
    expect(marks[1].encode?.update).toHaveProperty('fontSize', { value: 20 });
  });

  test('adds prefix to text expression', () => {
    const opts = { ...defaultLabelSpecOptions, prefix: '$' };
    const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
    const textSignal = (marks[1].encode?.update?.text as { signal: string }).signal;
    expect(textSignal).toContain("'$ '");
  });

  test('resolves transparent background to spectrum background (gray-25)', () => {
    const lightMarks = getLineDirectLabelMarks(
      'line0',
      defaultLabelSpecOptions,
      defaultLineOptions,
      'transparent',
      'light'
    );
    const lightStroke = lightMarks[0].encode?.enter?.stroke as { value: string };
    expect(lightStroke.value).toBe('white'); // gray-25 in light
    const darkMarks = getLineDirectLabelMarks(
      'line0',
      defaultLabelSpecOptions,
      defaultLineOptions,
      'transparent',
      'dark'
    );
    const darkStroke = darkMarks[0].encode?.enter?.stroke as { value: string };
    expect(darkStroke.value).toBe('#111111'); // gray-25 in dark
  });

  test('resolves undefined background to spectrum background', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, undefined, 'light');
    const bgStroke = marks[0].encode?.enter?.stroke as { value: string };
    expect(bgStroke.value).toBe('white');
  });

  test('uses provided backgroundColor when not transparent or undefined', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'blue-100', 'light');
    const bgStroke = marks[0].encode?.enter?.stroke as { value: string };
    expect(bgStroke.value).toBeTruthy();
  });

  test('resolves background color with dark color scheme', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'dark');
    const bgStroke = marks[0].encode?.enter?.stroke as { value: string };
    expect(bgStroke.value).toBeTruthy();
  });

  test('text expression has no prefix when prefix is empty string', () => {
    const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
    const textSignal = (marks[0].encode?.update?.text as { signal: string }).signal;
    expect(textSignal).toBe('datum.directLabel_text');
  });

  test('text expression has no prefix when prefix is undefined (uses default)', () => {
    const opts = { ...defaultLabelSpecOptions, prefix: undefined };
    const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
    const textSignal = (marks[0].encode?.update?.text as { signal: string }).signal;
    expect(textSignal).toBe('datum.directLabel_text');
  });

  test('escapes single quotes in prefix', () => {
    const opts = { ...defaultLabelSpecOptions, prefix: "it's" };
    const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
    const textSignal = (marks[0].encode?.update?.text as { signal: string }).signal;
    expect(textSignal).toContain(String.raw`it\'s`);
  });

  test('marks reference correct data source', () => {
    const opts = { ...defaultLabelSpecOptions, index: 1 };
    const marks = getLineDirectLabelMarks('line0', opts, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].from).toEqual({ data: 'line0DirectLabel1_data' });
    expect(marks[1].from).toEqual({ data: 'line0DirectLabel1_data' });
  });

  describe('with fgOpacityRules', () => {
    const fgRules = [{ value: 1 as number }, { value: 0 as number }];

    test('returns two marks with _fg suffix when fgOpacityRules is provided', () => {
      const marks = getLineDirectLabelMarks(
        'line0',
        defaultLabelSpecOptions,
        defaultLineOptions,
        'gray-50',
        'light',
        fgRules
      );
      expect(marks).toHaveLength(2);
      expect(marks[0].name).toBe('line0DirectLabel0_bg_fg');
      expect(marks[1].name).toBe('line0DirectLabel0_fg');
    });

    test('fg marks use the provided fgOpacityRules for opacity', () => {
      const marks = getLineDirectLabelMarks(
        'line0',
        defaultLabelSpecOptions,
        defaultLineOptions,
        'gray-50',
        'light',
        fgRules
      );
      const fgMark = marks[1] as { encode: { update: { opacity: unknown } } };
      expect(fgMark.encode.update.opacity).toEqual(fgRules);
    });

    test('fg marks preserve other encoding from base marks', () => {
      const marks = getLineDirectLabelMarks(
        'line0',
        defaultLabelSpecOptions,
        defaultLineOptions,
        'gray-50',
        'light',
        fgRules
      );
      expect(marks[0].type).toBe('text');
      expect(marks[1].type).toBe('text');
      expect(marks[0].interactive).toBe(false);
    });
  });

  test('both marks have matching encoding for position=start', () => {
    const startOpts = { ...defaultLabelSpecOptions, position: 'start' as const };
    const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
    expect(marks[0].encode?.update?.x).toEqual({ value: 0 });
    expect(marks[1].encode?.update?.x).toEqual({ value: 0 });
    expect(marks[0].encode?.enter?.align).toEqual({ value: 'left' });
    expect(marks[1].encode?.enter?.align).toEqual({ value: 'left' });
  });

  describe('position=start', () => {
    const startOpts = { ...defaultLabelSpecOptions, position: 'start' as const };

    test('x is anchored to 0', () => {
      const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
      expect(marks[0].encode?.update?.x).toEqual({ value: 0 });
    });

    test('text is left-aligned', () => {
      const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
      expect(marks[0].encode?.enter?.align).toEqual({ value: 'left' });
    });

    test('limit is space from left edge to data point', () => {
      const marks = getLineDirectLabelMarks('line0', startOpts, defaultLineOptions, 'gray-50', 'light');
      const limit = marks[0].encode?.update?.limit as { signal: string };
      expect(limit.signal).toContain("scale('xTime'");
      expect(limit.signal).not.toContain('width -');
    });
  });

  describe('position=end', () => {
    test('x is anchored to chart width', () => {
      const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
      expect(marks[0].encode?.update?.x).toEqual({ signal: 'width' });
    });

    test('text is right-aligned', () => {
      const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
      expect(marks[0].encode?.enter?.align).toEqual({ value: 'right' });
    });

    test('limit is space from data point to right edge', () => {
      const marks = getLineDirectLabelMarks('line0', defaultLabelSpecOptions, defaultLineOptions, 'gray-50', 'light');
      const limit = marks[0].encode?.update?.limit as { signal: string };
      expect(limit.signal).toContain('width -');
    });
  });
});
