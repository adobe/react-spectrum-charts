import { LocaleCode, NumberLocaleCode, TimeLocaleCode } from 'types/locales';
import { NumberLocale, TimeLocale } from 'vega';

import enNumber from '../locales/numberLocales/en-US.json';
import frNumber from '../locales/numberLocales/fr-FR.json';
import enTime from '../locales/timeLocales/en-US.json';
import frTime from '../locales/timeLocales/fr-FR.json';
import { getLocale } from './locale';

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
