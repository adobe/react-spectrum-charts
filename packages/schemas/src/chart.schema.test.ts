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
import { parseChartRequest } from '.';
import { ChartSchema } from './chart.schema';

const validBarRequest = {
  component: 'Chart',
  data: { values: [{ browser: 'Chrome', downloads: 27000 }] },
  axes: [{ component: 'Axis', position: 'bottom' }],
  children: [{ component: 'Bar', dimension: 'browser', metric: 'downloads' }],
};

describe('ChartSchema', () => {
  test('parses a valid Bar request', () => {
    const parsed = ChartSchema.parse(validBarRequest);
    expect(parsed.children).toHaveLength(1);
    expect(parsed.children[0]).toMatchObject({ component: 'Bar', dimension: 'browser' });
  });

  test('parses a valid Line request', () => {
    const parsed = ChartSchema.parse({
      ...validBarRequest,
      children: [{ component: 'Line', dimension: 'month', metric: 'downloads', scaleType: 'point' }],
    });
    expect(parsed.children[0]).toMatchObject({ component: 'Line', scaleType: 'point' });
  });

  test('axes are optional', () => {
    const { axes: _axes, ...withoutAxes } = validBarRequest;
    expect(() => ChartSchema.parse(withoutAxes)).not.toThrow();
  });

  test('rejects an empty children array', () => {
    const result = ChartSchema.safeParse({ ...validBarRequest, children: [] });
    expect(result.success).toBe(false);
  });

  test('rejects a mark with an unrecognized component discriminator', () => {
    const result = ChartSchema.safeParse({
      ...validBarRequest,
      children: [{ component: 'Donut', dimension: 'browser', metric: 'downloads' }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a request missing the required data field', () => {
    const { data: _data, ...withoutData } = validBarRequest;
    const result = ChartSchema.safeParse(withoutData);
    expect(result.success).toBe(false);
  });
});

describe('parseChartRequest', () => {
  test('returns the parsed request for a valid payload', () => {
    expect(parseChartRequest(validBarRequest).component).toBe('Chart');
  });

  test('throws for an invalid payload', () => {
    expect(() => parseChartRequest({ component: 'Chart' })).toThrow();
  });
});
