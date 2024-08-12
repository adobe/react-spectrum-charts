import { createElement } from 'react';

import { Axis } from '@components/Axis';
import { Bar } from '@components/Bar';
import { Line } from '@components/Line';
import { addBar } from '@specBuilder/bar/barSpecBuilder';
import { addLine } from '@specBuilder/line/lineSpecBuilder';

import { addCombo, getComboChildName } from './comboSpecBuilder';

jest.mock('@specBuilder/bar/barSpecBuilder', () => ({
	addBar: jest.fn(),
}));

jest.mock('@specBuilder/line/lineSpecBuilder', () => ({
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
					children: [
						createElement(Bar, {
							dimension: 'datetime',
							metric: 'people',
						}),

						createElement(Line, {
							color: { value: 'indigo-900' },
							dimension: 'datetime',
							metric: 'adoptionRate',
						}),
					],
				}
			);

			expect(addBar).toHaveBeenCalledTimes(1);
			expect(addLine).toHaveBeenCalledTimes(1);
		});

		it('should skip invalid children', () => {
			addCombo(
				{},
				{
					children: [createElement(Axis)],
				}
			);

			expect(addBar).not.toHaveBeenCalled();
			expect(addLine).not.toHaveBeenCalled();
		});
	});

	describe('getComboChildName', () => {
		it('should return the name of the combo child', () => {
			const child = createElement(Bar, {
				name: 'bar1',
			});

			expect(getComboChildName(child, 'combo1', 1)).toEqual('bar1');
		});

		it('should generate a name for the combo child', () => {
			const child = createElement(Line);

			expect(getComboChildName(child, 'combo1', 1)).toEqual('combo1Line1');
		});
	});
});
