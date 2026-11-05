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
import { getNavigationLocale } from './useDataNavigator.js';

describe('getNavigationLocale()', () => {
  test('reads a locale code or the code of a split locale', () => {
    expect(getNavigationLocale('fr-FR')).toBe('fr-FR');
    expect(getNavigationLocale({ number: 'de-DE', time: 'fr-FR' })).toBe('de-DE');
    expect(getNavigationLocale({ time: 'fr-FR' })).toBe('fr-FR');
  });

  test('is undefined for locale definitions', () => {
    expect(getNavigationLocale({ number: { decimal: ',' } })).toBeUndefined();
    expect(getNavigationLocale(undefined)).toBeUndefined();
  });
});
