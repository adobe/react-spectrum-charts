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
import { BarDirectLabelSchema } from './barDirectLabel.schema';

describe('BarDirectLabelSchema', () => {
  test('parses with no optional fields', () => {
    const parsed = BarDirectLabelSchema.parse({ component: 'BarDirectLabel' });
    expect(parsed.component).toBe('BarDirectLabel');
  });

  test('parses with position and format', () => {
    const parsed = BarDirectLabelSchema.parse({
      component: 'BarDirectLabel',
      position: 'end-outside',
      format: 'currency',
    });
    expect(parsed).toMatchObject({ position: 'end-outside', format: 'currency' });
  });

  test('rejects an invalid position', () => {
    const result = BarDirectLabelSchema.safeParse({ component: 'BarDirectLabel', position: 'top' });
    expect(result.success).toBe(false);
  });

  test('rejects a wrong component discriminator', () => {
    const result = BarDirectLabelSchema.safeParse({ component: 'LineDirectLabel' });
    expect(result.success).toBe(false);
  });
});
