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
import { View, parse } from 'vega';

import { MARK_ID, TABLE } from '@spectrum-charts/core-s2/constants';

import { getRowKeyField, getRowKeyTransforms } from './rowKeyUtils.js';

const getKeys = async (rows: object[], fields: string[]): Promise<string[]> => {
  const view = new View(
    parse({
      data: [
        {
          name: TABLE,
          values: rows,
          transform: [
            { type: 'identifier', as: MARK_ID },
            ...getRowKeyTransforms({ name: 'bar0', idKey: MARK_ID, fields }),
          ],
        },
      ],
    }),
    { renderer: 'none' }
  );
  await view.runAsync();
  return view.data(TABLE).map((row) => row[getRowKeyField({ name: 'bar0', idKey: MARK_ID })]);
};

describe('getRowKeyField()', () => {
  test('should use a mark-specific field when idKey is the generated MARK_ID', () => {
    expect(getRowKeyField({ name: 'bar0', idKey: MARK_ID })).toBe('bar0_rowKey');
  });

  test('should use a consumer idKey directly', () => {
    expect(getRowKeyField({ name: 'bar0', idKey: 'id' })).toBe('id');
  });
});

describe('getRowKeyTransforms()', () => {
  test('should not add transforms for a consumer idKey', () => {
    expect(getRowKeyTransforms({ name: 'bar0', idKey: 'id', fields: ['x'] })).toEqual([]);
  });

  test('should give rows with the same fields unique keys', async () => {
    const keys = await getKeys([{ x: 'a' }, { x: 'a' }, { x: 'b' }], ['x']);
    expect(new Set(keys).size).toBe(3);
  });

  test('should keep keys stable when data is replaced with new rows', async () => {
    const rows = [
      { x: 'a', s: 1 },
      { x: 'b', s: 1 },
    ];
    expect(
      await getKeys(
        rows.map((row) => ({ ...row })),
        ['x', 's']
      )
    ).toEqual(await getKeys(rows, ['x', 's']));
  });

  test('should not collide when values contain the separator', async () => {
    const keys = await getKeys(
      [
        { x: 'a|1', s: '' },
        { x: 'a', s: '1|' },
      ],
      ['x', 's']
    );
    expect(keys[0]).not.toBe(keys[1]);
  });
});
