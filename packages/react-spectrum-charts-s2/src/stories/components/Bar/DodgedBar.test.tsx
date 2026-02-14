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
  within,
} from '../../../test-utils';
import { TooltipOnDimensionArea } from './DodgedBar.story';

describe('TooltipOnDimensionArea', () => {
  test('hovering dimension area should apply highlight styling and show tooltip', async () => {
    render(<TooltipOnDimensionArea {...TooltipOnDimensionArea.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const dimensionAreas = await findAllMarksByGroupName(chart, `bar0_${DIMENSION_HOVER_AREA}`);
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    const legendSymbols = await findAllMarksByGroupName(chart, 'role-legend-symbol');
    expect(dimensionAreas).toHaveLength(3);

    // hovering dimension area should apply highlight styling and show tooltip
    await hoverNthElement(dimensionAreas, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(within(tooltip).getByText('Chrome Downloads')).toBeInTheDocument();
    expect(bars[0]).toHaveAttribute('opacity', `1`);
    expect(bars[4]).toHaveAttribute('opacity', `${FADE_FACTOR}`);

    await unhoverNthElement(dimensionAreas, 0);

    // hovering bar should do normal stuff
    await hoverNthElement(bars, 4);
    expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    expect(bars[4]).toHaveAttribute('opacity', `1`);

    expect(legendSymbols[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    expect(legendSymbols[1]).toHaveAttribute('opacity', '1');
    expect(legendSymbols[2]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
  });
});
