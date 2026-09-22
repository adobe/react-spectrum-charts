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
import userEvent from '@testing-library/user-event';

import { ChartActionBar } from '../../../../components';
import { clickNthElement, findAllMarksByGroupName, findChart, render, screen, waitFor, within } from '../../../../test-utils';
import '../../../../test-utils/__mocks__/matchMedia.mock.js';
import { WithActionBar, WithEmphasized, WithFewActions, WithOverflow } from './LineActionBar.story';

describe('ChartActionBar', () => {
  // ChartActionBar is not a real React component. This test just provides test coverage for sonarqube
  test('ChartActionBar pseudo element', () => {
    render(<ChartActionBar />);
  });

  test('Renders properly on canvas', async () => {
    render(<WithActionBar {...WithActionBar.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('opens on point click and closes when clicking outside', async () => {
    render(<WithActionBar {...WithActionBar.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    await waitFor(() => expect(actionBar).toBeInTheDocument());

    // shouldn't close the action bar
    await userEvent.click(actionBar);
    expect(actionBar).toBeInTheDocument();

    // should close the action bar
    await userEvent.click(chart);
    await waitFor(() => expect(actionBar).not.toBeInTheDocument());
  });

  test('positions above the anchor when there is room', async () => {
    render(<WithActionBar {...WithActionBar.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
    const anchor = await screen.findByTestId('rsc-popover-anchor');
    jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({ top: 400, bottom: 420, left: 50 } as DOMRect);

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    await waitFor(() => expect(parseFloat(actionBar.style.top)).toBeLessThan(400));
  });

  test('flips below the anchor when there is not enough room above', async () => {
    render(<WithActionBar {...WithActionBar.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
    const anchor = await screen.findByTestId('rsc-popover-anchor');
    jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({ top: 2, bottom: 22, left: 50 } as DOMRect);

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    await waitFor(() => expect(parseFloat(actionBar.style.top)).toBeGreaterThanOrEqual(22));
  });

  test('Esc closes the action bar', async () => {
    render(<WithActionBar {...WithActionBar.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(actionBar).not.toBeInTheDocument());
  });

  test('moves focus into the bar when it opens', async () => {
    render(<WithActionBar {...WithActionBar.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    await waitFor(() => expect(within(actionBar).getByRole('button', { name: 'Annotate' })).toHaveFocus());
  });

  test('actions appear in the action bar and clicking one closes it', async () => {
    render(<WithActionBar {...WithActionBar.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    expect(within(actionBar).getByText('Annotate')).toBeInTheDocument();
    expect(within(actionBar).getByText('Comment')).toBeInTheDocument();

    await userEvent.click(within(actionBar).getByText('Annotate'));
    await waitFor(() => expect(actionBar).not.toBeInTheDocument());
  });

  test('emphasized action bar has the emphasized class', async () => {
    render(<WithEmphasized {...WithEmphasized.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    expect(actionBar).toHaveClass('rsc-action-bar--emphasized');
  });

  test('collapses extra actions into an overflow menu', async () => {
    render(<WithOverflow {...WithOverflow.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    const overflowButton = await within(actionBar).findByRole('button', { name: 'More actions' });
    expect(overflowButton).toHaveAttribute('aria-haspopup', 'true');
    expect(overflowButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(overflowButton);
    const overflowPanel = await screen.findByTestId('rsc-action-bar-overflow');
    expect(overflowPanel).toBeInTheDocument();
    expect(overflowButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('clicking inside the overflow menu does not close the action bar', async () => {
    render(<WithOverflow {...WithOverflow.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    const overflowButton = await within(actionBar).findByRole('button', { name: 'More actions' });
    await userEvent.click(overflowButton);
    const overflowPanel = await screen.findByTestId('rsc-action-bar-overflow');

    await userEvent.click(overflowPanel);
    expect(actionBar).toBeInTheDocument();
    expect(overflowPanel).toBeInTheDocument();
  });

  test('Esc closes the overflow menu without closing the whole bar', async () => {
    render(<WithOverflow {...WithOverflow.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    const actionBar = await screen.findByTestId('rsc-action-bar');
    const overflowButton = await within(actionBar).findByRole('button', { name: 'More actions' });
    await userEvent.click(overflowButton);
    await screen.findByTestId('rsc-action-bar-overflow');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('rsc-action-bar-overflow')).not.toBeInTheDocument());
    expect(actionBar).toBeInTheDocument();
  });

  test('does not show an overflow menu when all actions fit', async () => {
    render(<WithFewActions {...WithFewActions.args} />);
    const chart = await findChart();
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await clickNthElement(points, 0);
    await screen.findByTestId('rsc-action-bar');
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });
});
