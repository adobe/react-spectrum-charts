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
import { ReactElement } from 'react';

import { fireEvent } from '@testing-library/react';

import { DIMENSION_HOVER_AREA, FADE_FACTOR } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import {
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  unhoverNthElement,
  within,
} from '../../../test-utils';
import { AccessibleNavigation, InspectOnDimensionArea } from './StackedBar.story';
import { barSeriesData } from './data';

describe('AccessibleNavigation', () => {
  test('keyboard navigation moves focus and updates the corresponding focus ring at each level', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    expect(entryButton).toBeTruthy();
    entryButton.click();

    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;
    expect(dnNode()).toBeTruthy();

    const [chartRing] = await findAllMarksByGroupName(chart, 'chartFocusRing');
    expect(chartRing).toHaveAttribute('opacity', '1');

    // drill into the first stack (division level)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' });
    const stackRings = await findAllMarksByGroupName(chart, 'bar0_stackFocusRing');
    expect(stackRings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);

    // drill into the first segment (leaf)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' });
    const segmentRings = await findAllMarksByGroupName(chart, 'bar0_focusRing');
    expect(segmentRings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);

    // arrow key moves focus to a sibling node
    const focusedIdBefore = dnNode().id;
    fireEvent.keyDown(dnNode(), { key: 'ArrowRight', code: 'ArrowRight' });
    expect(dnNode().id).not.toBe(focusedIdBefore);
  });

  // Regression test: Enter-to-activate resolves the mark name via RscChart's navResolvedName, not
  // the raw (usually-absent) name prop — this Bar deliberately omits `name` to prove that path works.
  test('Enter on a focused segment opens its ChartPopover even when Bar has no explicit name prop', async () => {
    const UnnamedBarWithPopover = (): ReactElement => {
      const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600, accessibleNavigation: true });
      return (
        <Chart {...chartProps}>
          <Axis position="bottom" baseline title="Browser" />
          <Axis position="left" grid title="Downloads" />
          <Bar dimension="browser" color="operatingSystem">
            <ChartPopover width="auto">{(datum: Datum) => <div>{String(datum.operatingSystem)}</div>}</ChartPopover>
          </Bar>
          <Legend title="Operating system" />
        </Chart>
      );
    };
    render(<UnnamedBarWithPopover />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> stack
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // stack -> segment (leaf)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // activate -> popover opens
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    expect(screen.getByTestId('rsc-popover-content')).toBeInTheDocument();
  });
});

describe('InspectOnDimensionArea', () => {
  test('hovering dimension area should apply highlight styling and show tooltip', async () => {
    render(<InspectOnDimensionArea {...InspectOnDimensionArea.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const dimensionAreas = await findAllMarksByGroupName(chart, `bar0_${DIMENSION_HOVER_AREA}`);
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(dimensionAreas).toHaveLength(3);

    // hovering dimension area should apply highlight styling and show tooltip
    await hoverNthElement(dimensionAreas, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    expect(within(inspect).getByText('Chrome Downloads')).toBeInTheDocument();
    expect(bars[0]).toHaveAttribute('opacity', `1`);
    expect(bars[4]).toHaveAttribute('opacity', `${FADE_FACTOR}`);

    await unhoverNthElement(dimensionAreas, 0);

    // hovering bar should do normal stuff
    await hoverNthElement(bars, 4);
    expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    expect(bars[4]).toHaveAttribute('opacity', `1`);
  });
});
