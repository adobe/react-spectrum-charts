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
import { View } from 'vega';

import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { render, waitFor } from '../../../test-utils/index.js';
import { CustomMetricAxis, DualMetricAxes } from './MetricRangeGeometry.story.js';

test.each([
  { name: 'custom', Story: CustomMetricAxis, scale: 'customMetric', lower: 12, series: undefined },
  { name: 'dual', Story: DualMetricAxes, scale: 'yLinearSecondary', lower: 2700, series: 'Secondary' },
])('$name-axis bands preserve alignment, curves and gaps through resize', async ({ Story, scale, lower, series }) => {
  const onView = jest.fn<void, [View]>();
  const { container, rerender } = render(<Story {...Story.args} onVegaViewReady={onView} />);
  const expectGeometry = async () => {
    await waitFor(() => {
      expect(onView).toHaveBeenCalled();
      const view = onView.mock.calls.at(-1)?.[0];
      const area = container.querySelector('.line0MetricRange0_area path')?.getAttribute('d');
      expect(area).toBeTruthy();
      expect(area).not.toMatch(/NaN|Infinity/);
      expect(area?.match(/M/g)).toHaveLength(2);
      expect(area).toContain('C');
      expect(Number(area?.match(/^M[^,]+,(-?[\d.]+)/)?.[1])).toBeCloseTo(view?.scale(scale)(lower), 3);
      const linePaths = [...container.querySelectorAll('.line0 path')].map((path) => path.getAttribute('d'));
      const rangeLine = container.querySelector('.line0MetricRange0_line path')?.getAttribute('d');
      expect(rangeLine).toBeTruthy();
      expect(linePaths).toContain(rangeLine);
    });
    return container.querySelector('.line0MetricRange0_area path')?.getAttribute('d');
  };
  const originalPath = await expectGeometry();
  rerender(<Story {...Story.args} width={360} onVegaViewReady={onView} />);
  await expectGeometry();
  await waitFor(() =>
    expect(container.querySelector('.line0MetricRange0_area path')?.getAttribute('d')).not.toBe(originalPath)
  );
  if (series) {
    rerender(<Story {...Story.args} width={360} highlightedSeries={undefined} onVegaViewReady={onView} />);
    await waitFor(() => expect(container.querySelector('.line0MetricRange0_area path')).toBeNull());
    rerender(<Story {...Story.args} width={360} highlightedSeries="Primary" onVegaViewReady={onView} />);
    await waitFor(() => {
      const path = container.querySelector('.line0MetricRange0_area path')?.getAttribute('d');
      const view = onView.mock.calls.at(-1)?.[0];
      expect(path?.match(/M/g)).toHaveLength(2);
      expect(Number(path?.match(/^M[^,]+,(-?[\d.]+)/)?.[1])).toBeCloseTo(view?.scale('yLinearPrimary')(12), 3);
    });
  }
});
