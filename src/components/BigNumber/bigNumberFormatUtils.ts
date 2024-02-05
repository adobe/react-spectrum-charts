import { BigNumberProps } from 'types';
import { NumberLocale } from 'vega';
import { numberFormatLocale } from 'vega-format';

export const getFormattedString = (
	value: number,
	numberLocale: NumberLocale | undefined,
	numberFormat: string | undefined,
	numberType: BigNumberProps['numberType']
): string => {
	const formatter = numberFormatLocale(numberLocale);

	if (numberType === 'percentage') {
		return formatter.format('~%')(value);
	}

	if (Math.abs(value) >= 1000) {
		// Format in scientific notation with B instead of G (e.g., 1K, 20M, 1.3B)
		const formattedValue = formatter.format('.3s')(value);
		return formattedValue.replace('G', 'B').toUpperCase();
	}

	// Format with commas for thousands, etc., or use the provided numberFormat
	return numberFormat ? formatter.format(numberFormat)(value) : formatter.format(',')(value);
};
