import { BulletSpecProps } from 'types';
import { Data } from 'vega';

import { samplePropsColumn } from './bulletSpecBuilder.test';
import { getBulletTableData, getBulletTransforms } from './bulletSummaryUtils';

describe('getBulletTableData', () => {
	it('creates new table data if none exists', () => {
		const data: Data[] = [];
		const result = getBulletTableData(data);

		expect(result.name).toBe('table');
		expect(result.values).toEqual([]);
		expect(result.transform).toEqual([]);

		expect(data.length).toBe(1);
		expect(data[0]).toBe(result);
	});

	it('returns existing table data if it exists', () => {
		const existingTableData: Data = {
			name: 'table',
			values: [],
			transform: [],
		};
		const data: Data[] = [existingTableData];
		const result = getBulletTableData(data);

		expect(result).toBe(existingTableData);
		expect(data.length).toBe(1);
	});
});

describe('getBulletTransforms', () => {
	it('returns a formula transform using the provided target field', () => {
		const bulletProps: BulletSpecProps = {
			...samplePropsColumn,
			target: 'targetField',
		};

		const transform = getBulletTransforms(bulletProps);

		expect(transform).toHaveLength(1);

		const [formulaTransform] = transform;
		expect(formulaTransform.type).toBe('formula');
		expect(formulaTransform.expr).toBe('isValid(datum.targetField) ? round(datum.targetField * 1.05) : 0');
		expect(formulaTransform.as).toBe('xPaddingForTarget');
	});

	it('handles a different target name', () => {
		const bulletProps: BulletSpecProps = {
			...samplePropsColumn,
			target: 'differentTarget',
		};

		const transform = getBulletTransforms(bulletProps);

		expect(transform).toHaveLength(1);

		const [formulaTransform] = transform;
		expect(formulaTransform.type).toBe('formula');
		expect(formulaTransform.expr).toBe('isValid(datum.differentTarget) ? round(datum.differentTarget * 1.05) : 0');
		expect(formulaTransform.as).toBe('xPaddingForTarget');
	});
});
