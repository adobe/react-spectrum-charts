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
import { NumberLocale, TimeLocale } from 'vega';

import { getLocale } from './locale';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode } from './locale.types';
import enNumber from './numberLocales/en-US.json';
import frNumber from './numberLocales/fr-FR.json';
import enTime from './timeLocales/en-US.json';
import frTime from './timeLocales/fr-FR.json';

describe('getLocale()', () => {
	test('if locale code is provided, should return the number and time locale definition for that code', () => {
		const locale = getLocale('fr-FR');
		expect(locale.number).toEqual(frNumber);
		expect(locale.time).toEqual(frTime);
	});
	test('if an invalid locale code is provided, should default back to en-US', () => {
		const locale = getLocale('fo-BR' as LocaleCode);
		expect(locale.number).toEqual(enNumber);
		expect(locale.time).toEqual(enTime);
	});
	test('should honor unique number and time localeCodes', () => {
		const locale = getLocale({ number: 'fr-FR', time: 'en-US' });
		expect(locale.number).toEqual(frNumber);
		expect(locale.time).toEqual(enTime);
	});
	test('if an invalid code is provided to number or time, they should default back to en-US', () => {
		const locale = getLocale({ number: 'fo-BR' as NumberLocaleCode, time: 'fo-BR' as TimeLocaleCode });
		expect(locale.number).toEqual(enNumber);
		expect(locale.time).toEqual(enTime);
	});
	test('should honor custom locale definitions', () => {
		const locale = getLocale({ number: frNumber as NumberLocale, time: frTime as TimeLocale });
		expect(locale.number).toEqual(frNumber);
		expect(locale.time).toEqual(frTime);
	});
});
