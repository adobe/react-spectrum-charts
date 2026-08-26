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
import { Axis, Bar } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  rightClickNthElement,
  screen,
  unhoverNthElement,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  AccessibleNavigation,
  BarWithUTCDatetimeFormat,
  Basic,
  OnClick,
  OnMouseInputs,
  Opacity,
  PaddingRatio,
  InspectOnDimensionArea,
  WithInspect,
} from './Bar.story';
import { Color, DodgedStacked } from './DodgedBar.story';
import { AccessibleNavigationNoInspect, Basic as StackedBasic } from './StackedBar.story';
import { barData } from './data';

describe('Bar', () => {
  // Bar is not a real React component. This is test just provides test coverage for sonarqube
  test('Bar pseudo element', () => {
    render(<Bar />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(5);
  });

  test('Opacity renders properly', async () => {
    render(<Opacity {...Opacity.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars[0].getAttribute('fill-opacity')).toEqual('0.75');
  });

  test('Padding Ratio renders properly', async () => {
    render(<PaddingRatio {...PaddingRatio.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(5);
  });


  test('Dodged Basic renders properly', async () => {
    render(<Color {...Color.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(9);
  });

  test('Dodged Stacked renders properly', async () => {
    render(<DodgedStacked {...DodgedStacked.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(18);
  });

  test('Stacked Basic renders properly', async () => {
    render(<StackedBasic {...StackedBasic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(9);
  });

  test('Bar with UTC date on dimension renders properly', async () => {
    render(<BarWithUTCDatetimeFormat {...BarWithUTCDatetimeFormat.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(6);
  });

  test('should call onClick callback when selecting a bar item', async () => {
    const onClick = jest.fn();
    render(<OnClick {...OnClick.args} onClick={onClick} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');

    await clickNthElement(bars, 0);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining(barData[0]));

    await clickNthElement(bars, 1);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining(barData[1]));

    await clickNthElement(bars, 2);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining(barData[2]));

    await clickNthElement(bars, 3);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining(barData[3]));

    await clickNthElement(bars, 4);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining(barData[4]));
  });

  test('should call onContextMenu callback when right-clicking a bar item', async () => {
    const onContextMenu = jest.fn();
    render(<OnClick {...OnClick.args} onContextMenu={onContextMenu} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');

    await rightClickNthElement(bars, 0);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining(barData[0])
    );
    expect(onContextMenu.mock.calls[0][0]).toMatchObject(
      expect.objectContaining({ clientX: expect.any(Number), clientY: expect.any(Number) })
    );
  });

  test('should call onMouseOver and onMouseOut callbacks when hovering bar items', async () => {
    const onMouseOver = jest.fn();
    const onMouseOut = jest.fn();
    render(<Basic {...Basic.args} onMouseOver={onMouseOver} onMouseOut={onMouseOut} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');

    await hoverNthElement(bars, 0);
    expect(onMouseOver).toHaveBeenCalledWith(expect.objectContaining(barData[0]));

    await unhoverNthElement(bars, 0);
    expect(onMouseOut).toHaveBeenCalledWith(expect.objectContaining(barData[0]));
  });

  test('should display custom hover information in UI when mousing over bar items', async () => {
    render(<OnMouseInputs {...OnMouseInputs.args} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');

    // Initially no hover info should be displayed
    expect(screen.getByTestId('no-hover')).toBeInTheDocument();
    expect(screen.queryByTestId('hover-data')).not.toBeInTheDocument();

    // Hover over first bar (Chrome, 27000)
    await hoverNthElement(bars, 0);

    expect(screen.queryByTestId('no-hover')).not.toBeInTheDocument();
    let hoverData = screen.getByTestId('hover-data');
    expect(hoverData).toBeInTheDocument();

    const firstBarData = JSON.parse(hoverData.textContent || '{}');
    expect(firstBarData.browser).toBe('Chrome');
    expect(firstBarData.downloads).toBe(27000);
    expect(firstBarData.percentLabel).toBe('53.1%');
    expect(firstBarData.rscMarkId).toBe(1);
    expect(firstBarData.downloads0).toBe(0);
    expect(firstBarData.downloads1).toBe(27000);
    expect(firstBarData.rscStackId).toBe('Chrome');

    // Re-query bars after hover state change to get fresh DOM references
    const barsAfterHover = await findAllMarksByGroupName(chart, 'bar0');

    // Unhover first bar
    await unhoverNthElement(barsAfterHover, 0);
    expect(screen.getByTestId('no-hover')).toBeInTheDocument();
    expect(screen.queryByTestId('hover-data')).not.toBeInTheDocument();

    // Re-query bars after unhover state change for fresh DOM references
    const barsAfterUnhover = await findAllMarksByGroupName(chart, 'bar0');

    // Hover over second bar (Firefox, 8000)
    await hoverNthElement(barsAfterUnhover, 1);

    hoverData = screen.getByTestId('hover-data');
    expect(hoverData).toBeInTheDocument();

    const secondBarData = JSON.parse(hoverData.textContent || '{}');
    expect(secondBarData.browser).toBe('Firefox');
    expect(secondBarData.downloads).toBe(8000);
    expect(secondBarData.percentLabel).toBe('15.7%');
    expect(secondBarData.rscMarkId).toBe(2);
    expect(secondBarData.downloads0).toBe(0);
    expect(secondBarData.downloads1).toBe(8000);
    expect(secondBarData.rscStackId).toBe('Firefox');
  });

  describe('InspectOnDimensionArea', () => {
    test('hovering dimension area should apply highlight styling and show tooltip', async () => {
      render(<InspectOnDimensionArea {...InspectOnDimensionArea.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();
      const dimensionAreas = await findAllMarksByGroupName(chart, `bar0_${DIMENSION_HOVER_AREA}`);
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(dimensionAreas).toHaveLength(5);

      // hovering dimension area should apply highlight styling and show tooltip
      await hoverNthElement(dimensionAreas, 0);
      let inspect = await screen.findByTestId('rsc-tooltip');
      expect(inspect).toBeInTheDocument();
      expect(within(inspect).getByText('Chrome: 27000')).toBeInTheDocument();
      expect(bars[0]).toHaveAttribute('opacity', `1`);
      expect(bars[4]).toHaveAttribute('opacity', `${FADE_FACTOR}`);

      await unhoverNthElement(dimensionAreas, 0);

      // hovering bar should do normal stuff
      await hoverNthElement(bars, 4);
      expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      expect(bars[4]).toHaveAttribute('opacity', `1`);
      inspect = await screen.findByTestId('rsc-tooltip');
      expect(inspect).toBeInTheDocument();
      expect(within(inspect).getByText('Explorer: 500')).toBeInTheDocument();
    });
  });
  describe('AccessibleNavigation', () => {
    // Regression: a single-series bar has no color facet, so the focus opacity rule (markUtils.ts's
    // getMarkOpacity) must key on the dimension value alone rather than the stacked dimension+color
    // composite id — previously this branch was skipped entirely for non-stacked bars.
    test('keyboard focus dims the other bars and keeps the focused bar at full opacity', async () => {
      render(<AccessibleNavigation {...AccessibleNavigation.args} />);
      const chart = await findChart();
      const container = chart.closest('.rsc-container') as HTMLElement;

      const entryButton = container.querySelector('button') as HTMLButtonElement;
      entryButton.click();
      const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first bar

      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.some((bar) => bar.getAttribute('opacity') === '1')).toBe(true);
      expect(bars.some((bar) => bar.getAttribute('opacity') === `${FADE_FACTOR}`)).toBe(true);

      const focusedId = dnNode().id;
      fireEvent.keyDown(dnNode(), { key: 'ArrowRight', code: 'ArrowRight' });
      expect(dnNode().id).not.toBe(focusedId);
      expect(bars.some((bar) => bar.getAttribute('opacity') === '1')).toBe(true);
      expect(bars.some((bar) => bar.getAttribute('opacity') === `${FADE_FACTOR}`)).toBe(true);
    });

    // Regression: clicking (or keyboard-focusing) a bar moves dataNavigator focus, which calls
    // onNavLeafFocus — without navMarkHasInspect gating that, an unconditional Handler.call falls
    // through to vega-tooltip's own default renderer (a raw table of every field on the datum),
    // showing an unrequested tooltip even though AccessibleNavigationNoInspect has no ChartInspect configured.
    test('clicking or keyboard-focusing a bar with no ChartInspect does not show a default tooltip', async () => {
      render(<AccessibleNavigationNoInspect {...AccessibleNavigationNoInspect.args} />);
      const chart = await findChart();
      const bars = await findAllMarksByGroupName(chart, 'bar0');

      await clickNthElement(bars, 0);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      expect(document.getElementById('vg-tooltip-element')).not.toHaveClass('visible');

      const container = chart.closest('.rsc-container') as HTMLElement;
      const entryButton = container.querySelector('button') as HTMLButtonElement;
      entryButton.click();
      const dnNode = () => container.querySelector('.dn-node') as HTMLElement;
      expect(dnNode()).toBeTruthy();
      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(dnNode(), { key: 'ArrowRight', code: 'ArrowRight' });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      expect(document.getElementById('vg-tooltip-element')).not.toHaveClass('visible');
    });

    // Regression: accessibleNavigation alone (AccessibleNavigationNoInspect has no ChartInspect/
    // ChartPopover/onClick) must not introduce mouse-hover opacity dimming — that behavior should only
    // appear when the user actually configures a hover-driven feature, matching getMarkOpacity's
    // hasRealInteractivity gate.
    test('mouse hover does not dim other bars when there is no other interactive feature', async () => {
      render(<AccessibleNavigationNoInspect {...AccessibleNavigationNoInspect.args} />);
      const chart = await findChart();
      const bars = await findAllMarksByGroupName(chart, 'bar0');

      await hoverNthElement(bars, 0);
      expect(bars.every((bar) => bar.getAttribute('opacity') === '1')).toBe(true);

      await unhoverNthElement(bars, 0);
      expect(bars.every((bar) => bar.getAttribute('opacity') === '1')).toBe(true);
    });

    // Regression: keyboard focus should mirror whatever mouse hover would already do — with no
    // ChartInspect/ChartPopover/onClick configured, mouse hover doesn't dim anything (see the test
    // above), so keyboard focus shouldn't either; the focus ring alone shows which segment is focused.
    test('keyboard focus does not dim other bars when there is no other interactive feature', async () => {
      render(<AccessibleNavigationNoInspect {...AccessibleNavigationNoInspect.args} />);
      const chart = await findChart();
      const container = chart.closest('.rsc-container') as HTMLElement;

      const entryButton = container.querySelector('button') as HTMLButtonElement;
      entryButton.click();
      const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first stack
      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // stack -> first segment (leaf)

      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars.every((bar) => bar.getAttribute('opacity') === '1')).toBe(true);
    });

    // Regression: activating a keyboard-focused mark (Enter/Space) never dispatches a real DOM click,
    // so Vega's own view 'click' listener (getOnChartMarkClickCallback) never sees it — onNavActivate
    // must call the mark's onClick directly instead of relying on that listener.
    test('Enter on a focused bar fires onClick with the focused datum, even with no popover', async () => {
      const onClick = jest.fn();
      const BarWithOnClick = (): ReactElement => {
        const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: true });
        return (
          <Chart {...chartProps}>
            <Axis position="bottom" baseline title="Browser" />
            <Axis position="left" grid title="Downloads" />
            <Bar dimension="browser" metric="downloads" onClick={onClick} />
          </Chart>
        );
      };
      render(<BarWithOnClick />);
      const chart = await findChart();
      const container = chart.closest('.rsc-container') as HTMLElement;

      const entryButton = container.querySelector('button') as HTMLButtonElement;
      entryButton.click();
      const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first bar (leaf)
      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // activate

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ browser: 'Chrome' } as Partial<Datum>));
    });

    // Regression: onNavActivate previously called selectAndOpenPopover unconditionally, regardless of
    // whether the mark actually declared a ChartPopover — it must only fire selection/popover logic
    // when one is present, mirroring getOnMarkClickCallback's own markHasPopover gate for real clicks.
    test('Enter on a focused bar with no ChartPopover does not open a popover', async () => {
      const BarWithNoPopover = (): ReactElement => {
        const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: true });
        return (
          <Chart {...chartProps}>
            <Axis position="bottom" baseline title="Browser" />
            <Axis position="left" grid title="Downloads" />
            <Bar dimension="browser" metric="downloads" />
          </Chart>
        );
      };
      render(<BarWithNoPopover />);
      const chart = await findChart();
      const container = chart.closest('.rsc-container') as HTMLElement;

      const entryButton = container.querySelector('button') as HTMLButtonElement;
      entryButton.click();
      const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first bar (leaf)
      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // activate
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      expect(screen.queryByTestId('rsc-popover-content')).not.toBeInTheDocument();
      expect(document.querySelector('[id$="-popover-button"]')).not.toBeInTheDocument();
    });

    test('Space on a focused bar also fires onClick', async () => {
      const onClick = jest.fn();
      const BarWithOnClick = (): ReactElement => {
        const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: true });
        return (
          <Chart {...chartProps}>
            <Axis position="bottom" baseline title="Browser" />
            <Axis position="left" grid title="Downloads" />
            <Bar dimension="browser" metric="downloads" onClick={onClick} />
          </Chart>
        );
      };
      render(<BarWithOnClick />);
      const chart = await findChart();
      const container = chart.closest('.rsc-container') as HTMLElement;

      const entryButton = container.querySelector('button') as HTMLButtonElement;
      entryButton.click();
      const dnNode = () => container.querySelector('.dn-node') as HTMLElement;

      fireEvent.keyDown(dnNode(), { key: 'Enter', code: 'Enter' }); // root -> first bar (leaf)
      fireEvent.keyDown(dnNode(), { key: ' ', code: 'Space' }); // activate

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
  describe('WithInspect', () => {
    test('hovering bar should apply highlight styling and show tooltip', async () => {
      render(<WithInspect {...WithInspect.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(5);

      // hovering bar should do normal stuff
      await hoverNthElement(bars, 4);
      expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      expect(bars[4]).toHaveAttribute('opacity', `1`);
      const inspect = await screen.findByTestId('rsc-tooltip');
      expect(inspect).toBeInTheDocument();
      expect(within(inspect).getByText('Explorer: 500')).toBeInTheDocument();
    });
  });
});
