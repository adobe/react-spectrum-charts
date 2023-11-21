import { FILTERED_TABLE } from '@constants';
import { FilterTransform } from 'vega';

import { getLineHighlightedData } from './lineDataUtils';

describe('getLineHighlightedData()', () => {
	test('should include select signal if hasPopover', () => {
		const expr = (getLineHighlightedData('line0', FILTERED_TABLE, true).transform?.[0] as FilterTransform).expr;
		expect(expr.includes('line0_selectedId')).toBeTruthy();
	});
	test('should not include select signal if does not hasPopover', () => {
		const expr = (getLineHighlightedData('line0', FILTERED_TABLE, false).transform?.[0] as FilterTransform).expr;
		expect(expr.includes('line0_selectedId')).toBeFalsy();
	});
});
