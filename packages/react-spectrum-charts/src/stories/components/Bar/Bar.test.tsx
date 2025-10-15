/*
 * Copyright 2023 Adobe. All rights reserved.
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
import { Bar } from '../../../components';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  unhoverNthElement,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  BarWithUTCDatetimeFormat,
  Basic,
  OnClick,
  OnMouseInputs,
  Opacity,
  PaddingRatio,
  TooltipOnDimensionArea,
  WithAnnotation,
  WithTooltip,
} from './Bar.story';
import { Color, DodgedStacked } from './DodgedBar.story';
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

  test('With Annotation renders properly', async () => {
    render(<WithAnnotation {...WithAnnotation.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(5);

    // get annotations
    const labels = await findAllMarksByGroupName(chart, 'bar0_annotationText', 'text');
    expect(labels.length).toEqual(5);
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

  describe('TooltipOnDimensionArea', () => {
    test('hovering dimension area should apply highlight styling and show tooltip', async () => {
      render(<TooltipOnDimensionArea {...TooltipOnDimensionArea.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();
      const dimensionAreas = await findAllMarksByGroupName(chart, `bar0_${DIMENSION_HOVER_AREA}`);
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(dimensionAreas).toHaveLength(5);
      
      // hovering dimension area should apply highlight styling and show tooltip
      await hoverNthElement(dimensionAreas, 0);
      let tooltip = await screen.findByTestId('rsc-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(within(tooltip).getByText('Chrome: 27000')).toBeInTheDocument();
      expect(bars[0]).toHaveAttribute('opacity', `1`);
      expect(bars[4]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      
      await unhoverNthElement(dimensionAreas, 0);
      
      // hovering bar should do normal stuff
      await hoverNthElement(bars, 4);
      expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      expect(bars[4]).toHaveAttribute('opacity', `1`);
      tooltip = await screen.findByTestId('rsc-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(within(tooltip).getByText('Explorer: 500')).toBeInTheDocument();

    });
  });
  describe('WithTooltip', () => {
    test('hovering bar should apply highlight styling and show tooltip', async () => {
      render(<WithTooltip {...WithTooltip.args} />);
      const chart = await findChart();
      expect(chart).toBeInTheDocument();
      const bars = await findAllMarksByGroupName(chart, 'bar0');
      expect(bars).toHaveLength(5);
      
      
      // hovering bar should do normal stuff
      await hoverNthElement(bars, 4);
      expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      expect(bars[4]).toHaveAttribute('opacity', `1`);
      const tooltip = await screen.findByTestId('rsc-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(within(tooltip).getByText('Explorer: 500')).toBeInTheDocument();

    });
  });
});
