/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Config } from 'vega';

import { numberLocales } from '@spectrum-charts/locales';

import { applyUserMetaConfigPatches, getVegaEmbedOptions } from './vegaEmbedUtils';

describe('applyUserMetaConfigPatches()', () => {
  const base: Config = {
    legend: {
      layout: {
        bottom: { anchor: 'middle', direction: 'horizontal', center: true, offset: 24 },
        top: { anchor: 'middle', direction: 'horizontal' },
      },
      padding: 8,
    },
    axis: { labelFontSize: 12 },
  };

  test('returns config unchanged when patches is undefined', () => {
    expect(applyUserMetaConfigPatches(undefined, base)).toBe(base);
  });

  test('returns config unchanged when patches is empty', () => {
    expect(applyUserMetaConfigPatches([], base)).toBe(base);
  });

  test('overrides a primitive leaf value', () => {
    const result = applyUserMetaConfigPatches([{ axis: { labelFontSize: 14 } }], base);
    expect(result.axis?.labelFontSize).toBe(14);
  });

  test('preserves sibling keys not mentioned in the patch', () => {
    const result = applyUserMetaConfigPatches([{ legend: { layout: { bottom: { anchor: 'start' } } } }], base);
    expect(result.legend?.layout?.bottom).toHaveProperty('direction', 'horizontal');
    expect(result.legend?.layout?.bottom).toHaveProperty('center', true);
    expect(result.legend?.layout?.bottom).toHaveProperty('offset', 24);
  });

  test('overrides only the patched key in a nested object', () => {
    const result = applyUserMetaConfigPatches([{ legend: { layout: { bottom: { anchor: 'start' } } } }], base);
    expect(result.legend?.layout?.bottom).toHaveProperty('anchor', 'start');
  });

  test('does not affect sibling position layouts when patching one position', () => {
    const result = applyUserMetaConfigPatches([{ legend: { layout: { bottom: { anchor: 'start' } } } }], base);
    expect(result.legend?.layout?.top).toStrictEqual({ anchor: 'middle', direction: 'horizontal' });
  });

  test('does not affect unrelated config sections', () => {
    const result = applyUserMetaConfigPatches([{ legend: { layout: { bottom: { anchor: 'end' } } } }], base);
    expect(result.axis).toStrictEqual({ labelFontSize: 12 });
    expect(result.legend?.padding).toBe(8);
  });

  test('patch creates nested structure if base key is absent', () => {
    const result = applyUserMetaConfigPatches([{ legend: { layout: { left: { anchor: 'start' } } } }], base);
    expect(result.legend?.layout?.left).toStrictEqual({ anchor: 'start' });
  });

  test('applies multiple patches in order — later patches win', () => {
    const result = applyUserMetaConfigPatches(
      [
        { legend: { layout: { bottom: { anchor: 'start' } } } },
        { legend: { layout: { bottom: { anchor: 'end' } } } },
      ],
      base
    );
    expect(result.legend?.layout?.bottom).toHaveProperty('anchor', 'end');
  });

  test('replaces arrays instead of merging them', () => {
    const withArray = { ...base, signals: [{ name: 'a' }] } as typeof base & { signals: object[] };
    const result = applyUserMetaConfigPatches([{ signals: [{ name: 'b' }, { name: 'c' }] } as never], withArray);
    expect((result as typeof withArray).signals).toStrictEqual([{ name: 'b' }, { name: 'c' }]);
  });

  test('treats SignalRef objects as leaf values, not recursed into', () => {
    const withSignal = { ...base, legend: { ...base.legend, symbolSize: { signal: 'mySize' } } };
    const result = applyUserMetaConfigPatches(
      [{ legend: { symbolSize: { signal: 'otherSize' } } } as never],
      withSignal
    );
    expect((result as typeof withSignal).legend.symbolSize).toStrictEqual({ signal: 'otherSize' });
  });

  test('patch with null value overrides base value', () => {
    const result = applyUserMetaConfigPatches([{ legend: { padding: null } } as never], base);
    expect(result.legend?.padding).toBeNull();
  });

  test('does not mutate the original config', () => {
    const original: Config = { legend: { layout: { bottom: { anchor: 'middle' } } } };
    applyUserMetaConfigPatches([{ legend: { layout: { bottom: { anchor: 'start' } } } }], original);
    expect(original.legend?.layout?.bottom?.anchor).toBe('middle');
  });
});

describe('getVegaEmbedOptions()', () => {
  it('should return the correct options', () => {
    const options = getVegaEmbedOptions({});
    expect(options).toHaveProperty('actions', false);
    expect(options).toHaveProperty('ast', true);
    expect(options).toHaveProperty('expressionFunctions');
    expect(options).toHaveProperty('formatLocale');
    expect(options).toHaveProperty('height', 400);
    expect(options).toHaveProperty('width', 600);
    expect(options).toHaveProperty('padding', 0);
  });
  it('should use the correct color scheme', () => {
    let options = getVegaEmbedOptions({ colorScheme: 'dark' });
    expect(options?.config?.text?.fill).toEqual('rgb(235, 235, 235)');
    options = getVegaEmbedOptions({ colorScheme: 'light' });
    expect(options?.config?.text?.fill).toEqual('rgb(34, 34, 34)');
  });
  it('should default to en-US', () => {
    const enLocale = numberLocales['en-US'];
    const options = getVegaEmbedOptions({});
    expect(options?.formatLocale).toEqual(enLocale);
  });
  it('should use the correct locale if provided', () => {
    const frLocale = numberLocales['fr-FR'];
    const options = getVegaEmbedOptions({ locale: 'fr-FR' });
    expect(options?.formatLocale).toEqual(frLocale);
  });
});
