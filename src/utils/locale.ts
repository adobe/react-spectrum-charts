import { numberLocale } from 'locales/numberLocales/numberLocales';
import { timeLocale } from 'locales/timeLocales/timeLocales';
import { ChartProps } from 'types';
import { NumberLocaleCode, TimeLocaleCode } from 'types/locales';
import { Locale, NumberLocale, TimeLocale } from 'vega';

export const getLocale = (locale: ChartProps['locale'] = 'en-US'): Locale => {
	if (typeof locale === 'string') {
		// if the locale is a string, we assume that it is a locale code and get the locale from the locale files
		return {
			number: numberLocale[locale] ?? numberLocale['en-US'],
			time: timeLocale[locale] ?? timeLocale['en-US'],
		};
	}

	return {
		number: getNumberLocale(locale.number),
		time: getTimeLocale(locale.time),
	};
};

const getNumberLocale = (locale: NumberLocaleCode | NumberLocale | undefined): NumberLocale | undefined => {
	if (typeof locale === 'string') {
		// if the locale is a string, we assume that it is a locale code and get the locale from the locale files
		return numberLocale[locale] ?? numberLocale['en-US'];
	}
	return locale;
};

const getTimeLocale = (locale: TimeLocaleCode | TimeLocale | undefined): TimeLocale | undefined => {
	if (typeof locale === 'string') {
		// if the locale is a string, we assume that it is a locale code and get the locale from the locale files
		return timeLocale[locale] ?? timeLocale['en-US'];
	}
	return locale;
};
