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
import { FILTERED_TABLE } from '@spectrum-charts/constants';

import { initializeSpec } from '../specUtils';
import { addData, addGauge, addMarks, addSignals, setScales } from './gaugeSpecBuilder';
import { defaultGaugeOptions } from './gaugeTestUtils';

describe('addData', () => {
  test('should isolate the last row for method: last', () => {
    const data = addData(initializeSpec().data ?? [], defaultGaugeOptions);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('testName');
    expect(data[0]).toHaveProperty('source', FILTERED_TABLE);
    expect(data[0].transform).toHaveLength(4);
    expect(data[0].transform?.[0]).toHaveProperty('type', 'window');
    expect(data[0].transform?.[1]).toHaveProperty('type', 'joinaggregate');
    expect(data[0].transform?.[2]).toHaveProperty('type', 'filter');
    expect(data[0].transform?.[3]).toHaveProperty('as', 'testName_valueAngle');
  });

  test('should aggregate with mean for method: avg', () => {
    const data = addData(initializeSpec().data ?? [], { ...defaultGaugeOptions, method: 'avg' });
    expect(data[0].transform).toHaveLength(2);
    expect(data[0].transform?.[0]).toHaveProperty('type', 'aggregate');
    expect(data[0].transform?.[0]).toHaveProperty('ops', ['mean']);
  });

  test('should aggregate with sum for method: sum', () => {
    const data = addData(initializeSpec().data ?? [], { ...defaultGaugeOptions, method: 'sum' });
    expect(data[0].transform).toHaveLength(2);
    expect(data[0].transform?.[0]).toHaveProperty('type', 'aggregate');
    expect(data[0].transform?.[0]).toHaveProperty('ops', ['sum']);
  });
});

describe('addSignals()', () => {
  test('should add gauge geometry signals derived from width/height, not an input size', () => {
    const signals = addSignals([], defaultGaugeOptions);
    expect(signals.map((s) => s.name)).toEqual([
      'testName_cx',
      'testName_cy',
      'testName_radius',
      'testName_innerRadius',
      'testName_totalAngle',
      'testName_startAngle',
      'testName_endAngle',
      'testName_valueFontSize',
      'testName_metricFontSize',
      'testName_needleBaseHalfWidth',
      'testName_needleTipHalfWidth',
      'testName_needleTipDiameter',
      'testName_needleTipGap',
      'testName_pivotDiameter',
      'testName_pivotStrokeWidth',
    ]);
  });

  test('should derive typography/needle signals from the rendered inner radius', () => {
    const signals = addSignals([], defaultGaugeOptions);
    expect(signals.find((s) => s.name === 'testName_valueFontSize')).toHaveProperty(
      'update',
      "scale('testName_valueFontSizeScale', testName_innerRadius)"
    );
    expect(signals.find((s) => s.name === 'testName_needleBaseHalfWidth')).toHaveProperty(
      'update',
      'testName_innerRadius * 0.1'
    );
  });
});

describe('setScales()', () => {
  test('should add the radius-driven value font size threshold scale', () => {
    const scales = setScales([], defaultGaugeOptions);
    expect(scales).toHaveLength(1);
    expect(scales[0]).toHaveProperty('name', 'testName_valueFontSizeScale');
    expect(scales[0]).toHaveProperty('type', 'threshold');
  });
});

describe('addMarks()', () => {
  test('should add needle marks when showNeedle is true', () => {
    const marks = addMarks([], defaultGaugeOptions);
    expect(marks.map((m) => m.name)).toEqual([
      'testName_track',
      'testName_needle',
      'testName_needleTip',
      'testName_pivot',
      'testName_value',
      'testName_label',
    ]);
  });

  test('should add a fill mark instead of a needle when showNeedle is false', () => {
    const marks = addMarks([], { ...defaultGaugeOptions, showNeedle: false });
    expect(marks.map((m) => m.name)).toEqual(['testName_track', 'testName_fill', 'testName_value', 'testName_label']);
  });
});

describe('addGauge', () => {
  test('should add gauge correctly', () => {
    const spec = { data: [{ name: FILTERED_TABLE }], usermeta: {} };
    const options = { ...defaultGaugeOptions };
    const result = addGauge(spec, options);
    const expectedSpec = {
      data: addData(spec.data, options),
      signals: addSignals([], options),
      scales: setScales([], options),
      marks: addMarks([], options),
      usermeta: {},
    };
    expect(result).toEqual(expectedSpec);
  });

  test('should clamp arcSize and holeRatio to their supported ranges', () => {
    const result = addGauge({ data: [], usermeta: {} }, { ...defaultGaugeOptions, arcSize: 5, holeRatio: 0 });
    const signals = result.signals ?? [];
    expect(signals.find((s) => s.name === 'testName_totalAngle')).toHaveProperty('update', '0.85 * 2 * PI');
    expect(signals.find((s) => s.name === 'testName_innerRadius')).toHaveProperty(
      'update',
      'testName_radius * 0.4'
    );
  });
});
