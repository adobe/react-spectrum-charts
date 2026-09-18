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
import { findChart, render } from '../../../../test-utils';
import { Currency, CustomFormat, Percentage, ShortCurrency, ShortNumber } from './BulletNumberFormat.story';

describe('Bullet NumberFormat', () => {
  test('ShortNumber renders properly', async () => {
    render(<ShortNumber {...ShortNumber.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('ShortCurrency renders properly', async () => {
    render(<ShortCurrency {...ShortCurrency.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('Currency renders properly', async () => {
    render(<Currency {...Currency.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('CustomFormat renders properly', async () => {
    render(<CustomFormat {...CustomFormat.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('Percentage renders properly', async () => {
    render(<Percentage {...Percentage.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });
});
