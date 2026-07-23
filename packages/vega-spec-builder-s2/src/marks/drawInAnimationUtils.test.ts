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
import { Data, Signal, SourceData, Transforms } from 'vega';

import {
  ANIMATION_THROTTLE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DRAW_IN_ANIMATION_DURATION_MS,
  FILTERED_TABLE,
  LAST_RSC_SERIES_ID,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { defaultLineMarkOptions, defaultLineOptions } from '../line/lineTestUtils';
import { LineSpecOptions } from '../types';
import {
  addDrawInClockSignals,
  addLineDrawInAnimationSignals,
  addLineDrawInLeadTransform,
  addLineDrawInTimeMsTransform,
  getDualAxisDrawInRule,
  getLineDrawInData,
  getLineDrawInDataSourceName,
  getLineDrawInPointIndexData,
  getLineDrawInSortField,
  getLineDrawInXEncoding,
  getLineDrawInYEncoding,
} from './drawInAnimationUtils';

describe('getLineDrawInSortField()', () => {
  test('returns the numeric-ms field for time scales', () => {
    expect(getLineDrawInSortField('time', 'datetime', 'line0')).toEqual('rscDrawInTimeMs');
  });

  test('returns a name-scoped ordinal index field for point scales', () => {
    expect(getLineDrawInSortField('point', 'category', 'line0')).toEqual('line0_drawInPointIndex');
  });

  test('returns the dimension field itself for linear scales', () => {
    expect(getLineDrawInSortField('linear', 'x', 'line0')).toEqual('x');
  });
});

describe('getLineDrawInDataSourceName()', () => {
  test('returns the name-scoped indexed source for point scales', () => {
    expect(getLineDrawInDataSourceName({ name: 'line0', scaleType: 'point' } as LineSpecOptions)).toEqual(
      'line0_drawInIndexed'
    );
  });

  test('returns filteredTable for non-point scales', () => {
    expect(getLineDrawInDataSourceName({ name: 'line0', scaleType: 'time' } as LineSpecOptions)).toEqual(
      FILTERED_TABLE
    );
    expect(getLineDrawInDataSourceName({ name: 'line0', scaleType: 'linear' } as LineSpecOptions)).toEqual(
      FILTERED_TABLE
    );
  });
});

describe('getLineDrawInPointIndexData()', () => {
  test('builds a formula source indexing each row within the x scale domain', () => {
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', dimension: 'category', scaleType: 'point' };
    expect(getLineDrawInPointIndexData(options)).toStrictEqual({
      name: 'line0_drawInIndexed',
      source: FILTERED_TABLE,
      transform: [
        {
          type: 'formula',
          as: 'line0_drawInPointIndex',
          expr: `indexof(domain('xPoint'), datum.category)`,
        },
      ],
    });
  });
});

describe('addLineDrawInTimeMsTransform()', () => {
  test('adds a formula transform converting the dimension to numeric ms', () => {
    const transforms: Transforms[] = [];
    expect(addLineDrawInTimeMsTransform(transforms, 'datetime')).toStrictEqual([
      { type: 'formula', expr: 'toNumber(datum.datetime)', as: 'rscDrawInTimeMs' },
    ]);
  });

  test('does not add a second transform when one already exists', () => {
    const transforms: Transforms[] = [{ type: 'formula', expr: 'toNumber(datum.datetime)', as: 'rscDrawInTimeMs' }];
    const result = addLineDrawInTimeMsTransform(transforms, 'datetime');
    expect(result).toHaveLength(1);
    expect(result).toBe(transforms);
  });
});

describe('addLineDrawInLeadTransform()', () => {
  test('adds a lead window transform keyed to the sort field for a time scale', () => {
    const sourceData: Data = { name: 'filteredTable' };
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', dimension: 'datetime', metric: 'value', scaleType: 'time' };
    addLineDrawInLeadTransform(sourceData, options);
    expect(sourceData.transform).toStrictEqual([
      {
        type: 'window',
        sort: { field: 'rscDrawInTimeMs', order: 'ascending' },
        groupby: [SERIES_ID],
        ops: ['lead', 'lead'],
        fields: ['rscDrawInTimeMs', 'value'],
        as: ['line0_drawInNextDimValue', 'line0_drawInNextMetricValue'],
      },
    ]);
  });

  test('also carries the next point real category value for point scales', () => {
    const sourceData: Data = { name: 'line0_drawInIndexed' };
    const options: LineSpecOptions = {
      ...defaultLineOptions,
      name: 'line0',
      dimension: 'category',
      metric: 'value',
      scaleType: 'point',
    };
    addLineDrawInLeadTransform(sourceData, options);
    expect(sourceData.transform).toStrictEqual([
      {
        type: 'window',
        sort: { field: 'line0_drawInPointIndex', order: 'ascending' },
        groupby: [SERIES_ID],
        ops: ['lead', 'lead', 'lead'],
        fields: ['line0_drawInPointIndex', 'category', 'value'],
        as: ['line0_drawInNextDimValue', 'line0_drawInNextCategoryValue', 'line0_drawInNextMetricValue'],
      },
    ]);
  });

  test('initializes transform when the source has none yet', () => {
    const sourceData: Data = { name: 'filteredTable' };
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', scaleType: 'time' };
    addLineDrawInLeadTransform(sourceData, options);
    expect(sourceData.transform).toHaveLength(1);
  });

  test('does not add a duplicate lead transform for the same mark', () => {
    const sourceData: Data = { name: 'filteredTable' };
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', scaleType: 'time' };
    addLineDrawInLeadTransform(sourceData, options);
    addLineDrawInLeadTransform(sourceData, options);
    expect(sourceData.transform).toHaveLength(1);
  });
});

describe('getLineDrawInData()', () => {
  test('builds prev/tip/lerp sources reading from filteredTable for a time scale', () => {
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', dimension: 'datetime', scaleType: 'time' };
    const [prevData, tipData, lerpData] = getLineDrawInData(options) as SourceData[];

    expect(prevData).toStrictEqual({
      name: 'line0_drawInPrev',
      source: FILTERED_TABLE,
      transform: [{ type: 'filter', expr: 'datum.rscDrawInTimeMs <= line0_drawInAnimCutoff' }],
    });

    expect(tipData).toStrictEqual({
      name: 'line0_drawInTip',
      source: FILTERED_TABLE,
      transform: [
        {
          type: 'filter',
          expr:
            'datum.rscDrawInTimeMs <= line0_drawInAnimCutoff && isValid(datum.line0_drawInNextDimValue) && datum.line0_drawInNextDimValue > line0_drawInAnimCutoff',
        },
        { type: 'formula', as: 'isDrawInTip', expr: 'true' },
      ],
    });

    expect(lerpData).toStrictEqual({
      name: 'line0_drawInLerp',
      source: ['line0_drawInPrev', 'line0_drawInTip'],
    });
  });

  test('reads from the name-scoped indexed source for a point scale', () => {
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', dimension: 'category', scaleType: 'point' };
    const [prevData, tipData] = getLineDrawInData(options) as SourceData[];
    expect(prevData.source).toEqual('line0_drawInIndexed');
    expect(tipData.source).toEqual('line0_drawInIndexed');
    expect(prevData.transform).toStrictEqual([
      { type: 'filter', expr: 'datum.line0_drawInPointIndex <= line0_drawInAnimCutoff' },
    ]);
  });
});

describe('addDrawInClockSignals()', () => {
  test('adds the shared mount-timer chain', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals);
    expect(signals).toStrictEqual([
      { name: 'drawInStart', update: 'now()' },
      {
        name: 'drawInAnimT',
        init: '0',
        on: [
          {
            events: { type: 'timer', throttle: ANIMATION_THROTTLE },
            update: `clamp((now() - drawInStart) / ${DRAW_IN_ANIMATION_DURATION_MS}, 0, 1)`,
          },
        ],
      },
      {
        name: 'drawInAnimTEased',
        update: 'drawInAnimT < 0.5 ? 2 * pow(drawInAnimT, 2) : 1 - pow(-2 * drawInAnimT + 2, 2) / 2',
      },
    ]);
  });

  test('does not add a second clock chain when one already exists', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals);
    addDrawInClockSignals(signals);
    expect(signals).toHaveLength(3);
  });

  test('eases 0 -> 0, 1 -> 1, and the midpoint -> 0.5', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals);
    const eased = signals.find((s) => s.name === 'drawInAnimTEased') as { update: string } | undefined;
    const evalEased = (t: number): number => {
      // eslint-disable-next-line no-new-func
      return new Function('drawInAnimT', 'pow', `return ${eased?.update};`)(t, Math.pow);
    };
    expect(evalEased(0)).toBe(0);
    expect(evalEased(1)).toBe(1);
    expect(evalEased(0.5)).toBeCloseTo(0.5);
  });
});

