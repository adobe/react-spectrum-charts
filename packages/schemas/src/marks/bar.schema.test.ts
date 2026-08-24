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
import { BarSchema } from './bar.schema';

describe('BarSchema', () => {
  test('parses a minimal Bar', () => {
    const parsed = BarSchema.parse({ component: 'Bar', dimension: 'browser', metric: 'downloads' });
    expect(parsed).toMatchObject({ component: 'Bar', dimension: 'browser', metric: 'downloads' });
  });

  test('parses color as a data field name', () => {
    const parsed = BarSchema.parse({
      component: 'Bar',
      dimension: 'browser',
      metric: 'downloads',
      color: 'operatingSystem',
    });
    expect(parsed.color).toBe('operatingSystem');
  });

  test('parses color as a dual facet tuple', () => {
    const parsed = BarSchema.parse({
      component: 'Bar',
      dimension: 'browser',
      metric: 'downloads',
      color: ['operatingSystem', 'segment'],
    });
    expect(parsed.color).toEqual(['operatingSystem', 'segment']);
  });

  test('parses BarDirectLabel and ChartInspect decorations', () => {
    const parsed = BarSchema.parse({
      component: 'Bar',
      dimension: 'browser',
      metric: 'downloads',
      decorations: [
        { component: 'BarDirectLabel', position: 'end-outside' },
        { component: 'ChartInspect', highlightBy: 'item' },
      ],
    });
    expect(parsed.decorations).toHaveLength(2);
    expect(parsed.decorations?.[0]).toMatchObject({ component: 'BarDirectLabel', position: 'end-outside' });
    expect(parsed.decorations?.[1]).toMatchObject({ component: 'ChartInspect', highlightBy: 'item' });
  });

  test('rejects an unrecognized decoration discriminator', () => {
    const result = BarSchema.safeParse({
      component: 'Bar',
      dimension: 'browser',
      metric: 'downloads',
      decorations: [{ component: 'LineDirectLabel', value: 'series' }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects a missing dimension', () => {
    const result = BarSchema.safeParse({ component: 'Bar', metric: 'downloads' });
    expect(result.success).toBe(false);
  });

  test('rejects a wrong component discriminator', () => {
    const result = BarSchema.safeParse({ component: 'Line', dimension: 'browser', metric: 'downloads' });
    expect(result.success).toBe(false);
  });
});
