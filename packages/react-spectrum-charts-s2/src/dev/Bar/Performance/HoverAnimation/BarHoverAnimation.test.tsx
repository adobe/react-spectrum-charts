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
  allElementsHaveAttributeValue,
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  getAllLegendEntries,
  getAllLegendSymbols,
  hoverNthElement,
  render,
  screen,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  DodgedStackedLegendHover,
  DodgedStackedPointHover,
  StackedControlledHighlight,
  StackedDimensionHover,
  StackedLegendHover,
  StackedPointHover,
  StackedPopoverSelection,
  TrellisPointHover,
} from './BarHoverAnimation.story';

// `animations={false}` restores the original instant, synchronous highlighting for every trigger.
describe('animations={false}', () => {
  test('direct item hover fades every other bar instantly', async () => {
    render(<StackedPointHover {...StackedPointHover.args} animations={false} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    await hoverNthElement(bars, 4);
    expect(bars[4]).toHaveAttribute('opacity', '1');
    expect(allElementsHaveAttributeValue(bars.filter((_, i) => i !== 4), 'opacity', FADE_FACTOR)).toBeTruthy();
  });

  test('dimension-hover-area hover fades every other dimension value instantly', async () => {
    render(<StackedDimensionHover {...StackedDimensionHover.args} animations={false} />);
    const chart = await findChart();
    const dimensionAreas = await findAllMarksByGroupName(chart, `bar0_${DIMENSION_HOVER_AREA}`);
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    await hoverNthElement(dimensionAreas, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    // every bar at the hovered dimension value stays opaque; every other bar fades
    const opacities = bars.map((bar) => bar.getAttribute('opacity'));
    expect(opacities).toContain('1');
    expect(opacities).toContain(`${FADE_FACTOR}`);
  });

  test('legend hover fades every bar of the non-hovered series instantly', async () => {
    render(<StackedLegendHover {...StackedLegendHover.args} animations={false} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    const legendSymbols = getAllLegendSymbols(chart);
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    const legendEntries = getAllLegendEntries(chart);
    await hoverNthElement(legendEntries, 0);

    expect(legendSymbols[0]).toHaveAttribute('opacity', '1');
    expect(allElementsHaveAttributeValue(legendSymbols.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
  });

  test('a controlled highlightedSeries fades every bar of every other series instantly', async () => {
    render(<StackedControlledHighlight {...StackedControlledHighlight.args} animations={false} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');

    const opacities = bars.map((bar) => bar.getAttribute('opacity'));
    expect(opacities).toContain('1');
    expect(opacities).toContain(`${FADE_FACTOR}`);
  });

  test('popover selection fades every other bar instantly', async () => {
    render(<StackedPopoverSelection {...StackedPopoverSelection.args} animations={false} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    await clickNthElement(bars, 4);
    expect(await screen.findByTestId('rsc-popover')).toBeInTheDocument();
    expect(bars[4]).toHaveAttribute('opacity', '1');
    expect(allElementsHaveAttributeValue(bars.filter((_, i) => i !== 4), 'opacity', FADE_FACTOR)).toBeTruthy();
  });

  test('dodged-and-stacked (dual-facet) point hover keeps two segments sharing a dimension + primary facet independent', async () => {
    render(<DodgedStackedPointHover {...DodgedStackedPointHover.args} animations={false} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    await hoverNthElement(bars, 0);
    expect(bars[0]).toHaveAttribute('opacity', '1');
    expect(allElementsHaveAttributeValue(bars.filter((_, i) => i !== 0), 'opacity', FADE_FACTOR)).toBeTruthy();
  });

  test('dodged-and-stacked (dual-facet) legend hover aggregates correctly across the secondary facet', async () => {
    render(<DodgedStackedLegendHover {...DodgedStackedLegendHover.args} animations={false} />);
    const chart = await findChart();
    const legendEntries = getAllLegendEntries(chart);
    const legendSymbols = getAllLegendSymbols(chart);
    expect(allElementsHaveAttributeValue(legendSymbols, 'opacity', 1)).toBeTruthy();

    await hoverNthElement(legendEntries, 0);
    expect(legendSymbols[0]).toHaveAttribute('opacity', '1');
    expect(allElementsHaveAttributeValue(legendSymbols.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
  });

  test('trellis point hover keeps identity unique across repeated trellis panels', async () => {
    render(<TrellisPointHover {...TrellisPointHover.args} animations={false} />);
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    await hoverNthElement(bars, 0);
    expect(bars[0]).toHaveAttribute('opacity', '1');
    // at least one bar (in a different trellis panel or dimension value) fades independently
    expect(bars.some((bar) => bar.getAttribute('opacity') === `${FADE_FACTOR}`)).toBe(true);
  });
});
