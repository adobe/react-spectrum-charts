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
import { TOOLTIP_DELAY } from '@spectrum-charts/core-s2/constants';

import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { findChart, getAllLegendEntries, hoverNthElement, render, screen } from '../../../test-utils/index.js';
import { NamedLegend } from './NamedLegend.story.js';

afterEach(() => document.body.querySelectorAll('.vg-tooltip').forEach((node) => node.remove()));

test('a named legend renders and shows its descriptions on hover', async () => {
  render(<NamedLegend {...NamedLegend.args} />);
  const chart = await findChart();
  const entries = getAllLegendEntries(chart);
  expect(entries).toHaveLength(3);

  await hoverNthElement(entries, 1);
  await new Promise((resolve) => setTimeout(resolve, TOOLTIP_DELAY));
  expect(await screen.findByTestId('rsc-tooltip')).toHaveTextContent('MacDesktop and laptop users on macOS.');
});
