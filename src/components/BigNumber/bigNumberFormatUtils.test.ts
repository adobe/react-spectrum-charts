import { getLocale } from 'utils/locale';

import { getFormattedString } from './bigNumberFormatUtils';

describe('Big Number format utility functions', () => {
	describe('getFormattedString', () => {
		const US_NUMBER_LOCALE = getLocale('en-US').number;
		const DE_NUMBER_LOCALE = getLocale('de-DE').number;

		const COMMA_FORMAT = ',';
		const CURRENCY_FORMAT = '$,.2f';

		test('should use % format when numberType is percentage', () => {
			const formattedString = getFormattedString(0.123, 'percentage', undefined, US_NUMBER_LOCALE);
			expect(formattedString).toBe('12.3%');
		});

		test('should not format when numberFormat is undefined', () => {
			const formattedString = getFormattedString(123456, 'linear', undefined, US_NUMBER_LOCALE);
			expect(formattedString).toBe('123456');
		});

		test('should format according to default locale when numberLocale is undefined', () => {
			const formattedString = getFormattedString(123456, 'linear', COMMA_FORMAT, undefined);
			expect(formattedString).toBe('123,456');
		});

		test('should format when locale is en-US and numberFormat is basic comma format', () => {
			const formattedString = getFormattedString(123456, 'linear', COMMA_FORMAT, US_NUMBER_LOCALE);
			expect(formattedString).toBe('123,456');
		});

		test('should format when locale is de-DE and numberFormat is currency format', () => {
			const formattedString = getFormattedString(1234.56, 'linear', CURRENCY_FORMAT, DE_NUMBER_LOCALE);
			expect(formattedString).toBe('1.234,56 €');
		});
	});
});
