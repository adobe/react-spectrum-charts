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
import { getChangedSignals } from './viewAdapter.js';

describe('getChangedSignals()', () => {
  test('should return only signals whose values differ by content', () => {
    const previous = new Map<string, unknown>([
      ['a', 1],
      ['b', ['x']],
      ['c', null],
    ]);
    const next = new Map<string, unknown>([
      ['a', 1],
      ['b', ['x']],
      ['c', 'y'],
    ]);

    expect(getChangedSignals(previous, next)).toEqual([['c', 'y']]);
  });
});
