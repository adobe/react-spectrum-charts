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
import { act } from '@testing-library/react';

import '../../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  unhoverNthElement,
} from '../../../../test-utils/index.js';
import * as stories from './DrawInStability.story.js';

const markNames: Record<string, string> = {
  BarSimple: 'bar0',
  BarStacked: 'bar0',
  BarHorizontal: 'bar0',
  BarDodged: 'bar0',
  BarDirectLabels: 'bar0',
  LineMultiSeries: 'line0_voronoi',
  LineStaticPoints: 'line0_voronoi',
  DonutSummaryStability: 'donut0',
  DonutSegmentLabels: 'donut0',
  ComboStability: 'combo0Bar0',
};

const { default: _meta, ...exported } = stories;

describe.each(Object.entries(exported))('%s', (name, Story) => {
  test.each([false, true])(
    'stableProps=%s: inspect and popover work before and after a parent re-render',
    async (stableProps) => {
      const args = { ...Story.args, stableProps, animations: false };
      const { rerender } = render(<Story {...args} />);
      let chart = await findChart();

      for (const pass of ['mount', 'rerender']) {
        if (pass === 'rerender') {
          rerender(<Story {...args} />);
          chart = await findChart();
        }
        const marks = await findAllMarksByGroupName(chart, markNames[name]);
        expect(marks.length).toBeGreaterThan(0);

        await hoverNthElement(marks, 0);
        expect(await screen.findByTestId('rsc-tooltip')).toBeInTheDocument();
        await unhoverNthElement(marks, 0);

        await clickNthElement(marks, 0);
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        act(() => {
          dialog.ownerDocument.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
      }
    }
  );
});
