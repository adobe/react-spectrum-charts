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
import { findAllMarksByGroupName, findChart, render, screen } from '../../../test-utils/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { OnContextMenu } from './ActionHandlers/BarActionHandlers.story.js';
import { DimensionDataType } from './Bar.story.js';
import { Basic as DirectLabelBasic, Format, Position } from './BarDirectLabel.story.js';
import { Diverging } from './Diverging.story.js';
import { GroupedPadding } from './DodgedBar.story.js';
import { Order } from './StackedBar.story.js';
import { ColorOverride } from './Styling/BarStyling.story.js';
import { Trellis, TrellisOrientation } from './TrellisBar.story.js';

describe('Bar feature stories', () => {
  test('ColorOverride fills bars from the override field', async () => {
    render(<ColorOverride {...ColorOverride.args} />);
    const bars = await findAllMarksByGroupName(await findChart(), 'bar0');
    expect(bars).toHaveLength(5);
    expect(bars[0].getAttribute('fill')).not.toEqual(bars[4].getAttribute('fill'));
  });

  test('DimensionDataType renders one bar per month', async () => {
    render(<DimensionDataType {...DimensionDataType.args} />);
    const bars = await findAllMarksByGroupName(await findChart(), 'bar0');
    expect(bars).toHaveLength(6);
  });

  test('OnContextMenu renders', async () => {
    render(<OnContextMenu {...OnContextMenu.args} />);
    const bars = await findAllMarksByGroupName(await findChart(), 'bar0');
    expect(bars).toHaveLength(5);
  });

  test('Order and GroupedPadding render every segment', async () => {
    const { unmount } = render(<Order {...Order.args} />);
    expect(await findAllMarksByGroupName(await findChart(), 'bar0')).toHaveLength(12);
    unmount();
    render(<GroupedPadding {...GroupedPadding.args} />);
    expect(await findAllMarksByGroupName(await findChart(), 'bar0')).toHaveLength(8);
  });

  test('Diverging renders both change directions in the legend', async () => {
    render(<Diverging {...Diverging.args} />);
    await findChart();
    expect(screen.getByText('Increase')).toBeInTheDocument();
    expect(screen.getByText('Decrease')).toBeInTheDocument();
  });

  test('Trellis variants render a facet title per step', async () => {
    const { unmount } = render(<Trellis {...Trellis.args} />);
    await findChart();
    expect(screen.getByText('A. Sign up')).toBeInTheDocument();
    unmount();
    render(<TrellisOrientation {...TrellisOrientation.args} />);
    await findChart();
    expect(screen.getByText('C. Add to My List')).toBeInTheDocument();
  });

  test('Direct label stories render formatted labels', async () => {
    const { unmount } = render(<DirectLabelBasic {...DirectLabelBasic.args} />);
    await findChart();
    expect((await screen.findAllByText('12,600')).length).toBeGreaterThan(0);
    unmount();
    const second = render(<Position {...Position.args} />);
    await findChart();
    expect((await screen.findAllByText('9,400')).length).toBeGreaterThan(0);
    second.unmount();
    render(<Format {...Format.args} />);
    await findChart();
    expect((await screen.findAllByText('13k')).length).toBeGreaterThan(0);
  });
});
