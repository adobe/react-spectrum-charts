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
    expect(data).toHaveLength(55);
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

    // geometry defaults
    expect(byName(signals, 'radiusRef')?.update).toBe('min(width/2, height/2)');
    expect(byName(signals, 'outerRadius')?.update).toBe('radiusRef * 0.95');
    expect(byName(signals, 'innerRadius')?.update).toBe('outerRadius - (radiusRef * 0.25)');
    expect(byName(signals, 'centerX')?.update).toBe('width/2');
    expect(byName(signals, 'centerY')?.update).toBe('height/2 + outerRadius/2');


    // target value uses default target field from options
    expect(byName(signals, 'target')?.update).toBe("data('table')[0].target");

    // clamped value and angle mapping are wired as expressions
    expect(byName(signals, 'clampedVal')?.update).toBe('min(max(arcMinVal, currVal), arcMaxVal)');
    expect(byName(signals, 'theta')?.update).toBe("scale('angleScale', clampedVal)");
    expect(byName(signals, 'needleAngleClampedVal')?.update).toBe("scale('angleScale', clampedVal)");
    expect(byName(signals, 'needleAngleDeg')?.update).toBe('needleAngleClampedVal * 180 / PI');
    expect(byName(signals, 'needleLength')?.update).toBe('30');

    // label/value text colors from scheme
    const expectedValueColor = getColorValue('gray-900', DEFAULT_COLOR_SCHEME);
    const expectedLabelColor = getColorValue('gray-600', DEFAULT_COLOR_SCHEME);

    expect(byName(signals, 'valueTextColor')?.value).toBe(expectedValueColor);
    expect(byName(signals, 'labelTextColor')?.value).toBe(expectedLabelColor);

    // showAsPercent default wiring
    expect(byName(signals, 'showAsPercent')?.update).toBe(`${defaultGaugeOptions.showsAsPercent}`);

    // textSignal formatting expression
    expect(byName(signals, 'textSignal')?.update).toBe("showAsPercent ? format((currVal / arcMaxVal) * 100, '.2f') + '%' : format(currVal, '.0f')");

    // --- band ranges: default formulas ---
    expect(byName(signals, 'bandRange')?.update).toBe('arcMaxVal - arcMinVal');
    expect(byName(signals, 'band1StartVal')?.update).toBe('arcMinVal');
    expect(byName(signals, 'band1EndVal')?.update).toBe('arcMinVal + bandRange * band1EndPct');
    expect(byName(signals, 'band2StartVal')?.update).toBe('band1EndVal');
    expect(byName(signals, 'band2EndVal')?.update).toBe('arcMinVal + bandRange * band2EndPct');
    expect(byName(signals, 'band3StartVal')?.update).toBe('band2EndVal');
    expect(byName(signals, 'band3EndVal')?.update).toBe('arcMaxVal');

    // --- band angle mapping formulas ---
    expect(byName(signals, 'band1StartAngle')?.update).toBe("scale('angleScale', band1StartVal)");
    expect(byName(signals, 'band1EndAngle')?.update).toBe("scale('angleScale', band1EndVal)");
    expect(byName(signals, 'band2StartAngle')?.update).toBe("scale('angleScale', band2StartVal)");
    expect(byName(signals, 'band2EndAngle')?.update).toBe("scale('angleScale', band2EndVal)");
    expect(byName(signals, 'band3StartAngle')?.update).toBe("scale('angleScale', band3StartVal)");
    expect(byName(signals, 'band3EndAngle')?.update).toBe("scale('angleScale', band3EndVal)");

    // --- band gap geometry formulas (band 1) ---
    expect(byName(signals, 'band1GapX')?.update).toBe("centerX + ( innerRadius - 5 ) * cos(band1EndAngle - PI/2)");
    expect(byName(signals, 'band1GapY')?.update).toBe("centerY + ( innerRadius - 5 ) * sin(band1EndAngle - PI/2)");
    expect(byName(signals, 'band1GapX2')?.update).toBe("centerX + ( outerRadius + 5 ) * cos(band1EndAngle - PI/2)");
    expect(byName(signals, 'band1GapY2')?.update).toBe("centerY + ( outerRadius + 5 ) * sin(band1EndAngle - PI/2)");

    // --- band gap geometry formulas (band 2) ---
    expect(byName(signals, 'band2GapX')?.update).toBe("centerX + ( innerRadius - 5 ) * cos(band2EndAngle - PI/2)");
    expect(byName(signals, 'band2GapY')?.update).toBe("centerY + ( innerRadius - 5 ) * sin(band2EndAngle - PI/2)");
    expect(byName(signals, 'band2GapX2')?.update).toBe("centerX + ( outerRadius + 5 ) * cos(band2EndAngle - PI/2)");
    expect(byName(signals, 'band2GapY2')?.update).toBe("centerY + ( outerRadius + 5 ) * sin(band2EndAngle - PI/2)");

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
    const expectedTargetStrokeDark = getColorValue('gray-900', 'dark');
    const expectedValueColorDark = getColorValue('gray-900', 'dark');
    const expectedLabelColorDark = getColorValue('gray-600', 'dark');

    expect(byName(signals, 'targetLineStroke')?.value).toBe(expectedTargetStrokeDark);
    expect(byName(signals, 'valueTextColor')?.value).toBe(expectedValueColorDark);
    expect(byName(signals, 'labelTextColor')?.value).toBe(expectedLabelColorDark);

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

describe('getGaugeSignals – performanceRanges overrides', () => {
    let spec: ScSpec;

    beforeEach(() => {
      spec = { data: [], marks: [], scales: [], usermeta: {} };
    });

    test('binds band pct signals to options.performanceRanges', () => {
      const performanceRanges = [
        { bandEndPct: 0.4,  fill: 'red' },
        { bandEndPct: 0.75, fill: 'yellow' },
        { bandEndPct: 1,    fill: 'green' },
      ];

      const overrides = {
        ...defaultGaugeOptions,
        performanceRanges,
      };

      const newSpec = addGauge(spec, overrides);
      const signals = newSpec.signals as any[];

      expect(byName(signals, 'band1EndPct')?.value).toBe(0.4);
      expect(byName(signals, 'band2EndPct')?.value).toBe(0.75);
      expect(byName(signals, 'band3EndPct')?.value).toBe(1);
    });
  });


});

