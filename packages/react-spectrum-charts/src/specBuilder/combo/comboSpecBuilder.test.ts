/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { MARK_ID } from '../../constants';
import { addBar } from '../bar/barSpecBuilder';
import { addLine } from '../line/lineSpecBuilder';
import { BarOptions, LineOptions } from '../types';
import { addCombo, getComboMarkName } from './comboSpecBuilder';

jest.mock('../bar/barSpecBuilder', () => ({
	addBar: jest.fn(),
}));

jest.mock('../line/lineSpecBuilder', () => ({
	addLine: jest.fn(),
}));

describe('comboSpecBuilder', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('addCombo', () => {
		it('should build a combo spec with a line and bar mark', () => {
			addCombo(
				{},
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
			addCombo({}, { idKey: MARK_ID, markType: 'combo' });

			expect(addBar).not.toHaveBeenCalled();
			expect(addLine).not.toHaveBeenCalled();
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
