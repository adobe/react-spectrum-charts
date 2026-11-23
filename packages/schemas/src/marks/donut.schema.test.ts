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
import { ChartSchema } from '../chart.schema.js';
import { DonutSchema, DonutSummarySchema, SegmentLabelSchema } from './donut.schema.js';

test('preserves supplied Donut summary and label text through chart validation', () => {
  const mark = {
    component: 'Donut',
    color: 'category',
    metric: 'value',
    labelSpaceRatio: 0.3,
    decorations: [
      { component: 'DonutSummary', valueText: '100 units', hideValue: false },
      {
        component: 'SegmentLabel',
        labelKey: 'shareLabel',
        value: false,
        percent: false,
        fontSize: 12,
        fontWeight: 600,
      },
    ],
  };
  const result = ChartSchema.parse({
    component: 'Chart',
    data: { values: [{ category: 'Alpha', value: 100, shareLabel: '100,0 %' }] },
    children: [mark],
  });
  expect(result.children).toEqual([mark]);
});

test('accepts empty valueText but rejects non-string formatted values', () => {
  expect(DonutSummarySchema.parse({ component: 'DonutSummary', valueText: '' })).toHaveProperty('valueText', '');
  expect(DonutSummarySchema.safeParse({ component: 'DonutSummary', valueText: 123 }).success).toBe(false);
});

test.each([-1, 1.1, NaN, Infinity])('rejects invalid label space ratios: %s', (labelSpaceRatio) => {
  expect(DonutSchema.safeParse({ component: 'Donut', labelSpaceRatio }).success).toBe(false);
});

test.each([{ fontSize: 0 }, { fontSize: Infinity }, { fontWeight: 0 }, { fontWeight: 1001 }, { fontWeight: 'heavy' }])(
  'rejects invalid primary label typography: %p',
  (typography) => {
    expect(SegmentLabelSchema.safeParse({ component: 'SegmentLabel', ...typography }).success).toBe(false);
  }
);
