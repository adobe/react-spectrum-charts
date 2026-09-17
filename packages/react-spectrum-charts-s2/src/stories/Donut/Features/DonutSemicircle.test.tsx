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
import { FADE_FACTOR } from '@spectrum-charts/constants';
import { sequentialCerulean5 } from '@spectrum-charts/themes';

import {
  allElementsHaveAttributeValue,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  waitFor,
} from '../../../test-utils';
import { SemicircleBoolean, SemicircleOrdinal } from './DonutSemicircle.story';

describe('DonutSemicircle', () => {
  test('passes hideValue to the boolean DonutSummary', async () => {
    render(<SemicircleBoolean {...SemicircleBoolean.args} hideValue />);
    await findChart();

    expect(screen.queryByText('68%')).not.toBeInTheDocument();
    expect(screen.getByText('Success rate')).toBeInTheDocument();
  });

  test('keeps ordinal responses in source order with a light-to-dark sequential palette', async () => {
    render(<SemicircleOrdinal {...SemicircleOrdinal.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    expect(segments.map((segment) => segment.getAttribute('fill'))).toEqual([
      sequentialCerulean5[1],
      sequentialCerulean5[0],
      ...sequentialCerulean5.slice(2),
    ]);
  });

  test('hovering a semicircle segment fades the other segments', async () => {
    render(<SemicircleOrdinal {...SemicircleOrdinal.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await hoverNthElement(segments, 0);
    await waitFor(() => {
      expect(segments[0]).toHaveAttribute('opacity', '1');
      expect(allElementsHaveAttributeValue(segments.slice(1), 'opacity', FADE_FACTOR)).toBe(true);
    });
  });
});
