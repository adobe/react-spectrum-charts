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
import { DateValuesWithHiddenLabels } from './TimeAxisAnnotations.story.js';

test('Date-valued custom time annotations stay positioned after resizing while time labels stay hidden', async () => {
  const onView = jest.fn<void, [View]>();
  const { container, rerender } = render(
    <DateValuesWithHiddenLabels {...DateValuesWithHiddenLabels.args} onVegaViewReady={onView} />
  );
  const expectAnnotations = async () => {
    await waitFor(() => {
      expect(onView).toHaveBeenCalled();
      const view = onView.mock.calls.at(-1)?.[0];
      expect(view?.data('axis0Annotation0_aggregate').map(({ id, center }) => ({ id, center }))).toEqual(
        expect.arrayContaining([
          { id: 'point', center: Date.UTC(2026, 0, 1) },
          { id: 'range', center: Date.UTC(2026, 0, 4) },
        ])
      );
      const icons = container.querySelectorAll('.axis0Annotation0_icon path');
      expect(icons).toHaveLength(2);
      for (const icon of icons) expect(icon.getAttribute('transform')).not.toMatch(/NaN|Infinity/);
      const labels = [...container.querySelectorAll('.role-axis-label text')];
      expect(labels.length).toBeGreaterThan(0);
      for (const label of labels) expect(label.textContent).toMatch(/^\d+$/);
    });
    return [...container.querySelectorAll('.axis0Annotation0_icon path')].map((icon) =>
      icon.getAttribute('transform')
    );
  };
  const initialPositions = await expectAnnotations();
  rerender(
    <DateValuesWithHiddenLabels {...DateValuesWithHiddenLabels.args} width={360} onVegaViewReady={onView} />
  );
  await expectAnnotations();
  await waitFor(() =>
    expect(
      [...container.querySelectorAll('.axis0Annotation0_icon path')].map((icon) => icon.getAttribute('transform'))
    ).not.toEqual(initialPositions)
  );
});