describe('addLineDrawInAnimationSignals()', () => {
  test('adds the clock chain plus a domain-min/max/cutoff triplet scoped to the scale, for a time scale', () => {
    const signals: Signal[] = [];
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', scaleType: 'time' };
    addLineDrawInAnimationSignals(signals, options);
    expect(signals.map((s) => s.name)).toEqual([
      'drawInStart',
      'drawInAnimT',
      'drawInAnimTEased',
      'line0_drawInDomainMin',
      'line0_drawInDomainMax',
      'line0_drawInAnimCutoff',
    ]);
    expect(signals.find((s) => s.name === 'line0_drawInDomainMin')).toStrictEqual({
      name: 'line0_drawInDomainMin',
      init: `toNumber(extent(domain('xTime'))[0])`,
    });
    expect(signals.find((s) => s.name === 'line0_drawInDomainMax')).toStrictEqual({
      name: 'line0_drawInDomainMax',
      init: `toNumber(extent(domain('xTime'))[1])`,
    });
    expect(signals.find((s) => s.name === 'line0_drawInAnimCutoff')).toStrictEqual({
      name: 'line0_drawInAnimCutoff',
      update: 'drawInAnimTEased * (line0_drawInDomainMax - line0_drawInDomainMin) + line0_drawInDomainMin',
    });
  });

  test('sweeps an ordinal index range instead of the domain values for a point scale', () => {
    const signals: Signal[] = [];
    const options: LineSpecOptions = { ...defaultLineOptions, name: 'line0', scaleType: 'point' };
    addLineDrawInAnimationSignals(signals, options);
    expect(signals.find((s) => s.name === 'line0_drawInDomainMin')).toStrictEqual({
      name: 'line0_drawInDomainMin',
      init: '0',
    });
    expect(signals.find((s) => s.name === 'line0_drawInDomainMax')).toStrictEqual({
      name: 'line0_drawInDomainMax',
      init: `length(domain('xPoint')) - 1`,
    });
  });

  test('shares one clock chain across marks but gives each mark its own domain/cutoff signals', () => {
    const signals: Signal[] = [];
    addLineDrawInAnimationSignals(signals, { ...defaultLineOptions, name: 'line0', scaleType: 'time' });
    addLineDrawInAnimationSignals(signals, { ...defaultLineOptions, name: 'line1', scaleType: 'time' });
    expect(signals.filter((s) => s.name === 'drawInStart')).toHaveLength(1);
    expect(signals.filter((s) => s.name === 'drawInAnimT')).toHaveLength(1);
    expect(signals.filter((s) => s.name === 'drawInAnimTEased')).toHaveLength(1);
    expect(signals.filter((s) => s.name === 'line0_drawInAnimCutoff')).toHaveLength(1);
    expect(signals.filter((s) => s.name === 'line1_drawInAnimCutoff')).toHaveLength(1);
  });
});

