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
import { waitFor } from '@testing-library/react';
import { View } from 'vega';

import { spectrum2Colors } from '@spectrum-charts/core-s2/tokens';

import { Chart } from '../../Chart.js';
import { Legend } from '../../components/index.js';
import { Donut } from '../../pre-alpha/components/Donut/index.js';
import { basicDonutData } from '../../storyShared/Donut/data.js';
import {
  allElementsHaveAttributeValue,
  findAllMarksByGroupName,
  findChart,
  render,
  screen,
} from '../../test-utils/index.js';
import { Basic, EmptyState } from './Features/DonutFeatures.story.js';

describe('Donut', () => {
  test.each([
    { heightCase: 'omitted', heightProps: {}, width: 340, position: 'left' as const },
    { heightCase: 'omitted', heightProps: {}, width: 340, position: 'right' as const },
    { heightCase: 'undefined', heightProps: { height: undefined }, width: 140, position: 'left' as const },
    { heightCase: 'undefined', heightProps: { height: undefined }, width: 140, position: 'right' as const },
  ])(
    'does not reserve surplus space with height $heightCase and a $position legend',
    async ({ heightProps, width, position }) => {
      const onVegaViewReady = jest.fn<void, [View]>();
      render(
        <Chart
          data={basicDonutData}
          width={width}
          {...heightProps}
          animations={false}
          onVegaViewReady={onVegaViewReady}
        >
          <Donut name="unsetHeightDonut" color="browser" metric="count" />
          <Legend position={position} title="Browser" />
        </Chart>
      );
      const chart = await findChart();
      await waitFor(() => expect(onVegaViewReady).toHaveBeenCalled());
      const view = onVegaViewReady.mock.calls[0][0];
      const [left, right] = await Promise.all([
        findAllMarksByGroupName(chart, 'rscDonutLegendSpacerLeft'),
        findAllMarksByGroupName(chart, 'rscDonutLegendSpacerRight'),
      ]);
      expect(left).toHaveLength(1);
      expect(right).toHaveLength(1);
      await waitFor(() => {
        expect(view.signal('rscDonutLegendMargin')).toBe(0);
        expect(left[0]).toHaveAttribute('d', expect.stringMatching(/^M-?0,0h0v0h0Z$/));
        expect(right[0]).toHaveAttribute('d', `M${view.width()},0h0v0h0Z`);
        // Legend stroke bounds round the measured extent to whole pixels.
        expect(view.width()).toBeGreaterThan(width - view.signal('rscDonutLegendExtent') - 2);
      });
    }
  );

  // Donut is not a real React component. This is test just provides test coverage for sonarqube
  test('Donut pseudo element', () => {
    render(<Donut />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // donut data has 7 segments
    const bars = await findAllMarksByGroupName(chart, 'donut0');
    expect(bars.length).toEqual(7);

    // empty state ring should be hidden since there is data
    const emptyStateRings = await findAllMarksByGroupName(chart, 'donut0_emptyState');
    expect(allElementsHaveAttributeValue(emptyStateRings, 'opacity', '0')).toBe(true);
  });

  test('EmptyState renders a gray ring with the value in the center when all values are 0', async () => {
    render(<EmptyState {...EmptyState.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // the empty state ring should be visible and gray-200
    const emptyStateRings = await findAllMarksByGroupName(chart, 'donut0_emptyState');
    expect(emptyStateRings.length).toEqual(1);
    expect(emptyStateRings[0]).toHaveAttribute('fill', spectrum2Colors.light['gray-200']);
    expect(emptyStateRings[0]).toHaveAttribute('opacity', '1');

    // the donut segments should be hidden
    const segments = await findAllMarksByGroupName(chart, 'donut0');
    expect(allElementsHaveAttributeValue(segments, 'opacity', '0')).toBe(true);

    // the summary value should display 0
    expect(await screen.findByText('0')).toBeInTheDocument();
    expect(screen.getByText('Visitors')).toBeInTheDocument();

    // no NaN segment labels should be displayed
    expect(screen.queryAllByText(/NaN/)).toHaveLength(0);
  });
});
