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
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  render,
  screen,
} from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { FewActions } from './ChartActionBarTests.story.js';

// jsdom doesn't implement the Pointer Events capture API used for dragging.
beforeAll(() => {
  HTMLElement.prototype.setPointerCapture = jest.fn();
});

describe('ChartActionBar tests', () => {
  test('does not show an overflow menu when all actions fit', async () => {
    render(<FewActions {...FewActions.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    await screen.findByTestId('rsc-action-bar');
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });
});