describe('getDualAxisDrawInRule()', () => {
  test('branches onto the secondary scale for the last series and the primary scale otherwise', () => {
    const buildExpr = (scaleName: string) => `EXPR(${scaleName})`;
    expect(getDualAxisDrawInRule('yLinear', buildExpr)).toStrictEqual([
      { test: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`, signal: 'EXPR(yLinearSecondary)' },
      { signal: 'EXPR(yLinearPrimary)' },
    ]);
  });
});

describe('getLineDrawInXEncoding()', () => {
  test('lerps the flagged tip point toward its lead position for a time scale', () => {
    const result = getLineDrawInXEncoding({ ...defaultLineMarkOptions, name: 'line0', dimension: 'datetime', scaleType: 'time' });
    const currentPos = `scale('xTime', datum.${DEFAULT_TRANSFORMED_TIME_DIMENSION})`;
    const nextPos = `scale('xTime', datum.line0_drawInNextDimValue)`;
    const tween =
      'clamp((line0_drawInAnimCutoff - datum.rscDrawInTimeMs) / (datum.line0_drawInNextDimValue - datum.rscDrawInTimeMs), 0, 1)';
    expect(result).toStrictEqual({
      signal: `isValid(datum.isDrawInTip) ? lerp([${currentPos}, ${nextPos}], ${tween}) : ${currentPos}`,
    });
  });

  test('looks up the lead position via the real category value for a point scale', () => {
    const result = getLineDrawInXEncoding({ ...defaultLineMarkOptions, name: 'line0', dimension: 'category', scaleType: 'point' });
    const currentPos = `scale('xPoint', datum.category)`;
    const nextPos = `scale('xPoint', datum.line0_drawInNextCategoryValue)`;
    const tween =
      'clamp((line0_drawInAnimCutoff - datum.line0_drawInPointIndex) / (datum.line0_drawInNextDimValue - datum.line0_drawInPointIndex), 0, 1)';
    expect(result).toStrictEqual({
      signal: `isValid(datum.isDrawInTip) ? lerp([${currentPos}, ${nextPos}], ${tween}) : ${currentPos}`,
    });
  });
});

describe('getLineDrawInYEncoding()', () => {
  test('returns a single production rule against yLinear when there is no dual metric axis', () => {
    const result = getLineDrawInYEncoding({ ...defaultLineMarkOptions, name: 'line0', metric: 'value', scaleType: 'time' });
    const currentPos = `scale('yLinear', datum.value)`;
    const nextPos = `scale('yLinear', datum.line0_drawInNextMetricValue)`;
    expect(result).toStrictEqual({
      signal: `isValid(datum.isDrawInTip) ? lerp([${currentPos}, ${nextPos}], clamp((line0_drawInAnimCutoff - datum.rscDrawInTimeMs) / (datum.line0_drawInNextDimValue - datum.rscDrawInTimeMs), 0, 1)) : ${currentPos}`,
    });
  });

  test('honors a custom metricAxis name when not a dual axis', () => {
    const result = getLineDrawInYEncoding({
      ...defaultLineMarkOptions,
      name: 'line0',
      metric: 'value',
      scaleType: 'time',
      metricAxis: 'customAxis',
    });
    expect(result).toStrictEqual({
      signal: expect.stringContaining(`scale('customAxis', datum.value)`),
    });
  });

  test('branches per series onto the primary/secondary scale when dualMetricAxis is set', () => {
    const result = getLineDrawInYEncoding({
      ...defaultLineMarkOptions,
      name: 'line0',
      metric: 'value',
      scaleType: 'time',
      dualMetricAxis: true,
    });
    expect(Array.isArray(result)).toBe(true);
    const rules = result as { test?: string; signal: string }[];
    expect(rules).toHaveLength(2);
    expect(rules[0].test).toEqual(`datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`);
    expect(rules[0].signal).toContain(`scale('yLinearSecondary', datum.value)`);
    expect(rules[1].signal).toContain(`scale('yLinearPrimary', datum.value)`);
  });
});
