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
import { AlternateSegments, ForecastSegments } from './CustomTimeSegments.story.js';

test.each([
  { name: 'alternate', Story: AlternateSegments, segmentIds: [0, 0, 1, 1, 2, 2, 3, 3], dashedCount: 2 },
  { name: 'forecast', Story: ForecastSegments, segmentIds: [0, 0, 0, 0, 1, 1, 1, 1], dashedCount: 1 },
])('$name segments follow the custom time field', async ({ Story, segmentIds, dashedCount }) => {
  const onView = jest.fn<void, [View]>();
  const { container } = render(<Story {...Story.args} onVegaViewReady={onView} />);
  await waitFor(() => {
    expect(onView).toHaveBeenCalled();
    const view = onView.mock.calls.at(-1)?.[0];
    const segments = [...(view?.data('line0_segmented') ?? [])].sort((a, b) => a.timestamp - b.timestamp);
    expect(segments.map((row) => row.line0_segmentId)).toEqual(segmentIds);
    const paths = [...container.querySelectorAll('.line0 path')];
    expect(paths).toHaveLength(dashedCount * 2);
    expect(paths.filter((path) => path.getAttribute('stroke-dasharray'))).toHaveLength(dashedCount);
    for (const path of paths) expect(path.getAttribute('d')).not.toMatch(/NaN|undefined/);
  });
});
