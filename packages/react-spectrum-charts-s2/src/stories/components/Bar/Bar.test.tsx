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

import { Bar } from '../../../components';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  rightClickNthElement,
  screen,
  unhoverNthElement,
  waitForMarksByGroupName,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  Basic,
  LineType,
  OnClick,
  OnMouseInputs,
  PaddingRatio,
  WithInspect,
} from './Bar.story';
import { BarWithUTCDatetimeFormat } from '../../../dev/Bar/Tests/BarMovedTests.story';
import { Basic as DodgedBasic, DodgedStacked } from './DodgedBar.story';
import { Basic as StackedBasic } from './StackedBar.story';
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
    render(<LineType {...LineType.args} />);
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
    render(<DodgedBasic {...DodgedBasic.args} />);
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
    render(<OnClick {...OnClick.args} onMouseOver={onMouseOver} onMouseOut={onMouseOut} />);
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
    expect(hoverData).toHaveTextContent('Previewing Chrome: 27,000 downloads');

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
    expect(hoverData).toHaveTextContent('Previewing Firefox: 8,000 downloads');
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
      // opacity is now animated, so it settles asynchronously -- hence waitForMarksByGroupName
      await waitForMarksByGroupName(chart, 'bar0', (updatedBars) => {
        expect(updatedBars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
        expect(updatedBars[4]).toHaveAttribute('opacity', `1`);
      });
      const inspect = await screen.findByTestId('rsc-tooltip');
      expect(inspect).toBeInTheDocument();
      expect(within(inspect).getByText('Explorer: 500')).toBeInTheDocument();
    });
  });
});
