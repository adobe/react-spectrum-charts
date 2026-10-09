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
import { Spec } from 'vega';

import { createSpecDeduper } from './specDeduper.js';

describe('createSpecDeduper()', () => {
  test('should return the previous spec when the new spec is identical', () => {
    const dedupe = createSpecDeduper();
    const first: Spec = { signals: [{ name: 'a', value: 1 }] };
    dedupe(first);

    expect(dedupe({ signals: [{ name: 'a', value: 1 }] })).toBe(first);
  });

  test('should return the new spec when it differs', () => {
    const dedupe = createSpecDeduper();
    dedupe({ signals: [{ name: 'a', value: 1 }] });
    const next: Spec = { signals: [{ name: 'a', value: 2 }] };

    expect(dedupe(next)).toBe(next);
  });

  test('should compare against the most recent spec', () => {
    const dedupe = createSpecDeduper();
    dedupe({ signals: [{ name: 'a', value: 1 }] });
    const second: Spec = { signals: [{ name: 'a', value: 2 }] };
    dedupe(second);

    expect(dedupe({ signals: [{ name: 'a', value: 2 }] })).toBe(second);
  });

  test('should not share state between dedupers', () => {
    const spec: Spec = { signals: [] };
    createSpecDeduper()(spec);

    const other: Spec = { signals: [] };
    expect(createSpecDeduper()(other)).toBe(other);
  });
});
