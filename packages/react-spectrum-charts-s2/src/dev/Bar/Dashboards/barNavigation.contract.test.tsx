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
import { fireEvent } from '@testing-library/react';

import { findChart, render, waitFor } from '../../../test-utils/index.js';
import { VariationProvider } from '../../VariationDashboard.js';
import { stubS2BrowserApis } from '../../dashboardTestUtils.js';
import { barVariations } from './bar.dashboard.js';
import { barDatasetOptions } from './barVariationData.js';

// Every bar dashboard variation must either navigate in step with what it renders, or be listed here with why it doesn't.
const UNSUPPORTED: Record<string, string> = {
  trellis: 'trellised bars',
  'trellis-vertical': 'trellised bars',
  'empty-state': 'no data to navigate',
  loading: 'no data to navigate',
};

beforeAll(stubS2BrowserApis);

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn');
});
afterEach(() => warn.mockRestore());

const warningsAbout = (text: string) =>
  warn.mock.calls.filter(([message]) => typeof message === 'string' && message.includes(text));

const renderVariation = async (id: string, dataset = 'standard') => {
  const variation = barVariations.find((candidate) => candidate.id === id);
  render(
    <VariationProvider dataset={dataset} size={360} viewMode="axesLegend" accessibleNavigation>
      {variation?.render()}
    </VariationProvider>
  );
  return (await findChart()).closest('.rsc-container') as HTMLElement;
};

const focusedLabel = (container: HTMLElement) =>
  container.querySelector('.dn-node .dn-node-text')?.getAttribute('aria-label');

test('every unsupported variation is still on the dashboard', () => {
  const ids = new Set(barVariations.map((variation) => variation.id));
  expect(Object.keys(UNSUPPORTED).filter((id) => !ids.has(id))).toEqual([]);
});

const supportedIds = barVariations.filter(({ id }) => !(id in UNSUPPORTED)).map(({ id }) => id);

describe.each(barDatasetOptions.map(({ value }) => value))('%s data', (dataset) => {
  test.each(supportedIds)('%s navigates every rendered bar and reaches one from the entry button', async (id) => {
    const container = await renderVariation(id, dataset);
    await waitFor(() => expect(container.querySelector('.dn-entry-button')).toBeTruthy());
    expect(warningsAbout('accessibleNavigation')).toEqual([]);

    (container.querySelector('.dn-entry-button') as HTMLButtonElement).click();
    await waitFor(() => expect(focusedLabel(container)).toBeTruthy());
    for (let depth = 0; depth < 3; depth++) {
      fireEvent.keyDown(container.querySelector('.dn-node') as HTMLElement, { key: 'Enter', code: 'Enter' });
    }
    expect(focusedLabel(container)).toMatch(/\S/);
  });
});

describe.each(Object.entries(UNSUPPORTED))('%s', (id, reason) => {
  test(`has no navigation (${reason})`, async () => {
    const container = await renderVariation(id).catch(() => document.body);
    expect(container.querySelector('.dn-entry-button')).toBeNull();
  });
});
