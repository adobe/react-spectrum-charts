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
import { HOVERED_ITEM, MARK_ID } from '@spectrum-charts/core-s2/constants';

import { addBar } from '../bar/barSpecBuilder.js';
import { addLine } from '../line/lineSpecBuilder.js';
import { BarOptions, LineOptions } from '../types/index.js';
import { addCombo, addMissingSiblingHoveredItemSignals, getComboMarkName } from './comboSpecBuilder.js';

jest.mock('../bar/barSpecBuilder', () => ({
  addBar: jest.fn((spec) => spec),
}));

jest.mock('../line/lineSpecBuilder', () => ({
  addLine: jest.fn((spec) => spec),
}));

describe('comboSpecBuilder', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addCombo', () => {
    it('should build a combo spec with a line and bar mark', () => {
      addCombo(
        { usermeta: {} },
        {
          idKey: MARK_ID,
          dimension: 'datetime',
          marks: [
            { markType: 'bar', metric: 'people' },
            { markType: 'line', color: { value: 'indigo-900' }, metric: 'adoptionRate' },
          ],
          markType: 'combo',
        }
      );

      expect(addBar).toHaveBeenCalledTimes(1);
      expect(getCallParams(addBar).dimension).toEqual('datetime');

      expect(addLine).toHaveBeenCalledTimes(1);
      expect(getCallParams(addLine).dimension).toEqual('datetime');
    });

    it('should do nothing if no children', () => {
      addCombo({ usermeta: {} }, { idKey: MARK_ID, markType: 'combo' });

      expect(addBar).not.toHaveBeenCalled();
      expect(addLine).not.toHaveBeenCalled();
    });
  });

  describe('addMissingSiblingHoveredItemSignals', () => {
    it('should add a null hovered item signal for marks without one', () => {
      const spec = addMissingSiblingHoveredItemSignals(
        { usermeta: {}, signals: [{ name: `combo0Bar0_${HOVERED_ITEM}`, value: null, on: [] }] },
        ['combo0Bar0', 'combo0Line0']
      );
      expect(spec.signals).toHaveLength(2);
      expect(spec.signals?.[0]).toHaveProperty('on');
      expect(spec.signals?.[1]).toEqual({ name: `combo0Line0_${HOVERED_ITEM}`, value: null });
    });

    it('should return the same spec when every mark has a hovered item signal', () => {
      const spec = { usermeta: {}, signals: [{ name: `combo0Line0_${HOVERED_ITEM}`, value: null }] };
      expect(addMissingSiblingHoveredItemSignals(spec, ['combo0Line0'])).toBe(spec);
    });

    it('should create signals when the spec has none', () => {
      expect(addMissingSiblingHoveredItemSignals({ usermeta: {} }, ['combo0Bar0']).signals).toEqual([
        { name: `combo0Bar0_${HOVERED_ITEM}`, value: null },
      ]);
    });

    it('should add hovered item signals for non-interactive combo children', () => {
      const spec = addCombo(
        { usermeta: {} },
        {
          idKey: MARK_ID,
          marks: [
            { markType: 'bar', metric: 'people' },
            { markType: 'line', metric: 'adoptionRate' },
          ],
          markType: 'combo',
        }
      );
      expect(spec.signals?.map(({ name }) => name)).toEqual([
        `combo0Bar0_${HOVERED_ITEM}`,
        `combo0Line0_${HOVERED_ITEM}`,
      ]);
    });
  });

  describe('getComboMarkName', () => {
    it('should return the name of the combo child', () => {
      const mark: BarOptions = {
        markType: 'bar',
        name: 'bar1',
      };

      expect(getComboMarkName(mark, 'combo1', 1)).toEqual('bar1');
    });

    it('should generate a name for the combo child', () => {
      const mark: LineOptions = { markType: 'line' };

      expect(getComboMarkName(mark, 'combo1', 1)).toEqual('combo1Line1');
    });
  });

  const getCallParams = (mockFn: unknown) => (mockFn as jest.Mock).mock.calls[0][1];
});
