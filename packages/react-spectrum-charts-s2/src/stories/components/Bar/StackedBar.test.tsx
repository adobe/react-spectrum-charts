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
  getAllLegendSymbols,
  hoverNthElement,
  render,
  screen,
  unhoverNthElement,
  waitFor,
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

  // Regression: a stack's aria-label should read the metric axis's title ("Downloads"), not the
  // raw metric field name ("value") — RscChart.tsx finds the Axis positioned on the metric side.
  test("a stack's label includes its summed metric total, using the metric axis's title", async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first stack
    // data-navigator sets aria-label on a nested `.dn-node-text` child, not on `.dn-node` itself.
    const label = dnNode().querySelector('.dn-node-text')?.getAttribute('aria-label');
    expect(label).toMatch(/Contains \d+ bars?, [\d,]+ Downloads\./);
  });

  // Generality: the metric axis is on 'bottom'/'top' (not 'left'/'right') once orientation flips to
  // horizontal — RscChart.tsx's Axis lookup must follow, not stay hardcoded to the vertical case.
  test("still finds the metric axis's title when the bar is horizontal", async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} orientation="horizontal" />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first stack
    const label = dnNode().querySelector('.dn-node-text')?.getAttribute('aria-label');
    expect(label).toMatch(/Contains \d+ bars?, [\d,]+ Downloads\./);
  });

  // Feature: once drilled into a segment, up/down move through every segment in the chart
  // (crossing stack boundaries once the current stack is exhausted), and left/right jump to the
  // same-color segment in the adjacent stack instead of a same-stack sibling.
  test('once drilled into a segment, up/down move through the whole chart and left/right jump to the same series in the adjacent stack', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first stack (Chrome)
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // stack -> first segment (Chrome/Windows)
    const chromeWindowsId = dnNode().id;

    fireEvent.keyDown(dnNode(), { key: 'ArrowDown', code: 'ArrowDown' }); // down within Chrome
    const chromeMacId = dnNode().id;
    expect(chromeMacId).not.toBe(chromeWindowsId);

    fireEvent.keyDown(dnNode(), { key: 'ArrowUp', code: 'ArrowUp' }); // back up to the first segment
    expect(dnNode().id).toBe(chromeWindowsId);

    // barSeriesData is Chrome[Windows,Mac,Other] then Firefox[Windows,Mac,Other] then Safari[...] —
    // three downs from Chrome/Windows exhausts Chrome's own segments and crosses into Firefox.
    fireEvent.keyDown(dnNode(), { key: 'ArrowDown', code: 'ArrowDown' });
    fireEvent.keyDown(dnNode(), { key: 'ArrowDown', code: 'ArrowDown' });
    fireEvent.keyDown(dnNode(), { key: 'ArrowDown', code: 'ArrowDown' });
    const crossedStackId = dnNode().id;
    expect(crossedStackId).not.toBe(chromeWindowsId);
    expect(crossedStackId).not.toBe(chromeMacId);
    expect(crossedStackId.startsWith('Firefox')).toBe(true);

    fireEvent.keyDown(dnNode(), { key: 'ArrowRight', code: 'ArrowRight' }); // same series, adjacent (Safari) stack
    const rightJumpId = dnNode().id;
    expect(rightJumpId).not.toBe(crossedStackId);

    fireEvent.keyDown(dnNode(), { key: 'ArrowLeft', code: 'ArrowLeft' }); // back to the same series in the previous stack
    expect(dnNode().id).toBe(crossedStackId);
  });

  // Regression test: navGeometryFields (RscChart.tsx) must default dimension/metric/type the same
  // way Bar itself does, since this story (like most) never sets them explicitly — otherwise the
  // stacked segment's position is computed from the pre-stack metric field, or not at all.
  test('focusing and activating a stacked segment dims other segments/legend entries and anchors the popover to real geometry', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> stack
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // stack -> segment (leaf)

    const segments = await findAllMarksByGroupName(chart, 'bar0');
    expect(segments.some((segment) => segment.getAttribute('opacity') === '1')).toBe(true);
    expect(segments.some((segment) => segment.getAttribute('opacity') === `${FADE_FACTOR}`)).toBe(true);

    const legendSymbols = getAllLegendSymbols(chart);
    expect(legendSymbols.some((symbol) => symbol.getAttribute('opacity') === '1')).toBe(true);
    expect(legendSymbols.some((symbol) => symbol.getAttribute('opacity') === `${FADE_FACTOR}`)).toBe(true);

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // activate -> popover opens
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const anchor = screen.getByTestId('rsc-popover-anchor');
    // Degenerate (pre-fix) geometry collapses to a zeroed box anchored at the chart's own origin.
    expect(anchor.style.width).not.toBe('0px');
    expect(anchor.style.height).not.toBe('0px');
  });

  // Regression test: same navGeometryFields defaulting as above, but for ChartInspect's tooltip
  // (onNavLeafFocus) rather than ChartPopover's anchor — a separate code path in RscChart.tsx that
  // relies on the same geometry fix, and previously rendered the tooltip at a fixed/degenerate
  // position regardless of which segment was focused.
  test('focusing different stacked segments moves the ChartInspect tooltip to each segment position', async () => {
    render(<AccessibleNavigation {...AccessibleNavigation.args} />);
    const chart = await findChart();
    const container = chart.closest('.rsc-container') as HTMLElement;

    const entryButton = container.querySelector('button') as HTMLButtonElement;
    entryButton.click();
    const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> stack
    fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // stack -> segment (leaf)

    const tooltip = () => document.getElementById('vg-tooltip-element') as HTMLElement;
    await waitFor(() => expect(tooltip()).toHaveClass('visible'));
    const firstPosition = { top: tooltip().style.top, left: tooltip().style.left };
    expect(firstPosition).not.toEqual({ top: '', left: '' });

    fireEvent.keyDown(dnNode(), { key: 'ArrowRight', code: 'ArrowRight' }); // move to the sibling segment in the same stack

    await waitFor(() => {
      const secondPosition = { top: tooltip().style.top, left: tooltip().style.left };
      expect(secondPosition).not.toEqual(firstPosition);
    });
  });

  // Regression test: Enter-to-activate resolves the mark name via RscChart's navResolvedName, not
  // the raw (usually-absent) name prop — this Bar deliberately omits `name` to prove that path works.
  // Also covers onClick firing alongside the popover, matching a real click's dual-callback behavior.
  test('Enter on a focused segment opens its ChartPopover and fires onClick, even with no explicit name prop', async () => {
    const onClick = jest.fn();
    const UnnamedBarWithPopover = (): ReactElement => {
      const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600, accessibleNavigation: true });
      return (
        <Chart {...chartProps}>
          <Axis position="bottom" baseline title="Browser" />
          <Axis position="left" grid title="Downloads" />
          <Bar dimension="browser" color="operatingSystem" onClick={onClick}>
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
    expect(onClick).toHaveBeenCalledTimes(1);
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
