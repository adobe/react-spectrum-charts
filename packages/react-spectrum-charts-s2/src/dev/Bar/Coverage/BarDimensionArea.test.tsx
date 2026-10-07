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
import { DIMENSION_HOVER_AREA, FADE_FACTOR } from '@spectrum-charts/constants';

import {
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  unhoverNthElement,
  waitForMarksByGroupName,
  within,
} from '../../../test-utils';
import { BasicInspectOnDimensionArea } from './BarDimensionArea.story';

describe('BasicInspectOnDimensionArea', () => {
  test('hovering dimension area should apply highlight styling and show tooltip', async () => {
    render(<BasicInspectOnDimensionArea {...BasicInspectOnDimensionArea.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const dimensionAreas = await findAllMarksByGroupName(chart, `bar0_${DIMENSION_HOVER_AREA}`);
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(dimensionAreas).toHaveLength(5);

    await hoverNthElement(dimensionAreas, 0);
    let inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    expect(within(inspect).getByText('Chrome: 27000')).toBeInTheDocument();
    await waitForMarksByGroupName(chart, 'bar0', (updatedBars) => {
      expect(updatedBars[0]).toHaveAttribute('opacity', `1`);
      expect(updatedBars[4]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    });

    await unhoverNthElement(dimensionAreas, 0);

    await hoverNthElement(bars, 4);
    await waitForMarksByGroupName(chart, 'bar0', (updatedBars) => {
      expect(updatedBars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      expect(updatedBars[4]).toHaveAttribute('opacity', `1`);
    });
    inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    expect(within(inspect).getByText('Explorer: 500')).toBeInTheDocument();
  });
});
