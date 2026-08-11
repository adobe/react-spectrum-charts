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
import { LineSchema } from './line.schema';

describe('LineSchema', () => {
  test('parses a minimal Line', () => {
    const parsed = LineSchema.parse({ component: 'Line', dimension: 'month', metric: 'downloads' });
    expect(parsed).toMatchObject({ component: 'Line', dimension: 'month', metric: 'downloads' });
  });

  test('parses color as a data field name', () => {
    const parsed = LineSchema.parse({
      component: 'Line',
      dimension: 'month',
      metric: 'downloads',
      color: 'browser',
    });
    expect(parsed.color).toBe('browser');
  });

  test('parses a valid scaleType', () => {
    const parsed = LineSchema.parse({
      component: 'Line',
      dimension: 'datetime',
      metric: 'users',
      scaleType: 'time',
    });
    expect(parsed.scaleType).toBe('time');
  });

  test('rejects an invalid scaleType', () => {
    const result = LineSchema.safeParse({
      component: 'Line',
      dimension: 'datetime',
      metric: 'users',
      scaleType: 'ordinal',
    });
    expect(result.success).toBe(false);
  });

  test('parses a LineDirectLabel decoration', () => {
    const parsed = LineSchema.parse({
      component: 'Line',
      dimension: 'datetime',
      metric: 'users',
      decorations: [{ component: 'LineDirectLabel', value: 'series', position: 'end' }],
    });
    expect(parsed.decorations).toHaveLength(1);
    expect(parsed.decorations?.[0]).toMatchObject({ component: 'LineDirectLabel', value: 'series' });
  });

  test('rejects an unrecognized decoration discriminator', () => {
    const result = LineSchema.safeParse({
      component: 'Line',
      dimension: 'datetime',
      metric: 'users',
      decorations: [{ component: 'BarDirectLabel', position: 'end-outside' }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a missing metric', () => {
    const result = LineSchema.safeParse({ component: 'Line', dimension: 'datetime' });
    expect(result.success).toBe(false);
  });
});
