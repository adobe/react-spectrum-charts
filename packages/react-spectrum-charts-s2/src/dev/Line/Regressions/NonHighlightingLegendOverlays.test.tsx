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
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  findChart,
  getAllLegendEntries,
  hoverNthElement,
  render,
  unhoverNthElement,
  waitFor,
} from '../../../test-utils/index.js';
import { HoverOnlyOverlays } from './NonHighlightingLegendOverlays.story.js';

test('hover-only overlays render and clear without requiring legend highlighting', async () => {
  const { container, rerender } = render(<HoverOnlyOverlays {...HoverOnlyOverlays.args} />);
  const expectOverlayCount = async (count: number) =>
    waitFor(() => {
      expect(container.querySelectorAll('.line0 path')).toHaveLength(2);
      expect(container.querySelectorAll('.line0MetricRange0_area path')).toHaveLength(count);
      expect(container.querySelectorAll('.line0Trendline0 path')).toHaveLength(count);
      expect(container.innerHTML).not.toContain('NaN');
    });
  await expectOverlayCount(1);
  rerender(<HoverOnlyOverlays {...HoverOnlyOverlays.args} highlightedSeries={undefined} />);
  await expectOverlayCount(0);
  const chart = await findChart();
  const entries = getAllLegendEntries(chart);
  expect(entries).toHaveLength(2);
  await hoverNthElement(entries, 0);
  await expectOverlayCount(0);
  await unhoverNthElement(entries, 0);
  rerender(<HoverOnlyOverlays {...HoverOnlyOverlays.args} highlightedSeries="Email" />);
  await expectOverlayCount(1);
  rerender(<HoverOnlyOverlays {...HoverOnlyOverlays.args} highlightedSeries={undefined} />);
  await expectOverlayCount(0);
});
