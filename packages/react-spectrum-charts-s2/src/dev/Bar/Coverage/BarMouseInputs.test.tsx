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
import {
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  unhoverNthElement,
} from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { OnMouseInputs } from './BarMouseInputs.story.js';

describe('Bar', () => {
  test('should display custom hover information in UI when mousing over bar items', async () => {
    render(<OnMouseInputs {...OnMouseInputs.args} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');

    // Initially no hover info should be displayed
    expect(screen.getByTestId('no-hover')).toBeInTheDocument();
    expect(screen.queryByTestId('hover-data')).not.toBeInTheDocument();

    // Hover over first bar (Chrome, 27000)
    await hoverNthElement(bars, 0);

    expect(screen.queryByTestId('no-hover')).not.toBeInTheDocument();
    let hoverData = screen.getByTestId('hover-data');
    expect(hoverData).toHaveTextContent('Previewing Chrome: 27,000 downloads');

    // Re-query bars after hover state change to get fresh DOM references
    const barsAfterHover = await findAllMarksByGroupName(chart, 'bar0');

    // Unhover first bar
    await unhoverNthElement(barsAfterHover, 0);
    expect(screen.getByTestId('no-hover')).toBeInTheDocument();
    expect(screen.queryByTestId('hover-data')).not.toBeInTheDocument();

    // Re-query bars after unhover state change for fresh DOM references
    const barsAfterUnhover = await findAllMarksByGroupName(chart, 'bar0');

    // Hover over second bar (Firefox, 8000)
    await hoverNthElement(barsAfterUnhover, 1);

    hoverData = screen.getByTestId('hover-data');
    expect(hoverData).toHaveTextContent('Previewing Firefox: 8,000 downloads');
  });
});
