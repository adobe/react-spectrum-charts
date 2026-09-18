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

import { getEffectiveMetricField, getForecastEffectiveValueTransform } from './lineForecastUtils';

describe('getForecastEffectiveValueTransform', () => {
  test('builds a formula that uses the historical metric when valid, falling back to forecast', () => {
    const transform = getForecastEffectiveValueTransform('line0', 'value', 'forecastValue');
    expect(transform.as).toBe('line0_effectiveValue');
    expect(transform.expr).toBe("isValid(datum['value']) ? datum['value'] : datum['forecastValue']");
  });
});

describe('getEffectiveMetricField', () => {
  test('returns the raw metric when there are no forecasts', () => {
    const field = getEffectiveMetricField({ alternateSegmentKey: undefined, forecasts: [], metric: 'value', name: 'line0' });
    expect(field).toBe('value');
  });

  test('returns the raw metric when alternateSegmentKey is set, even with forecasts present', () => {
    const field = getEffectiveMetricField({
      alternateSegmentKey: 'isAlternate',
      forecasts: [{ metric: 'forecastValue', start: 5 }],
      metric: 'value',
      name: 'line0',
    });
    expect(field).toBe('value');
  });

  test('returns the effective value field when forecasts are present and alternateSegmentKey is unset', () => {
    const field = getEffectiveMetricField({
      alternateSegmentKey: undefined,
      forecasts: [{ metric: 'forecastValue', start: 5 }],
      metric: 'value',
      name: 'line0',
    });
    expect(field).toBe('line0_effectiveValue');
  });
});
