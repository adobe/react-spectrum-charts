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
import { numberLocales } from '@spectrum-charts/locales';

import { getVegaEmbedOptions } from './vegaEmbedUtils';

describe('getVegaEmbedOptions()', () => {
	it('should return the correct options', () => {
		const options = getVegaEmbedOptions({});
		expect(options).toHaveProperty('actions', false);
		expect(options).toHaveProperty('ast', true);
		expect(options).toHaveProperty('expressionFunctions');
		expect(options).toHaveProperty('formatLocale');
		expect(options).toHaveProperty('height', 400);
		expect(options).toHaveProperty('width', 600);
		expect(options).toHaveProperty('padding', 0);
	});
	it('should use the correct color scheme', () => {
		let options = getVegaEmbedOptions({ colorScheme: 'dark' });
		expect(options?.config?.text?.fill).toEqual('rgb(235, 235, 235)');
		options = getVegaEmbedOptions({ colorScheme: 'light' });
		expect(options?.config?.text?.fill).toEqual('rgb(34, 34, 34)');
	});
	it('should default to en-US', () => {
		const enLocale = numberLocales['en-US'];
		const options = getVegaEmbedOptions({});
		expect(options?.formatLocale).toEqual(enLocale);
	});
	it('should use the correct locale if provided', () => {
		const frLocale = numberLocales['fr-FR'];
		const options = getVegaEmbedOptions({ locale: 'fr-FR' });
		expect(options?.formatLocale).toEqual(frLocale);
	});
});
