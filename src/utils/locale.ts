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

import { numberLocale } from 'locales/numberLocales';
import { timeLocale } from 'locales/timeLocales';
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
