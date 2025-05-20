/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Config, Locale, NumberLocale, Padding, Renderers, TimeLocale } from 'vega';

import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode, getLocale } from '@spectrum-charts/locales';

import { getExpressionFunctions } from './expressionFunctions';
import { getChartConfig } from './specUtils';

export const getVegaEmbedOptions = ({
	locale = 'en-US',
	height = 400,
	width = 600,
	padding = 0,
	renderer = 'svg',
	config,
	colorScheme = DEFAULT_COLOR_SCHEME,
}: {
	locale?: Locale | LocaleCode | { number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale };
	height?: number;
	width?: number;
	padding?: Padding;
	renderer?: Renderers;
	config?: Config;
	colorScheme?: 'light' | 'dark';
}) => {
	const expressionFunctions = getExpressionFunctions(locale);
	const { number: numberLocale, time: timeLocale } = getLocale(locale);
	const chartConfig = config ?? getChartConfig(undefined, colorScheme);

	return {
		actions: false,
		ast: true,
		expressionFunctions,
		formatLocale: numberLocale as unknown as Record<string, unknown>, // these are poorly typed by vega-embed
		height,
		width,
		padding,
		renderer,
		timeFormatLocale: timeLocale as unknown as Record<string, unknown>, // these are poorly typed by vega-embed
		config: chartConfig,
	};
};
