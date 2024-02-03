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

const numberLocaleCodes = [
	'ar-AE',
	'ar-BH',
	'ar-DJ',
	'ar-DZ',
	'ar-EG',
	'ar-IL',
	'ar-IQ',
	'ar-JO',
	'ar-KM',
	'ar-KW',
	'ar-LB',
	'ar-LY',
	'ar-MA',
	'ar-OM',
	'ar-PS',
	'ar-QA',
	'ar-SA',
	'ar-SD',
	'ar-SO',
	'ar-SS',
	'ar-SY',
	'ar-TD',
	'ar-TN',
	'ar-YE',
	'ca-ES',
	'cs-CZ',
	'da-DK',
	'de-CH',
	'de-DE',
	'en-CA',
	'en-GB',
	'en-IE',
	'en-IN',
	'en-US',
	'es-BO',
	'es-ES',
	'es-MX',
	'fi-FI',
	'fr-CA',
	'fr-FR',
	'he-IL',
	'hu-HU',
	'it-IT',
	'ja-JP',
	'ko-KR',
	'mk-MK',
	'nl-NL',
	'pl-PL',
	'pt-BR',
	'pt-PT',
	'ru-RU',
	'sl-SI',
	'sv-SE',
	'uk-UA',
	'zh-CN',
] as const;

/** locale code used for default number locales */
export type NumberLocaleCode = (typeof numberLocaleCodes)[number];

const timeLocaleCodes = [
	'ar-EG',
	'ar-SY',
	'ca-ES',
	'cs-CZ',
	'da-DK',
	'de-CH',
	'de-DE',
	'en-CA',
	'en-GB',
	'en-US',
	'es-ES',
	'es-MX',
	'fa-IR',
	'fi-FI',
	'fr-CA',
	'fr-FR',
	'he-IL',
	'hr-HR',
	'hu-HU',
	'it-IT',
	'ja-JP',
	'ko-KR',
	'mk-MK',
	'nb-NO',
	'nl-BE',
	'nl-NL',
	'pl-PL',
	'pt-BR',
	'ru-RU',
	'sv-SE',
	'tr-TR',
	'uk-UA',
	'zh-CN',
	'zh-TW',
] as const;

/** locale code used for default time locales */
export type TimeLocaleCode = (typeof timeLocaleCodes)[number];

const localeCodes = [
	'ar-EG',
	'ar-SY',
	'ca-ES',
	'cs-CZ',
	'da-DK',
	'de-CH',
	'de-DE',
	'en-CA',
	'en-GB',
	'en-US',
	'es-ES',
	'es-MX',
	'fi-FI',
	'fr-CA',
	'fr-FR',
	'he-IL',
	'hu-HU',
	'it-IT',
	'ja-JP',
	'ko-KR',
	'mk-MK',
	'nl-NL',
	'pl-PL',
	'pt-BR',
	'ru-RU',
	'sv-SE',
	'uk-UA',
	'zh-CN',
] as const;

/** locale code used for default number and time locales */
export type LocaleCode = (typeof localeCodes)[number];
