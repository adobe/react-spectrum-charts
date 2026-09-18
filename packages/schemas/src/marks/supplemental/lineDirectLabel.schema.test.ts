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
import { LineDirectLabelSchema } from './lineDirectLabel.schema';

describe('LineDirectLabelSchema', () => {
  test('parses with no optional fields', () => {
    const parsed = LineDirectLabelSchema.parse({ component: 'LineDirectLabel' });
    expect(parsed.component).toBe('LineDirectLabel');
  });

  test('parses all optional fields', () => {
    const parsed = LineDirectLabelSchema.parse({
      component: 'LineDirectLabel',
      value: 'series',
      position: 'end',
      format: 'shortNumber',
      prefix: '$',
      excludeSeries: ['Series B'],
      fontSize: 12,
    });
    expect(parsed).toMatchObject({
      value: 'series',
      position: 'end',
      format: 'shortNumber',
      prefix: '$',
      excludeSeries: ['Series B'],
      fontSize: 12,
    });
  });

  test('rejects an invalid value', () => {
    const result = LineDirectLabelSchema.safeParse({ component: 'LineDirectLabel', value: 'max' });
    expect(result.success).toBe(false);
  });

  test('rejects an invalid position', () => {
    const result = LineDirectLabelSchema.safeParse({ component: 'LineDirectLabel', position: 'middle' });
    expect(result.success).toBe(false);
  });

  test('rejects a wrong component discriminator', () => {
    const result = LineDirectLabelSchema.safeParse({ component: 'BarDirectLabel' });
    expect(result.success).toBe(false);
  });
});
