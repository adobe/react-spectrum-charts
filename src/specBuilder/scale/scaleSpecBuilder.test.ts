/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { DEFAULT_COLOR } from '@constants';
import { OrdinalScale, Scale } from 'vega';

import {
	addContinuousDimensionScale,
	addDomainFields,
	addFieldToFacetScaleDomain,
	getPadding,
} from './scaleSpecBuilder';

const defaultColorScale: OrdinalScale = {
	domain: { data: 'table', fields: [DEFAULT_COLOR] },
	name: 'color',
	type: 'ordinal',
};

describe('scaleSpecBuilder', () => {
	describe('addDomainFields()', () => {
		test('no domain fields', () => {
			expect(addDomainFields({ name: 'color', type: 'ordinal' }, [DEFAULT_COLOR])).toStrictEqual({
				domain: { data: 'table', fields: [DEFAULT_COLOR] },
				name: 'color',
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
				padding: 32,
			});
		});
		test('linear', () => {
			expect(getPadding('time')).toStrictEqual({
				padding: 32,
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
			const scales: Scale[] = [{ name: 'color', type: 'ordinal' }];
			addFieldToFacetScaleDomain(scales, 'color', DEFAULT_COLOR);
			expect(scales).toStrictEqual([
				{ name: 'color', type: 'ordinal', domain: { data: 'table', fields: [DEFAULT_COLOR] } },
			]);
		});

		test('should not add any fields to the domain if the facet value is static', () => {
			const scales: Scale[] = [{ name: 'color', type: 'ordinal' }];
			addFieldToFacetScaleDomain(scales, 'color', { value: 'red-500' });
			expect(scales).toStrictEqual([{ name: 'color', type: 'ordinal' }]);
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
});
