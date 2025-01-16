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
import { getTextNumberFormat } from './textUtils';

describe('getTextNumberFormat()', () => {
	test('should return correct signal for shortNumber', () => {
		const format = getTextNumberFormat('shortNumber');
		expect(format).toHaveLength(1);
		expect(format[0]).toHaveProperty('signal', "upper(replace(format(datum['value'], '.3~s'), /(\\d+)G/, '$1B'))");
	});
	test('should return correct signal for shortCurrency', () => {
		const format = getTextNumberFormat('shortCurrency');
		expect(format).toHaveLength(2);
		expect(format[0]).toHaveProperty('signal', "upper(replace(format(datum['value'], '$.3~s'), /(\\d+)G/, '$1B'))");
	});
	test('should return correct signal for string specifier', () => {
		const numberFormat = '.2f';
		const format = getTextNumberFormat(numberFormat);
		expect(format).toHaveLength(1);
		expect(format[0]).toHaveProperty('signal', `format(datum['value'], '${numberFormat}')`);
	});
	test('should return correct signal for string specifier with currencyCode and locale', () => {
		const currencyCode = 'JPY';
		const locale = 'fr-FR';
		const numberFormat = '.4f';
		const format = getTextNumberFormat(numberFormat, 'value', locale, currencyCode);
		expect(format).toHaveLength(1);
		expect(format[0]).toHaveProperty(
			'signal',
			`formatLocaleCurrency(datum, \"${locale}\", \"${currencyCode}\", \"${numberFormat}\")`
		);
	});
	test('should return correct signal for string specifier if no currencyCode', () => {
		const numberFormat = '.2f';
		const format = getTextNumberFormat(numberFormat, 'value', 'fr-FR');
		expect(format).toHaveLength(1);
		expect(format[0]).toHaveProperty('signal', `format(datum['value'], '${numberFormat}')`);
	});
	test('should return correct signal for string specifier if no currencyLocale', () => {
		const numberFormat = '.2f';
		const format = getTextNumberFormat(numberFormat, 'value', undefined, 'USD');
		expect(format).toHaveLength(1);
		expect(format[0]).toHaveProperty('signal', `format(datum['value'], '${numberFormat}')`);
	});
});
