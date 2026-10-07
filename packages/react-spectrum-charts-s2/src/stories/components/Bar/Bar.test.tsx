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
import { FADE_FACTOR } from '@spectrum-charts/core-s2/constants';

import { Bar } from '../../../components/index.js';
import { acquisitionChannelData as barData } from '../../../storyShared/components/Bar/data.js';
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
} from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { OnClick } from './ActionHandlers/BarActionHandlers.story.js';
import { Basic, ChartInspect as ChartInspectStory } from './Bar.story.js';
import { Dodged as DodgedBasic, DodgedStacked } from './DodgedBar.story.js';
import { PaddingRatio } from './Spacing/BarSpacing.story.js';
import { Stacked as StackedBasic } from './StackedBar.story.js';
import { Opacity } from './Styling/BarStyling.story.js';

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
    expect(bars[0].getAttribute('fill-opacity')).toEqual('0.6');
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
    expect(bars.length).toEqual(8);
  });

  test('Dodged Stacked renders properly', async () => {
    render(<DodgedStacked {...DodgedStacked.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(16);
  });

  test('Stacked Basic renders properly', async () => {
    render(<StackedBasic {...StackedBasic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(12);
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
    expect(onContextMenu).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining(barData[0]));
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

  describe('ChartInspect', () => {
    test('hovering bar should apply highlight styling and show tooltip', async () => {
      render(<ChartInspectStory {...ChartInspectStory.args} />);
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
      expect(within(inspect).getByText('Referral: 7,600 sign-ups')).toBeInTheDocument();
    });
  });
});
