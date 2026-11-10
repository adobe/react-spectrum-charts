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
import { Data, OrdinalScale, Scale } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR,
  FILTERED_TABLE,
  LINEAR_PADDING,
  MARK_ID,
  TABLE,
} from '@spectrum-charts/core-s2/constants';

import {
  addContinuousDimensionScale,
  addDomainFields,
  addFieldToFacetScaleDomain,
  getPadding,
  getScaleName,
  sortDiscreteDomainsByFirstAppearance,
} from './scaleSpecBuilder.js';

const defaultColorScale: OrdinalScale = {
  domain: { data: 'table', fields: [DEFAULT_COLOR] },
  name: COLOR_SCALE,
  type: 'ordinal',
};

describe('addDomainFields()', () => {
  test('no domain fields', () => {
    expect(addDomainFields({ name: COLOR_SCALE, type: 'ordinal' }, [DEFAULT_COLOR])).toStrictEqual({
      domain: { data: 'table', fields: [DEFAULT_COLOR] },
      name: COLOR_SCALE,
      type: 'ordinal',
    });
  });

  test('field matches existing one, nothing should change', () => {
    expect(addDomainFields(defaultColorScale, [DEFAULT_COLOR])).toStrictEqual(defaultColorScale);
  });

  test('new field should be added to existing one', () => {
    expect(
      addDomainFields({ ...defaultColorScale, domain: { data: 'table', fields: ['test'] } }, [DEFAULT_COLOR])
    ).toStrictEqual({ ...defaultColorScale, domain: { data: 'table', fields: ['test', DEFAULT_COLOR] } });
  });
});

describe('getPadding()', () => {
  test('time', () => {
    expect(getPadding('time')).toStrictEqual({
      padding: LINEAR_PADDING,
    });
  });
  test('linear', () => {
    expect(getPadding('time')).toStrictEqual({
      padding: LINEAR_PADDING,
    });
  });
  test('point', () => {
    expect(getPadding('point')).toStrictEqual({
      paddingOuter: 0.5,
    });
  });
  test('band', () => {
    expect(getPadding('band')).toStrictEqual({
      paddingInner: 0.4,
      paddingOuter: 0.2,
    });
  });
});

describe('addFieldToFacetScaleDomain()', () => {
  test('should add fields to correct scale', () => {
    const scales: Scale[] = [{ name: COLOR_SCALE, type: 'ordinal' }];
    addFieldToFacetScaleDomain(scales, COLOR_SCALE, DEFAULT_COLOR);
    expect(scales).toStrictEqual([
      { name: COLOR_SCALE, type: 'ordinal', domain: { data: 'table', fields: [DEFAULT_COLOR] } },
    ]);
  });

  test('should not add any fields to the domain if the facet value is static', () => {
    const scales: Scale[] = [{ name: COLOR_SCALE, type: 'ordinal' }];
    addFieldToFacetScaleDomain(scales, COLOR_SCALE, { value: 'red-500' });
    expect(scales).toStrictEqual([{ name: COLOR_SCALE, type: 'ordinal' }]);
  });
});

describe('addContinuousDimensionScale()', () => {
  test('should override padding if it exists', () => {
    const scales = [];
    addContinuousDimensionScale(scales, { scaleType: 'linear', dimension: 'x', padding: 24 });
    expect(scales[0]).toHaveProperty('padding', 24);
  });
  test('should override paddingOuter if padding exists', () => {
    const scales: Scale[] = [{ type: 'band', name: 'xBand', paddingInner: 0.3, paddingOuter: 0.7 }];
    addContinuousDimensionScale(scales, { scaleType: 'band', dimension: 'x', padding: 0 });
    expect(scales[0]).toHaveProperty('paddingOuter', 0);
  });
});

describe('getScaleName()', () => {
  test('should return correct scale name', () => {
    expect(getScaleName('x', 'linear')).toBe('xLinear');
    expect(getScaleName('y', 'band')).toBe('yBand');
  });
});

describe('sortDiscreteDomainsByFirstAppearance()', () => {
  const firstAppearance = { op: 'min', field: MARK_ID };
  const getDomains = (scales: Scale[], data: Data[] = [{ name: TABLE }, { name: FILTERED_TABLE, source: TABLE }]) =>
    sortDiscreteDomainsByFirstAppearance({ data, scales, usermeta: {} }).scales?.map((scale) => scale.domain);

  test('should sort single-field discrete domains from data that carries the row id', () => {
    const domains = getDomains([
      { name: COLOR_SCALE, type: 'ordinal', domain: { data: FILTERED_TABLE, fields: [DEFAULT_COLOR] } },
      { name: 'xBand', type: 'band', domain: { data: TABLE, field: 'category' } },
    ]);
    expect(domains).toEqual([
      { data: FILTERED_TABLE, fields: [DEFAULT_COLOR], sort: firstAppearance },
      { data: TABLE, field: 'category', sort: firstAppearance },
    ]);
  });

  test('should only sort aggregated data that outputs the row id', () => {
    const domains = getDomains(
      [
        { name: 'kept', type: 'ordinal', domain: { data: 'withId', field: 'key' } },
        { name: 'skipped', type: 'ordinal', domain: { data: 'withoutId', field: 'key' } },
      ],
      [
        { name: TABLE },
        {
          name: 'withId',
          source: TABLE,
          transform: [{ type: 'aggregate', groupby: ['key'], fields: [MARK_ID], ops: ['min'], as: [MARK_ID] }],
        },
        { name: 'withoutId', source: TABLE, transform: [{ type: 'aggregate', groupby: ['key'] }] },
      ]
    );
    expect(domains?.[0]).toHaveProperty('sort', firstAppearance);
    expect(domains?.[1]).not.toHaveProperty('sort');
  });

  test('should leave continuous, multi-field and already sorted domains unchanged', () => {
    const scales: Scale[] = [
      { name: 'xLinear', type: 'linear', domain: { data: TABLE, fields: ['value'] } },
      { name: COLOR_SCALE, type: 'ordinal', domain: { data: TABLE, fields: ['a', 'b'] } },
      { name: 'xBand', type: 'band', domain: { data: TABLE, field: 'category', sort: true } },
    ];
    expect(getDomains(scales)).toEqual(scales.map((scale) => scale.domain));
  });
});
