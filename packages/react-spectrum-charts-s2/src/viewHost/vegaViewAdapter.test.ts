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

import { TABLE } from '@spectrum-charts/core-s2/constants';

import { prepareSpec, splitSpec } from './vegaViewAdapter.js';

const spec: Spec = {
  data: [
    { name: TABLE, values: [] },
    { name: 'other', source: TABLE },
  ],
  signals: [
    { name: 'highlightedSeries', value: null },
    { name: 'hiddenSeries', value: [] },
    { name: 'derived', update: 'highlightedSeries' },
  ],
  marks: [{ type: 'rect', from: { data: TABLE } }],
};

describe('prepareSpec()', () => {
  test('should inject table rows and signal values without mutating the spec', () => {
    const prepared = prepareSpec(spec, [{ x: 1 }], { highlightedSeries: 'a', missing: 1 });

    expect(prepared.data?.[0]).toHaveProperty('values', [{ x: 1 }]);
    expect(prepared.signals?.[0]).toHaveProperty('value', 'a');
    expect(prepared.signals?.some((signal) => signal.name === 'missing')).toBe(false);
    expect(spec.data?.[0]).toHaveProperty('values', []);
    expect(spec.signals?.[0]).toHaveProperty('value', null);
  });

  test('should keep the initial value when the override is undefined', () => {
    const prepared = prepareSpec(spec, [], { highlightedSeries: undefined });

    expect(prepared.signals?.[0]).toHaveProperty('value', null);
  });

  test('should not add a value to a signal that has none', () => {
    const prepared = prepareSpec(spec, [], { derived: 'x' });

    expect(prepared.signals?.[2]).not.toHaveProperty('value');
  });
});

describe('splitSpec()', () => {
  test('should exclude table rows and signal values from the program', () => {
    const a = splitSpec(prepareSpec(spec, [{ x: 1 }], { highlightedSeries: 'a' }));
    const b = splitSpec(prepareSpec(spec, [{ x: 2 }, { x: 3 }], { highlightedSeries: 'b' }));

    expect(a.program).toBe(b.program);
    expect(b.table).toEqual([{ x: 2 }, { x: 3 }]);
    expect(b.signalValues.get('highlightedSeries')).toBe('b');
  });

  test('should keep hiddenSeries in the program', () => {
    const a = splitSpec(prepareSpec(spec, [], { hiddenSeries: ['a'] }));
    const b = splitSpec(prepareSpec(spec, [], { hiddenSeries: ['b'] }));

    expect(a.program).not.toBe(b.program);
    expect(a.signalValues.has('hiddenSeries')).toBe(false);
  });

  test('should change the program when a signal value is added or removed', () => {
    const withValue = splitSpec(spec);
    const withoutValue = splitSpec({ ...spec, signals: [{ name: 'highlightedSeries' }] });

    expect(withValue.program).not.toBe(withoutValue.program);
  });

  test('should change the program when anything outside table values and signal values changes', () => {
    const changed = splitSpec({ ...spec, marks: [{ type: 'symbol', from: { data: TABLE } }] });

    expect(changed.program).not.toBe(splitSpec(spec).program);
  });

  test('should return an undefined table when the spec has no inline table', () => {
    expect(splitSpec({ data: [{ name: TABLE, url: 'data.json' }] }).table).toBeUndefined();
  });
});
