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
import { NodeObject } from 'data-navigator';

import { getContentLeafIds, reconcileNavigation } from './navigationReconciliation.js';

describe('getContentLeafIds()', () => {
  test('keeps only the chart content nodes below the divisions', () => {
    const nodes = {
      root: { id: 'root', dimensionLevel: 1 },
      stack: { id: 'stack', dimensionLevel: 2 },
      bar: { id: 'bar' },
      tagged: { id: 'tagged', region: 'content' },
      tick: { id: 'xAxis:tick', region: 'xAxis' },
      entry: { id: 'legend:entry', region: 'legend' },
    } as unknown as Record<string, NodeObject>;
    expect(getContentLeafIds(nodes)).toEqual(['bar', 'tagged']);
  });
});

describe('reconcileNavigation()', () => {
  test('is undefined when leaves and rendered items match one-to-one', () => {
    expect(reconcileNavigation(['a', 'b'], ['b', 'a'])).toBeUndefined();
  });

  test('reports leaves without a rendered item and rendered items without a leaf', () => {
    expect(reconcileNavigation(['a', 'b'], ['a', 'c', undefined])).toEqual({
      missing: ['b'],
      unreachable: ['c', '(unkeyed item)'],
    });
  });
});
