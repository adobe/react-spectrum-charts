import { BigNumberProps } from 'types';
import { NumberLocale } from 'vega';
import { numberFormatLocale } from 'vega-format';

const createD3LocaleFormatter = (numberLocale: NumberLocale) => {
	// Create a custom d3 locale based on the provided NumberLocale
	return numberFormatLocale({
		decimal: numberLocale.decimal,
		thousands: numberLocale.thousands,
		grouping: numberLocale.grouping,
		currency: numberLocale.currency,
	});
};

const defaultNumberLocale: NumberLocale = {
	decimal: '.',
	thousands: ',',
	grouping: [3],
	currency: ['$', ''],
};

export const getFormattedString = (
	value: number,
	numberLocale: NumberLocale | undefined,
	numberFormat: string | undefined,
	numberType: BigNumberProps['numberType']
): string => {
	// Create a formatter based on the provided locale
	const d3Formatter = createD3LocaleFormatter(numberLocale ? numberLocale : defaultNumberLocale);

	if (numberType === 'percentage') {
		return d3Formatter.format('~%')(value);
	}

	if (Math.abs(value) >= 1000) {
		// Format in scientific notation with B instead of G (e.g., 1K, 20M, 1.3B)
		let formattedValue = d3Formatter.format('.3s')(value);
		return formattedValue.replace('G', 'B').toUpperCase();
	}

	// Format with commas for thousands, etc., or use the provided numberFormat
	return numberFormat ? d3Formatter.format(numberFormat)(value) : d3Formatter.format(',')(value);
};
