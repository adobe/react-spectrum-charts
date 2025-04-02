import { BulletSpecProps } from 'types';
import { Data } from 'vega';

import { getBulletTableData, getBulletTransforms } from './bulletDataUtils';
import { samplePropsColumn } from './bulletSpecBuilder.test';

describe('getBulletTableData', () => {
	it('Should create a new table data if it does not exist', () => {
		const data: Data[] = [];

		const result = getBulletTableData(data);

		expect(result.name).toBe('table');
		expect(result.values).toEqual([]);
		expect(result.transform).toEqual([]);

		expect(data.length).toBe(1);
		expect(data[0]).toEqual(result);
	});

	it('Should return the existing table data if it exists', () => {
		const existingTableData: Data = {
			name: 'table',
			values: [],
			transform: [],
		};
		const data: Data[] = [existingTableData];

		const result = getBulletTableData(data);

		expect(result).toEqual(existingTableData);
	});
});

describe('getBulletTransforms', () => {
	it('Should return a formula transform using the target property', () => {
		const props: BulletSpecProps = {
			...samplePropsColumn,
			target: 'target',
		};

		const result = getBulletTransforms(props);

		expect(result).toHaveLength(1);

		expect(result).toEqual([
			{
				type: 'formula',
				expr: 'isValid(datum.target) ? round(datum.target * 1.05) : 0',
				as: 'xPaddingForTarget',
			},
		]);
	});
	it('Should return a formula transform using the maxScaleValue property', () => {
		const props: BulletSpecProps = {
			...samplePropsColumn,
			target: 'target',
			scaleType: 'flexible',
			maxScaleValue: 100,
		};

		const result = getBulletTransforms(props);

		expect(result).toHaveLength(2);

		expect(result[1]).toEqual({
			type: 'formula',
			expr: '100',
			as: 'flexibleScaleValue',
		});
	});
});
