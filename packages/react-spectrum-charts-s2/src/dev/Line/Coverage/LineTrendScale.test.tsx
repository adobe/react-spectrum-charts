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
import { render, screen } from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { LinearTrendScale, TrendScale } from './LineTrendScale.story.js';

describe('Line', () => {
  test('Trend scale renders', async () => {
    render(<TrendScale {...TrendScale.args} />);
    expect(await screen.findByRole('graphics-document')).toBeInTheDocument();
  });

  test('Linear scale renders', async () => {
    render(<LinearTrendScale {...LinearTrendScale.args} />);
    expect(await screen.findByRole('graphics-document')).toBeInTheDocument();
    // if the linear axis isn't set correctly, 14 won't be on the x-axis
    expect(await screen.findByText('14')).toBeInTheDocument();
  });
});
