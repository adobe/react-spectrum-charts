import { DEFAULT_COLOR, TABLE } from '@constants';
import { Scale } from 'vega';

import { getFacets, getFacetsFromKeys } from './legendFacetUtils';

describe('getFacets()', () => {
	test('should correctly identify continuous and categorical facets', () => {
		const scales: Scale[] = [
			{
				name: 'color',
				type: 'ordinal',
				domain: { data: TABLE, fields: [DEFAULT_COLOR] },
			},
			{
				name: 'lineType',
				type: 'ordinal',
			},
			{
				name: 'symbolSize',
				type: 'linear',
				domain: { data: TABLE, fields: ['weight'] },
			},
		];
		const { ordinalFacets, continuousFacets } = getFacets(scales);
		expect(ordinalFacets).toHaveLength(1);
		expect(continuousFacets).toHaveLength(1);
	});
});

describe('getFacetsFromKeys()', () => {
	test('should find the correct facets from the provided keys', () => {
		const scales: Scale[] = [
			{
				name: 'color',
				type: 'ordinal',
				domain: { data: TABLE, fields: [DEFAULT_COLOR] },
			},
			{
				name: 'lineType',
				type: 'ordinal',
			},
			{
				name: 'symbolSize',
				type: 'linear',
				domain: { data: TABLE, fields: ['weight'] },
			},
		];
		let facets = getFacetsFromKeys(['weight'], scales);
		expect(facets.ordinalFacets).toHaveLength(0);
		expect(facets.continuousFacets).toHaveLength(1);
		facets = getFacetsFromKeys([DEFAULT_COLOR], scales);
		expect(facets.ordinalFacets).toHaveLength(1);
		expect(facets.continuousFacets).toHaveLength(0);
	});
});
