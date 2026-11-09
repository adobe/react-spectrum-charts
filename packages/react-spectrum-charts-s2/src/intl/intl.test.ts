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
import { numberLocales } from '@spectrum-charts/core-s2/locales';

import { formatMessage, getMessageLocale } from './index.js';

describe('getMessageLocale()', () => {
  test('uses a locale code directly', () => {
    expect(getMessageLocale('fr-FR')).toBe('fr-FR');
  });

  test('uses the number locale code, then the time locale code', () => {
    expect(getMessageLocale({ number: 'de-DE', time: 'fr-FR' })).toBe('de-DE');
    expect(getMessageLocale({ time: 'fr-FR' })).toBe('fr-FR');
  });

  test('falls back to en-US for missing or object-only locales', () => {
    expect(getMessageLocale()).toBe('en-US');
    expect(getMessageLocale({ number: numberLocales['fr-FR'] })).toBe('en-US');
  });
});

describe('formatMessage()', () => {
  test('interpolates and pluralizes variables', () => {
    expect(formatMessage('en-US', 'navigation.axisDescription', { axisName: 'Browser', count: 1 })).toBe(
      'Browser axis. Contains 1 tick value. Use the left and right arrow keys to browse.'
    );
  });

  test('falls back to English for locales without a translation', () => {
    expect(formatMessage('ja-JP', 'chart.emptyState')).toBe('No data found');
  });
});
