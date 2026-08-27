/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { GaugeOptions, ScSpec } from '../types';
import { addGauge, addData, addScales, addSignals } from './gaugeSpecBuilder';
import { defaultGaugeOptions } from './gaugeTestUtils';

import { getColorValue, spectrumColors } from '../../../themes';

import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants';

const byName = (signals: any[], name: string) => signals.find(s => s.name === name);

describe('addGauge', () => {
  let spec: ScSpec;

  beforeEach(() => {
    spec = { data: [], marks: [], scales: [], usermeta: {} };
  });

  test('should create a spec with gauge chart properties', () => {
    const newSpec = addGauge(spec, defaultGaugeOptions);

    expect(newSpec).toBeDefined();
    expect(newSpec).toHaveProperty('data');
    expect(newSpec).toHaveProperty('marks');
    expect(newSpec).toHaveProperty('scales');
    expect(newSpec).toHaveProperty('signals');
  });
});

describe('getGaugeScales', () => {
  test('Should return the correct scale object', () => {
    const data = addScales([], defaultGaugeOptions);
    expect(data).toBeDefined();
    expect(data).toHaveLength(1);
    expect('range' in data[0] && data[0].range).toBeTruthy();
    if ('range' in data[0] && data[0].range) {
      expect(data[0].range[1].signal).toBe('endAngle');
    }
  });
});

describe('getGaugeSignals', () => {
  test('Should return the correct signals object', () => {
    const data = addSignals([], defaultGaugeOptions);
    expect(data).toBeDefined();
    expect(data).toHaveLength(19);
  });
});

describe('getGaugeData', () => {
  test('Should return the data object', () => {
    const data = addData([], defaultGaugeOptions);
    expect(data).toHaveLength(1);
  });
});

describe('addGauge (defaults & overrides for gaugeOptions)', () => {
  let spec: ScSpec;

  beforeEach(() => {
    spec = { data: [], marks: [], scales: [], usermeta: {} };
  });

  test('uses defaults when no overrides are provided', () => {
    const newSpec = addGauge(spec, defaultGaugeOptions);

    expect(newSpec).toBeDefined();
    expect(newSpec.signals).toBeDefined();

    const signals = newSpec.signals as any[];

    // min/max come from defaults in gaugeOptions
    expect(byName(signals, 'arcMaxVal')?.value).toBe(100);
    expect(byName(signals, 'arcMinVal')?.value).toBe(0);

    // default angles: -120° .. +120°
    expect(byName(signals, 'startAngle')?.update).toBe('-PI * 2 / 3');
    expect(byName(signals, 'endAngle')?.update).toBe('PI * 2 / 3');

    // default metric is 'currentAmount'
    expect(byName(signals, 'currVal')?.update).toBe("data('table')[0].currentAmount");

    // background fill from DEFAULT_COLOR_SCHEME
    const scheme = DEFAULT_COLOR_SCHEME;
    const expectedBgFill   = spectrumColors[scheme]['gray-200'];
    expect(byName(signals, 'backgroundfillColor')?.value).toBe(expectedBgFill);

    // fillerColorToCurrVal uses light
    expect(byName(signals, 'fillerColorToCurrVal')?.value).toBe('light');
  });

  test('applies user overrides (colorScheme, color, min/max, metric, name, index)', () => {
    const overrides = {
      ...defaultGaugeOptions,
      colorScheme: 'dark' as const,
      color: spectrumColors.dark['yellow-900'],
      backgroundFill: spectrumColors.dark['gray-200'],
      minArcValue: 50,
      maxArcValue: 500,
      metric: 'myMetric',
      name: 'Revenue Gauge',
      index: 2,
    };

    const newSpec = addGauge(spec, overrides);
    const signals = newSpec.signals as any[];

    // min/max should reflect overrides
    expect(byName(signals, 'arcMinVal')?.value).toBe(50);
    expect(byName(signals, 'arcMaxVal')?.value).toBe(500);

    // metric override reflected in currVal
    expect(byName(signals, 'currVal')?.update).toBe("data('table')[0].myMetric");

    // background fill should read from dark scheme
    expect(byName(signals, 'backgroundfillColor')?.value).toBe(spectrumColors.dark['gray-200']);

    // filler color should be computed via getColorValue with dark scheme
    const expectedFillerDark = getColorValue(spectrumColors.dark['yellow-900'], 'dark');
    expect(byName(signals, 'fillerColorToCurrVal')?.value).toBe(expectedFillerDark);

    // sanity: start/end angles remain the same defaults
    expect(byName(signals, 'startAngle')?.update).toBe('-PI * 2 / 3');
    expect(byName(signals, 'endAngle')?.update).toBe('PI * 2 / 3');
  });

});

