/*
 * Copyright 2026 Adobe. All rights reserved.
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
    // S2 package always uses S2 colors (hex format)
    let options = getVegaEmbedOptions({ colorScheme: 'dark' });
    expect(options?.config?.text?.fill).toEqual('#DBDBDB'); // S2 dark gray-300
    options = getVegaEmbedOptions({ colorScheme: 'light' });
    expect(options?.config?.text?.fill).toEqual('#292929'); // S2 light gray-800
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
